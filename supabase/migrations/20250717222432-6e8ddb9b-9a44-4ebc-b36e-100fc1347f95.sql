-- First fix any existing user if there's one with this email
UPDATE public.profiles 
SET role = 'admin', admin_role = 'super_admin'
WHERE email = 'kaydee.professional@gmail.com';

-- Make sure admin permissions exist
INSERT INTO public.admin_permissions (admin_role, permission_name, can_read, can_write, can_delete)
VALUES 
  ('super_admin', 'users', true, true, true),
  ('super_admin', 'drivers', true, true, true),
  ('super_admin', 'riders', true, true, true),
  ('super_admin', 'rides', true, true, true),
  ('super_admin', 'applications', true, true, true),
  ('super_admin', 'pricing', true, true, true)
ON CONFLICT (admin_role, permission_name) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_write = EXCLUDED.can_write,
  can_delete = EXCLUDED.can_delete;