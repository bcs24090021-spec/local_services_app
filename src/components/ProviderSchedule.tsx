import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, RefreshCw } from 'lucide-react';
import { Calendar as CalendarUI } from './ui/calendar';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';
import { getBookings, updateBookingStatus, getServiceById } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface EnrichedBooking {
  id: string;
  service_id: string;
  service_title?: string;
  customer_id: string;
  customer_name?: string;
  date: string;
  time: string;
  duration: number;
  notes: string;
  status: string;
  total_price: number;
  created_at: string;
}

export function ProviderSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
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
      console.error('Error loading bookings:', error);
      toast.error('Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await updateBookingStatus(bookingId, status);
      toast.success('Booking updated successfully');
      loadBookings();
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc: any, booking: EnrichedBooking) => {
    const date = new Date(booking.date).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(booking);
    return acc;
  }, {});

  const selectedDateBookings = selectedDate 
    ? bookingsByDate[selectedDate.toDateString()] || []
    : [];

  const datesWithBookings = Object.keys(bookingsByDate).map(dateStr => new Date(dateStr));

  return (
    <div className="pb-20 bg-gray-50">
      {/* Calendar */}
      <div className="bg-white px-4 pt-4 pb-6 mb-2">
        <div className="flex items-center justify-between mb-4">
          <h2>Schedule</h2>
          <Button variant="outline" size="sm" onClick={loadBookings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="flex justify-center">
          <CalendarUI
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              booked: datesWithBookings,
            }}
            modifiersStyles={{
              booked: {
                fontWeight: 'bold',
                color: '#2563eb',
              },
            }}
          />
        </div>
      </div>

      {/* Selected Date Schedule */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
          </h3>
          {selectedDateBookings.length > 0 && (
            <Badge variant="secondary">
              {selectedDateBookings.length} booking{selectedDateBookings.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 h-32 animate-pulse bg-gray-100" />
              </Card>
            ))}
          </div>
        ) : selectedDateBookings.length > 0 ? (
          <div className="space-y-3">
            {selectedDateBookings
              .sort((a: EnrichedBooking, b: EnrichedBooking) => a.time.localeCompare(b.time))
              .map((booking: EnrichedBooking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{booking.time}</span>
                      </div>
                      <Badge
                        className={
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    <h3 className="text-sm mb-2">
                      {booking.service_title || 'Service'}
                    </h3>

                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {booking.customer_name?.[0]?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">{booking.customer_name || 'Customer'}</p>
                        {booking.notes && (
                          <p className="text-xs text-gray-500 mt-1">{booking.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-gray-600">Duration: {booking.duration}h</span>
                      <span className="text-blue-600">${booking.total_price?.toFixed(2)}</span>
                    </div>

                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                        >
                          Decline
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                        >
                          Accept
                        </Button>
                      </div>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateStatus(booking.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-1">No bookings</p>
              <p className="text-sm text-gray-500">You have no bookings for this day</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="px-4 mt-6">
        <h3 className="text-sm mb-3">Booking Summary</h3>
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Pending</p>
                <p className="text-blue-600">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Confirmed</p>
                <p className="text-green-600">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Completed</p>
                <p className="text-gray-600">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
