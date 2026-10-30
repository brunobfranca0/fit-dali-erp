-- SQL / supabase/migrations/20261030173007_crm_public_api_keys.sql / PostgreSQL / Fit DaLi ERP Supabase
CREATE TABLE IF NOT EXISTS public.crm_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT ARRAY['crm:read']::text[],
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT crm_api_keys_scopes_check CHECK (scopes <@ ARRAY['crm:read', 'crm:write']::text[])
);

CREATE INDEX IF NOT EXISTS crm_api_keys_active_prefix_idx
  ON public.crm_api_keys (key_prefix)
  WHERE revoked_at IS NULL;

ALTER TABLE public.crm_api_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_api_keys FROM anon, authenticated;
GRANT ALL ON public.crm_api_keys TO service_role;
