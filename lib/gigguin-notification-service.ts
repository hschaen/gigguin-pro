'use client';

import { BookingData } from './firestore';
import { getDJById } from './dj-firestore';
import { userLinkingService } from './user-linking-service';

export interface BookingNotificationData {
  eventType: 'booking_request' | 'booking_confirmed' | 'booking_cancelled' | 'booking_updated';
  bookingId: string;
  djBookingToolUid: string;
  bookingData: {
    promoterName: string;
    promoterEmail: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    venue: string;
    amountPaid: number;
    duration: number;
    notes?: string;
  };
}

export class GigguinNotificationService {
  private static instance: GigguinNotificationService;

  static getInstance(): GigguinNotificationService {
    if (!GigguinNotificationService.instance) {
      GigguinNotificationService.instance = new GigguinNotificationService();
    }
    return GigguinNotificationService.instance;
  }

  /**
   * Send booking notification to Gigguin when a new booking is created
   */
  async sendBookingRequest(bookingId: string, bookingData: BookingData): Promise<boolean> {
    try {
      // Find the DJ's UID from the booking data
      let djBookingToolUid: string | undefined;

      if (bookingData.djId) {
        // If we have a DJ reference, get the DJ's email as UID
        const dj = await getDJById(bookingData.djId);
        djBookingToolUid = dj?.email; // Use email as the unique identifier
      }

      if (!djBookingToolUid) {
        console.log('No DJ UID found for booking, skipping Gigguin notification');
        return false;
      }

      // Check if DJ has linked Gigguin account
      const linkingRecord = await userLinkingService.getLinkingRecordByDjUid(djBookingToolUid);
      if (!linkingRecord || !linkingRecord.isLinked) {
        console.log(`DJ ${djBookingToolUid} does not have a linked Gigguin account`);
        return false;
      }

      // Transform booking data to notification format
      const notificationData: BookingNotificationData = {
        eventType: 'booking_request',
        bookingId,
        djBookingToolUid,
        bookingData: {
          promoterName: 'Event Promoter', // This should come from promoter data
          promoterEmail: bookingData.email, // Using contact email as promoter email
          eventName: this.generateEventName(bookingData),
          eventDate: bookingData.eventDate,
          eventTime: bookingData.setStartTime,
          venue: 'Event Venue', // This should come from venue data
          amountPaid: parseFloat(bookingData.paymentAmount) || 0,
          duration: 4, // Default duration, should be configurable
          notes: `DJ Booking for ${bookingData.djName}`,
        },
      };

      // Send to our webhook endpoint
      const response = await fetch('/api/webhooks/send-to-gigguin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to send Gigguin notification:', errorData);
        return false;
      }

      const result = await response.json();
      console.log('Gigguin notification sent successfully:', result);
      return true;

    } catch (error) {
      console.error('Error sending Gigguin notification:', error);
      return false;
    }
  }

  /**
   * Send booking confirmation notification to Gigguin
   */
  async sendBookingConfirmation(bookingId: string, bookingData: BookingData): Promise<boolean> {
    return this.sendBookingUpdate(bookingId, bookingData, 'booking_confirmed');
  }

  /**
   * Send booking cancellation notification to Gigguin
   */
  async sendBookingCancellation(bookingId: string, bookingData: BookingData): Promise<boolean> {
    return this.sendBookingUpdate(bookingId, bookingData, 'booking_cancelled');
  }

  /**
   * Send booking update notification to Gigguin
   */
  async sendBookingUpdated(bookingId: string, bookingData: BookingData): Promise<boolean> {
    return this.sendBookingUpdate(bookingId, bookingData, 'booking_updated');
  }

  private async sendBookingUpdate(
    bookingId: string,
    bookingData: BookingData,
    eventType: 'booking_confirmed' | 'booking_cancelled' | 'booking_updated'
  ): Promise<boolean> {
    try {
      let djBookingToolUid: string | undefined;

      if (bookingData.djId) {
        const dj = await getDJById(bookingData.djId);
        djBookingToolUid = dj?.email;
      }

      if (!djBookingToolUid) {
        console.log('No DJ UID found for booking, skipping Gigguin notification');
        return false;
      }

      const notificationData: BookingNotificationData = {
        eventType,
        bookingId,
        djBookingToolUid,
        bookingData: {
          promoterName: 'Event Promoter',
          promoterEmail: bookingData.email,
          eventName: this.generateEventName(bookingData),
          eventDate: bookingData.eventDate,
          eventTime: bookingData.setStartTime,
          venue: 'Event Venue',
          amountPaid: parseFloat(bookingData.paymentAmount) || 0,
          duration: 4,
          notes: `DJ Booking for ${bookingData.djName}`,
        },
      };

      const response = await fetch('/api/webhooks/send-to-gigguin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`Failed to send ${eventType} notification:`, errorData);
        return false;
      }

      console.log(`${eventType} notification sent successfully`);
      return true;

    } catch (error) {
      console.error(`Error sending ${eventType} notification:`, error);
      return false;
    }
  }

  /**
   * Generate a meaningful event name from booking data
   */
  private generateEventName(bookingData: BookingData): string {
    const date = new Date(bookingData.eventDate);
    const formattedDate = date.toLocaleDateString();
    return `DJ ${bookingData.djName} - ${formattedDate}`;
  }
}

export const gigguinNotificationService = GigguinNotificationService.getInstance();