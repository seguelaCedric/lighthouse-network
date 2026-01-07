-- Allow agency admins to list users in their organization
DROP POLICY IF EXISTS users_admin_select ON public.users;
CREATE POLICY users_admin_select ON public.users
  FOR SELECT
  USING (
    public.is_current_user_admin()
    AND organization_id = public.get_current_user_organization_id()
  );
