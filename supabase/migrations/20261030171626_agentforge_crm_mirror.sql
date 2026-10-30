-- language / supabase/migrations/20261030171626_agentforge_crm_mirror.sql / PostgreSQL / Fit DaLi ERP Supabase
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  phone text,
  email text,
  stage text NOT NULL DEFAULT 'novo' CHECK (stage IN ('novo', 'contato', 'qualificado', 'convertido', 'perdido')),
  source text NOT NULL DEFAULT 'manual',
  agentforge_session_id text,
  agentforge_conversation_id text,
  notes text NOT NULL DEFAULT '',
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_leads_stage_updated_idx ON public.crm_leads (stage, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_session_unique_idx ON public.crm_leads (agentforge_session_id) WHERE agentforge_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_leads_email_lower_idx ON public.crm_leads (lower(email)) WHERE email IS NOT NULL;

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_leads FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;

CREATE POLICY "crm leads visible to office" ON public.crm_leads
FOR SELECT TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])));
CREATE POLICY "crm leads managed by office" ON public.crm_leads
FOR INSERT TO authenticated
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])));
CREATE POLICY "crm leads updated by office" ON public.crm_leads
FOR UPDATE TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])))
WITH CHECK ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])));
CREATE POLICY "crm leads deleted by leadership" ON public.crm_leads
FOR DELETE TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor'])));

CREATE TABLE IF NOT EXISTS public.agentforge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload_hash text NOT NULL UNIQUE,
  event_name text NOT NULL,
  agent_id text,
  conversation_id text,
  session_id text,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agentforge_events_received_idx ON public.agentforge_events (received_at DESC);
CREATE INDEX IF NOT EXISTS agentforge_events_session_idx ON public.agentforge_events (session_id) WHERE session_id IS NOT NULL;

ALTER TABLE public.agentforge_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agentforge_events FROM anon;
GRANT SELECT ON public.agentforge_events TO authenticated;
CREATE POLICY "agentforge events visible to office" ON public.agentforge_events
FOR SELECT TO authenticated
USING ((SELECT public.has_app_role(ARRAY['admin', 'gestor', 'atendimento'])));

-- Credentials are encrypted by the Next.js server and never exposed through the Data API.
CREATE TABLE IF NOT EXISTS public.agentforge_connections (
  id text PRIMARY KEY DEFAULT 'primary' CHECK (id = 'primary'),
  api_key_ciphertext text NOT NULL,
  webhook_secret_ciphertext text NOT NULL,
  agent_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.agentforge_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agentforge_connections FROM anon, authenticated;
GRANT ALL ON public.agentforge_events, public.agentforge_connections TO service_role;
