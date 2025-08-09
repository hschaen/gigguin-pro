// QR Code generation and validation utilities

export interface QRCodeData {
  eventInstanceId: string;
  rsvpId: string;
}

// Generate QR code data string
export function generateQRCodeData(eventInstanceId: string, rsvpId: string): string {
  return `${eventInstanceId}-${rsvpId}`;
}

// Parse QR code data string
export function parseQRCodeData(qrCodeData: string): QRCodeData | null {
  const parts = qrCodeData.split('-');
  if (parts.length < 2) {
    return null;
  }
  
  // For format: eventInstanceId-rsvpId, we want the first part as eventId
  // and everything after the first dash as rsvpId
  const eventInstanceId = parts[0];
  const rsvpId = parts.slice(1).join('-'); // Rejoin remaining parts with dashes
  
  if (!eventInstanceId || !rsvpId) {
    return null;
  }
  
  return {
    eventInstanceId,
    rsvpId
  };
}

// Generate QR code URL using a QR code API service
export function generateQRCodeUrl(data: string, size: number = 200): string {
  // Using qr-server.com as it's free and reliable
  const baseUrl = 'https://api.qrserver.com/v1/create-qr-code/';
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: data,
    format: 'png',
    margin: '10',
    color: '000000',
    bgcolor: 'ffffff'
  });
  
  return `${baseUrl}?${params.toString()}`;
}

// Generate QR code as data URL (base64)
export async function generateQRCodeDataUrl(data: string, size: number = 200): Promise<string> {
  try {
    const qrUrl = generateQRCodeUrl(data, size);
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error generating QR code data URL:", error);
    throw new Error("Failed to generate QR code");
  }
}

// Validate QR code format
export function isValidQRCodeData(data: string): boolean {
  const parsed = parseQRCodeData(data);
  return parsed !== null;
}

// Generate check-in URL for QR code
export function generateCheckInUrl(qrCodeData: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
  return `${baseUrl}/checkin/qr?code=${encodeURIComponent(qrCodeData)}`;
}

// Generate RSVP confirmation email content with QR code
export function generateRSVPEmailContent(
  guestName: string,
  eventName: string,
  eventDate: string,
  venue: string,
  qrCodeDataUrl: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Your RSVP Confirmation - ${eventName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>RSVP Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .qr-section { text-align: center; background: #fff; padding: 30px; border: 2px solid #e9ecef; border-radius: 8px; margin: 20px 0; }
        .qr-code { max-width: 200px; height: auto; margin: 20px 0; }
        .event-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { font-size: 12px; color: #666; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>RSVP Confirmed!</h1>
          <p>Hi ${guestName},</p>
          <p>Your RSVP for <strong>${eventName}</strong> has been confirmed.</p>
        </div>
        
        <div class="event-details">
          <h2>Event Details</h2>
          <p><strong>Event:</strong> ${eventName}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Venue:</strong> ${venue}</p>
        </div>
        
        <div class="qr-section">
          <h2>Your Check-In QR Code</h2>
          <p>Show this QR code at the event for quick check-in:</p>
          <img src="${qrCodeDataUrl}" alt="Check-in QR Code" class="qr-code" />
          <p><strong>Important:</strong> Save this email or take a screenshot of the QR code for easy access at the event.</p>
        </div>
        
        <div class="footer">
          <p>Can't scan the QR code? No problem! Just give your name at check-in and we'll find you on the list.</p>
          <p>Questions? Reply to this email and we'll help you out.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
RSVP Confirmed!

Hi ${guestName},

Your RSVP for ${eventName} has been confirmed.

Event Details:
- Event: ${eventName}
- Date: ${eventDate}
- Venue: ${venue}

Your check-in QR code is attached to this email. Show it at the event for quick check-in.

Can't scan the QR code? No problem! Just give your name at check-in and we'll find you on the list.

Questions? Reply to this email and we'll help you out.
  `;
  
  return { subject, html, text };
}

// Format QR code data for display
export function formatQRCodeForDisplay(qrCodeData: string): string {
  const parsed = parseQRCodeData(qrCodeData);
  if (!parsed) return qrCodeData;
  
  return `Event: ${parsed.eventInstanceId.slice(-8)} | RSVP: ${parsed.rsvpId.slice(-8)}`;
}

// Check if QR code belongs to specific event
export function isQRCodeForEvent(qrCodeData: string, eventInstanceId: string): boolean {
  const parsed = parseQRCodeData(qrCodeData);
  return parsed?.eventInstanceId === eventInstanceId;
}