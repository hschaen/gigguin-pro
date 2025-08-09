import { Timestamp } from 'firebase/firestore';

// Public Page Types
export interface PublicPage {
  id?: string;
  type: 'event' | 'venue' | 'dj' | 'organization';
  entityId: string;
  
  // URL & Domain
  slug: string;
  customDomain?: string;
  customPath?: string;
  isPublished: boolean;
  
  // SEO
  seo: SEOMetadata;
  
  // Content
  content: PageContent;
  
  // Theme & Design
  theme: PageTheme;
  
  // Analytics
  analytics?: {
    views: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    bounceRate: number;
    conversionRate: number;
  };
  
  // Social
  socialLinks?: SocialLinks;
  
  // Settings
  settings: PageSettings;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  
  // Twitter Card
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCreator?: string;
  
  // Structured Data
  structuredData?: any; // JSON-LD
  
  // Additional
  canonicalUrl?: string;
  robots?: string;
  author?: string;
  language?: string;
}

export interface PageContent {
  // Hero Section
  hero?: {
    title: string;
    subtitle?: string;
    description?: string;
    image?: string;
    video?: string;
    cta?: CallToAction[];
  };
  
  // Sections
  sections?: PageSection[];
  
  // Components
  components?: {
    [key: string]: ComponentConfig;
  };
}

export interface PageSection {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  content?: any;
  order: number;
  isVisible: boolean;
  settings?: Record<string, any>;
}

export type SectionType =
  | 'hero'
  | 'about'
  | 'gallery'
  | 'schedule'
  | 'lineup'
  | 'tickets'
  | 'location'
  | 'sponsors'
  | 'testimonials'
  | 'faq'
  | 'contact'
  | 'social'
  | 'newsletter'
  | 'custom';

export interface ComponentConfig {
  type: string;
  props?: Record<string, any>;
  children?: ComponentConfig[];
}

export interface CallToAction {
  label: string;
  url: string;
  type: 'primary' | 'secondary' | 'link';
  target?: '_self' | '_blank';
  tracking?: {
    event: string;
    category: string;
    label: string;
  };
}

export interface PageTheme {
  template: 'default' | 'modern' | 'classic' | 'minimal' | 'bold' | 'custom';
  
  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  
  // Typography
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  
  // Layout
  layout: {
    containerWidth: 'narrow' | 'medium' | 'wide' | 'full';
    spacing: 'compact' | 'normal' | 'relaxed';
  };
  
  // Custom CSS
  customCss?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  spotify?: string;
  soundcloud?: string;
  linkedin?: string;
  website?: string;
}

export interface PageSettings {
  // Access
  requirePassword?: boolean;
  password?: string;
  
  // Features
  showComments?: boolean;
  showSharing?: boolean;
  showRSVP?: boolean;
  showTickets?: boolean;
  
  // Tracking
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  customTracking?: string;
  
  // Forms
  contactFormEmail?: string;
  newsletterEnabled?: boolean;
  
  // Legal
  privacyPolicyUrl?: string;
  termsUrl?: string;
  cookieConsent?: boolean;
}

// Event Public Page Types
export interface EventPublicPage extends PublicPage {
  type: 'event';
  eventData: {
    name: string;
    date: Timestamp;
    startTime: string;
    endTime: string;
    venue: {
      name: string;
      address: string;
      city: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    description: string;
    lineup?: EventLineupItem[];
    schedule?: EventScheduleItem[];
    tickets?: EventTicketType[];
    capacity?: number;
    ageRestriction?: string;
    dressCode?: string;
    specialInfo?: string;
  };
}

export interface EventLineupItem {
  id: string;
  name: string;
  role: 'headliner' | 'support' | 'opener' | 'special_guest';
  image?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  performanceTime?: string;
  order: number;
}

export interface EventScheduleItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
}

export interface EventTicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  available: number;
  maxPerPerson?: number;
  salesStartDate?: Timestamp;
  salesEndDate?: Timestamp;
  url?: string;
}

// DJ Public Profile Types
export interface DJPublicProfile extends PublicPage {
  type: 'dj';
  profileData: {
    name: string;
    stageName?: string;
    bio: string;
    genres: string[];
    image: string;
    coverImage?: string;
    
    // Experience
    yearsActive: number;
    residencies?: DJResidency[];
    achievements?: DJAchievement[];
    
    // Media
    photos?: MediaItem[];
    videos?: MediaItem[];
    mixes?: DJMix[];
    tracks?: DJTrack[];
    
    // Press
    pressKit?: {
      bio: string;
      photos: MediaItem[];
      rider?: string;
      technicalRequirements?: string;
    };
    
    // Upcoming Events
    upcomingEvents?: {
      id: string;
      name: string;
      date: Timestamp;
      venue: string;
      ticketUrl?: string;
    }[];
    
    // Testimonials
    testimonials?: Testimonial[];
    
    // Booking
    bookingInfo?: {
      available: boolean;
      contactEmail?: string;
      contactPhone?: string;
      bookingForm?: boolean;
      rates?: string;
    };
  };
}

