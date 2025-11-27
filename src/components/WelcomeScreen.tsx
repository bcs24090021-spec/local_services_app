import { Search, Briefcase, ArrowRight, Star, Users, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface WelcomeScreenProps {
  onSelectMode: (mode: 'customer' | 'provider') => void;
}

export function WelcomeScreen({ onSelectMode }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Logo & Header */}
      <div className="px-6 pt-12 pb-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-blue-900 mb-2">ServiceHub</h1>
        <p className="text-gray-600">Your local services marketplace</p>
      </div>

      {/* Main Options */}
      <div className="flex-1 px-6 pb-8">
        <div className="max-w-md mx-auto space-y-4">
          {/* Find Services Card */}
          <Card 
            className="border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer group"
            onClick={() => onSelectMode('customer')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-2">Find Services</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Browse and book trusted local service providers
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      <span>Cleaning, repair, beauty & more</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      <span>Verified providers with ratings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      <span>Easy booking & payment</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
              <Button 
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMode('customer');
                }}
              >
                Browse Services
              </Button>
            </CardContent>
          </Card>

          {/* Become a Provider Card */}
          <Card 
            className="border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer group"
            onClick={() => onSelectMode('provider')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-2">Become a Provider</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Grow your business and reach more customers
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      <span>Manage bookings & schedule</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      <span>Track earnings & performance</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      <span>Build your reputation</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
              <Button 
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMode('provider');
                }}
              >
                Start Providing
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="max-w-md mx-auto mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">50K+</span>
            </div>
            <p className="text-xs text-gray-600">Active Users</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span className="text-purple-900">5K+</span>
            </div>
            <p className="text-xs text-gray-600">Providers</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-900">4.8</span>
            </div>
            <p className="text-xs text-gray-600">Avg Rating</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center">
        <p className="text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
