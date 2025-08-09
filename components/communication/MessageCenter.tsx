'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  Paperclip,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Users,
  Archive,
  Bell,
  BellOff,
  Star,
  Trash2,
  Plus,
  MessageCircle,
  Hash,
  Lock,
  Globe
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import {
  getConversations,
  getMessages,
  sendMessage,
  subscribeToMessages,
  createConversation,
  markMessageAsRead
} from '@/lib/services/communication-service';
import { Conversation, Message, ConversationParticipant } from '@/lib/types/communication';

export default function MessageCenter() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id!);
      
      // Subscribe to real-time messages
      unsubscribeRef.current = subscribeToMessages(
        selectedConversation.id!,
        (newMessages) => {
          setMessages(newMessages);
          scrollToBottom();
        }
      );
      
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const convos = await getConversations(user.uid);
      setConversations(convos);
      
      // Select first conversation if available
      if (convos.length > 0 && !selectedConversation) {
        setSelectedConversation(convos[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
      
      // Mark messages as read
      msgs.forEach(msg => {
        if (msg.senderId !== user?.uid && msg.status !== 'read') {
          markMessageAsRead(msg.id!, user!.uid);
        }
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    try {
      setSendingMessage(true);
      await sendMessage(selectedConversation.id!, {
        conversationId: selectedConversation.id!,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderAvatar: user.photoURL || undefined,
        content: newMessage,
        type: 'text'
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: any) => {
    const date = timestamp.toDate();
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getConversationIcon = (type: Conversation['type']) => {
    switch (type) {
      case 'direct':
        return <MessageCircle className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'channel':
        return <Hash className="h-4 w-4" />;
      case 'support':
        return <Info className="h-4 w-4" />;
      case 'broadcast':
        return <Globe className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== user?.uid
      );
      return otherParticipant?.userName || 'Unknown';
    }
    
    return 'Conversation';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar) return conversation.avatar;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== user?.uid
      );
      return otherParticipant?.userAvatar;
    }
    
    return undefined;
  };

  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50 rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button size="sm" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100%-120px)]">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations found
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getConversationAvatar(conversation)} />
                      <AvatarFallback>
                        {getConversationName(conversation).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getConversationIcon(conversation.type)}
                          <p className="font-medium truncate">
                            {getConversationName(conversation)}
                          </p>
                        </div>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
                        </p>
                      )}
                      
                      {conversation.unreadCount > 0 && (
                        <Badge className="mt-1" variant="default">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Messages Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-white border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={getConversationAvatar(selectedConversation)} />
                <AvatarFallback>
                  {getConversationName(selectedConversation).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold">{getConversationName(selectedConversation)}</h3>
                {selectedConversation.type === 'group' && (
                  <p className="text-sm text-gray-500">
                    {selectedConversation.participants.length} members
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost">
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Video className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Info className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId === user?.uid;
                  const showAvatar = index === 0 || 
                    messages[index - 1].senderId !== message.senderId;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isOwnMessage ? 'justify-end' : ''}`}
                    >
                      {!isOwnMessage && showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.senderAvatar} />
                          <AvatarFallback>
                            {message.senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {!isOwnMessage && !showAvatar && (
                        <div className="w-8" />
                      )}
                      
                      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : ''}`}>
                        {showAvatar && !isOwnMessage && (
                          <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
                        )}
                        
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border'
                          }`}
                        >
                          {message.type === 'system' ? (
                            <p className="text-sm italic">{message.content}</p>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {formatMessageTime(message.sentAt)}
                          {message.status === 'read' && isOwnMessage && (
                            <span className="ml-2">✓✓</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost">
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sendingMessage}
              />
              
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}