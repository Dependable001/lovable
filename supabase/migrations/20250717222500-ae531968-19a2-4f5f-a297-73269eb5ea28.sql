-- Create a new admin user with different email
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@ubify.com',
  crypt('Dallastx1', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Super Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Also insert permissions for all admin roles to ensure access
INSERT INTO public.admin_permissions (admin_role, permission_name, can_read, can_write, can_delete)
VALUES 
  ('super_admin', 'users', true, true, true),
  ('super_admin', 'drivers', true, true, true),
  ('super_admin', 'riders', true, true, true),
  ('super_admin', 'rides', true, true, true),
  ('super_admin', 'applications', true, true, true),
  ('super_admin', 'pricing', true, true, true),
  ('operations_admin', 'users', true, true, false),
  ('operations_admin', 'drivers', true, true, false),
  ('operations_admin', 'riders', true, true, false),
  ('operations_admin', 'rides', true, true, false),
  ('operations_admin', 'applications', true, true, false),
  ('operations_admin', 'pricing', true, true, false),
  ('support_admin', 'users', true, false, false),
  ('support_admin', 'drivers', true, false, false),
  ('support_admin', 'riders', true, false, false),
  ('support_admin', 'rides', true, false, false),
  ('support_admin', 'applications', true, false, false),
  ('support_admin', 'pricing', true, false, false)
ON CONFLICT (admin_role, permission_name) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_write = EXCLUDED.can_write,
  can_delete = EXCLUDED.can_delete;