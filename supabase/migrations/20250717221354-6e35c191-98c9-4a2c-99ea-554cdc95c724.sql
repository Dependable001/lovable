-- Add RLS policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- Insert admin permissions for the users resource if they don't exist
INSERT INTO public.admin_permissions (admin_role, permission_name, can_read, can_write, can_delete)
VALUES 
  ('super_admin', 'users', true, true, true),
  ('operations_admin', 'users', true, true, false),
  ('support_admin', 'users', true, false, false)
ON CONFLICT (admin_role, permission_name) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_write = EXCLUDED.can_write,
  can_delete = EXCLUDED.can_delete;