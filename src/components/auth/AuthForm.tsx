import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Car, Users } from "lucide-react";

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAuth = async (
    email: string,
    password: string,
    fullName: string,
    role: 'rider' | 'driver',
    isSignUp: boolean
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              role: role
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // ✅ Wait for session to initialize
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData.session) {
          onSuccess(); // Redirect handled by parent
        } else {
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session) onSuccess();
          });
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Ubify</CardTitle>
          <CardDescription>Your decentralized ride-hailing platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm onSubmit={(email, password) => handleAuth(email, password, '', 'rider', false)} loading={loading} />
            </TabsContent>

            <TabsContent value="signup">
              <SignUpForm onSubmit={handleAuth} loading={loading} />
            </TabsContent>
          </Tabs>

          {error && (
            <Alert className="mt-4 border-destructive bg-destructive/10">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm({ onSubmit, loading }: { onSubmit: (email: string, password: string) => void; loading: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  );
}

function SignUpForm({ onSubmit, loading }: { onSubmit: (email: string, password: string, fullName: string, role: 'rider' | 'driver', isSignUp: boolean) => void; loading: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<'rider' | 'driver'>('rider');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, fullName, role, true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          required
          minLength={6}
        />
      </div>

      <div className="space-y-3">
        <Label>I want to join as:</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={role === 'rider' ? 'default' : 'outline'}
            onClick={() => setRole('rider')}
            className="h-auto p-4 flex flex-col items-center"
          >
            <Users className="h-6 w-6 mb-2" />
            <span>Rider</span>
            <span className="text-xs text-muted-foreground">Book rides</span>
          </Button>
          <Button
            type="button"
            variant={role === 'driver' ? 'default' : 'outline'}
            onClick={() => setRole('driver')}
            className="h-auto p-4 flex flex-col items-center"
          >
            <Car className="h-6 w-6 mb-2" />
            <span>Driver</span>
            <span className="text-xs text-muted-foreground">
              {role === 'driver' ? 'Complete verification' : 'Offer rides'}
            </span>
          </Button>
        </div>
      </div>

      {role === 'driver' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Car className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Driver Verification Required</p>
              <p className="text-amber-700 mt-1">
                After account creation, you'll complete a comprehensive verification process including 
                background checks, document uploads, and vehicle inspection.
              </p>
            </div>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {role === 'driver' ? 'Start Driver Application' : 'Create Account'}
      </Button>
    </form>
  );
}