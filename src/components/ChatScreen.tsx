import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, RefreshCw, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getMessages, sendMessage, getCurrentUser } from '../utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LocationMap } from './LocationMap';
import { LocationMessage } from './LocationMessage';

interface ChatScreenProps {
  userId: string;
  userName?: string;
  onBack: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export function ChatScreen({ userId, userName = 'User', onBack }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadCurrentUser();
    loadMessages();
    
    // Poll for new messages every 3 seconds
    intervalRef.current = setInterval(() => {
      loadMessages(true);
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      if (user?.id) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      
      const response = await getMessages(userId);
      
      if (response.success && response.messages) {
        setMessages(response.messages);
      }
    } catch (error: any) {
      console.error('Load messages error:', error);
      if (!silent) {
        toast.error('Failed to load messages');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLocationSelect = async (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    try {
      setIsSending(true);
      
      // Format location message
      const locationMessage = `📍 Location: ${location.address}\nCoordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\nGoogle Maps: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      
      const response = await sendMessage(userId, locationMessage);
      
      if (response.success) {
        setShowLocationPicker(false);
        await loadMessages(true);
        toast.success('Location shared successfully');
      }
    } catch (error: any) {
      console.error('Send location error:', error);
      toast.error('Failed to share location');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      
      const response = await sendMessage(userId, newMessage.trim());
      
      if (response.success) {
        setNewMessage('');
        await loadMessages(true);
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'h:mm a');
    } else {
      return format(date, 'MMM d, h:mm a');
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

  const parseLocationMessage = (content: string) => {
    // Check if message contains location data
    const locationRegex = /📍 Location: (.+?)\nCoordinates: ([\d.]+), ([\d.]+)/;
    const match = content.match(locationRegex);
    
    if (match) {
      return {
        isLocation: true,
        address: match[1],
        latitude: parseFloat(match[2]),
        longitude: parseFloat(match[3]),
      };
    }
    
    return { isLocation: false };
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <Avatar className="w-10 h-10">
            <AvatarImage src="" />
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-sm">{userName}</h2>
            <p className="text-xs text-gray-500">Tap to view profile</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentUserId;
              const showDate = index === 0 || 
                new Date(messages[index - 1].created_at).toDateString() !== 
                new Date(message.created_at).toDateString();

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {format(new Date(message.created_at), 'EEEE, MMMM d')}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {(() => {
                        const locationData = parseLocationMessage(message.content);
                        if (locationData.isLocation && locationData.latitude && locationData.longitude && locationData.address) {
                          return (
                            <>
                              <LocationMessage
                                latitude={locationData.latitude}
                                longitude={locationData.longitude}
                                address={locationData.address}
                                isOwnMessage={isOwnMessage}
                              />
                              <p className={`text-xs text-gray-500 mt-2 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                                {formatMessageTime(message.created_at)}
                              </p>
                            </>
                          );
                        }
                        return (
                          <>
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isOwnMessage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                              {formatMessageTime(message.created_at)}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        {showLocationPicker && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <LocationMap onLocationSelect={handleLocationSelect} />
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button
            type="button"
            size="icon"
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            variant="outline"
            className="flex-shrink-0"
            title="Share location"
          >
            <MapPin className="w-4 h-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
          >
            {isSending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
