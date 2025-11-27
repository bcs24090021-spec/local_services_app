import { Home, Search, MessageCircle, Calendar, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getConversations } from '../utils/api';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Check for unread messages every 10 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await getConversations();
      if (response.success && response.conversations) {
        const total = response.conversations.reduce(
          (sum: number, conv: any) => sum + (conv.unread_count || 0),
          0
        );
        setUnreadCount(total);
      }
    } catch (error) {
      // Silently fail - user might not be authenticated
    }
  };
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'explore', icon: Search, label: 'Explore' },
    { id: 'messages', icon: MessageCircle, label: 'Messages' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'messages' && unreadCount > 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {showBadge && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
