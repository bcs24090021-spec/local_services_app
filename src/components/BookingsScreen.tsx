import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, RefreshCw, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { getBookings, updateBookingStatus, getServiceById } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { format } from 'date-fns';

interface EnrichedBooking {
  id: string;
  service_id: string;
  service_title?: string;
  service_category?: string;
  provider_id: string;
  provider_name?: string;
  provider_business_name?: string;
  customer_id: string;
  date: string;
  time: string;
  duration: number;
  notes: string;
  status: string;
  total_price: number;
  created_at: string;
}

interface BookingCardProps {
  booking: EnrichedBooking;
  isPast?: boolean;
  onRefresh: () => void;
  onContactClick?: (providerId: string, providerName: string) => void;
}

function BookingCard({ booking, isPast = false, onRefresh, onContactClick }: BookingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      setIsUpdating(true);
      await updateBookingStatus(booking.id, 'cancelled');
      toast.success('Booking cancelled successfully');
      onRefresh();
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const providerName = booking.provider_business_name || booking.provider_name || 'Provider';
  const providerInitials = providerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm">{booking.service_title || 'Service'}</h3>
        <Badge className={getStatusColor(booking.status)}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Avatar>
          <AvatarImage src="" />
          <AvatarFallback>{providerInitials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm">{providerName}</p>
          <p className="text-xs text-gray-500">
            {format(new Date(booking.date), 'EEE, MMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{booking.time} ({booking.duration}h)</span>
        </div>
        {booking.notes && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Notes: </span>
            {booking.notes}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <span className="text-sm text-gray-500">Total: </span>
          <span className="text-blue-600">${booking.total_price.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (onContactClick && booking.provider_id) {
                onContactClick(booking.provider_id, providerName);
              }
            }}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Contact
          </Button>
          {!isPast && booking.status === 'pending' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancelBooking}
              disabled={isUpdating}
            >
              {isUpdating ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface BookingsScreenProps {
  onContactClick?: (providerId: string, providerName: string) => void;
}

export function BookingsScreen({ onContactClick }: BookingsScreenProps = {}) {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getBookings();
      
      if (response.success && response.bookings) {
        // Enrich bookings with service information
        const enrichedBookings = await Promise.all(
          response.bookings.map(async (booking: any) => {
            try {
              const serviceResponse = await getServiceById(booking.service_id);
              if (serviceResponse.success && serviceResponse.service) {
                return {
                  ...booking,
                  service_title: serviceResponse.service.title,
                  service_category: serviceResponse.service.category,
                  provider_name: serviceResponse.service.provider_name,
                  provider_business_name: serviceResponse.service.provider_name,
                };
              }
            } catch (error) {
              console.error('Error fetching service details:', error);
            }
            return booking;
          })
        );
        
        setBookings(enrichedBookings);
      }
    } catch (error: any) {
      console.error('Load bookings error:', error);
      setError(error.message || 'Failed to load bookings');
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(b => 
    ['pending', 'confirmed'].includes(b.status) && new Date(b.date) >= new Date()
  );

  const pastBookings = bookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status) || new Date(b.date) < new Date()
  );

  if (isLoading) {
    return (
      <div className="pb-20 flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-20 px-4 py-12">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button onClick={loadBookings} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <Tabs defaultValue="upcoming" className="w-full">
        <div className="sticky top-16 bg-white border-b border-gray-200 z-40">
          <TabsList className="w-full justify-start px-4 bg-transparent h-12">
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1">
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upcoming" className="p-4 mt-0">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                onRefresh={loadBookings}
                onContactClick={onContactClick}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No upcoming bookings</p>
              <p className="text-sm text-gray-500">Book a service to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="p-4 mt-0">
          {pastBookings.length > 0 ? (
            pastBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                isPast 
                onRefresh={loadBookings}
                onContactClick={onContactClick}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No past bookings</p>
              <p className="text-sm text-gray-500">Your booking history will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
