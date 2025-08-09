import { Resend } from 'resend';
import QRCode from 'qrcode';

interface RSVPConfirmationData {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  partySize: number;
  plusOneName?: string;
  instagram?: string;
  eventName: string;
  eventDate: string;
  venue: string;
  assigneeName: string;
  assigneeType: 'dj' | 'team_member';
  rsvpId: string;
  checkInUrl?: string;
}

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    this.initializeResend();
  }

  private initializeResend() {
    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend API key not found in environment variables');
      return;
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private isInitialized(): boolean {
    return this.resend !== null;
  }

  /**
   * Generate QR code for guest check-in
   */
  private async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    const dateParts = dateString.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Generate HTML email template
   */
  private generateHTMLTemplate(data: RSVPConfirmationData, qrCodeDataUrl: string): string {
    const formattedDate = this.formatDate(data.eventDate);
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RSVP Confirmation - ${data.eventName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          background-color: #f8f9fa;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .title {
          color: #1f2937;
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 5px 0 0 0;
        }
        .content {
          margin: 30px 0;
        }
        .event-details {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #2563eb;
        }
        .detail-row {
          display: flex;
          margin: 10px 0;
          align-items: center;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
          min-width: 120px;
        }
        .detail-value {
          color: #1f2937;
        }
        .qr-section {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: #f0f9ff;
          border-radius: 8px;
          border: 2px dashed #3b82f6;
        }
        .qr-code {
          margin: 20px 0;
          display: inline-block;
          padding: 15px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .qr-instructions {
          color: #1e40af;
          font-weight: 500;
          margin-top: 15px;
        }
        .guest-info {
          background: #f0fdf4;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #10b981;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background: #2563eb;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          margin: 10px 0;
        }
        .success-badge {
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          display: inline-block;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎵 DJ Booking Tool</div>
          <h1 class="title">RSVP Confirmed!</h1>
          <p class="subtitle">Your spot is secured for ${data.eventName}</p>
        </div>

        <div class="content">
          <div class="success-badge">✓ Successfully Registered</div>
          
          <p>Hi ${data.guestName},</p>
          <p>Thank you for your RSVP! ${data.assigneeName} is excited to have you at the event. Here are your confirmation details:</p>

          <div class="event-details">
            <h3 style="margin-top: 0; color: #1f2937;">📅 Event Details</h3>
            <div class="detail-row">
              <div class="detail-label">Event:</div>
              <div class="detail-value">${data.eventName}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Date:</div>
              <div class="detail-value">${formattedDate}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Venue:</div>
              <div class="detail-value">${data.venue}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Invited by:</div>
              <div class="detail-value">${data.assigneeName} (${data.assigneeType === 'dj' ? 'DJ' : 'Team Member'})</div>
            </div>
          </div>

          <div class="guest-info">
            <h3 style="margin-top: 0; color: #1f2937;">👤 Your RSVP Details</h3>
            <div class="detail-row">
              <div class="detail-label">Name:</div>
              <div class="detail-value">${data.guestName}</div>
            </div>
            ${data.guestEmail ? `
            <div class="detail-row">
              <div class="detail-label">Email:</div>
              <div class="detail-value">${data.guestEmail}</div>
            </div>
            ` : ''}
            ${data.guestPhone ? `
            <div class="detail-row">
              <div class="detail-label">Phone:</div>
              <div class="detail-value">${data.guestPhone}</div>
            </div>
            ` : ''}
            <div class="detail-row">
              <div class="detail-label">Party Size:</div>
              <div class="detail-value">${data.partySize} ${data.partySize === 1 ? 'person' : 'people'}</div>
            </div>
            ${data.plusOneName ? `
            <div class="detail-row">
              <div class="detail-label">Plus One:</div>
              <div class="detail-value">${data.plusOneName}</div>
            </div>
            ` : ''}
            ${data.instagram ? `
            <div class="detail-row">
              <div class="detail-label">Instagram:</div>
              <div class="detail-value">@${data.instagram}</div>
            </div>
            ` : ''}
            <div class="detail-row">
              <div class="detail-label">RSVP ID:</div>
              <div class="detail-value">${data.rsvpId}</div>
            </div>
          </div>

          <div class="qr-section">
            <h3 style="margin-top: 0; color: #1e40af;">📱 Your Check-In QR Code</h3>
            <p>Show this QR code at the venue for quick check-in:</p>
            <div class="qr-code">
              <img src="${qrCodeDataUrl}" alt="Check-in QR Code" width="200" height="200" style="display: block; margin: 0 auto;" />
            </div>
            <div class="qr-instructions">
              💡 Save this email or take a screenshot for easy access at the event
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p><strong>Questions about the event?</strong></p>
            <p>Contact ${data.assigneeName} directly for any event-related questions.</p>
          </div>
        </div>

        <div class="footer">
          <p>This confirmation was generated by DJ Booking Tool</p>
          <p style="font-size: 12px; color: #9ca3af;">
            Please keep this email for your records. You'll need the QR code to check in at the event.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate plain text email version
   */
  private generateTextTemplate(data: RSVPConfirmationData): string {
    const formattedDate = this.formatDate(data.eventDate);
    
    return `
RSVP CONFIRMED - ${data.eventName}

Hi ${data.guestName},

Thank you for your RSVP! ${data.assigneeName} is excited to have you at the event.

EVENT DETAILS:
Event: ${data.eventName}
Date: ${formattedDate}
Venue: ${data.venue}
Invited by: ${data.assigneeName} (${data.assigneeType === 'dj' ? 'DJ' : 'Team Member'})

YOUR RSVP DETAILS:
Name: ${data.guestName}
${data.guestEmail ? `Email: ${data.guestEmail}` : ''}
${data.guestPhone ? `Phone: ${data.guestPhone}` : ''}
Party Size: ${data.partySize} ${data.partySize === 1 ? 'person' : 'people'}
${data.plusOneName ? `Plus One: ${data.plusOneName}` : ''}
${data.instagram ? `Instagram: @${data.instagram}` : ''}
RSVP ID: ${data.rsvpId}

IMPORTANT: A QR code for check-in has been included in the HTML version of this email. Please view the HTML version or use a device that can display images to access your QR code.

Questions about the event? Contact ${data.assigneeName} directly.

This confirmation was generated by DJ Booking Tool.
Please keep this email for your records.
    `.trim();
  }

  /**
   * Send RSVP confirmation email with QR code
   */
  async sendRSVPConfirmation(data: RSVPConfirmationData): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error('Email service not initialized - missing Resend API key');
      return false;
    }

    if (!data.guestEmail) {
      console.warn('No email address provided for RSVP confirmation');
      return false;
    }

    try {
      // Generate QR code data (contains RSVP ID for check-in)
      const qrData = JSON.stringify({
        rsvpId: data.rsvpId,
        eventId: data.eventName,
        guestName: data.guestName,
        partySize: data.partySize,
        checkInUrl: data.checkInUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkin/${data.rsvpId}`
      });

      const qrCodeDataUrl = await this.generateQRCode(qrData);

      // Generate email content
      const htmlContent = this.generateHTMLTemplate(data, qrCodeDataUrl);
      const textContent = this.generateTextTemplate(data);

      // Send email
      const result = await this.resend!.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'RSVP Confirmations <noreply@your-domain.com>',
        to: [data.guestEmail],
        subject: `🎵 RSVP Confirmed: ${data.eventName}`,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-RSVP-ID': data.rsvpId,
          'X-Event-Name': data.eventName,
          'X-Assignee': data.assigneeName,
        },
        tags: [
          {
            name: 'type',
            value: 'rsvp-confirmation'
          },
          {
            name: 'event',
            value: data.eventName.toLowerCase().replace(/\s+/g, '-')
          },
          {
            name: 'assignee-type',
            value: data.assigneeType
          }
        ]
      });

      if (result.error) {
        console.error('Resend API error:', result.error);
        return false;
      }

      console.log(`RSVP confirmation email sent to ${data.guestEmail} (ID: ${result.data?.id})`);
      return true;
    } catch (error) {
      console.error('Error sending RSVP confirmation email:', error);
      return false;
    }
  }

  /**
   * Send reminder email (can be used for follow-up communications)
   */
  async sendEventReminder(data: RSVPConfirmationData): Promise<boolean> {
    if (!this.isInitialized() || !data.guestEmail) {
      return false;
    }

    try {
      const formattedDate = this.formatDate(data.eventDate);
      
      const result = await this.resend!.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Event Reminders <noreply@your-domain.com>',
        to: [data.guestEmail],
        subject: `📅 Reminder: ${data.eventName} is coming up!`,
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Don't forget about ${data.eventName}!</h2>
          <p>Hi ${data.guestName},</p>
          <p>This is a friendly reminder about the upcoming event:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>${data.eventName}</strong><br>
            📅 ${formattedDate}<br>
            📍 ${data.venue}<br>
            👤 Hosted by ${data.assigneeName}
          </div>
          <p>Don't forget to bring your QR code from your original confirmation email for quick check-in!</p>
          <p>See you there!</p>
        </div>
        `,
        text: `
Don't forget about ${data.eventName}!

Hi ${data.guestName},

This is a friendly reminder about the upcoming event:

${data.eventName}
Date: ${formattedDate}
Venue: ${data.venue}
Hosted by: ${data.assigneeName}

Don't forget to bring your QR code from your original confirmation email for quick check-in!

See you there!
        `.trim(),
        tags: [
          {
            name: 'type',
            value: 'event-reminder'
          }
        ]
      });

      return !result.error;
    } catch (error) {
      console.error('Error sending event reminder:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    if (!this.isInitialized()) {
      return false;
    }

    try {
      // Send a test email to verify configuration
      const result = await this.resend!.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Test <noreply@your-domain.com>',
        to: [process.env.TEST_EMAIL || 'test@example.com'],
        subject: 'DJ Booking Tool - Email Service Test',
        html: '<p>This is a test email from the DJ Booking Tool email service. If you received this, your email configuration is working correctly!</p>',
        text: 'This is a test email from the DJ Booking Tool email service. If you received this, your email configuration is working correctly!'
      });

      return !result.error;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types
export type { RSVPConfirmationData };