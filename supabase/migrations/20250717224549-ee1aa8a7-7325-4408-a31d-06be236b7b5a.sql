-- Reset passwords for testing purposes
-- Update all users to have the same test password for verification
UPDATE auth.users 
SET encrypted_password = crypt('testpass123', gen_salt('bf'))
WHERE email IN (
  'ibkaydeee@gmail.com',
  'dependableconcepts@gmail.com',
  'olatunji_oladipupo@yahoo.com',
  'kaydee.professional@gmail.com'
);

-- Make sure all users have email confirmed
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;