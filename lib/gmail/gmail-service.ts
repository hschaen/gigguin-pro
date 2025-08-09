import { google } from 'googleapis';
import { GmailConnection, getGmailConnection, refreshGmailToken, createOAuth2Client } from './oauth-manager';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: Array<{
      name: string;
      value: string;
    }>;
    body: {
      data: string;
      size: number;
    };
    parts?: Array<{
      partId: string;
      mimeType: string;
      filename: string;
      headers: Array<{
        name: string;
        value: string;
      }>;
      body: {
        data: string;
        size: number;
      };
    }>;
  };
  sizeEstimate: number;
}

/**
 * Create Gmail API client with user authentication
 */
export async function createGmailClient(userId: string) {
  const connection = await getGmailConnection(userId);
  
  if (!connection) {
    throw new Error('Gmail connection not found');
  }
  
  const oauth2Client = createOAuth2Client();
  
  // Check if token needs refresh
  if (connection.expiresAt <= Date.now()) {
    const newTokens = await refreshGmailToken(connection);
    oauth2Client.setCredentials({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token
    });
  } else {
    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken
    });
  }
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Send email using Gmail API
 */
export async function sendEmail(userId: string, message: EmailMessage): Promise<string> {
  const gmail = await createGmailClient(userId);
  
  // Create email content
  const emailContent = createEmailContent(message);
  
  // Encode the email content
  const encodedEmail = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Send the email
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail
    }
  });
  
  return response.data.id || '';
}

/**
 * Create email content in RFC 2822 format
 */
function createEmailContent(message: EmailMessage): string {
  const boundary = 'boundary_' + Math.random().toString(36).substring(2);
  const date = new Date().toUTCString();
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@gmail.com>`;
  
  let emailContent = '';
  
  // Headers
  emailContent += `From: ${message.from || 'Gigguin <noreply@gigguin.com>'}\r\n`;
  emailContent += `To: ${Array.isArray(message.to) ? message.to.join(', ') : message.to}\r\n`;
  emailContent += `Subject: ${message.subject}\r\n`;
  emailContent += `Date: ${date}\r\n`;
  emailContent += `Message-ID: ${messageId}\r\n`;
  
  if (message.replyTo) {
    emailContent += `Reply-To: ${message.replyTo}\r\n`;
  }
  
  if (message.attachments && message.attachments.length > 0) {
    // Multipart email with attachments
    emailContent += `MIME-Version: 1.0\r\n`;
    emailContent += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    
    // Text part
    emailContent += `--${boundary}\r\n`;
    emailContent += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    emailContent += `${message.body}\r\n\r\n`;
    
    // HTML part (if provided)
    if (message.html) {
      emailContent += `--${boundary}\r\n`;
      emailContent += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
      emailContent += `${message.html}\r\n\r\n`;
    }
    
    // Attachments
    for (const attachment of message.attachments) {
      emailContent += `--${boundary}\r\n`;
      emailContent += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`;
      emailContent += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
      emailContent += `Content-Transfer-Encoding: base64\r\n\r\n`;
      emailContent += `${attachment.content}\r\n\r\n`;
    }
    
    emailContent += `--${boundary}--\r\n`;
  } else {
    // Simple text email
    emailContent += `MIME-Version: 1.0\r\n`;
    emailContent += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    emailContent += `${message.body}\r\n`;
  }
  
  return emailContent;
}

/**
 * Get user's Gmail messages
 */
export async function getMessages(userId: string, query?: string, maxResults: number = 10): Promise<GmailMessage[]> {
  const gmail = await createGmailClient(userId);
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults
  });
  
  if (!response.data.messages) {
    return [];
  }
  
  // Get full message details
  const messagePromises = response.data.messages.map(async (message) => {
    const fullMessage = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!
    });
    
    return fullMessage.data as GmailMessage;
  });
  
  return Promise.all(messagePromises);
}

/**
 * Get a specific Gmail message
 */
export async function getMessage(userId: string, messageId: string): Promise<GmailMessage> {
  const gmail = await createGmailClient(userId);
  
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId
  });
  
  return response.data as GmailMessage;
}

/**
 * Send email with HTML content
 */
export async function sendHtmlEmail(userId: string, message: EmailMessage): Promise<string> {
  if (!message.html) {
    throw new Error('HTML content is required for sendHtmlEmail');
  }
  
  return sendEmail(userId, message);
}

/**
 * Send email with attachment
 */
export async function sendEmailWithAttachment(
  userId: string,
  message: EmailMessage,
  attachment: {
    filename: string;
    content: string;
    contentType: string;
  }
): Promise<string> {
  const messageWithAttachment: EmailMessage = {
    ...message,
    attachments: [attachment]
  };
  
  return sendEmail(userId, messageWithAttachment);
}

/**
 * Check if user has valid Gmail connection
 */
export async function hasValidGmailConnection(userId: string): Promise<boolean> {
  try {
    const connection = await getGmailConnection(userId);
    return connection !== null && connection.isActive;
  } catch {
    return false;
  }
} 