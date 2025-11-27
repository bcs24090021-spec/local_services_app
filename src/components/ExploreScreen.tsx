import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapIcon, List, RefreshCw } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ServiceCard } from './ServiceCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { getServices } from '../utils/api';
import { toast } from 'sonner@2.0.3';

const categories = [
  { value: 'all', label: 'All Categories' },
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

interface ExploreScreenProps {
  onServiceClick?: (serviceId: string) => void;
  initialCategory?: string;
}

export function ExploreScreen({ onServiceClick, initialCategory }: ExploreScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [allServices, setAllServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastServiceCount, setLastServiceCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);

  // Update selected category when initialCategory prop changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

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

  // Apply filters whenever services or filter settings change
  useEffect(() => {
    applyFilters();
  }, [allServices, searchQuery, selectedCategory, sortBy, priceRange, verifiedOnly, availableNow]);

  const fetchServices = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const response = await getServices({ 
        category: selectedCategory !== 'all' ? selectedCategory : undefined 
      });
      
      if (response.success && response.services) {
        // Map API services to component format
        const mappedServices = response.services
          .filter((s: any) => s.active !== false)
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
            description: s.description,
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
        console.log(`Loaded ${mappedServices.length} services`);
      } else {
        setAllServices([]);
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

  const applyFilters = () => {
    let filtered = [...allServices];

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title?.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.provider?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(
      (s) => s.price >= priceRange[0] && s.price <= priceRange[1]
    );

    // Verified only filter
    if (verifiedOnly) {
      filtered = filtered.filter((s) => s.verified);
    }

    // Available now filter (simplified - in real app would check availability)
    if (availableNow) {
      // For now, just show all - in production this would check provider availability
      filtered = filtered;
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'distance':
        // In real app, would sort by actual distance
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredServices(filtered);
  };

  const handleApplyFilters = () => {
    applyFilters();
    toast.success('Filters applied');
  };

  return (
    <div className="pb-20">
      {/* Search Header */}
      <div className="sticky top-16 bg-white border-b border-gray-200 z-40 px-4 py-3">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search for services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div>
                  <label className="text-sm mb-3 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
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

                <div>
                  <label className="text-sm mb-3 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rating</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="distance">Nearest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm mb-3 block">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={200}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm">Verified Only</label>
                  <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm">Available Now</label>
                  <Switch checked={availableNow} onCheckedChange={setAvailableNow} />
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Button
            onClick={handleManualRefresh}
            disabled={isLoading}
            size="icon"
            variant="outline"
            title={isRefreshing ? 'Checking for updates...' : 'Refresh services'}
            className="relative"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {isLoading ? 'Loading...' : isRefreshing ? 'Refreshing...' : `${filteredServices.length} services found`}
            </p>
            {selectedCategory && selectedCategory !== 'all' && (
              <p className="text-xs text-blue-600">
                Filtered by: {categories.find(c => c.value === selectedCategory)?.label}
              </p>
            )}
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded ${
                viewMode === 'map' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {viewMode === 'list' ? (
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Loading services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <>
              {hasError && allServices.length === 0 ? (
                <div className="py-12 text-center">
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
              ) : (
                <div className="py-12 text-center">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2">No Services Found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setVerifiedOnly(false);
                      setAvailableNow(false);
                      setPriceRange([0, 200]);
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </>
          ) : (
            filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                {...service}
                onClick={() => onServiceClick?.(service.id)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="h-[calc(100vh-200px)] bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Map View</p>
            <p className="text-sm text-gray-500">Interactive map coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
