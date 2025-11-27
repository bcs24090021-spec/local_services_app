import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { getConversations } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { format, formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_type: string;
  last_message: string;
  created_at: string;
  unread_count: number;
}

interface MessagesScreenProps {
  onConversationClick?: (userId: string, userName: string) => void;
}

export function MessagesScreen({ onConversationClick }: MessagesScreenProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadConversations(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv =>
        conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setError(null);
      
      const response = await getConversations();
      
      if (response.success && response.conversations) {
        setConversations(response.conversations);
        if (!searchQuery) {
          setFilteredConversations(response.conversations);
        }
      }
    } catch (error: any) {
      console.error('Load conversations error:', error);
      if (!silent) {
        setError(error.message || 'Failed to load conversations');
        toast.error('Failed to load conversations');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
      } else if (diffInHours < 24) {
        return format(date, 'h:mm a');
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else if (diffInHours < 168) {
        return format(date, 'EEEE');
      } else {
        return format(date, 'MMM d');
      }
    } catch (error) {
      return '';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="pb-20 flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-20 px-4 py-12">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadConversations()}
            className="text-sm text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="sticky top-16 bg-white border-b border-gray-200 z-40 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search messages..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="px-4 py-12 text-center">
          {searchQuery ? (
            <>
              <p className="text-gray-600 mb-2">No conversations found</p>
              <p className="text-sm text-gray-500">Try a different search term</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500">
                Contact a service provider to start a conversation
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onConversationClick?.(conversation.other_user_id, conversation.other_user_name)}
              className="w-full px-4 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="relative flex-shrink-0">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>{getInitials(conversation.other_user_name)}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm truncate pr-2">
                    {conversation.other_user_name}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(conversation.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate pr-2 ${
                    conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {conversation.last_message}
                  </p>
                  {conversation.unread_count > 0 && (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center flex-shrink-0">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
