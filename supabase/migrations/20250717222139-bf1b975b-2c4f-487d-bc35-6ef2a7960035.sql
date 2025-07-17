-- First ensure the profile table is working as expected and has the admin_role column properly set
-- This helps ensure that after we create a user, their profile will have the right role

-- First, let's drop the existing user if it exists (to avoid conflicts)
-- We'll create it fresh with proper admin permissions
DELETE FROM auth.users WHERE email = 'kaydee.professional@gmail.com';

-- Now let's create a super_admin user with the requested credentials
-- Create the user in auth.users
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
  'kaydee.professional@gmail.com',
  crypt('Dallastx1', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) 
RETURNING id INTO user_id;

-- The handle_new_user trigger should automatically create a profile,
-- but let's make sure it has admin privileges
UPDATE public.profiles 
SET role = 'admin', admin_role = 'super_admin'
WHERE email = 'kaydee.professional@gmail.com';