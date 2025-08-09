import { Timestamp } from 'firebase/firestore';

// Message Types
export interface Message {
  id?: string;
  
  // Conversation Reference
  conversationId: string;
  
  // Sender
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  
  // Content
  content: string;
  type: 'text' | 'image' | 'file' | 'link' | 'system' | 'event';
  
  // Attachments
  attachments?: MessageAttachment[];
  
  // Metadata
  metadata?: {
    eventId?: string;
    contractId?: string;
    venueId?: string;
    djId?: string;
    bookingId?: string;
    action?: string;
  };
  
  // Status
  status: 'sent' | 'delivered' | 'read' | 'failed';
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
  
  // Reactions
  reactions?: MessageReaction[];
  
  // Threading
  replyTo?: string; // Message ID being replied to
  threadId?: string;
  
  // Timestamps
  sentAt: Timestamp;
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

export interface MessageReaction {
  userId: string;
  userName: string;
  emoji: string;
  timestamp: Timestamp;
}

// Conversation Types
export interface Conversation {
  id?: string;
  
  // Conversation Details
  type: 'direct' | 'group' | 'channel' | 'support' | 'broadcast';
  name?: string; // For group/channel
  description?: string;
  avatar?: string;
  
  // Participants
  participants: ConversationParticipant[];
  createdBy: string;
  
  // Context
  context?: {
    type: 'event' | 'venue' | 'contract' | 'booking' | 'general';
    entityId?: string;
    entityName?: string;
  };
  
  // Last Message
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp;
    type: Message['type'];
  };
  
  // Settings
  settings: {
    muted?: boolean;
    archived?: boolean;
    pinned?: boolean;
    notificationsEnabled?: boolean;
  };
  
  // Metadata
  messageCount: number;
  unreadCount: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ConversationParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: Timestamp;
  lastReadAt?: Timestamp;
  unreadCount: number;
  status: 'active' | 'left' | 'removed' | 'blocked';
  settings?: {
    muted?: boolean;
    notifications?: boolean;
  };
}

// Notification Types
export interface Notification {
  id?: string;
  
  // Recipient
  userId: string;
  orgId?: string;
  
  // Type & Category
  type: NotificationType;
  category: 'system' | 'event' | 'booking' | 'payment' | 'contract' | 'message' | 'social';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Content
  title: string;
  message: string;
  imageUrl?: string;
  
  // Action
  actionUrl?: string;
  actionText?: string;
  actions?: NotificationAction[];
  
  // Related Entities
  relatedEntities?: {
    eventId?: string;
    venueId?: string;
    djId?: string;
    contractId?: string;
    conversationId?: string;
    userId?: string;
  };
  
  // Status
  status: 'unread' | 'read' | 'archived' | 'deleted';
  readAt?: Timestamp;
  
  // Delivery
  channels: NotificationChannel[];
  deliveryStatus: Record<NotificationChannel, 'pending' | 'sent' | 'failed'>;
  
  // Timestamps
  createdAt: Timestamp;
  scheduledFor?: Timestamp;
  expiresAt?: Timestamp;
}

export type NotificationType = 
  | 'event_created'
  | 'event_updated'
  | 'event_cancelled'
  | 'event_reminder'
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_due'
  | 'contract_sent'
  | 'contract_signed'
  | 'contract_expiring'
  | 'message_received'
  | 'mention'
  | 'review_received'
  | 'system_update'
  | 'custom';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  action?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// Email Template Types
export interface EmailTemplate {
  id?: string;
  
  // Template Info
  name: string;
  description?: string;
  category: 'transactional' | 'marketing' | 'notification' | 'reminder';
  type: EmailTemplateType;
  
  // Content
  subject: string;
  preheader?: string;
  htmlContent: string;
  textContent?: string;
  
  // Variables
  variables?: TemplateVariable[];
  
  // Design
  design?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logoUrl?: string;
  };
  
  // Settings
  isActive: boolean;
  isSystem: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  lastUsed?: Timestamp;
  useCount?: number;
}

