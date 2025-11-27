import { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Phone, Briefcase, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';

interface ProviderAuthProps {
  onBack: () => void;
  onAuthSuccess: () => void;
}

export function ProviderAuth({ onBack, onAuthSuccess }: ProviderAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupBusinessName, setSignupBusinessName] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const { login } = await import('../utils/api');
      const data = await login(loginEmail, loginPassword);
      
      // Check if user is a provider
      if (data.user?.user_metadata?.user_type !== 'provider') {
        toast.error('This account is not registered as a provider');
        setIsLoading(false);
        return;
      }
      
      toast.success('Login successful!');
      onAuthSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide helpful error messages
      let errorMessage = 'Failed to login';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Email confirmation in progress. Please try again in a moment.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupName || !signupEmail || !signupPhone || !signupPassword || !signupBusinessName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    if (signupPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { signupProvider } = await import('../utils/api');
      await signupProvider({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        phone: signupPhone,
        businessName: signupBusinessName,
      });
      toast.success('Account created successfully!');
      onAuthSuccess();
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 bg-white border-b border-gray-200">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2>Provider Portal</h2>
          <p className="text-sm text-gray-600">Join our network of professionals</p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="px-4 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <h3 className="text-white mb-4">Why become a provider?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Reach thousands of customers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Manage bookings & schedule easily</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Get paid quickly & securely</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Build your reputation with reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Login to access your provider dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <label
                        htmlFor="remember"
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        Remember me
                      </label>
                    </div>
                    <Button variant="link" className="px-0 text-sm">
                      Forgot password?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signup Form */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Start your journey as a service provider</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-business">Business Name</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-business"
                        type="text"
                        placeholder="Your Business Name"
                        className="pl-10"
                        value={signupBusinessName}
                        onChange={(e) => setSignupBusinessName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                      I agree to the{' '}
                      <span className="text-purple-600">Terms of Service</span> and{' '}
                      <span className="text-purple-600">Privacy Policy</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? <span className="text-purple-600 cursor-pointer">Contact Support</span>
        </p>
      </div>
    </div>
  );
}
