import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DriverRegistrationFlow from "@/components/driver/DriverRegistrationFlow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Profile {
  id: string;
  role: string;
}

interface DriverApplication {
  id: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
}

export default function DriverOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;

      if (profileData.role !== 'driver') {
        navigate("/");
        return;
      }

      setProfile(profileData);

      // Check if application exists
      const { data: applicationData } = await supabase
        .from('driver_applications')
        .select('*')
        .eq('driver_id', profileData.id)
        .maybeSingle();

      setApplication(applicationData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationComplete = () => {
    fetchProfile(); // Refresh to show updated status
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // If no application exists, show the registration flow
  if (!application) {
    return (
      <DriverRegistrationFlow 
        profileId={profile.id} 
        onComplete={handleApplicationComplete}
      />
    );
  }

  // Show application status
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Driver Application Status</CardTitle>
            <CardDescription>
              Track your driver verification progress
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <ApplicationStatus status={application.status} />
            
            {application.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Application Rejected</h4>
                    <p className="text-red-700 mt-1">{application.rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Application submitted on {new Date(application.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ApplicationStatus({ status }: { status: string }) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          title: 'Application Pending',
          description: 'Your application is being reviewed. We\'ll contact you soon.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'documents_submitted':
        return {
          icon: Clock,
          title: 'Documents Under Review',
          description: 'We\'re reviewing your submitted documents.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'background_check_initiated':
        return {
          icon: Clock,
          title: 'Background Check in Progress',
          description: 'Background verification is being processed (2-3 business days).',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'background_check_complete':
        return {
          icon: Clock,
          title: 'Final Review',
          description: 'Background check complete. Final application review in progress.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Application Approved!',
          description: 'Congratulations! You can now start driving with Ubify.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          title: 'Application Rejected',
          description: 'Your application was not approved. See details below.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: Clock,
          title: 'Processing',
          description: 'Your application is being processed.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusInfo = getStatusInfo(status);
  const Icon = statusInfo.icon;

  return (
    <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-lg p-6`}>
      <div className="flex items-center space-x-3">
        <Icon className={`w-8 h-8 ${statusInfo.color}`} />
        <div>
          <h3 className={`text-lg font-semibold ${statusInfo.color}`}>
            {statusInfo.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {statusInfo.description}
          </p>
        </div>
      </div>
    </div>
  );
}