// Client-safe Google Sheets service wrapper
// This file provides a client-side interface for Google Sheets operations

// Import the type from the server module to avoid duplication
import type { RSVPData } from './google-sheets';
export type { RSVPData };

class GoogleSheetsClientService {
  private baseUrl = '/api/google-sheets';

  /**
   * Create a new Google Sheet for an assignee
   */
  async createAssigneeSheet(
    assigneeName: string,
    assigneeEmail: string,
    eventName: string,
    eventDate: string
  ): Promise<string | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createAssigneeSheet',
          assigneeName,
          assigneeEmail,
          eventName,
          eventDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create assignee sheet');
      }

      const data = await response.json();
      return data.spreadsheetId || null;
    } catch (error) {
      console.error('Error creating assignee sheet:', error);
      throw new Error('Failed to create Google Sheet');
    }
  }

  /**
   * Append RSVP data to an existing sheet
   */
  async appendRSVPData(
    spreadsheetId: string,
    rsvpData: RSVPData,
    rsvpId: string
  ): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'appendRSVPData',
          spreadsheetId,
          rsvpData,
          rsvpId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to append RSVP data');
      }
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
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateCheckInStatus',
          spreadsheetId,
          rsvpId,
          checkedIn,
          checkedInAt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update check-in status');
      }
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
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validateSheetAccess',
          spreadsheetId,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isValid || false;
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
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getSheetStats',
          spreadsheetId,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.stats || null;
    } catch (error) {
      console.error('Error getting sheet stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const googleSheetsClientService = new GoogleSheetsClientService(); 