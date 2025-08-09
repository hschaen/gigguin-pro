import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Message,
  Conversation,
  ConversationParticipant,
  Notification,
  NotificationType,
  NotificationChannel,
  EmailTemplate,
  Broadcast,
  NotificationPreferences,
  CommunicationAnalytics,
  WebhookConfig
} from '@/lib/types/communication';

const MESSAGES_COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';
const NOTIFICATIONS_COLLECTION = 'notifications';
const EMAIL_TEMPLATES_COLLECTION = 'email_templates';
const BROADCASTS_COLLECTION = 'broadcasts';
const PREFERENCES_COLLECTION = 'notification_preferences';
const WEBHOOKS_COLLECTION = 'webhooks';

// Message Operations

export async function sendMessage(
  conversationId: string,
  messageData: Omit<Message, 'id' | 'sentAt' | 'status'>
): Promise<string> {
  try {
    const message: Omit<Message, 'id'> = {
      ...messageData,
      conversationId,
      status: 'sent',
      sentAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), message);
    
    // Update conversation last message
    await updateConversationLastMessage(conversationId, message);
    
    // Send notifications to participants
    await notifyParticipants(conversationId, message);
    
    // Trigger webhooks
    await triggerWebhook('message.sent', { messageId: docRef.id, conversationId });
    
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function getMessages(
  conversationId: string,
  limitCount: number = 50,
  beforeTimestamp?: Timestamp
): Promise<Message[]> {
  try {
    let q = query(
      collection(db, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('sentAt', 'desc'),
      limit(limitCount)
    );
    
    if (beforeTimestamp) {
      q = query(q, where('sentAt', '<', beforeTimestamp));
    }
    
    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as Message);
    });
    
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

export async function markMessageAsRead(
  messageId: string,
  userId: string
): Promise<void> {
  try {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId);
    await updateDoc(docRef, {
      status: 'read',
      readAt: Timestamp.now()
    });
    
    // Update conversation participant's last read
    const message = await getDoc(docRef);
    if (message.exists()) {
      const messageData = message.data() as Message;
      await updateParticipantLastRead(messageData.conversationId, userId);
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('sentAt', 'desc'),
    limit(50)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as Message);
    });
    callback(messages.reverse());
  });
  
  return unsubscribe;
}

// Conversation Operations

export async function createConversation(
  conversationData: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'messageCount' | 'unreadCount'>
): Promise<string> {
  try {
    // Check for existing direct conversation
    if (conversationData.type === 'direct' && conversationData.participants.length === 2) {
      const existing = await findDirectConversation(
        conversationData.participants[0].userId,
        conversationData.participants[1].userId
      );
      if (existing) return existing.id!;
    }
    
    const conversation: Omit<Conversation, 'id'> = {
      ...conversationData,
      messageCount: 0,
      unreadCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversation);
    
    // Send welcome message for group conversations
    if (conversationData.type === 'group') {
      await sendMessage(docRef.id, {
        conversationId: docRef.id,
        senderId: 'system',
        senderName: 'System',
        content: `${conversationData.createdBy} created the group "${conversationData.name}"`,
        type: 'system'
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', {
        userId,
        status: 'active'
      }),
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      } as Conversation);
    });
    
    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
}

export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Conversation;
    }
    return null;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
}

async function findDirectConversation(
  userId1: string,
  userId2: string
): Promise<Conversation | null> {
  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('type', '==', 'direct'),
      where('participants', 'array-contains', {
        userId: userId1,
        status: 'active'
      })
    );
    
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      const conversation = {
        id: doc.id,
        ...doc.data()
      } as Conversation;
      
      // Check if the other user is also a participant
      const hasUser2 = conversation.participants.some(
        p => p.userId === userId2 && p.status === 'active'
      );
      
      if (hasUser2) {
        return conversation;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding direct conversation:', error);
    return null;
  }
}

