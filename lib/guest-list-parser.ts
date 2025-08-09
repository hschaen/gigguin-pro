import { ParsedGuest } from "./host-types";

// Parse guest list from various formats
export class GuestListParser {
  // Parse CSV content
  static parseCSV(csvContent: string): ParsedGuest[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Assume first line is header
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const guests: ParsedGuest[] = [];
    
    // Find column indices
    const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('guest'));
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
    const plusOneIndex = headers.findIndex(h => h.includes('plus') || h.includes('+1'));
    const notesIndex = headers.findIndex(h => h.includes('note') || h.includes('comment'));
    
    if (nameIndex === -1) {
      // If no name column, assume first column is name
      console.warn("No name column found in CSV, using first column");
    }
    
    // Parse each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const name = values[nameIndex >= 0 ? nameIndex : 0];
      if (!name) continue;
      
      guests.push({
        name,
        email: emailIndex >= 0 ? values[emailIndex] : undefined,
        phone: phoneIndex >= 0 ? values[phoneIndex] : undefined,
        plusOne: plusOneIndex >= 0 ? values[plusOneIndex]?.toLowerCase() === 'yes' : false,
        notes: notesIndex >= 0 ? values[notesIndex] : undefined
      });
    }
    
    return guests;
  }
  
  // Parse plain text list (one name per line)
  static parsePlainText(textContent: string): ParsedGuest[] {
    const lines = textContent.split('\n').filter(line => line.trim());
    const guests: ParsedGuest[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Check if line contains email
      const emailMatch = trimmedLine.match(/[\w.-]+@[\w.-]+\.\w+/);
      const phoneMatch = trimmedLine.match(/[\d\s()+-]+/);
      
      let name = trimmedLine;
      let email: string | undefined;
      let phone: string | undefined;
      
      if (emailMatch) {
        email = emailMatch[0];
        name = trimmedLine.replace(email, '').trim();
      }
      
      if (phoneMatch && phoneMatch[0].length >= 10) {
        phone = phoneMatch[0];
        name = name.replace(phone, '').trim();
      }
      
      // Clean up name
      name = name.replace(/[,;]/g, '').trim();
      
      if (name) {
        guests.push({
          name,
          email,
          phone,
          plusOne: false
        });
      }
    }
    
    return guests;
  }
  
  // Parse from Google Sheets shared link
  static async parseGoogleSheets(sheetUrl: string): Promise<ParsedGuest[]> {
    // Extract sheet ID from URL
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error("Invalid Google Sheets URL");
    }
    
    const sheetId = sheetIdMatch[1];
    
    // For now, we'll return empty array as Google Sheets API requires authentication
    // In production, you'd implement Google Sheets API integration here
    console.warn("Google Sheets parsing not implemented yet. Sheet ID:", sheetId);
    return [];
  }
  
  // Parse from URL content
  static async parseFromURL(url: string): Promise<ParsedGuest[]> {
    try {
      // Check if it's a Google Sheets URL
      if (url.includes('docs.google.com/spreadsheets')) {
        return await this.parseGoogleSheets(url);
      }
      
      // For other URLs, try to fetch content
      const response = await fetch(url);
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      
      if (contentType.includes('csv')) {
        return this.parseCSV(text);
      } else {
        return this.parsePlainText(text);
      }
    } catch (error) {
      console.error("Error parsing from URL:", error);
      throw new Error("Failed to parse guest list from URL");
    }
  }
  
  // Auto-detect format and parse
  static parse(content: string): ParsedGuest[] {
    // Check if it's CSV (contains commas and possibly headers)
    if (content.includes(',') && content.split('\n').length > 1) {
      const firstLine = content.split('\n')[0].toLowerCase();
      if (firstLine.includes('name') || firstLine.includes('email') || firstLine.includes('guest')) {
        return this.parseCSV(content);
      }
    }
    
    // Otherwise treat as plain text
    return this.parsePlainText(content);
  }
  
  // Merge parsed guests with existing ones (avoid duplicates)
  static mergeGuests(existingGuests: ParsedGuest[], newGuests: ParsedGuest[]): ParsedGuest[] {
    const merged = [...existingGuests];
    const existingNames = new Set(existingGuests.map(g => g.name.toLowerCase()));
    
    for (const newGuest of newGuests) {
      if (!existingNames.has(newGuest.name.toLowerCase())) {
        merged.push(newGuest);
      }
    }
    
    return merged;
  }
  
  // Validate and clean guest data
  static validateGuest(guest: ParsedGuest): ParsedGuest {
    return {
      name: guest.name.trim(),
      email: guest.email?.trim().toLowerCase(),
      phone: guest.phone?.replace(/\D/g, '').slice(-10), // Keep last 10 digits
      plusOne: guest.plusOne || false,
      notes: guest.notes?.trim()
    };
  }
}

// Example guest list formats this parser can handle:
/*
CSV Format:
Name,Email,Phone,Plus One,Notes
John Doe,john@example.com,555-1234,Yes,VIP Guest
Jane Smith,jane@example.com,555-5678,No,

Plain Text Format:
John Doe
Jane Smith jane@example.com
Bob Johnson 555-9012
Alice Williams alice@example.com 555-3456
*/