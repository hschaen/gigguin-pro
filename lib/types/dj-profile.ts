import { Timestamp } from 'firebase/firestore';

// Enhanced DJ Profile with EPK
export interface DJProfile {
  id?: string;
  userId: string; // Firebase Auth user ID
  
  // Basic Information
  artistName: string;
  realName?: string;
  slug: string; // URL-friendly version of artist name
  email: string;
  phone?: string;
  
  // Profile Details
  bio: string;
  shortBio?: string; // 160 chars for social media
  hometown?: string;
  currentCity?: string;
  yearsActive?: number;
  
  // Music Details
  genres: string[];
  subGenres?: string[];
  style?: string;
  influences?: string[];
  
  // Performance Info
  performanceTypes: ('club' | 'festival' | 'private' | 'corporate' | 'wedding' | 'radio')[];
  setLengthMin: number; // Minutes
  setLengthMax: number;
  technicalRequirements?: string[];
  
  // Rates & Availability
  baseRate?: {
    amount: number;
    currency: string;
    per: 'hour' | 'set' | 'event';
  };
  travelRadius?: number; // Miles/KM willing to travel
  availability: DJAvailability;
  blackoutDates?: Timestamp[];
  
  // Media & Assets
  media: {
    profilePhoto?: string;
    coverPhoto?: string;
    photos?: string[];
    logo?: string;
    mixLinks?: MixLink[];
    videoLinks?: VideoLink[];
    pressPhotos?: PressPhoto[];
  };
  
  // Social & Streaming
  social: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    soundcloud?: string;
    mixcloud?: string;
    spotify?: string;
    beatport?: string;
    bandcamp?: string;
    website?: string;
  };
  
  // Press & Achievements
  press: {
    quotes?: PressQuote[];
    features?: PressFeature[];
    achievements?: Achievement[];
    residencies?: Residency[];
    labels?: string[];
    releases?: Release[];
  };
  
  // Performance History
  stats: {
    totalGigs?: number;
    totalVenues?: number;
    averageRating?: number;
    reviewCount?: number;
    repeatBookings?: number;
    cancellationRate?: number;
  };
  
  // Technical Details
  technical: {
    equipment?: string[];
    software?: string[];
    canStream?: boolean;
    hasOwnSound?: boolean;
    hasOwnLighting?: boolean;
    needsHospitality?: string;
  };
  
  // Booking Preferences
  preferences: {
    preferredVenueTypes?: string[];
    preferredEventTypes?: string[];
    minimumNotice?: number; // Days
    willingToTravel?: boolean;
    internationalGigs?: boolean;
    acceptsDeposit?: boolean;
    contractRequired?: boolean;
  };
  
  // Settings
  settings: {
    publicProfile: boolean;
    showRates: boolean;
    acceptsDirectBookings: boolean;
    autoResponse?: string;
    bookingEmail?: string;
    managementEmail?: string;
  };
  
  // Metadata
  isActive: boolean;
  isVerified?: boolean;
  verificationDate?: Timestamp;
  completionScore?: number; // Profile completion percentage
  lastActive?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// DJ Availability
export interface DJAvailability {
  general: 'available' | 'busy' | 'selective' | 'not_booking';
  calendar?: AvailabilityCalendar;
  weeklySchedule?: WeeklyAvailability;
  notes?: string;
}

export interface AvailabilityCalendar {
  [date: string]: { // YYYY-MM-DD format
    status: 'available' | 'booked' | 'hold' | 'blackout';
    eventId?: string;
    notes?: string;
  };
}

export interface WeeklyAvailability {
  [day: string]: { // monday, tuesday, etc.
    available: boolean;
    preferredTimes?: string[];
    notes?: string;
  };
}

// Media Types
export interface MixLink {
  id: string;
  title: string;
  url: string;
  platform: 'soundcloud' | 'mixcloud' | 'youtube' | 'spotify' | 'other';
  duration?: number; // Minutes
  genre?: string;
  recordedDate?: Timestamp;
  plays?: number;
  likes?: number;
  featured?: boolean;
}

export interface VideoLink {
  id: string;
  title: string;
  url: string;
  platform: 'youtube' | 'vimeo' | 'instagram' | 'tiktok' | 'other';
  type: 'performance' | 'interview' | 'tutorial' | 'promo';
  thumbnail?: string;
  featured?: boolean;
}

export interface PressPhoto {
  id: string;
  url: string;
  caption?: string;
  credit?: string;
  highResUrl?: string;
  orientation: 'landscape' | 'portrait' | 'square';
  usage?: 'editorial' | 'promotional' | 'both';
}

// Press & Achievements
export interface PressQuote {
  id: string;
  quote: string;
  source: string;
  sourceUrl?: string;
  date?: Timestamp;
  featured?: boolean;
}

export interface PressFeature {
  id: string;
  publication: string;
  title: string;
  url?: string;
  date: Timestamp;
  type: 'interview' | 'feature' | 'review' | 'mention';
  excerpt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description?: string;
  year?: number;
  icon?: string;
  verified?: boolean;
}

export interface Residency {
  id: string;
  venueName: string;
  venueId?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  frequency?: string; // "Weekly", "Monthly", etc.
  dayOfWeek?: string;
  active: boolean;
}

