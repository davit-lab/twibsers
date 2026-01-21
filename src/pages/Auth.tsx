import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Users, BookOpen, MessageCircle } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const validateForm = (isSignUp: boolean) => {
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (isSignUp && displayName && displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    setLoading(true);
    const { error } = await signUp(email, password, displayName || undefined);
    setLoading(false);
    
    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please log in instead.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: errorMessage,
      });
    } else {
      toast({
        title: 'Welcome to Twibsers!',
        description: 'Your account has been created successfully.',
      });
      navigate('/');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-display font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Twibsers
          </h1>
          <p className="text-white/80 mt-2 text-lg">Connect. Create. Collaborate.</p>
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Build Your Community</h3>
              <p className="text-white/70">Connect with like-minded individuals and grow your network</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Real-Time Messaging</h3>
              <p className="text-white/70">Stay connected with instant messaging and notifications</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Digital Library</h3>
              <p className="text-white/70">Publish and discover amazing content from verified creators</p>
            </div>
          </div>
        </div>
        
        <p className="relative z-10 text-white/60 text-sm">
          © 2024 Twibsers. All rights reserved.
        </p>
      </div>
      
      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-display font-bold gradient-text flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              Twibsers
            </h1>
          </div>
          
          <Card className="border-0 shadow-card">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-display">
                {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'login' 
                  ? 'Enter your credentials to access your account' 
                  : 'Join Twibsers and start connecting'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Log In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'border-destructive' : ''}
                        disabled={loading}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive' : ''}
                        disabled={loading}
                      />
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>
                    
                    <Button type="submit" className="w-full btn-gradient" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        'Log In'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Display Name (optional)</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={errors.displayName ? 'border-destructive' : ''}
                        disabled={loading}
                      />
                      {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'border-destructive' : ''}
                        disabled={loading}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive' : ''}
                        disabled={loading}
                      />
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>
                    
                    <Button type="submit" className="w-full btn-gradient" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      By signing up, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}