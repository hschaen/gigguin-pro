import { Timestamp } from 'firebase/firestore';

export interface Venue {
  id?: string;
  orgId: string; // Organization that owns/manages this venue
  
  // Basic Information
  name: string;
  slug: string;
  type: 'nightclub' | 'bar' | 'lounge' | 'restaurant' | 'outdoor' | 'warehouse' | 'concert_hall' | 'other';
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  
  // Location
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Capacity & Layout
  capacity: {
    standing: number;
    seated?: number;
    vip?: number;
    total: number;
  };
  
  areas?: VenueArea[];
  
  // Technical Specifications
  techSpecs: {
    soundSystem?: string;
    djBooth?: string;
    lighting?: string;
    visualsScreens?: string;
    specialEffects?: string[];
    backline?: string[];
    powerRequirements?: string;
  };
  
  // Amenities
  amenities: {
    parking?: boolean;
    vipArea?: boolean;
    coatCheck?: boolean;
    greenRoom?: boolean;
    production?: boolean;
    catering?: boolean;
    security?: boolean;
    boxOffice?: boolean;
  };
  
  // Operating Hours
  operatingHours: {
    [key: string]: { // monday, tuesday, etc.
      open?: string;
      close?: string;
      closed?: boolean;
    };
  };
  
  // Booking Policies
  bookingPolicies: {
    minLeadTime?: number; // days
    maxAdvanceBooking?: number; // days
    depositRequired?: boolean;
    depositAmount?: number;
    cancellationPolicy?: string;
    ageRestriction?: number;
    dressCode?: string;
    securityRequirements?: string;
  };
  
  // Financial
  rentalFee?: {
    baseRate?: number;
    currency: string;
    billingPeriod: 'hourly' | 'daily' | 'event';
    minimumHours?: number;
    additionalHourRate?: number;
  };
  
  barMinimum?: {
    amount: number;
    currency: string;
    includes?: string[];
  };
  
  // Preferred Promoters
  preferredPromoters?: string[]; // User IDs
  blockedPromoters?: string[]; // User IDs
  
  // Images & Media
  images?: {
    main?: string;
    logo?: string;
    gallery?: string[];
    floorPlan?: string;
    techRider?: string;
  };
  
  // Staff & Contacts
  contacts?: VenueContact[];
  
  // Ratings & Stats
  stats?: {
    totalEvents?: number;
    averageAttendance?: number;
    rating?: number;
    reviews?: number;
  };
  
  // Settings
  settings: {
    publicProfile: boolean;
    acceptsOnlineBookings: boolean;
    requiresApproval: boolean;
    showCalendar: boolean;
    allowPromoterInquiries: boolean;
  };
  
  // Metadata
  isActive: boolean;
  isVerified?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy?: string;
}

export interface VenueArea {
  id: string;
  name: string;
  type: 'main_floor' | 'vip' | 'outdoor' | 'rooftop' | 'basement' | 'private_room';
  capacity: number;
  description?: string;
  amenities?: string[];
  rentalFee?: number;
}

export interface VenueContact {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'booking' | 'production' | 'marketing' | 'security';
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

// Venue Calendar Types
export interface VenueCalendarEvent {
  id?: string;
  venueId: string;
  eventId?: string; // Link to event in pipeline
  
  // Event Details
  title: string;
  type: 'hold' | 'confirmed' | 'private' | 'maintenance' | 'blocked';
  status: 'tentative' | 'confirmed' | 'cancelled';
  
  // Timing
  startDate: Timestamp;
  endDate: Timestamp;
  setupTime?: Timestamp;
  breakdownTime?: Timestamp;
  
  // Promoter/Organizer
  organizerId?: string;
  organizerName?: string;
  organizerContact?: string;
  
  // Financial
  agreedFee?: number;
  depositPaid?: boolean;
  settlementComplete?: boolean;
  
  // Technical Requirements
  techRequirements?: string[];
  specialRequests?: string[];
  
