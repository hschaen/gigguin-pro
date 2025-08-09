import { Timestamp } from "firebase/firestore";

// Shared types from DJ booking tool
export interface DJAssignment {
  djId?: string;
  djName: string;
  djLegalName: string;
  email: string;
  phone: string;
  paymentAmount: string;
  setStartTime: string;
  setEndTime?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  assignedAt: Timestamp;
  agreementSentManually?: boolean;
  guestListLink?: string;
  paymentRecordId?: string;
  paymentStatus?: 'not_created' | 'pending' | 'processing' | 'completed' | 'failed' | 'overdue';
  paymentDueDate?: Timestamp;
  paidAt?: Timestamp;
}

export interface EventInstanceData {
  id?: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  djAssignments: DJAssignment[];
  totalPayment: string;
  budget?: number;
  revenue?: number;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BookingData {
  id?: string;
  djId?: string;
  djLegalName: string;
  djName: string;
  email: string;
  phone: string;
  setStartTime: string;
  eventDate: string;
  paymentAmount: string;
  agreementSentManually?: boolean;
  guestListLink?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DJData {
  id?: string;
  djName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// New types for host check-in app
export interface HostGuest {
  id?: string;
  eventInstanceId: string;
  hostId: string;
  name: string;
  email?: string;
  phone?: string;
  checkedIn: boolean;
  checkedInAt?: Timestamp;
  checkedOutAt?: Timestamp;
  notes?: string;
  source: 'dj-list' | 'manual'; // Track if guest is from DJ list or manually added
  djEmail?: string; // If from DJ list, track which DJ
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CheckInSession {
  id?: string;
  eventInstanceId: string;
  hostId: string;
  hostName: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  activeGuestLists: string[]; // DJ emails with active guest lists
  totalCheckedIn: number;
  totalGuests: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Guest list item that combines DJ guests and manual additions
export interface GuestListItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  checkedIn: boolean;
  checkedInAt?: Timestamp;
  checkedOutAt?: Timestamp;
  source: 'dj-list' | 'manual';
  djName?: string; // If from DJ list
  djEmail?: string; // If from DJ list
  notes?: string;
  canEdit: boolean; // Only manual additions can be edited
}

// Filter and search options
export interface GuestFilters {
  search: string;
  djFilter: 'all' | 'manual' | string; // 'all', 'manual', or specific DJ email
  statusFilter: 'all' | 'checked-in' | 'not-checked-in';
  sortBy: 'name' | 'checkInTime' | 'dj';
  sortOrder: 'asc' | 'desc';
}

// Stats for dashboard
export interface EventStats {
  totalGuests: number;
  checkedIn: number;
  notCheckedIn: number;
  djCounts: { [djName: string]: { total: number; checkedIn: number } };
  manualAdditions: { total: number; checkedIn: number };
}

// RSVP system types - aligned with DJ Booking Tool
export interface RSVP {
  id?: string;
  eventInstanceId: string;
  assigneeType: 'dj' | 'team_member';
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  
  // Guest information
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  partySize: number;
  plusOneName?: string;
  
  // QR code data
  qrCodeData: string; // Format: {eventInstanceId}-{rsvpId}
  qrCodeUrl?: string; // Base64 encoded QR code image
  
  // Check-in tracking
  checkedIn: boolean;
  checkedInAt?: Timestamp;
  checkedInBy?: string;
  
  // Unique RSVP token
  rsvpToken: string;
  
  // Metadata
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Guest list entry from DJ booking tool
export interface GuestListEntry {
  id?: string;
  eventInstanceId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  
  // Who this guest list belongs to
  assigneeType: 'dj' | 'team_member';
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  assigneeRole?: string;
  
  // Guest list link (Google Sheets, etc.)
  guestListLink: string;
  
  // Guest list metadata
  maxGuests?: number;
  description?: string;
  notes?: string;
  
  // Status
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Parsed guest from various sources
export interface ParsedGuest {
  name: string;
  email?: string;
  phone?: string;
  plusOne?: boolean;
  notes?: string;
}

// Enhanced guest list item with RSVP data
export interface EnhancedGuestListItem extends GuestListItem {
  rsvp?: RSVP;
  isFromGuestList: boolean; // true if from parsed list, false if only RSVP
}