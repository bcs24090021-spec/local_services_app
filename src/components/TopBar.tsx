import { MapPin, Search, Bell, Menu } from 'lucide-react';

interface TopBarProps {
  onSearchClick?: () => void;
  showSearch?: boolean;
}

export function TopBar({ onSearchClick, showSearch = true }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Location</span>
              <span className="text-sm">New York, NY</span>
            </div>
          </div>
          
          {showSearch && (
            <button
              onClick={onSearchClick}
              className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Search services...</span>
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <button className="relative">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