export interface Release {
  id: string;
  title: string;
  label?: string;
  releaseDate: Timestamp;
  type: 'single' | 'ep' | 'album' | 'remix' | 'compilation';
  url?: string;
  artwork?: string;
  trackCount?: number;
}

// Gig Application
export interface GigApplication {
  id?: string;
  djId: string;
  djName: string;
  eventId?: string;
  venueId?: string;
  organizerId: string;
  
  // Application Details
  eventName: string;
  eventDate: Timestamp;
  venueName?: string;
  eventType: string;
  
  // Proposed Terms
  proposedFee?: number;
  proposedSetLength?: number;
  proposedTimeSlot?: string;
  
  // Application Content
  coverLetter?: string;
  whyBook?: string; // Why should they book you
  mixLink?: string;
  videoLink?: string;
  
  // Technical
  canProvideEquipment?: boolean;
  technicalNeeds?: string[];
  specialRequests?: string[];
  
  // Status
  status: 'pending' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
  
  // Response
  organizerResponse?: {
    decision: 'accepted' | 'rejected' | 'maybe';
    message?: string;
    counterOffer?: {
      fee?: number;
      setLength?: number;
      timeSlot?: string;
    };
    respondedAt: Timestamp;
    respondedBy: string;
  };
  
  // Metadata
  submittedAt: Timestamp;
  updatedAt: Timestamp;
}

// DJ Search/Discovery
export interface DJSearchFilters {
  genres?: string[];
  city?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  availability?: {
    date?: Date;
    dayOfWeek?: string;
  };
  rating?: number; // Minimum rating
  verified?: boolean;
  hasVideo?: boolean;
  hasMixes?: boolean;
  yearsExperience?: number;
  willingToTravel?: boolean;
}

// DJ Booking Request (from Promoter/Venue)
export interface DJBookingRequest {
  id?: string;
  djId: string;
  requesterId: string; // Promoter/Venue user ID
  requesterOrgId?: string;
  
  // Event Details
  eventName: string;
  eventDate: Timestamp;
  venueId?: string;
  venueName: string;
  eventType: string;
  expectedAttendance?: number;
  
  // Booking Details
  proposedFee: number;
  setLength: number;
  timeSlot: string;
  
  // Additional Info
  otherDJs?: string[];
  eventDescription?: string;
  specialRequests?: string;
  travelCovered?: boolean;
  accommodationProvided?: boolean;
  
  // Contract & Payment
  contractTerms?: string;
  paymentTerms?: string;
  depositAmount?: number;
  cancellationPolicy?: string;
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'negotiating' | 'confirmed' | 'cancelled';
  
  // DJ Response
  djResponse?: {
    decision: 'accepted' | 'declined' | 'counter';
    message?: string;
    counterTerms?: {
      fee?: number;
      requirements?: string[];
    };
    availability: boolean;
    respondedAt: Timestamp;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
}

// DJ Performance Review
export interface DJPerformanceReview {
  id?: string;
  djId: string;
  eventId: string;
  reviewerId: string; // Promoter/Venue
  
  // Ratings (1-5)
  ratings: {
    overall: number;
    mixing: number;
    crowdReading: number;
    professionalism: number;
    punctuality: number;
    communication: number;
  };
  
  // Feedback
  review?: string;
  wouldBookAgain: boolean;
  wouldRecommend: boolean;
  
  // Performance Details
  actualSetLength?: number;
  crowdResponse?: 'poor' | 'fair' | 'good' | 'great' | 'excellent';
  technicalIssues?: string;
  
  // Private Notes (not shown to DJ)
  privateNotes?: string;
  
  // Metadata
  eventDate: Timestamp;
  reviewDate: Timestamp;
  verified: boolean; // Verified the event actually happened
}

// EPK Template/Theme
export interface EPKTheme {
  id?: string;
  name: string;
  template: 'modern' | 'classic' | 'minimal' | 'bold' | 'custom';
  
  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  
  // Fonts
  fonts: {
    heading: string;
    body: string;
  };
  
  // Layout
  layout: {
    heroStyle: 'fullscreen' | 'split' | 'centered' | 'video';
    sectionOrder: string[]; // Order of EPK sections
    showSocial: boolean;
    showStats: boolean;
    showPress: boolean;
    showCalendar: boolean;
  };
  
  // Custom CSS
  customCss?: string;
}

// Analytics
export interface DJAnalytics {
  djId: string;
  period: 'weekly' | 'monthly' | 'yearly' | 'all-time';
  
  // Profile Views
  profileViews: number;
  epkViews: number;
  uniqueVisitors: number;
  
  // Engagement
  mixPlays: number;
  videoViews: number;
  socialClicks: number;
  contactRequests: number;
  
  // Bookings
  bookingRequests: number;
  bookingsConfirmed: number;
  bookingsCompleted: number;
  totalRevenue?: number;
  
  // Performance
  averageRating: number;
  reviewsReceived: number;
  
  // Top Metrics
  topViewedMixes: MixLink[];
  topVenues: string[];
  topCities: string[];
  
  // Trends
  trends: {
    viewsChange: number; // Percentage
    bookingsChange: number;
    revenueChange: number;
  };
}