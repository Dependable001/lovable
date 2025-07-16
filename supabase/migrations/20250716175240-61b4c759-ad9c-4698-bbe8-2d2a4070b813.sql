-- Create admin role types
CREATE TYPE admin_role_type AS ENUM ('super_admin', 'operations_admin', 'support_admin');

-- Add admin_role column to profiles table
ALTER TABLE profiles ADD COLUMN admin_role admin_role_type;

-- Update existing admin users to super_admin by default
UPDATE profiles SET admin_role = 'super_admin' WHERE role = 'admin';

-- Create admin permissions table
CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_role admin_role_type NOT NULL,
  permission_name TEXT NOT NULL,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(admin_role, permission_name)
);

-- Insert default permissions for admin roles
INSERT INTO admin_permissions (admin_role, permission_name, can_read, can_write, can_delete) VALUES
-- Super Admin (full access)
('super_admin', 'users', true, true, true),
('super_admin', 'drivers', true, true, true),
('super_admin', 'riders', true, true, true),
('super_admin', 'rides', true, true, true),
('super_admin', 'applications', true, true, true),
('super_admin', 'pricing', true, true, true),
('super_admin', 'system_settings', true, true, true),

-- Operations Admin (limited write access)
('operations_admin', 'users', true, false, false),
('operations_admin', 'drivers', true, true, false),
('operations_admin', 'riders', true, true, false),
('operations_admin', 'rides', true, true, false),
('operations_admin', 'applications', true, true, false),
('operations_admin', 'pricing', true, false, false),
('operations_admin', 'system_settings', true, false, false),

-- Support Admin (read-only with limited updates)
('support_admin', 'users', true, false, false),
('support_admin', 'drivers', true, false, false),
('support_admin', 'riders', true, true, false),
('support_admin', 'rides', true, false, false),
('support_admin', 'applications', true, false, false),
('support_admin', 'pricing', true, false, false),
('support_admin', 'system_settings', true, false, false);

-- Enable RLS on admin_permissions
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_permissions
CREATE POLICY "Admins can view permissions" ON admin_permissions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- Create function to check admin permissions
CREATE OR REPLACE FUNCTION public.check_admin_permission(
  required_permission TEXT,
  operation_type TEXT -- 'read', 'write', or 'delete'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_admin_role admin_role_type;
  has_permission BOOLEAN := false;
BEGIN
  -- Get the user's admin role
  SELECT admin_role INTO user_admin_role 
  FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin';
  
  IF user_admin_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check permission based on operation type
  SELECT 
    CASE 
      WHEN operation_type = 'read' THEN can_read
      WHEN operation_type = 'write' THEN can_write
      WHEN operation_type = 'delete' THEN can_delete
      ELSE false
    END INTO has_permission
  FROM admin_permissions 
  WHERE admin_role = user_admin_role AND permission_name = required_permission;
  
  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role ON profiles(admin_role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_admin_permissions_role ON admin_permissions(admin_role);
CREATE INDEX IF NOT EXISTS idx_rides_status_created ON rides(status, created_at);
CREATE INDEX IF NOT EXISTS idx_rides_active ON rides(status) WHERE status IN ('pending', 'accepted', 'in_progress');