// Server-side only module - check if we're in a browser environment
if (typeof window !== 'undefined') {
  throw new Error('Google Sheets service can only be used on the server side');
}

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface RSVPData {
  timestamp: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  partySize: number;
  plusOneName?: string;
  instagram?: string;
  eventName: string;
  eventDate: string;
  venue: string;
  assigneeName: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

interface SheetConfig {
  spreadsheetId: string;
  range: string;
}

class GoogleSheetsService {
  private auth: JWT | null = null;
  private sheets: any = null;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.warn('Google Service Account key not found in environment variables');
        return;
      }

      const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      
      this.auth = new JWT({
        email: serviceAccountKey.client_email,
        key: serviceAccountKey.private_key,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive'
        ],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Failed to initialize Google Sheets authentication:', error);
    }
  }

  private isInitialized(): boolean {
    return this.auth !== null && this.sheets !== null;
  }

  /**
   * Create a new Google Sheet for an assignee
   */
  async createAssigneeSheet(
    assigneeName: string,
    assigneeEmail: string,
    eventName: string,
    eventDate: string
  ): Promise<string | null> {
    if (!this.isInitialized()) {
      throw new Error('Google Sheets service not initialized');
    }

    if (!this.auth) {
      throw new Error('Google Sheets authentication not available');
    }

    try {
      const drive = google.drive({ version: 'v3', auth: this.auth });
      
      // Create new spreadsheet
      const sheetTitle = `${eventName} - ${assigneeName} Guest List`;
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: sheetTitle,
          },
          sheets: [
            {
              properties: {
                title: 'RSVP Responses',
              },
            },
          ],
        },
      });

      const spreadsheetId = response.data.spreadsheetId;
      if (!spreadsheetId) {
        throw new Error('Failed to create spreadsheet');
      }

      // Set up headers
      await this.setupSheetHeaders(spreadsheetId);

      // Share with assignee (give edit permissions)
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: assigneeEmail,
        },
        sendNotificationEmail: true,
        emailMessage: `Your guest list for ${eventName} is ready! You can view and manage RSVPs here.`,
      });

      console.log(`Created Google Sheet for ${assigneeName}: ${spreadsheetId}`);
      return spreadsheetId;
    } catch (error) {
      console.error('Error creating assignee sheet:', error);
      throw new Error('Failed to create Google Sheet');
    }
  }

  /**
   * Set up headers for the RSVP sheet
   */
  private async setupSheetHeaders(spreadsheetId: string): Promise<void> {
    const headers = [
      'Timestamp',
      'Guest Name',
      'Email',
      'Phone',
      'Party Size',
      'Plus One Name',
      'Instagram',
      'Event Name',
      'Event Date',
      'Venue',
      'Invited By',
      'Checked In',
      'Checked In At',
      'RSVP ID'
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'RSVP Responses!A1:N1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    // Format headers
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                  textFormat: { bold: true },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      },
    });
  }

  /**
   * Append RSVP data to an existing sheet
   */
  async appendRSVPData(
    spreadsheetId: string,
    rsvpData: RSVPData,
    rsvpId: string
  ): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Google Sheets service not initialized');
    }

    if (!this.auth) {
      throw new Error('Google Sheets authentication not available');
    }

    try {
      const values = [
        rsvpData.timestamp,
        rsvpData.guestName,
        rsvpData.guestEmail || '',
        rsvpData.guestPhone || '',
        rsvpData.partySize.toString(),
        rsvpData.plusOneName || '',
        rsvpData.instagram || '',
        rsvpData.eventName,
        rsvpData.eventDate,
        rsvpData.venue,
        rsvpData.assigneeName,
        rsvpData.checkedIn ? 'Yes' : 'No',
        rsvpData.checkedInAt || '',
        rsvpId
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'RSVP Responses!A:N',
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });

      console.log(`Appended RSVP data for ${rsvpData.guestName} to sheet ${spreadsheetId}`);
    } catch (error) {
      console.error('Error appending RSVP data:', error);
      throw new Error('Failed to save RSVP to Google Sheets');
    }
  }

  /**
   * Update check-in status for a guest
   */
  async updateCheckInStatus(
    spreadsheetId: string,
    rsvpId: string,
    checkedIn: boolean,
    checkedInAt?: string
  ): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Google Sheets service not initialized');
    }

    if (!this.auth) {
      throw new Error('Google Sheets authentication not available');
    }

    try {
      // Find the row with the matching RSVP ID
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'RSVP Responses!N:N', // Column N contains RSVP IDs
      });

      const values = response.data.values;
      if (!values) return;

      const rowIndex = values.findIndex((row: string[]) => row[0] === rsvpId);
      if (rowIndex === -1) {
        console.warn(`RSVP ID ${rsvpId} not found in sheet ${spreadsheetId}`);
        return;
      }

      // Update the check-in status (columns L and M)
      const actualRowIndex = rowIndex + 1; // Sheets are 1-indexed
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `RSVP Responses!L${actualRowIndex}:M${actualRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[checkedIn ? 'Yes' : 'No', checkedInAt || '']],
        },
      });

      console.log(`Updated check-in status for RSVP ${rsvpId} in sheet ${spreadsheetId}`);
    } catch (error) {
      console.error('Error updating check-in status:', error);
      throw new Error('Failed to update check-in status in Google Sheets');
    }
  }

  /**
   * Get sheet URL from spreadsheet ID
   */
  getSheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  /**
   * Extract spreadsheet ID from Google Sheets URL
   */
  extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validate if a Google Sheets URL is accessible
   */
  async validateSheetAccess(spreadsheetId: string): Promise<boolean> {
    if (!this.isInitialized()) {
      return false;
    }

    if (!this.auth) {
      return false;
    }

    try {
      await this.sheets.spreadsheets.get({
        spreadsheetId,
      });
      return true;
    } catch (error) {
      console.error('Sheet access validation failed:', error);
      return false;
    }
  }

  /**
   * Get RSVP statistics from a sheet
   */
  async getSheetStats(spreadsheetId: string): Promise<{
    totalRSVPs: number;
    checkedIn: number;
    notCheckedIn: number;
  } | null> {
    if (!this.isInitialized()) {
      return null;
    }

    if (!this.auth) {
      return null;
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'RSVP Responses!A:N',
      });

      const values = response.data.values;
      if (!values || values.length <= 1) {
        return { totalRSVPs: 0, checkedIn: 0, notCheckedIn: 0 };
      }

      const dataRows = values.slice(1); // Skip header row
      const totalRSVPs = dataRows.length;
      const checkedIn = dataRows.filter((row: any[]) => row[11] === 'Yes').length; // Column L
      const notCheckedIn = totalRSVPs - checkedIn;

      return { totalRSVPs, checkedIn, notCheckedIn };
    } catch (error) {
      console.error('Error getting sheet stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();

// Export types
export type { RSVPData, SheetConfig };