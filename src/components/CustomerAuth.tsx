import { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Phone, ShoppingBag, MessageSquare, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';

interface CustomerAuthProps {
  onBack: () => void;
  onAuthSuccess: () => void;
  redirectFeature?: 'messages' | 'bookings' | 'profile';
}

export function CustomerAuth({ onBack, onAuthSuccess, redirectFeature }: CustomerAuthProps) {
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
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const getFeatureMessage = () => {
    switch (redirectFeature) {
      case 'messages':
        return 'Login to send messages to service providers';
      case 'bookings':
        return 'Login to view and manage your bookings';
      case 'profile':
        return 'Login to access your profile';
      default:
        return 'Login to access all features';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const { login } = await import('../utils/api');
      await login(loginEmail, loginPassword);
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

    if (!signupName || !signupEmail || !signupPhone || !signupPassword) {
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
      const { signupCustomer } = await import('../utils/api');
      await signupCustomer({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        phone: signupPhone,
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

  const handleSkipForNow = () => {
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 bg-white border-b border-gray-200">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2>Welcome to ServiceHub</h2>
          <p className="text-sm text-gray-600">{getFeatureMessage()}</p>
        </div>
      </div>

      {/* Feature Benefits */}
      <div className="px-4 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h3 className="text-white mb-4">What you'll get with an account</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Direct messaging with service providers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Easy booking and schedule management</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Track your booking history</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Manage your profile and preferences</p>
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
                <CardDescription>Login to continue with ServiceHub</CardDescription>
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
                    className="w-full bg-blue-600 hover:bg-blue-700"
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
                <CardDescription>Join ServiceHub and book services easily</CardDescription>
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
                      <span className="text-blue-600">Terms of Service</span> and{' '}
                      <span className="text-blue-600">Privacy Policy</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Skip Option */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={handleSkipForNow}
            className="text-gray-600"
          >
            Continue browsing without account
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? <span className="text-blue-600 cursor-pointer">Contact Support</span>
        </p>
      </div>
    </div>
  );
}
