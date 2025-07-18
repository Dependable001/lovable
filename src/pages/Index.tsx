import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Car,
  LogOut,
  Shield,
  Star,
  Smartphone,
  MapPin,
  Users,
  Clock,
  CreditCard
} from 'lucide-react';
import RiderDashboard from '@/components/RiderDashboard';
import DriverDashboard from '@/components/DriverDashboard';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Index() {
  const { user, userRole, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const role = data.session?.user?.user_metadata?.role;

      if (role === 'driver') {
        navigate('/driver/dashboard');
      } else if (role === 'rider') {
        navigate('/rider/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

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

  if (user && userRole) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                <Car className="h-8 w-8 text-green-500" />
                <span><span className="text-white">Ubi</span><span className="text-green-400">fy</span></span>
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
        <div className="container mx-auto px-4 py-8">
          {userRole === 'rider' && <RiderDashboard onBack={() => setShowAuth(false)} />}
          {userRole === 'driver' && <DriverDashboard onBack={() => setShowAuth(false)} />}
        </div>
      </div>
    );
  }

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary mb-4">
                <Car className="h-8 w-8 text-green-500" />
                <span><span className="text-white">Ubi</span><span className="text-green-400">fy</span></span>
              </Link>
            </div>
            <AuthForm onSuccess={() => window.location.reload()} />
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Car className="h-8 w-8 text-green-500" />
              <span><span className="text-white">Ubi</span><span className="text-green-400">fy</span></span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setShowAuth(true)}>
                Sign In / Sign Up
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate('/driver-onboarding')}>
                Become a Driver
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Background Video */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/video/hero.mp4?v=2" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Welcome to <span className="text-green-500">Ubify</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl">
            Your decentralized ride-hailing platform. Empowering drivers, rewarding riders.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-secondary rounded-lg p-6 shadow">
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Smartphone className="w-5 h-5 text-green-500" /> For Riders</h3>
            <p className="text-muted-foreground mb-4">Request a ride with ease, see prices upfront, and pay securely.</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Instant pickup anywhere</li>
              <li className="flex items-center gap-2"><Users className="w-4 h-4" /> Fast and reliable drivers</li>
              <li className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Multiple payment options</li>
              <li className="flex items-center gap-2"><Users className="w-4 h-4" /> Support your local drivers</li>
            </ul>
          </div>
          <div className="bg-secondary rounded-lg p-6 shadow">
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Shield className="w-5 h-5 text-green-500" /> For Drivers</h3>
            <p className="text-muted-foreground mb-4">Get paid instantly, accept rides on your own schedule.</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Star className="w-4 h-4" /> Build your reputation through ratings</li>
              <li className="flex items-center gap-2"><Shield className="w-4 h-4" /> Transparent feedback system</li>
              <li className="flex items-center gap-2"><Clock className="w-4 h-4" /> Full flexibility & control</li>
            </ul>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-16 text-center animate-fade-in">
        {/* How it Works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-secondary rounded-lg p-6 shadow">
              <h4 className="font-semibold mb-2">Step 1</h4>
              <p className="text-sm text-muted-foreground">Sign up as a rider or driver in just a few taps.</p>
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow">
              <h4 className="font-semibold mb-2">Step 2</h4>
              <p className="text-sm text-muted-foreground">Drivers go through quick onboarding & riders start booking.</p>
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow">
              <h4 className="font-semibold mb-2">Step 3</h4>
              <p className="text-sm text-muted-foreground">Earn or ride instantly — all while supporting a fairer platform.</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">What People Are Saying</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-secondary rounded-lg p-6 shadow animate-fade-in">
              <p className="text-muted-foreground">“Ubify lets me drive when I want and earn what I deserve.”</p>
              <p className="mt-2 font-semibold">– James, Driver</p>
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow animate-fade-in">
              <p className="text-muted-foreground">“So easy to request a ride and support my local drivers.”</p>
              <p className="mt-2 font-semibold">– Tolu, Rider</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground border-t pt-8 space-y-4">
          <p>&copy; {new Date().getFullYear()} Ubify. All rights reserved.</p>
          <div className="flex justify-center space-x-6 text-muted-foreground">
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/support">Support</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
