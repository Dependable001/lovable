import { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface AdminRoleGuardProps {
  children: ReactNode;
  permission: string;
  operation?: 'read' | 'write' | 'delete';
  fallback?: ReactNode;
}

export default function AdminRoleGuard({ 
  children, 
  permission, 
  operation = 'read',
  fallback 
}: AdminRoleGuardProps) {
  const { user } = useAuth();

  const { data: hasPermission, isLoading } = useQuery({
    queryKey: ['admin-permission', permission, operation, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase.rpc('check_admin_permission', {
        required_permission: permission,
        operation_type: operation
      });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="animate-pulse bg-muted h-20 rounded"></div>;
  }

  if (!hasPermission) {
    return fallback || (
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to {operation} {permission}. Contact your administrator for access.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}