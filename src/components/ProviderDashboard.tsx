import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Star, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { getProviderStats, getBookings, getCurrentUser } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface ProviderDashboardProps {
  onJobClick?: (jobId: string) => void;
}

export function ProviderDashboard({ onJobClick }: ProviderDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [providerName, setProviderName] = useState('Provider');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const user = await getCurrentUser();
      if (user?.user_metadata?.business_name) {
        setProviderName(user.user_metadata.business_name);
      }

      // Get provider stats
      const statsResponse = await getProviderStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

      // Get bookings
      const bookingsResponse = await getBookings();
      if (bookingsResponse.success) {
        setBookings(bookingsResponse.bookings || []);
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const { updateBookingStatus } = await import('../utils/api');
      await updateBookingStatus(bookingId, status);
      toast.success('Booking updated successfully');
      loadDashboardData(); // Reload data
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const upcomingJobs = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const dashboardStats = stats ? [
    {
      id: 'earnings',
      label: 'Total Earnings',
      value: `${stats.total_earnings?.toFixed(2) || '0.00'}`,
      change: '',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'bookings',
      label: 'Pending',
      value: stats.pending_bookings?.toString() || '0',
      change: '',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      value: stats.upcoming_bookings?.toString() || '0',
      change: '',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: stats.completed_bookings?.toString() || '0',
      change: '',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ] : [];
  return (
    <div className="pb-20 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white mb-1">Provider Dashboard</h1>
            <p className="text-sm text-blue-100">{providerName}</p>
          </div>
          <Avatar className="w-12 h-12 border-2 border-white">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-500">{getInitials(providerName)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {dashboardStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`${stat.bgColor} ${stat.color} rounded-lg p-1.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-blue-100">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white">{stat.value}</span>
                    {stat.change && <span className="text-xs text-green-300">{stat.change}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" className="flex-col h-auto py-3">
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-xs">Schedule</span>
            </Button>
            <Button variant="outline" className="flex-col h-auto py-3">
              <DollarSign className="w-5 h-5 mb-1" />
              <span className="text-xs">Earnings</span>
            </Button>
            <Button variant="outline" className="flex-col h-auto py-3">
              <Star className="w-5 h-5 mb-1" />
              <span className="text-xs">Reviews</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Upcoming Jobs */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2>Upcoming Jobs</h2>
          <Button variant="ghost" size="sm" className="text-blue-600">
            View All
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4 h-40 animate-pulse bg-gray-100" />
              </Card>
            ))}
          </div>
        ) : upcomingJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming jobs</p>
              <p className="text-sm text-gray-400">New bookings will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm mb-1">Booking #{job.id.slice(0, 8)}</h3>
                      <p className="text-xs text-gray-500">{formatDate(job.date)} • {job.time}</p>
                    </div>
                    <Badge
                      className={
                        job.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="" />
                      <AvatarFallback>CU</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">Customer</p>
                      {job.notes && <p className="text-xs text-gray-500">{job.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-blue-600">${job.total_price?.toFixed(2) || '0.00'}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                      {job.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleUpdateStatus(job.id, 'confirmed')}
                        >
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Performance */}
      {stats && (
        <div className="px-4 mb-6">
          <h2 className="mb-3">Overall Performance</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Bookings</span>
                  <span className="text-sm">{stats.total_bookings || 0}</span>
                </div>
                <Progress 
                  value={Math.min((stats.total_bookings || 0) * 10, 100)} 
                  className="h-2" 
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-sm">
                    {stats.total_bookings > 0 
                      ? Math.round((stats.completed_bookings / stats.total_bookings) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats.total_bookings > 0 
                    ? (stats.completed_bookings / stats.total_bookings) * 100 
                    : 0} 
                  className="h-2" 
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="text-sm">${stats.total_earnings?.toFixed(2) || '0.00'}</span>
                </div>
                <Progress 
                  value={Math.min((stats.total_earnings || 0) / 10, 100)} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