async function updateConversationLastMessage(
  conversationId: string,
  message: Omit<Message, 'id'>
): Promise<void> {
  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(docRef, {
      lastMessage: {
        content: message.content,
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: message.sentAt,
        type: message.type
      },
      messageCount: increment(1),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating conversation last message:', error);
  }
}

async function updateParticipantLastRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const conversation = await getConversationById(conversationId);
    if (!conversation) return;
    
    const updatedParticipants = conversation.participants.map(p => {
      if (p.userId === userId) {
        return {
          ...p,
          lastReadAt: Timestamp.now(),
          unreadCount: 0
        };
      }
      return p;
    });
    
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(docRef, {
      participants: updatedParticipants
    });
  } catch (error) {
    console.error('Error updating participant last read:', error);
  }
}

// Notification Operations

export async function createNotification(
  notificationData: Omit<Notification, 'id' | 'createdAt' | 'status' | 'deliveryStatus'>
): Promise<string> {
  try {
    const notification: Omit<Notification, 'id'> = {
      ...notificationData,
      status: 'unread',
      deliveryStatus: {} as Record<NotificationChannel, 'pending' | 'sent' | 'failed'>,
      createdAt: Timestamp.now()
    };
    
    // Initialize delivery status
    notificationData.channels.forEach(channel => {
      notification.deliveryStatus[channel] = 'pending';
    });
    
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification);
    
    // Send to different channels
    await sendToChannels(docRef.id, notification);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function getNotifications(
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', '!=', 'deleted'),
      orderBy('status'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as Notification);
    });
    
    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, {
      status: 'read',
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'unread')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

// Email Template Operations

export async function createEmailTemplate(
  templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const template: Omit<EmailTemplate, 'id'> = {
      ...templateData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      useCount: 0
    };
    
    const docRef = await addDoc(collection(db, EMAIL_TEMPLATES_COLLECTION), template);
    return docRef.id;
  } catch (error) {
    console.error('Error creating email template:', error);
    throw error;
  }
}

export async function getEmailTemplates(
  category?: EmailTemplate['category']
): Promise<EmailTemplate[]> {
  try {
    let q = query(
      collection(db, EMAIL_TEMPLATES_COLLECTION),
      where('isActive', '==', true)
    );
    
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    const querySnapshot = await getDocs(q);
    const templates: EmailTemplate[] = [];
    
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      } as EmailTemplate);
    });
    
    return templates;
  } catch (error) {
    console.error('Error getting email templates:', error);
    throw error;
  }
}

