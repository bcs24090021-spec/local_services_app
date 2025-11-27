import { Star, MapPin } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';

interface ServiceCardProps {
  id: string;
  title: string;
  provider: string;
  rating: number;
  reviews: number;
  price: number;
  priceUnit: string;
  image: string;
  distance?: string;
  verified?: boolean;
  onClick?: () => void;
}

export function ServiceCard({
  title,
  provider,
  rating,
  reviews,
  price,
  priceUnit,
  image,
  distance,
  verified,
  onClick,
}: ServiceCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        {verified && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            ✓ Verified
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{provider}</p>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{rating}</span>
            <span className="text-xs text-gray-500">({reviews})</span>
          </div>
          {distance && (
            <>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{distance}</span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-600">${price}</span>
            <span className="text-sm text-gray-500">/{priceUnit}</span>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}
