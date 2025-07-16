-- Insert default admin permissions for super_admin role
INSERT INTO admin_permissions (permission_name, admin_role, can_read, can_write, can_delete) 
VALUES 
  ('users', 'super_admin', true, true, true),
  ('drivers', 'super_admin', true, true, true),
  ('riders', 'super_admin', true, true, true),
  ('rides', 'super_admin', true, true, true),
  ('applications', 'super_admin', true, true, true),
  ('pricing', 'super_admin', true, true, true)
ON CONFLICT (permission_name, admin_role) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_write = EXCLUDED.can_write,
  can_delete = EXCLUDED.can_delete;

-- Verify the permissions were created
SELECT * FROM admin_permissions WHERE admin_role = 'super_admin';