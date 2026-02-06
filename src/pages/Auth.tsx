import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Users, BookOpen, MessageCircle, Mail, KeyRound, ArrowLeft, Phone, Smartphone, Eye, EyeOff } from 'lucide-react';
import { validateEmail } from '@/lib/emailValidation';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import CountryCodeSelector from '@/components/auth/CountryCodeSelector';
import { countries, type Country } from '@/lib/countryCodes';
import { cn } from '@/lib/utils';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'login' | 'signup' | 'otp-request' | 'otp-verify' | 'phone-request' | 'phone-verify';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries.find(c => c.code === 'US')!);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const validateForm = (isSignUp: boolean) => {
    const newErrors: typeof errors = {};
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error || 'Please enter a valid email address';
    }
    
    if (authMode !== 'otp-request') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
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
        title: 'Welcome back! 👋',
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
        title: 'Welcome to Twibsers! 🎉',
        description: 'Your account has been created successfully.',
      });
      navigate('/onboarding/interests');
    }
  };

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrors({ email: emailValidation.error || 'Please enter a valid email address' });
      return;
    }
    setErrors({});
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to send code',
        description: error.message,
      });
    } else {
      toast({
        title: 'Code sent! 📧',
        description: 'Check your email for the 6-digit verification code.',
      });
      setAuthMode('otp-verify');
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid code',
        description: 'Please enter the 6-digit code from your email.',
      });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    });
    setLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message,
      });
    } else {
      const { count } = await (supabase as any)
        .from('user_interests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      const isNewUser = (count || 0) === 0;
      
      toast({
        title: 'Welcome! 🎉',
        description: 'You have successfully signed in.',
      });
      navigate(isNewUser ? '/onboarding/interests' : '/');
    }
  };

  const handlePhoneRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullPhoneNumber = selectedCountry.dialCode + phoneNumber.replace(/^0+/, '');
    
    if (!isValidPhoneNumber(fullPhoneNumber)) {
      setErrors({ email: 'Please enter a valid phone number for ' + selectedCountry.name });
      return;
    }
    setErrors({});
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: fullPhoneNumber,
    });
    setLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to send code',
        description: error.message,
      });
    } else {
      toast({
        title: 'Code sent! 📱',
        description: 'Check your phone for the 6-digit verification code.',
      });
      setAuthMode('phone-verify');
    }
  };

  const handlePhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phoneOtpCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid code',
        description: 'Please enter the 6-digit code from your SMS.',
      });
      return;
    }
    const fullPhoneNumber = selectedCountry.dialCode + phoneNumber.replace(/^0+/, '');
    
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhoneNumber,
      token: phoneOtpCode,
      type: 'sms',
    });
    setLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message,
      });
    } else {
      const { count } = await (supabase as any)
        .from('user_interests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      const isNewUser = (count || 0) === 0;
      
      toast({
        title: 'Welcome! 🎉',
        description: 'You have successfully signed in.',
      });
      navigate(isNewUser ? '/onboarding/interests' : '/');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
        </div>
      </div>
    );
  }

  const renderOtpFlow = () => (
    <div className="w-full max-w-md mx-auto">
      <button
        onClick={() => setAuthMode('login')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
          {authMode === 'otp-request' ? (
            <Mail className="h-10 w-10 text-white" />
          ) : (
            <KeyRound className="h-10 w-10 text-white" />
          )}
        </div>
        <h1 className="text-3xl font-bold mb-2">
          {authMode === 'otp-request' ? 'Sign in with Email' : 'Enter Code'}
        </h1>
        <p className="text-muted-foreground">
          {authMode === 'otp-request' 
            ? "We'll send a 6-digit code to your email" 
            : `Enter the code sent to ${email}`}
        </p>
      </div>

      {authMode === 'otp-request' ? (
        <form onSubmit={handleOtpRequest} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp-email" className="text-sm font-medium">Email address</Label>
            <Input
              id="otp-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "h-14 text-base bg-muted/50 border-border/50 rounded-xl transition-all focus:bg-background focus:border-primary",
                errors.email && 'border-destructive'
              )}
              disabled={loading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          
          <Button type="submit" className="w-full h-14 text-base btn-gradient rounded-xl" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending code...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-5 w-5" />
                Send Code
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleOtpVerify} className="space-y-8">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-14 text-xl rounded-xl" />
                <InputOTPSlot index={1} className="w-12 h-14 text-xl rounded-xl" />
                <InputOTPSlot index={2} className="w-12 h-14 text-xl rounded-xl" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="w-12 h-14 text-xl rounded-xl" />
                <InputOTPSlot index={4} className="w-12 h-14 text-xl rounded-xl" />
                <InputOTPSlot index={5} className="w-12 h-14 text-xl rounded-xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          
          <Button type="submit" className="w-full h-14 text-base btn-gradient rounded-xl" disabled={loading || otpCode.length !== 6}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Sign In'
            )}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={() => setAuthMode('otp-request')}
              className="text-primary hover:underline font-medium"
            >
              Resend
            </button>
          </p>
        </form>
      )}
    </div>
  );

  const renderPhoneFlow = () => (
    <div className="w-full max-w-md mx-auto">
      <button
        onClick={() => setAuthMode('login')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
          {authMode === 'phone-request' ? (
            <Phone className="h-10 w-10 text-white" />
          ) : (
            <Smartphone className="h-10 w-10 text-white" />
          )}
        </div>
        <h1 className="text-3xl font-bold mb-2">
          {authMode === 'phone-request' ? 'Sign in with Phone' : 'Enter Code'}
        </h1>
        <p className="text-muted-foreground">
          {authMode === 'phone-request' 
            ? "We'll send a 6-digit code via SMS" 
            : `Enter the code sent to ${phoneNumber}`}
        </p>
      </div>

      {authMode === 'phone-request' ? (
        <form onSubmit={handlePhoneRequest} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone-number" className="text-sm font-medium">Phone Number</Label>
            <div className="flex gap-2">
              <CountryCodeSelector
                value={selectedCountry.code}
                onChange={setSelectedCountry}
                disabled={loading}
              />
              <Input
                id="phone-number"
                type="tel"
                placeholder="Enter your number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ''))}
                className={cn(
                  "flex-1 h-14 text-base bg-muted/50 border-border/50 rounded-xl transition-all focus:bg-background focus:border-primary",
                  errors.email && 'border-destructive'
                )}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Select your country and enter your phone number
            </p>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          
          <Button type="submit" className="w-full h-14 text-base btn-gradient rounded-xl" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending code...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-5 w-5" />
                Send Code
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handlePhoneVerify} className="space-y-8">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={phoneOtpCode}
              onChange={setPhoneOtpCode}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-14 text-xl rounded-xl" />
                <InputOTPSlot index={1} className="w-12 h-14 text-xl rounded-xl" />
                <InputOTPSlot index={2} className="w-12 h-14 text-xl rounded-xl" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="w-12 h-14 text-xl rounded-xl" />
                <InputOTPSlot index={4} className="w-12 h-14 text-xl rounded-xl" />
                <InputOTPSlot index={5} className="w-12 h-14 text-xl rounded-xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          
          <Button type="submit" className="w-full h-14 text-base btn-gradient rounded-xl" disabled={loading || phoneOtpCode.length !== 6}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Sign In'
            )}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={() => setAuthMode('phone-request')}
              className="text-primary hover:underline font-medium"
            >
              Resend
            </button>
          </p>
        </form>
      )}
    </div>
  );

  const renderAuthForm = () => (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30 lg:hidden">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          {activeTab === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-muted-foreground">
          {activeTab === 'login' 
            ? 'Enter your credentials to continue' 
            : 'Join Twibsers and start connecting'}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-muted/50 p-1.5 rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab('login')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
            activeTab === 'login'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Log In
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
            activeTab === 'signup'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Sign Up
        </button>
      </div>

      {/* Login Form */}
      {activeTab === 'login' && (
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "h-14 text-base bg-muted/50 border-border/50 rounded-xl transition-all focus:bg-background focus:border-primary",
                errors.email && 'border-destructive'
              )}
              disabled={loading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "h-14 text-base bg-muted/50 border-border/50 rounded-xl pr-12 transition-all focus:bg-background focus:border-primary",
                  errors.password && 'border-destructive'
                )}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>
          
          <Button type="submit" className="w-full h-14 text-base btn-gradient rounded-xl" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 gap-2 rounded-xl border-border/50 hover:bg-muted/50"
              onClick={() => setAuthMode('otp-request')}
            >
              <Mail className="h-4 w-4" />
              Email Code
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 gap-2 rounded-xl border-border/50 hover:bg-muted/50"
              onClick={() => setAuthMode('phone-request')}
            >
              <Phone className="h-4 w-4" />
              Phone
            </Button>
          </div>
        </form>
      )}

      {/* Signup Form */}
      {activeTab === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="signup-name" className="text-sm font-medium">Display Name <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="signup-name"
              type="text"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={cn(
                "h-14 text-base bg-muted/50 border-border/50 rounded-xl transition-all focus:bg-background focus:border-primary",
                errors.displayName && 'border-destructive'
              )}
              disabled={loading}
            />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "h-14 text-base bg-muted/50 border-border/50 rounded-xl transition-all focus:bg-background focus:border-primary",
                errors.email && 'border-destructive'
              )}
              disabled={loading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "h-14 text-base bg-muted/50 border-border/50 rounded-xl pr-12 transition-all focus:bg-background focus:border-primary",
                  errors.password && 'border-destructive'
                )}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>
          
          <Button type="submit" className="w-full h-14 text-base btn-gradient rounded-xl" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground">Or sign up with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 gap-2 rounded-xl border-border/50 hover:bg-muted/50"
            onClick={() => setAuthMode('phone-request')}
          >
            <Phone className="h-4 w-4" />
            Sign up with Phone
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent p-12 flex-col justify-between relative overflow-hidden">
        {/* Ambient Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-80 h-80 rounded-full bg-white blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-[150px]" />
        </div>
        
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Twibsers</h1>
          </div>
          <p className="text-white/80 mt-3 text-lg max-w-sm">
            Connect with creators, share your story, and discover amazing content.
          </p>
        </div>
        
        {/* Features */}
        <div className="relative z-10 space-y-6">
          {[
            { icon: Users, title: 'Build Your Community', desc: 'Connect with like-minded individuals and grow your network' },
            { icon: MessageCircle, title: 'Real-Time Messaging', desc: 'Stay connected with instant messaging and voice calls' },
            { icon: BookOpen, title: 'Digital Library', desc: 'Publish and discover amazing content from verified creators' },
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        <p className="relative z-10 text-white/50 text-sm">
          © 2024 Twibsers. All rights reserved.
        </p>
      </div>
      
      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 w-full">
          {(authMode === 'otp-request' || authMode === 'otp-verify') && renderOtpFlow()}
          {(authMode === 'phone-request' || authMode === 'phone-verify') && renderPhoneFlow()}
          {authMode === 'login' && renderAuthForm()}
        </div>
      </div>
    </div>
  );
}
