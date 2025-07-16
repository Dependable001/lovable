import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, Clock, Navigation } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import RideBookingForm from "@/components/rider/RideBooking";
import RideStatus from "@/components/rider/RideStatus";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface ActiveRequest {
  id: string;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  created_at: string;
}

export default function RideBookingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'booking' | 'status'>('booking');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchActiveRequest();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    }
  };

  const fetchActiveRequest = async () => {
    if (!user) return;

    try {
      // Get the user's profile ID first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Check for active ride requests
      const { data, error } = await supabase
        .from('ride_requests')
        .select('id, status, pickup_location, dropoff_location, created_at')
        .eq('rider_id', profileData.id)
        .in('status', ['searching', 'matched'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setActiveRequest(data);
        setCurrentView('status');
      }
    } catch (error) {
      console.error('Error fetching active request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRideRequested = (requestId: string) => {
    // Fetch the new request details
    fetchActiveRequest();
    setCurrentView('status');
    
    toast({
      title: "Ride Requested!",
      description: "We're looking for available drivers in your area."
    });
  };

  const handleRequestCancelled = () => {
    setActiveRequest(null);
    setCurrentView('booking');
  };

  const handleBackToBooking = () => {
    setCurrentView('booking');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to book a ride
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load your profile. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentView === 'status' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToBooking}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {currentView === 'booking' ? (
                    <Navigation className="h-6 w-6 text-primary" />
                  ) : (
                    <Clock className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-semibold">
                    {currentView === 'booking' ? 'Book a Ride' : 'Ride Status'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {profile.full_name || profile.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {currentView === 'booking' ? (
          <div className="max-w-4xl mx-auto">
            <RideBookingForm
              profileId={profile.id}
              onRideRequested={handleRideRequested}
            />
            
            {/* Recent Activity Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common destinations and ride options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                    <div className="text-lg">🏠</div>
                    <span className="text-sm">Home</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                    <div className="text-lg">💼</div>
                    <span className="text-sm">Work</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                    <div className="text-lg">✈️</div>
                    <span className="text-sm">Airport</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          activeRequest && (
            <div className="max-w-2xl mx-auto">
              <RideStatus
                rideRequestId={activeRequest.id}
                onRequestCancelled={handleRequestCancelled}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}