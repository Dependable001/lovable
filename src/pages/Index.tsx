import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Car, 
  MapPin, 
  Users, 
  Shield, 
  Star, 
  Clock,
  CreditCard,
  Smartphone,
  ArrowRight,
  User,
  Settings,
  BarChart3,
  LogOut
} from 'lucide-react';
import RiderDashboard from '@/components/RiderDashboard';
import DriverDashboard from '@/components/DriverDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Index() {
  const { user, userRole, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, show their dashboard
  if (user && userRole) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                <Car className="h-8 w-8" />
                RideShare
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {profile?.full_name || user?.email}
                </span>
                <Badge variant="outline">{userRole}</Badge>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-8">
          {userRole === 'rider' && <RiderDashboard onBack={() => {}} />}
          {userRole === 'driver' && <DriverDashboard onBack={() => {}} />}
          {userRole === 'admin' && <AdminDashboard onBack={() => {}} />}
        </div>
      </div>
    );
  }

  // Show auth form if requested
  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary mb-4">
                <Car className="h-8 w-8" />
                RideShare
              </Link>
            </div>
            <AuthForm onSuccess={() => setShowAuth(false)} />
            <div className="text-center mt-4">
              <Button variant="ghost" onClick={() => setShowAuth(false)}>
                ← Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Car className="h-8 w-8" />
              RideShare
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setShowAuth(true)}>
                Sign In
              </Button>
              <Button onClick={() => setShowAuth(true)}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Your Ride, Your Way
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with drivers in your area for safe, reliable, and affordable rides. 
              Whether you're a rider or driver, we've got you covered.
            </p>
            
            {/* Quick Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-2xl mx-auto">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setShowAuth(true)}>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Need a Ride?</CardTitle>
                  <CardDescription>
                    Book a ride in seconds and get to your destination safely
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-primary/90 transition-colors">
                    Book a Ride
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/driver-onboarding')}>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                    <Car className="h-8 w-8 text-secondary" />
                  </div>
                  <CardTitle className="text-xl">Drive & Earn</CardTitle>
                  <CardDescription>
                    Join our driver network and start earning on your schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full group-hover:bg-secondary/90 transition-colors">
                    Become a Driver
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose RideShare?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of transportation with our cutting-edge platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
              <p className="text-muted-foreground">
                All drivers are thoroughly vetted with background checks and vehicle inspections
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
              <p className="text-muted-foreground">
                Quick pickup times with real-time tracking and professional drivers
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Payment</h3>
              <p className="text-muted-foreground">
                Seamless cashless payments with transparent pricing and receipts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Active Riders</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Verified Drivers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Completed Rides</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">4.9</div>
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                Average Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join thousands of satisfied users who trust RideShare for their daily transportation needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setShowAuth(true)}
                className="text-lg px-8"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Download App
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setShowAuth(true)}
                className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Sign Up Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                <Car className="h-6 w-6" />
                RideShare
              </Link>
              <p className="text-muted-foreground text-sm">
                The most reliable ride-sharing platform connecting riders and drivers.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Riders</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground transition-colors">Book a Ride</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-colors">Safety</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Drivers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/driver-onboarding" className="hover:text-foreground transition-colors">Apply to Drive</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-colors">Requirements</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-colors">Earnings</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 RideShare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}