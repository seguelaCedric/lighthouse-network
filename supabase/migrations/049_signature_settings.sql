-- Add signature-related fields to team_members
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone_number text;

UPDATE public.team_members
SET first_name = COALESCE(first_name, split_part(name, ' ', 1)),
    last_name = COALESCE(
      last_name,
      NULLIF(trim(regexp_replace(name, '^[^ ]+\\s*', '')), '')
    )
WHERE name IS NOT NULL;

-- Signature settings per organization
CREATE TABLE IF NOT EXISTS public.signature_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  logo_url text,
  logo_width integer NOT NULL DEFAULT 140,
  template text NOT NULL DEFAULT 'classic',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

-- Keep updated_at current
DROP TRIGGER IF EXISTS trg_signature_settings_updated_at ON public.signature_settings;
CREATE TRIGGER trg_signature_settings_updated_at
  BEFORE UPDATE ON public.signature_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.signature_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS signature_settings_admin_select ON public.signature_settings;
CREATE POLICY signature_settings_admin_select ON public.signature_settings
  FOR SELECT
  USING (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  );

DROP POLICY IF EXISTS signature_settings_admin_insert ON public.signature_settings;
CREATE POLICY signature_settings_admin_insert ON public.signature_settings
  FOR INSERT
  WITH CHECK (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  );

DROP POLICY IF EXISTS signature_settings_admin_update ON public.signature_settings;
CREATE POLICY signature_settings_admin_update ON public.signature_settings
  FOR UPDATE
  USING (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  )
  WITH CHECK (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  );

DROP POLICY IF EXISTS signature_settings_admin_delete ON public.signature_settings;
CREATE POLICY signature_settings_admin_delete ON public.signature_settings
  FOR DELETE
  USING (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  );
