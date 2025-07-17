-- Update the new user's profile to make them a super admin
UPDATE public.profiles
SET role = 'admin', admin_role = 'super_admin'
WHERE email = 'admin@ubify.com';