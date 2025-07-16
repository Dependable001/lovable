import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, MapPin, DollarSign, Shield, Star, Users, Crown, Settings, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AuthForm from "@/components/auth/AuthForm";
import RiderDashboard from "@/components/RiderDashboard";
import DriverDashboard from "@/components/DriverDashboard";

interface Profile {
  role: 'rider' | 'driver' | 'admin';
  full_name: string;
}

type UserRole = "rider" | "driver" | "admin" | null;

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAuth) {
    return <AuthForm onSuccess={() => {
      setShowAuth(false);
      window.location.reload();
    }} />;
  }

  // If user is logged in, show dashboard based on their role
  if (user && profile) {
    if (profile.role === "rider") {
      return <RiderDashboard onBack={() => {}} />;
    }
    if (profile.role === "driver") {
      return <DriverDashboard onBack={() => {}} />;
    }
    if (profile.role === "admin") {
      window.location.href = '/admin';
      return null;
    }
  }

  // Role selection for non-authenticated users
  if (selectedRole === "rider" || selectedRole === "driver") {
    setShowAuth(true);
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-surface"></div>
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6">
              <Car className="h-8 w-8 text-ubify-primary" />
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                Ubi<span className="text-ubify-primary">fy</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              The <span className="text-ubify-primary font-semibold">decentralized</span> ride-hailing platform where 
              <br className="hidden md:block" />
              drivers control pricing and riders get transparent offers
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ubify-primary/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-ubify-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Drivers Keep 100%</h3>
                  <p className="text-sm text-muted-foreground">No commissions taken</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ubify-trust/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-ubify-trust" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Transparent Pricing</h3>
                  <p className="text-sm text-muted-foreground">See all offers upfront</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ubify-secondary/20 flex items-center justify-center">
                  <Star className="h-6 w-6 text-ubify-secondary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Fair Negotiations</h3>
                  <p className="text-sm text-muted-foreground">One counter allowed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Role</h2>
          <p className="text-muted-foreground">Get started with Ubify today</p>
        </div>

        <div className="text-center mb-8">
          {user ? (
            <div>
              <p className="text-lg mb-4">Welcome back, {profile?.full_name}!</p>
              <Button 
                size="lg" 
                className="px-8 py-6 text-lg"
                onClick={() => window.location.reload()}
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="px-8 py-6 text-lg"
                onClick={() => setSelectedRole("rider")}
              >
                <Users className="mr-2 h-5 w-5" />
                Find a Ride
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-6 text-lg"
                onClick={() => setSelectedRole("driver")}
              >
                <Car className="mr-2 h-5 w-5" />
                Drive & Earn
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="px-8 py-6 text-lg"
                onClick={() => setShowAuth(true)}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </div>
          )}
        </div>

        {!user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Rider Card */}
            <Card className="relative group hover:shadow-trust transition-all duration-300 cursor-pointer border-border/50 hover:border-ubify-trust/50"
                  onClick={() => setSelectedRole("rider")}>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-ubify-trust/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-ubify-trust/30 transition-colors">
                  <MapPin className="h-8 w-8 text-ubify-trust" />
                </div>
                <CardTitle className="text-xl">Rider</CardTitle>
                <CardDescription>Request rides and choose the best offers</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-trust"></div>
                    See transparent pricing from all drivers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-trust"></div>
                    Negotiate once for fairness
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-trust"></div>
                    Pay with card or cash
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-trust"></div>
                    Rate your experience
                  </li>
                </ul>
                <Button variant="ubify-outline" className="w-full mt-6">
                  Start as Rider
                </Button>
              </CardContent>
            </Card>

            {/* Driver Card */}
            <Card className="relative group hover:shadow-glow transition-all duration-300 cursor-pointer border-border/50 hover:border-ubify-primary/50"
                  onClick={() => setSelectedRole("driver")}>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-ubify-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-ubify-primary/30 transition-colors">
                  <Car className="h-8 w-8 text-ubify-primary" />
                </div>
                <CardTitle className="text-xl">Driver</CardTitle>
                <CardDescription>Set your prices and accept rides your way</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-primary"></div>
                    Control your pricing completely
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-primary"></div>
                    Keep 100% of fare (no commissions)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-primary"></div>
                    Choose which rides to accept
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-primary"></div>
                    Weekly/monthly subscription model
                  </li>
                </ul>
                <Button variant="ubify" className="w-full mt-6">
                  Start Driving
                </Button>
              </CardContent>
            </Card>

            {/* Admin Card */}
            <Card className="relative group hover:shadow-trust transition-all duration-300 cursor-pointer border-border/50 hover:border-ubify-secondary/50"
                  onClick={() => window.location.href = '/admin'}>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-ubify-secondary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-ubify-secondary/30 transition-colors">
                  <Crown className="h-8 w-8 text-ubify-secondary" />
                </div>
                <CardTitle className="text-xl">Admin</CardTitle>
                <CardDescription>Manage platform and resolve disputes</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-secondary"></div>
                    Monitor user activity
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-secondary"></div>
                    Handle support tickets
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-secondary"></div>
                    Resolve disputes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-ubify-secondary"></div>
                    Platform analytics
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-6 border-ubify-secondary text-ubify-secondary hover:bg-ubify-secondary hover:text-ubify-dark">
                  Admin Panel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trust Section */}
        <div className="bg-gradient-surface py-16 mt-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-6">Built on Trust & Transparency</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Ubify eliminates the black box of traditional ride-hailing. Every driver sets their own fair price, 
                every rider sees all options, and negotiations happen in the open.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-ubify-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Driver Autonomy</h3>
                  <p className="text-sm text-muted-foreground">Complete control over pricing and ride acceptance</p>
                </div>
                <div className="text-center">
                  <Shield className="h-12 w-12 text-ubify-trust mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Rider Protection</h3>
                  <p className="text-sm text-muted-foreground">See all offers, negotiate fairly, pay securely</p>
                </div>
                <div className="text-center">
                  <Settings className="h-12 w-12 text-ubify-secondary mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Fair Platform</h3>
                  <p className="text-sm text-muted-foreground">No hidden commissions, transparent operations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;