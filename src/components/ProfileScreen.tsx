import { useState, useEffect } from 'react';
import { ChevronRight, Heart, CreditCard, Bell, HelpCircle, Settings, LogOut, MapPin, Star, User, Edit2, Check, X, Mail, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { getUserProfile, updateCustomerProfile, getCustomerStats } from '../utils/api';
import { toast } from 'sonner@2.0.3';

const menuItems = [
  {
    id: 'saved',
    icon: Heart,
    label: 'Saved Services',
    badge: null,
  },
  {
    id: 'payment',
    icon: CreditCard,
    label: 'Payment Methods',
    badge: null,
  },
  {
    id: 'addresses',
    icon: MapPin,
    label: 'My Addresses',
    badge: null,
  },
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    badge: null,
  },
];

const settingsItems = [
  {
    id: 'settings',
    icon: Settings,
    label: 'Settings',
  },
  {
    id: 'help',
    icon: HelpCircle,
    label: 'Help & Support',
  },
];

interface ProfileScreenProps {
  onMenuClick?: (menuId: string) => void;
  onLogout?: () => void;
}

export function ProfileScreen({ onMenuClick, onLogout }: ProfileScreenProps) {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    address: '',
  });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getUserProfile();
      
      if (response.success && response.user) {
        setProfile(response.user);
        setFormData({
          name: response.user.name || '',
          phone: response.user.phone || '',
          bio: response.user.bio || '',
          address: response.user.address || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading customer profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getCustomerStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading customer stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await updateCustomerProfile(formData);
      
      if (response.success) {
        setProfile(response.customer);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating customer profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        address: profile.address || '',
      });
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="pb-20 bg-gray-50">
        <div className="bg-white px-4 py-6 mb-2 h-32 animate-pulse" />
        <div className="bg-white px-4 py-4 mb-2 h-24 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white mb-2 h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  // Simple menu view (not editing)
  if (!isEditing) {
    return (
      <div className="pb-20 bg-gray-50">
        {/* Profile Header */}
        <div className="bg-white px-4 py-6 mb-2">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials(profile?.name || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2>{profile?.name || 'User'}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">{profile?.email || 'email@example.com'}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{stats?.customer_rating?.toFixed(1) || '0.0'} Rating as Customer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white px-4 py-4 mb-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-blue-600">{stats?.total_bookings || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Bookings</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <div className="text-blue-600">{stats?.saved_services || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Saved</p>
            </div>
            <div className="text-center">
              <div className="text-blue-600">{stats?.total_reviews || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Reviews</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white mb-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {index > 0 && <Separator />}
                <button
                  onClick={() => onMenuClick?.(item.id)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Settings */}
        <div className="bg-white mb-2">
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {index > 0 && <Separator />}
                <button
                  onClick={() => onMenuClick?.(item.id)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Logout */}
        <div className="bg-white">
          <button 
            onClick={onLogout}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-600"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>

        {/* Version */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">Version 1.0.0</p>
        </div>
      </div>
    );
  }

  // Edit mode view
  return (
    <div className="pb-20 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-500">
                {getInitials(profile?.name || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-white mb-1">{profile?.name || 'User'}</h1>
              <p className="text-sm text-blue-100">{profile?.email || 'email@example.com'}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-white">
                  {stats?.customer_rating?.toFixed(1) || '0.0'} ({stats?.total_reviews || 0} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-white mb-1">{stats.total_bookings || 0}</div>
              <p className="text-xs text-blue-100">Bookings</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-white mb-1">{stats.saved_services || 0}</div>
              <p className="text-xs text-blue-100">Saved</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-white mb-1">{stats.total_reviews || 0}</div>
              <p className="text-xs text-blue-100">Reviews</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Mode Actions */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3>Edit Profile</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="w-4 h-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="px-4 py-4 space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="py-2">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm">{profile?.email || 'Not set'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell service providers about yourself..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Default Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State ZIP"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Account Type</span>
              <Badge variant="default" className="bg-blue-600">Customer</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="text-sm">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Card>
          <CardContent className="p-0">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 py-4"
              onClick={onLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Version Info */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">Customer App v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
