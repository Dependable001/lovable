-- Update your current user profile to be an admin
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET role = 'admin', admin_role = 'super_admin'
WHERE email = 'kaydee.professional@gmail.com';

-- Verify the update
SELECT id, email, full_name, role, admin_role FROM profiles WHERE email = 'kaydee.professional@gmail.com';