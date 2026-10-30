-- Store access roles in Auth app_metadata so users cannot promote themselves.
-- The oldest existing account becomes the initial administrator if none is set.
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb('admin'::text),
  true
)
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE COALESCE(raw_app_meta_data, '{}'::jsonb) ->> 'role' = 'admin'
  ORDER BY created_at, id
  LIMIT 1
);

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb('admin'::text),
  true
)
WHERE id = (
  SELECT id
  FROM auth.users
  ORDER BY created_at, id
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM auth.users
  WHERE COALESCE(raw_app_meta_data, '{}'::jsonb) ->> 'role' = 'admin'
);

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb('atendimento'::text),
  true
)
WHERE COALESCE(raw_app_meta_data, '{}'::jsonb) ->> 'role' IS NULL;

CREATE OR REPLACE FUNCTION public.has_app_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role' = ANY(allowed_roles), false)
$$;

CREATE OR REPLACE FUNCTION public.guard_production_order_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  current_role text := auth.jwt() -> 'app_metadata' ->> 'role';
BEGIN
  IF current_role = 'producao' THEN
    IF (to_jsonb(NEW) - ARRAY['status', 'updated_at']) IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['status', 'updated_at']) THEN
      RAISE EXCEPTION 'A produção pode atualizar somente o status do pedido.'
        USING ERRCODE = '42501';
    END IF;

    IF NOT (
      (OLD.status = 'confirmed' AND NEW.status = 'preparing') OR
      (OLD.status = 'preparing' AND NEW.status = 'ready') OR
      (OLD.status = 'ready' AND NEW.status = 'delivered')
    ) THEN
      RAISE EXCEPTION 'Transição de status não permitida para produção.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_production_order_updates ON public.orders;
CREATE TRIGGER guard_production_order_updates
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.guard_production_order_updates();

DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(ARRAY[
        'categories', 'products', 'customers', 'orders', 'order_items',
        'payments', 'daily_production', 'expenses'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  END LOOP;
END;
$$;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog read by staff" ON public.categories
FOR SELECT TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento', 'producao'])));
CREATE POLICY "catalog manage by leadership" ON public.categories
FOR ALL TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor'])))
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor'])));

CREATE POLICY "products read by staff" ON public.products
FOR SELECT TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento', 'producao'])));
CREATE POLICY "products manage by leadership" ON public.products
FOR ALL TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor'])))
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor'])));

CREATE POLICY "customer operations" ON public.customers
FOR ALL TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])))
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])));

CREATE POLICY "orders read by staff" ON public.orders
FOR SELECT TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento', 'producao'])));
CREATE POLICY "orders create by office" ON public.orders
FOR INSERT TO authenticated
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])));
CREATE POLICY "orders update by office" ON public.orders
FOR UPDATE TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])))
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])));
CREATE POLICY "production status updates" ON public.orders
FOR UPDATE TO authenticated
USING (
  (SELECT public.has_app_role(ARRAY['producao']))
  AND status IN ('confirmed', 'preparing', 'ready')
)
WITH CHECK (
  (SELECT public.has_app_role(ARRAY['producao']))
  AND status IN ('preparing', 'ready', 'delivered')
);
CREATE POLICY "orders delete by leadership" ON public.orders
FOR DELETE TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor'])));

CREATE POLICY "order items read by staff" ON public.order_items
FOR SELECT TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento', 'producao'])));
CREATE POLICY "order item operations by office" ON public.order_items
FOR ALL TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])))
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])));

CREATE POLICY "payments by office" ON public.payments
FOR ALL TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])))
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])));

CREATE POLICY "daily production operations" ON public.daily_production
FOR ALL TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'producao'])))
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'producao'])));

CREATE POLICY "expenses by leadership" ON public.expenses
FOR ALL TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor'])))
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor'])));
