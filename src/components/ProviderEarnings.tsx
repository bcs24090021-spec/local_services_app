import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { getProviderStats, getBookings } from '../utils/api';
import { toast } from 'sonner@2.0.3';

export function ProviderEarnings() {
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      
      const [statsResponse, bookingsResponse] = await Promise.all([
        getProviderStats(),
        getBookings(),
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

      if (bookingsResponse.success) {
        setBookings(bookingsResponse.bookings || []);
      }
    } catch (error: any) {
      console.error('Error loading earnings data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setIsLoading(false);
    }
  };

  const completedBookings = bookings.filter(b => b.status === 'completed');
  const pendingEarnings = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="pb-20 bg-gray-50">
      {/* Summary Cards */}
      <div className="bg-white px-4 pt-4 pb-6 mb-2">
        <h2 className="mb-4">Earnings Overview</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 h-24 animate-pulse bg-gray-100" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600">Total Earnings</span>
                  </div>
                  <div className="mb-1">${stats?.total_earnings?.toFixed(2) || '0.00'}</div>
                  <span className="text-xs text-blue-600">All time</span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                  <div className="mb-1">{stats?.completed_bookings || 0}</div>
                  <span className="text-xs text-gray-500">Jobs</span>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-gray-600 block mb-1">Total Bookings</span>
                  <div>{stats?.total_bookings || 0}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <span className="text-xs text-gray-600 block mb-1">Pending</span>
                  <div>${pendingEarnings.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <div className="sticky top-16 bg-white border-b border-gray-200 z-40">
          <TabsList className="w-full justify-start px-4 bg-transparent h-12">
            <TabsTrigger value="transactions" className="flex-1">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1">
              Payouts
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="transactions" className="p-4 mt-0 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm">Recent Transactions</h3>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-4 h-48 animate-pulse bg-gray-100" />
            </Card>
          ) : completedBookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                {completedBookings.map((booking: any, index: number) => (
                  <div key={booking.id}>
                    {index > 0 && <Separator />}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Booking #{booking.id.slice(0, 8)}</h4>
                          <p className="text-xs text-gray-500">Customer booking</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm mb-1">+${booking.total_price?.toFixed(2) || '0.00'}</div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {booking.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(booking.created_at)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payouts" className="p-4 mt-0 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm">Payout Information</h3>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <Card className="mb-4 border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Pending Earnings</span>
                <span className="text-blue-600">${pendingEarnings.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Total Earned</span>
                <span className="text-blue-600">${stats?.total_earnings?.toFixed(2) || '0.00'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Payout History</p>
              <p className="text-sm text-gray-400">
                Payout processing will be available once you complete your first booking
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