  // Attendance
  expectedAttendance?: number;
  actualAttendance?: number;
  
  // Notes
  internalNotes?: string;
  promoterNotes?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// Venue Availability Rules
export interface VenueAvailabilityRule {
  id?: string;
  venueId: string;
  
  // Rule Type
  type: 'recurring' | 'date_range' | 'specific_dates';
  
  // Availability
  isAvailable: boolean;
  
  // Recurring Rules (e.g., every Friday)
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    daysOfMonth?: number[]; // 1-31
    startTime?: string;
    endTime?: string;
  };
  
  // Date Range Rules
  dateRange?: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  
  // Specific Dates
  specificDates?: Timestamp[];
  
  // Restrictions
  restrictions?: {
    minCapacity?: number;
    maxCapacity?: number;
    allowedEventTypes?: string[];
    blockedEventTypes?: string[];
  };
  
  // Override Priority
  priority: number; // Higher number = higher priority
  
  // Notes
  reason?: string;
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
}

// Venue-Promoter Relationship
export interface VenuePromoterRelationship {
  id?: string;
  venueId: string;
  promoterId: string; // User ID
  orgId?: string; // Promoter's organization
  
  // Relationship Details
  type: 'preferred' | 'regular' | 'new' | 'blocked';
  status: 'active' | 'inactive' | 'suspended';
  
  // Terms
  terms?: {
    rentalRate?: number;
    barMinimum?: number;
    revenueShare?: number; // Percentage
    depositRequired?: boolean;
    depositAmount?: number;
  };
  
  // Performance History
  history?: {
    totalEvents: number;
    lastEventDate?: Timestamp;
    averageAttendance?: number;
    totalRevenue?: number;
    rating?: number;
  };
  
  // Notes
  notes?: string;
  
  // Metadata
  startDate: Timestamp;
  endDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// Venue Search Filters
export interface VenueSearchFilters {
  city?: string;
  state?: string;
  type?: string[];
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: string[];
  dateAvailable?: Date;
  priceRange?: {
    min?: number;
    max?: number;
  };
  hasParking?: boolean;
  hasVIP?: boolean;
  verified?: boolean;
}

// Venue Booking Request
export interface VenueBookingRequest {
  id?: string;
  venueId: string;
  promoterId: string;
  orgId?: string;
  
  // Event Details
  eventName: string;
  eventType: string;
  proposedDate: Timestamp;
  alternativeDates?: Timestamp[];
  expectedAttendance: number;
  
  // Lineup
  headline?: string;
  supportActs?: string[];
  
  // Technical Needs
  techRequirements?: string[];
  specialRequests?: string[];
  
  // Financial Proposal
  proposedTerms?: {
    rentalFee?: number;
    barMinimum?: number;
    revenueShare?: number;
    ticketPrice?: number;
  };
  
  // Marketing Plan
  marketingPlan?: string;
  targetAudience?: string;
  promotionChannels?: string[];
  
  // Status
  status: 'pending' | 'reviewing' | 'negotiating' | 'approved' | 'rejected' | 'withdrawn';
  
  // Response
  venueResponse?: {
    decision: 'approved' | 'rejected' | 'counter_offer';
    message?: string;
    counterTerms?: any;
    respondedAt: Timestamp;
    respondedBy: string;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Analytics Types
export interface VenueAnalytics {
  venueId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Timestamp;
  
  // Booking Metrics
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    inquiries: number;
  };
  
  // Financial Metrics
  revenue: {
    rental: number;
    bar: number;
    other: number;
    total: number;
  };
  
  // Attendance Metrics
  attendance: {
    total: number;
    average: number;
    capacity_utilization: number; // Percentage
  };
  
  // Event Types
  eventTypes: Record<string, number>;
  
  // Top Promoters
  topPromoters: Array<{
    promoterId: string;
    events: number;
    revenue: number;
  }>;
}