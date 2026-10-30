-- sql / supabase/migrations/20261030181830_ensure_auth_user_app_role.sql / PostgreSQL / Supabase Auth
-- Newly created Auth users receive the least-privileged application role.
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb('atendimento'::text),
  true
)
WHERE COALESCE(raw_app_meta_data ->> 'role', '') NOT IN ('admin', 'gestor', 'atendimento', 'producao');

CREATE OR REPLACE FUNCTION public.set_default_app_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(NEW.raw_app_meta_data ->> 'role', '') NOT IN ('admin', 'gestor', 'atendimento', 'producao') THEN
    NEW.raw_app_meta_data := jsonb_set(
      COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb('atendimento'::text),
      true
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_default_app_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS set_default_app_role_on_auth_user_insert ON auth.users;
CREATE TRIGGER set_default_app_role_on_auth_user_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_app_role();
