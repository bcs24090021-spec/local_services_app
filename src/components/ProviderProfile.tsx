import { useState, useEffect } from 'react';
import { User, Building2, Phone, Mail, MapPin, FileText, LogOut, Edit2, Check, X, Star, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { getUserProfile, updateProviderProfile, getProviderStats } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface ProviderProfileProps {
  onLogout?: () => void;
}

const categories = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'repair', label: 'Repair & Maintenance' },
  { value: 'beauty', label: 'Beauty & Wellness' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'moving', label: 'Moving & Delivery' },
  { value: 'photography', label: 'Photography' },
  { value: 'event', label: 'Event Planning' },
  { value: 'pet', label: 'Pet Care' },
  { value: 'general', label: 'General Services' },
];

export function ProviderProfile({ onLogout }: ProviderProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    phone: '',
    category: '',
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
          business_name: response.user.business_name || '',
          phone: response.user.phone || '',
          category: response.user.category || 'general',
          bio: response.user.bio || '',
          address: response.user.address || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getProviderStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await updateProviderProfile(formData);
      
      if (response.success) {
        setProfile(response.provider);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
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
        business_name: profile.business_name || '',
        phone: profile.phone || '',
        category: profile.category || 'general',
        bio: profile.bio || '',
        address: profile.address || '',
      });
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <div className="pb-20 bg-gray-50">
        <div className="px-4 py-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 h-32 animate-pulse bg-gray-100" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarImage src="" />
              <AvatarFallback className="bg-purple-500">
                {getInitials(profile?.business_name || profile?.name || 'P')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-white mb-1">{profile?.business_name || 'Business Name'}</h1>
              <p className="text-sm text-purple-100">{profile?.name || 'Provider'}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-white">
                  {profile?.rating?.toFixed(1) || '0.0'} ({profile?.total_reviews || 0} reviews)
                </span>
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-white mb-1">{stats.total_bookings || 0}</div>
              <p className="text-xs text-purple-100">Bookings</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-white mb-1">${stats.total_earnings?.toFixed(0) || '0'}</div>
              <p className="text-xs text-purple-100">Earnings</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-white mb-1">{stats.completed_bookings || 0}</div>
              <p className="text-xs text-purple-100">Completed</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Mode Actions */}
      {isEditing && (
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
      )}

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
            {isEditing ? (
              <>
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
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Your business name"
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
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 py-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Name</p>
                    <p>{profile?.name || 'Not set'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 py-2">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p>{profile?.business_name || 'Not set'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 py-2">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Phone</p>
                    <p>{profile?.phone || 'Not set'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 py-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Email</p>
                    <p>{profile?.email || 'Not set'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 py-2">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Category</p>
                    <Badge variant="secondary">{getCategoryLabel(profile?.category || 'general')}</Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bio">About Your Business</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell customers about your business and services..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City, State ZIP"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="py-2">
                  <p className="text-sm text-gray-600 mb-2">About</p>
                  <p className="text-sm">{profile?.bio || 'No description added yet.'}</p>
                </div>
                <Separator />
                <div className="flex items-start gap-3 py-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-sm">{profile?.address || 'Not set'}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Verification Status</span>
              <Badge variant={profile?.verified ? 'default' : 'secondary'}>
                {profile?.verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Account Type</span>
              <Badge variant="default" className="bg-purple-600">Provider</Badge>
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
          <p className="text-xs text-gray-500">Provider Portal v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