export async function sendEmail(
  to: string | string[],
  templateId: string,
  variables?: Record<string, any>
): Promise<void> {
  try {
    const template = await getEmailTemplateById(templateId);
    if (!template) throw new Error('Template not found');
    
    // Process template variables
    let subject = template.subject;
    let htmlContent = template.htmlContent;
    let textContent = template.textContent || '';
    
    if (variables) {
      Object.keys(variables).forEach(key => {
        const value = variables[key];
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        htmlContent = htmlContent.replace(regex, value);
        textContent = textContent.replace(regex, value);
      });
    }
    
    // TODO: Integrate with email service (SendGrid, etc.)
    console.log('Sending email:', { to, subject });
    
    // Update template usage
    await updateDoc(doc(db, EMAIL_TEMPLATES_COLLECTION, templateId), {
      lastUsed: Timestamp.now(),
      useCount: increment(1)
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function getEmailTemplateById(templateId: string): Promise<EmailTemplate | null> {
  try {
    const docRef = doc(db, EMAIL_TEMPLATES_COLLECTION, templateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EmailTemplate;
    }
    return null;
  } catch (error) {
    console.error('Error getting email template:', error);
    return null;
  }
}

// Broadcast Operations

export async function createBroadcast(
  broadcastData: Omit<Broadcast, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  try {
    const broadcast: Omit<Broadcast, 'id'> = {
      ...broadcastData,
      status: broadcastData.scheduledFor ? 'scheduled' : 'draft',
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, BROADCASTS_COLLECTION), broadcast);
    
    // If scheduled, set up scheduled job
    if (broadcastData.scheduledFor) {
      // TODO: Implement scheduled job system
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating broadcast:', error);
    throw error;
  }
}

export async function sendBroadcast(broadcastId: string): Promise<void> {
  try {
    const broadcast = await getBroadcastById(broadcastId);
    if (!broadcast) throw new Error('Broadcast not found');
    
    // Update status
    await updateDoc(doc(db, BROADCASTS_COLLECTION, broadcastId), {
      status: 'sending'
    });
    
    // Get recipients based on audience
    const recipients = await getBroadcastRecipients(broadcast);
    
    // Send to each recipient
    const stats = {
      sent: 0,
      failed: 0
    };
    
    for (const recipient of recipients) {
      try {
        await createNotification({
          userId: recipient.userId,
          type: 'custom',
          category: 'system',
          priority: 'normal',
          title: broadcast.title,
          message: broadcast.message,
          imageUrl: broadcast.imageUrl,
          actionUrl: broadcast.actionUrl,
          actionText: broadcast.actionText,
          channels: broadcast.channels
        });
        stats.sent++;
      } catch (error) {
        console.error('Error sending to recipient:', error);
        stats.failed++;
      }
    }
    
    // Update broadcast status and stats
    await updateDoc(doc(db, BROADCASTS_COLLECTION, broadcastId), {
      status: 'sent',
      sentAt: Timestamp.now(),
      stats: {
        sent: stats.sent,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: stats.failed
      }
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    throw error;
  }
}

async function getBroadcastById(broadcastId: string): Promise<Broadcast | null> {
  try {
    const docRef = doc(db, BROADCASTS_COLLECTION, broadcastId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Broadcast;
    }
    return null;
  } catch (error) {
    console.error('Error getting broadcast:', error);
    return null;
  }
}

async function getBroadcastRecipients(broadcast: Broadcast): Promise<{ userId: string }[]> {
  // TODO: Implement recipient selection based on audience filters
  const recipients: { userId: string }[] = [];
  
  if (broadcast.audience.type === 'manual' && broadcast.audience.userIds) {
    broadcast.audience.userIds.forEach(userId => {
      recipients.push({ userId });
    });
  }
  
  return recipients;
}

// Notification Preferences

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const q = query(
      collection(db, PREFERENCES_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as NotificationPreferences;
    }
    
    // Return default preferences if none exist
    return createDefaultPreferences(userId);
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const existing = await getNotificationPreferences(userId);
    
    if (existing?.id) {
      const docRef = doc(db, PREFERENCES_COLLECTION, existing.id);
      await updateDoc(docRef, {
        ...preferences,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new preferences
      await addDoc(collection(db, PREFERENCES_COLLECTION), {
        userId,
        ...preferences,
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

function createDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    channels: {
      email: true,
      sms: false,
      push: true,
      inApp: true
    },
    categories: {
      system: { enabled: true, email: true, inApp: true },
      event: { enabled: true, email: true, push: true, inApp: true },
      booking: { enabled: true, email: true, push: true, inApp: true },
      payment: { enabled: true, email: true, inApp: true },
      contract: { enabled: true, email: true, inApp: true },
      message: { enabled: true, push: true, inApp: true },
      marketing: { enabled: false, email: false }
    },
    updatedAt: Timestamp.now()
  };
}

// Helper Functions

async function notifyParticipants(
  conversationId: string,
  message: Omit<Message, 'id'>
): Promise<void> {
  try {
    const conversation = await getConversationById(conversationId);
    if (!conversation) return;
    
    // Notify all participants except sender
    for (const participant of conversation.participants) {
      if (participant.userId !== message.senderId && participant.status === 'active') {
        await createNotification({
          userId: participant.userId,
          type: 'message_received',
          category: 'message',
          priority: 'normal',
          title: `New message from ${message.senderName}`,
          message: message.content,
          actionUrl: `/messages/${conversationId}`,
          relatedEntities: {
            conversationId
          },
          channels: ['in_app', 'push']
        });
      }
    }
  } catch (error) {
    console.error('Error notifying participants:', error);
  }
}

async function sendToChannels(
  notificationId: string,
  notification: Omit<Notification, 'id'>
): Promise<void> {
  const batch = writeBatch(db);
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  
  for (const channel of notification.channels) {
    try {
      switch (channel) {
        case 'email':
          // TODO: Send email
          batch.update(docRef, {
            [`deliveryStatus.${channel}`]: 'sent'
          });
          break;
          
        case 'sms':
          // TODO: Send SMS
          batch.update(docRef, {
            [`deliveryStatus.${channel}`]: 'sent'
          });
          break;
          
        case 'push':
          // TODO: Send push notification
          batch.update(docRef, {
            [`deliveryStatus.${channel}`]: 'sent'
          });
          break;
          
        case 'in_app':
          // In-app is already created
          batch.update(docRef, {
            [`deliveryStatus.${channel}`]: 'sent'
          });
          break;
      }
    } catch (error) {
      console.error(`Error sending to ${channel}:`, error);
      batch.update(docRef, {
        [`deliveryStatus.${channel}`]: 'failed'
      });
    }
  }
  
  await batch.commit();
}

async function triggerWebhook(event: string, data: any): Promise<void> {
  // TODO: Implement webhook triggering
  console.log('Webhook triggered:', event, data);
}

// Initialize System Email Templates
export async function initializeSystemEmailTemplates(): Promise<void> {
  try {
    const templates: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Welcome Email',
        description: 'Sent when a new user signs up',
        category: 'transactional',
        type: 'welcome',
        subject: 'Welcome to Gigguin, {{userName}}!',
        preheader: 'Get started with your DJ booking platform',
        htmlContent: `
          <h1>Welcome to Gigguin!</h1>
          <p>Hi {{userName}},</p>
          <p>We're excited to have you on board. Gigguin is your all-in-one platform for DJ bookings and event management.</p>
          <a href="{{actionUrl}}">Get Started</a>
        `,
        textContent: 'Welcome to Gigguin! We are excited to have you on board.',
        variables: [
          { key: 'userName', label: 'User Name', type: 'text', required: true },
          { key: 'actionUrl', label: 'Action URL', type: 'url', required: true }
        ],
        isActive: true,
        isSystem: true
      },
      {
        name: 'Booking Confirmation',
        description: 'Sent when a booking is confirmed',
        category: 'transactional',
        type: 'booking_confirmation',
        subject: 'Booking Confirmed: {{eventName}}',
        preheader: 'Your booking has been confirmed',
        htmlContent: `
          <h1>Booking Confirmed!</h1>
          <p>Hi {{userName}},</p>
          <p>Your booking for {{eventName}} on {{eventDate}} has been confirmed.</p>
          <p>Venue: {{venueName}}</p>
          <p>Time: {{eventTime}}</p>
          <a href="{{bookingUrl}}">View Booking Details</a>
        `,
        variables: [
          { key: 'userName', label: 'User Name', type: 'text', required: true },
          { key: 'eventName', label: 'Event Name', type: 'text', required: true },
          { key: 'eventDate', label: 'Event Date', type: 'date', required: true },
          { key: 'venueName', label: 'Venue Name', type: 'text', required: true },
          { key: 'eventTime', label: 'Event Time', type: 'text', required: true },
          { key: 'bookingUrl', label: 'Booking URL', type: 'url', required: true }
        ],
        isActive: true,
        isSystem: true
      }
    ];
    
    // Check if templates already exist
    const existingTemplates = await getEmailTemplates();
    const systemTemplates = existingTemplates.filter(t => t.isSystem);
    
    if (systemTemplates.length === 0) {
      // Create system templates
      for (const template of templates) {
        await createEmailTemplate(template);
      }
      console.log('System email templates initialized');
    }
  } catch (error) {
    console.error('Error initializing system email templates:', error);
  }
}