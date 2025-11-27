import { useState, useEffect } from 'react';
import { CategoryCard } from './CategoryCard';
import { ServiceCard } from './ServiceCard';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getServices } from '../utils/api';
import { Button } from './ui/button';

const categories = [
  { id: 'cleaning', title: 'Cleaning', icon: '🧹', image: 'cleaning' },
  { id: 'repair', title: 'Repair', icon: '🔧', image: 'repair' },
  { id: 'beauty', title: 'Beauty', icon: '💅', image: 'beauty' },
  { id: 'tutoring', title: 'Tutoring', icon: '📚', image: 'tutoring' },
  { id: 'plumbing', title: 'Plumbing', icon: '🚰', image: 'plumbing' },
  { id: 'moving', title: 'Moving', icon: '📦', image: 'moving' },
  { id: 'photography', title: 'Photography', icon: '📸', image: 'photography' },
  { id: 'event', title: 'Events', icon: '🎉', image: 'event' },
  { id: 'pet', title: 'Pet Care', icon: '🐕', image: 'pet' },
];

interface HomeScreenProps {
  onServiceClick?: (serviceId: string) => void;
  onCategoryClick?: (categoryId: string) => void;
}

export function HomeScreen({ onServiceClick, onCategoryClick }: HomeScreenProps) {
  const [allServices, setAllServices] = useState<any[]>([]);
  const [recommendedServices, setRecommendedServices] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastServiceCount, setLastServiceCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Fetch services on mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Auto-refresh services every 15 seconds when page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !hasError) {
        fetchServices(true); // Silent refresh
      }
    }, 15000); // 15 seconds for more real-time updates

    return () => clearInterval(interval);
  }, [hasError]);

  const fetchServices = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const response = await getServices();
      
      if (response.success && response.services && response.services.length > 0) {
        // Map API services to component format
        const mappedServices = response.services
          .filter((s: any) => s.active !== false) // Only show active services
          .map((s: any) => ({
            id: s.id,
            title: s.title,
            provider: s.provider_name || 'Provider',
            rating: s.rating || 0,
            reviews: s.total_reviews || 0,
            price: s.price,
            priceUnit: s.price_unit || 'hour',
            image: s.images?.[0] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
            verified: s.provider_verified || false,
            category: s.category,
          }));
        
        // Check for new services
        if (silent && mappedServices.length > lastServiceCount && lastServiceCount > 0) {
          const newCount = mappedServices.length - lastServiceCount;
          toast.success(`${newCount} new service${newCount > 1 ? 's' : ''} available!`, {
            duration: 3000,
          });
        }
        
        setAllServices(mappedServices);
        setLastServiceCount(mappedServices.length);
        
        // Split services into recommended and popular
        // Recommended: highest rated services
        const recommended = [...mappedServices]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 6);
        setRecommendedServices(recommended);
        
        // Popular: most reviewed services
        const popular = [...mappedServices]
          .sort((a, b) => b.reviews - a.reviews)
          .slice(0, 6);
        setPopularServices(popular);
        
        console.log(`Loaded ${mappedServices.length} services from database`);
      } else {
        console.log('No services found in database');
        setAllServices([]);
        setRecommendedServices([]);
        setPopularServices([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch services:', error);
      setHasError(true);
      if (!silent) {
        const errorMessage = error?.message || 'Failed to load services';
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setHasError(false);
    fetchServices();
  };

  return (
    <div className="pb-20">
      {/* Header with Refresh Button */}
      <div className="sticky top-16 bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="mb-0">Discover Services</h2>
          {isRefreshing && (
            <p className="text-xs text-gray-500">Checking for updates...</p>
          )}
        </div>
        <Button
          onClick={handleManualRefresh}
          disabled={isLoading}
          size="icon"
          variant="outline"
          className="relative"
          title={isRefreshing ? 'Checking for updates...' : 'Refresh services'}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="px-4 mb-8 mt-4">
        <h2 className="mb-4">Browse Categories</h2>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              icon={category.icon}
              image={category.image}
              onClick={() => onCategoryClick?.(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="px-4 py-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Loading services...</p>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && allServices.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="mb-2">Connection Error</h3>
          <p className="text-sm text-gray-600 mb-4">
            Unable to connect to the server. The edge function may still be deploying.
          </p>
          <Button
            onClick={handleManualRefresh}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!hasError && !isLoading && allServices.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="mb-2">No Services Available</h3>
          <p className="text-sm text-gray-600">
            No services are currently listed. Check back soon!
          </p>
        </div>
      )}

      {/* Recommended Services */}
      {!isLoading && recommendedServices.length > 0 && (
        <div className="mb-8">
          <div className="px-4 mb-4 flex items-center justify-between">
            <h2>Recommended for You</h2>
            <button 
              onClick={() => onCategoryClick?.('all')}
              className="text-sm text-blue-600"
            >
              See All
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-4">
              {recommendedServices.map((service) => (
                <div key={service.id} className="w-72 flex-shrink-0">
                  <ServiceCard
                    {...service}
                    onClick={() => onServiceClick?.(service.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popular Services */}
      {!isLoading && popularServices.length > 0 && (
        <div className="mb-8">
          <div className="px-4 mb-4 flex items-center justify-between">
            <h2>Popular Services</h2>
            <button 
              onClick={() => onCategoryClick?.('all')}
              className="text-sm text-blue-600"
            >
              See All
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-4">
              {popularServices.map((service) => (
                <div key={service.id} className="w-72 flex-shrink-0">
                  <ServiceCard
                    {...service}
                    onClick={() => onServiceClick?.(service.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