export type EmailTemplateType = 
  | 'welcome'
  | 'event_invitation'
  | 'booking_confirmation'
  | 'payment_receipt'
  | 'contract_signature_request'
  | 'review_request'
  | 'reminder'
  | 'newsletter'
  | 'custom';

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'url' | 'html';
  required: boolean;
  defaultValue?: any;
  sampleValue?: any;
}

// Broadcast Types
export interface Broadcast {
  id?: string;
  orgId: string;
  
  // Message
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  
  // Audience
  audience: BroadcastAudience;
  recipientCount?: number;
  
  // Channels
  channels: NotificationChannel[];
  
  // Schedule
  scheduledFor?: Timestamp;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  
  // Stats
  stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  
  // Metadata
  createdAt: Timestamp;
  sentAt?: Timestamp;
  createdBy: string;
}

export interface BroadcastAudience {
  type: 'all' | 'segment' | 'manual';
  
  // Segment Filters
  filters?: {
    userType?: string[];
    eventAttendees?: string[]; // Event IDs
    venueVisitors?: string[]; // Venue IDs
    djFollowers?: string[]; // DJ IDs
    tags?: string[];
  };
  
  // Manual Selection
  userIds?: string[];
  emails?: string[];
}

// Notification Preferences
export interface NotificationPreferences {
  id?: string;
  userId: string;
  
  // Channel Preferences
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  
  // Category Preferences
  categories: {
    system: NotificationChannelPreference;
    event: NotificationChannelPreference;
    booking: NotificationChannelPreference;
    payment: NotificationChannelPreference;
    contract: NotificationChannelPreference;
    message: NotificationChannelPreference;
    marketing: NotificationChannelPreference;
  };
  
  // Quiet Hours
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
    timezone: string;
  };
  
  // Frequency
  frequency?: {
    immediate: boolean;
    digest?: 'daily' | 'weekly' | 'monthly';
    digestTime?: string; // HH:mm format
  };
  
  // Metadata
  updatedAt: Timestamp;
}

export interface NotificationChannelPreference {
  enabled: boolean;
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  inApp?: boolean;
}

// SMS Template
export interface SMSTemplate {
  id?: string;
  name: string;
  message: string;
  variables?: TemplateVariable[];
  type: 'transactional' | 'marketing' | 'reminder';
  isActive: boolean;
  createdAt: Timestamp;
}

// Push Notification
export interface PushNotification {
  id?: string;
  userId: string;
  
  // Content
  title: string;
  body: string;
  imageUrl?: string;
  
  // Action
  clickAction?: string;
  data?: Record<string, any>;
  
  // Targeting
  deviceTokens?: string[];
  topic?: string;
  
  // Options
  badge?: number;
  sound?: string;
  priority?: 'normal' | 'high';
  
  // Status
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Timestamp;
  error?: string;
}

// Communication Analytics
export interface CommunicationAnalytics {
  orgId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Timestamp;
  
  // Message Stats
  messages: {
    sent: number;
    received: number;
    conversations: number;
    activeUsers: number;
  };
  
  // Notification Stats
  notifications: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    byChannel: Record<NotificationChannel, number>;
  };
  
  // Email Stats
  emails: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  
  // Response Times
  responseTime: {
    average: number; // minutes
    median: number;
    p95: number;
  };
}

// Webhook Configuration
export interface WebhookConfig {
  id?: string;
  orgId: string;
  
  // Endpoint
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  
  // Events
  events: WebhookEvent[];
  
  // Security
  secret?: string;
  signatureHeader?: string;
  
  // Settings
  isActive: boolean;
  retryOnFailure: boolean;
  maxRetries?: number;
  
  // Stats
  stats?: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    lastCallAt?: Timestamp;
    lastError?: string;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type WebhookEvent = 
  | 'message.sent'
  | 'message.received'
  | 'notification.sent'
  | 'email.sent'
  | 'email.opened'
  | 'email.clicked'
  | 'conversation.created'
  | 'conversation.updated';