import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, CheckCircle, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { format } from 'date-fns';
import { getServiceById, getProviderById, createBooking } from '../utils/api';
import { supabaseClient } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface ServiceDetailScreenProps {
  serviceId: string;
  onBack: () => void;
  onBookingClick?: () => void;
  onContactClick?: (providerId: string, providerName: string) => void;
  onAuthRequired?: () => void;
}

export function ServiceDetailScreen({ serviceId, onBack, onBookingClick, onContactClick, onAuthRequired }: ServiceDetailScreenProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [service, setService] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchServiceDetails();
    checkAuth();
  }, [serviceId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    setIsAuthenticated(!!session?.user);
  };

  const fetchServiceDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch service details
      const serviceResponse = await getServiceById(serviceId);
      if (serviceResponse.success && serviceResponse.service) {
        setService(serviceResponse.service);
        
        // Fetch provider details
        if (serviceResponse.service.provider_id) {
          const providerResponse = await getProviderById(serviceResponse.service.provider_id);
          if (providerResponse.success && providerResponse.provider) {
            setProvider(providerResponse.provider);
          }
        }
      } else {
        toast.error('Service not found');
        onBack();
      }
    } catch (error) {
      console.error('Failed to fetch service details:', error);
      toast.error('Failed to load service details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error('Please login to book this service');
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    // Validate booking details
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (!selectedTime) {
      toast.error('Please select a time');
      return;
    }

    try {
      setIsBooking(true);
      
      const bookingData = {
        service_id: serviceId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        duration: service.min_booking || 1,
        notes: notes,
      };

      const response = await createBooking(bookingData);
      
      if (response.success) {
        toast.success('Booking created successfully!');
        if (onBookingClick) {
          onBookingClick();
        } else {
          onBack();
        }
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pb-20 bg-white">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-50 px-4 py-3">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        
        {/* Loading State */}
        <div className="px-4 py-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="pb-20 bg-white">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-50 px-4 py-3">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        
        {/* Error State */}
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-gray-600 mb-4">Service not found</p>
          <Button onClick={onBack} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  const serviceImages = service.images && service.images.length > 0 
    ? service.images 
    : ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'];
  
  const minBooking = service.min_booking || 1;
  const totalPrice = service.price * minBooking;

  return (
    <div className="pb-20 bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-50 px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {/* Image Carousel */}
      <div className="relative">
        <div className="relative h-64 overflow-hidden">
          <ImageWithFallback
            src={serviceImages[currentImageIndex]}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          {provider?.verified && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              ✓ Verified Provider
            </div>
          )}
        </div>
        {serviceImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {serviceImages.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-6' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        {/* Title & Rating */}
        <h1 className="mb-2">{service.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span>{service.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-sm text-gray-500">({service.total_reviews || 0} reviews)</span>
          </div>
        </div>

        {/* Provider Info */}
        {provider && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
            <Avatar className="w-12 h-12">
              <AvatarImage src="" />
              <AvatarFallback>
                {provider.business_name?.[0]?.toUpperCase() || provider.name?.[0]?.toUpperCase() || 'P'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-sm">{provider.business_name || provider.name}</h3>
              <p className="text-xs text-gray-600">
                {provider.total_bookings || 0} bookings • Member since {new Date(provider.created_at).getFullYear()}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error('Please login to contact the provider');
                  if (onAuthRequired) {
                    onAuthRequired();
                  }
                  return;
                }
                if (onContactClick && provider?.provider_id) {
                  onContactClick(provider.provider_id, provider.business_name || provider.name);
                }
              }}
            >
              Contact
            </Button>
          </div>
        )}

        {/* Price */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-blue-600">${service.price}</span>
            <span className="text-sm text-gray-600">/{service.price_unit || 'hour'}</span>
          </div>
          {minBooking > 1 && (
            <p className="text-xs text-gray-600 mt-1">Minimum {minBooking} {service.price_unit || 'hour'}s booking</p>
          )}
        </div>

        {/* Availability */}
        <div className="mb-6">
          <h3 className="mb-3">Select Date & Time</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 w-4 h-4" />
                {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>

          <div className="grid grid-cols-4 gap-2 mt-3">
            {['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'].map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2 px-3 border rounded-lg text-sm transition-colors ${
                  selectedTime === time
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Booking Notes */}
        <div className="mb-6">
          <Label htmlFor="notes" className="mb-2 block">Special Requests (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any special requirements or notes for the provider..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Separator className="my-6" />

        {/* Description */}
        <div className="mb-6">
          <h3 className="mb-3">About This Service</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {service.description}
          </p>
        </div>

        <Separator className="my-6" />

        {/* Reviews */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Reviews ({service.total_reviews || 0})</h3>
          </div>
          {service.total_reviews > 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              Reviews will be displayed here
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-500">
              No reviews yet
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        {(!selectedDate || !selectedTime) && (
          <p className="text-xs text-center text-gray-500 mb-2">
            Please select a date and time to continue
          </p>
        )}
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleBookNow}
          disabled={isBooking || !selectedDate || !selectedTime}
        >
          {isBooking ? 'Booking...' : `Book Now ${minBooking > 1 ? `- $${totalPrice}` : `- $${service.price}`}`}
        </Button>
      </div>
    </div>
  );
}
