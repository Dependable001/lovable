import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Car, Star, AlertCircle, Loader2, Settings, Zap, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AvailableRides from "@/components/driver/AvailableRides";
import ActiveRides from "@/components/driver/ActiveRides";
import EarningsOverview from "@/components/driver/EarningsOverview";

interface DriverDashboardProps {
  onBack: () => void;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  rating: number;
  total_ratings: number;
}

const DriverDashboard = ({ onBack }: DriverDashboardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [driverApplication, setDriverApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDriverStatus();
  }, [user]);

  const fetchDriverStatus = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, rating, total_ratings')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: applicationData } = await supabase
        .from('driver_applications')
        .select('*')
        .eq('driver_id', profileData.id)
        .maybeSingle();

      setDriverApplication(applicationData);
    } catch (error) {
      console.error('Error fetching driver status:', error);
      toast({
        title: "Error",
        description: "Failed to load driver profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && profile && !driverApplication) {
      navigate('/driver-onboarding');
    }
  }, [loading, profile, driverApplication, navigate]);

  if (!loading && driverApplication && driverApplication.status !== 'approved') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Driver Verification in Progress</CardTitle>
              <CardDescription>Your application is being reviewed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Verification Required</h3>
                    <p className="text-amber-700 mt-1">
                      You cannot access the driver dashboard until your application is approved. 
                      Current status: <strong>{driverApplication.status.replace('_', ' ')}</strong>
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center space-y-4">
                <Button onClick={() => navigate('/driver-onboarding')}>
                  Check Application Status
                </Button>
                <Button variant="outline" onClick={onBack}>
                  Return to Main Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <Button onClick={onBack}>Return to Main Menu</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.full_name?.split(' ').map(n => n[0]).join('') || 'D'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-semibold">Driver Dashboard</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>Welcome, {profile.full_name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{profile.rating?.toFixed(1) || '5.0'} ({profile.total_ratings || 0} rides)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Available Rides
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Active Rides
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Earnings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="mt-6">
            <AvailableRides driverId={profile.id} />
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <ActiveRides driverId={profile.id} />
          </TabsContent>
          
          <TabsContent value="earnings" className="mt-6">
            <EarningsOverview driverId={profile.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DriverDashboard;