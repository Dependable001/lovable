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
import ubifyLogo from '@/assets/ubify-logo-final.png';
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
                <img src={ubifyLogo} alt="Ubify" className="h-8 w-8" />
                Ubify
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
          {userRole === 'rider' && <RiderDashboard onBack={() => setShowAuth(false)} />}
          {userRole === 'driver' && <DriverDashboard onBack={() => setShowAuth(false)} />}
          {userRole === 'admin' && <AdminDashboard onBack={() => setShowAuth(false)} />}
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
                <img src={ubifyLogo} alt="Ubify" className="h-8 w-8" />
                Ubify
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
              <img src={ubifyLogo} alt="Ubify" className="h-8 w-8" />
              Ubify
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
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                The <span className="text-green-400">decentralized</span> ride-hailing platform where<br />
                drivers control pricing and riders get transparent offers
              </h1>
              
              {/* Key Features */}
              <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 font-bold text-xl">$</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">Drivers Keep 100%</h3>
                    <p className="text-sm text-muted-foreground">No commissions taken</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">Transparent Pricing</h3>
                    <p className="text-sm text-muted-foreground">See all offers upfront</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">Fair Negotiations</h3>
                    <p className="text-sm text-muted-foreground">One counter allowed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Choose Your Role Section */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Role</h2>
              <p className="text-muted-foreground mb-12">Get started with Ubify today</p>
              
              {/* Role Selection Buttons */}
              <div className="flex justify-center gap-4 mb-12">
                <Button 
                  variant="default" 
                  className="bg-green-500 hover:bg-green-600 text-white px-8"
                  onClick={() => setShowAuth(true)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Find a Ride
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/20 text-foreground hover:bg-white/10 px-8"
                  onClick={() => navigate('/driver-onboarding')}
                >
                  <Car className="mr-2 h-4 w-4" />
                  Drive & Earn
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/20 text-foreground hover:bg-white/10 px-8"
                  onClick={() => setShowAuth(true)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </div>

              {/* Role Cards */}
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Rider Card */}
                <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/70 transition-all">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-blue-400" />
                    </div>
                    <CardTitle className="text-xl">Rider</CardTitle>
                    <CardDescription>Request rides and choose the best offers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>See transparent pricing from all drivers</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Negotiate once for fairness</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Pay with card or cash</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Rate your experience</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4 bg-blue-500 hover:bg-blue-600"
                      onClick={() => setShowAuth(true)}
                    >
                      Start as Rider
                    </Button>
                  </CardContent>
                </Card>

                {/* Driver Card */}
                <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/70 transition-all">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car className="h-8 w-8 text-green-400" />
                    </div>
                    <CardTitle className="text-xl">Driver</CardTitle>
                    <CardDescription>Set your prices and accept rides you want</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Control your pricing completely</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Keep 100% of fare (no commissions)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Choose which rides to accept</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Weekly/monthly subscription model</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4 bg-green-500 hover:bg-green-600"
                      onClick={() => navigate('/driver-onboarding')}
                    >
                      Start Driving
                    </Button>
                  </CardContent>
                </Card>

                {/* Admin Card */}
                <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/70 transition-all">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="h-8 w-8 text-yellow-400" />
                    </div>
                    <CardTitle className="text-xl">Admin</CardTitle>
                    <CardDescription>Manage platform and resolve disputes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Monitor user activity</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Handle support tickets</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Resolve disputes</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Platform analytics</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
                      onClick={() => setShowAuth(true)}
                    >
                      Admin Panel
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Ubify?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of transportation with our blockchain-powered platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
               <h3 className="text-xl font-semibold mb-2">Blockchain Security</h3>
               <p className="text-muted-foreground">
                 Transparent, secure transactions powered by blockchain technology with smart contracts
               </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
               <h3 className="text-xl font-semibold mb-2">Decentralized Network</h3>
               <p className="text-muted-foreground">
                 No middleman - direct connections between riders and drivers with fair pricing
               </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
               <h3 className="text-xl font-semibold mb-2">Crypto Payments</h3>
               <p className="text-muted-foreground">
                 Pay with cryptocurrency or traditional methods with transparent, immutable records
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
              Join the Revolution
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Be part of the decentralized future of transportation with Ubify's blockchain-powered platform
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
                <img src={ubifyLogo} alt="Ubify" className="h-6 w-6" />
                Ubify
              </Link>
              <p className="text-muted-foreground text-sm">
                The decentralized ride-hailing platform connecting riders and drivers through blockchain.
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
            <p>&copy; 2024 Ubify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}