export interface DJResidency {
  id: string;
  venueName: string;
  location: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  frequency: string;
  current: boolean;
}

export interface DJAchievement {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  icon?: string;
}

export interface DJMix {
  id: string;
  title: string;
  description?: string;
  url: string;
  platform: 'soundcloud' | 'mixcloud' | 'youtube' | 'spotify';
  duration: number;
  playCount?: number;
  releaseDate: Timestamp;
  tracklist?: string[];
  coverImage?: string;
}

export interface DJTrack {
  id: string;
  title: string;
  artist: string;
  remixer?: string;
  label?: string;
  releaseDate: Timestamp;
  url?: string;
  platform?: string;
  coverImage?: string;
}

// Venue Public Page Types
export interface VenuePublicPage extends PublicPage {
  type: 'venue';
  venueData: {
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    
    // Details
    capacity: number;
    type: string[];
    amenities: string[];
    parkingInfo?: string;
    publicTransport?: string;
    accessibility?: string;
    
    // Media
    photos?: MediaItem[];
    virtualTour?: string;
    floorPlan?: string;
    
    // Hours
    hours?: {
      [day: string]: {
        open: string;
        close: string;
        closed?: boolean;
      };
    };
    
    // Events
    upcomingEvents?: {
      id: string;
      name: string;
      date: Timestamp;
      ticketUrl?: string;
    }[];
    
    // Booking
    bookingInfo?: {
      available: boolean;
      contactEmail?: string;
      contactPhone?: string;
      bookingForm?: boolean;
      rates?: string;
      minimumCapacity?: number;
    };
    
    // Reviews
    reviews?: Review[];
    rating?: number;
  };
}

// Common Types
export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  credits?: string;
  order: number;
}

export interface Testimonial {
  id: string;
  author: string;
  role?: string;
  company?: string;
  content: string;
  rating?: number;
  image?: string;
  date: Timestamp;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  date: Timestamp;
  verified?: boolean;
  response?: {
    content: string;
    date: Timestamp;
  };
}

// SEO & Discovery Types
export interface SiteMap {
  id?: string;
  urls: SiteMapUrl[];
  lastModified: Timestamp;
}

export interface SiteMapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SearchResult {
  id: string;
  type: 'event' | 'venue' | 'dj';
  title: string;
  description: string;
  url: string;
  image?: string;
  date?: Timestamp;
  location?: string;
  price?: string;
  rating?: number;
  relevanceScore: number;
}

// Social Media Integration
export interface SocialPost {
  id?: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok';
  postId: string;
  
  // Content
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  hashtags?: string[];
  mentions?: string[];
  
  // Engagement
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  
  // Settings
  autoPost: boolean;
  scheduledAt?: Timestamp;
  postedAt?: Timestamp;
  
  // Related
  entityType: 'event' | 'venue' | 'dj';
  entityId: string;
}

export interface SocialFeed {
  id?: string;
  type: 'instagram' | 'twitter' | 'facebook' | 'tiktok';
  username: string;
  feedUrl: string;
  posts: SocialPost[];
  lastUpdated: Timestamp;
}

// Discovery & Search
export interface DiscoverySettings {
  id?: string;
  orgId: string;
  
  // Visibility
  listed: boolean;
  featured: boolean;
  priority: number;
  
  // Categories
  categories: string[];
  tags: string[];
  
  // Location
  regions?: string[];
  searchRadius?: number;
  
  // Filters
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  
  // Recommendations
  similarProfiles?: string[];
  recommendedFor?: string[];
}

// Analytics & Tracking
export interface PageAnalytics {
  id?: string;
  pageId: string;
  date: Timestamp;
  
  // Metrics
  views: number;
  uniqueVisitors: number;
  sessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  
  // Sources
  trafficSources: {
    direct: number;
    organic: number;
    social: number;
    referral: number;
    email: number;
    paid: number;
  };
  
  // Devices
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  
  // Geography
  countries?: Record<string, number>;
  cities?: Record<string, number>;
  
  // Conversions
  conversions?: {
    tickets?: number;
    bookings?: number;
    inquiries?: number;
    newsletter?: number;
  };
}