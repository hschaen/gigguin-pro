import { Timestamp } from 'firebase/firestore';

// Google Calendar Types
export interface GoogleCalendarSync {
  id?: string;
  orgId: string;
  userId: string;
  
  // Connection
  calendarId: string;
  calendarName: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Timestamp;
  
  // Sync Settings
  syncEnabled: boolean;
  syncDirection: 'one-way' | 'two-way';
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  lastSyncAt?: Timestamp;
  nextSyncAt?: Timestamp;
  
  // Event Mapping
  eventMapping: {
    includePrivateEvents: boolean;
    defaultEventColor?: string;
    defaultReminders?: GoogleCalendarReminder[];
    fieldMapping: {
      title: string;
      description: string;
      location: string;
      startTime: string;
      endTime: string;
    };
  };
  
  // Status
  status: 'active' | 'paused' | 'error' | 'disconnected';
  lastError?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GoogleCalendarEvent {
  id: string;
  calendarId: string;
  
  // Event Details
  summary: string;
  description?: string;
  location?: string;
  
  // Timing
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  
  // Attendees
  attendees?: GoogleCalendarAttendee[];
  
  // Reminders
  reminders?: {
    useDefault: boolean;
    overrides?: GoogleCalendarReminder[];
  };
  
  // Status
  status?: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  
  // Metadata
  created?: string;
  updated?: string;
  htmlLink?: string;
  iCalUID?: string;
}

export interface GoogleCalendarAttendee {
  id?: string;
  email: string;
  displayName?: string;
  organizer?: boolean;
  self?: boolean;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  comment?: string;
}

export interface GoogleCalendarReminder {
  method: 'email' | 'popup' | 'sms';
  minutes: number;
}

// Google Sheets Types
export interface GoogleSheetsSync {
  id?: string;
  orgId: string;
  userId: string;
  
  // Connection
  spreadsheetId: string;
  spreadsheetName: string;
  sheetName?: string;
  range?: string;
  
  // Sync Settings
  syncType: 'import' | 'export' | 'bidirectional';
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  lastSyncAt?: Timestamp;
  
  // Data Mapping
  dataType: 'events' | 'venues' | 'djs' | 'contracts' | 'finances' | 'custom';
  fieldMapping: GoogleSheetsFieldMapping[];
  
  // Options
  options: {
    skipHeader: boolean;
    dateFormat: string;
    numberFormat: string;
    emptyValueHandling: 'skip' | 'null' | 'empty';
    duplicateHandling: 'overwrite' | 'skip' | 'append';
  };
  
  // Status
  status: 'active' | 'paused' | 'error';
  lastError?: string;
  rowsProcessed?: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GoogleSheetsFieldMapping {
  sheetColumn: string;
  dataField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'json';
  required: boolean;
  defaultValue?: any;
  transformer?: string; // Function name or expression
}

export interface GoogleSheetsData {
  spreadsheetId: string;
  range: string;
  values: any[][];
  majorDimension?: 'ROWS' | 'COLUMNS';
}

// Google Drive Types
export interface GoogleDriveIntegration {
  id?: string;
  orgId: string;
  userId: string;
  
  // Connection
  folderId: string;
  folderName: string;
  folderPath: string;
  
  // Settings
  autoUpload: boolean;
  uploadTypes: GoogleDriveUploadType[];
  namingConvention: string; // Template like "{type}_{date}_{name}"
  
  // Organization
  folderStructure: {
    createYearFolders: boolean;
    createMonthFolders: boolean;
    createEventFolders: boolean;
    createTypeFolders: boolean;
  };
  
  // Permissions
  defaultPermissions: GoogleDrivePermission[];
  shareWithTeam: boolean;
  
  // Status
  connected: boolean;
  lastActivity?: Timestamp;
  storageUsed?: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  
  // File Info
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
  
  // Location
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  
  // Permissions
  shared?: boolean;
  ownedByMe?: boolean;
  permissions?: GoogleDrivePermission[];
  
  // App Integration
  appProperties?: {
    orgId?: string;
    eventId?: string;
    venueId?: string;
    djId?: string;
    contractId?: string;
    type?: string;
  };
}

export interface GoogleDrivePermission {
  id?: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  emailAddress?: string;
  domain?: string;
  allowFileDiscovery?: boolean;
  expirationTime?: string;
}

export interface GoogleDriveUploadType {
  type: 'contracts' | 'invoices' | 'photos' | 'videos' | 'assets' | 'reports';
  autoUpload: boolean;
  folder?: string;
  maxSizeMB?: number;
}

// Google Maps Types
export interface GoogleMapsConfig {
  id?: string;
  orgId: string;
  
  // API Settings
  apiKey: string;
  
  // Map Defaults
  defaultCenter: {
    lat: number;
    lng: number;
  };
  defaultZoom: number;
  mapStyle?: string;
  
  // Features
  features: {
    showVenues: boolean;
    showEvents: boolean;
    showDJs: boolean;
    showRoute: boolean;
    showTraffic: boolean;
    showTransit: boolean;
  };
  
  // Geocoding Cache
  geocodingCache: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GoogleMapsLocation {
  id?: string;
  
  // Location Data
  address: string;
  formattedAddress?: string;
  
  // Coordinates
  coordinates: {
    lat: number;
    lng: number;
  };
  
  // Place Details
  placeId?: string;
  name?: string;
  types?: string[];
  
  // Additional Info
  vicinity?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  
  // Venue/Event Association
  venueId?: string;
  eventId?: string;
  
  // Cache
  cached?: boolean;
  cachedAt?: Timestamp;
}

export interface GoogleMapsRoute {
  id?: string;
  
  // Route Points
  origin: GoogleMapsLocation;
  destination: GoogleMapsLocation;
  waypoints?: GoogleMapsLocation[];
  
  // Route Details
  distance?: {
    text: string;
    value: number; // meters
  };
  duration?: {
    text: string;
    value: number; // seconds
  };
  
  // Traffic
  durationInTraffic?: {
    text: string;
    value: number;
  };
  
  // Route Options
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  
  // Polyline
  overviewPolyline?: string;
  
  // Metadata
  calculatedAt: Timestamp;
}

// Google Analytics Types
export interface GoogleAnalyticsConfig {
  id?: string;
  orgId: string;
  
  // GA4 Configuration
  measurementId: string;
  propertyId?: string;
  
  // Tracking Settings
  trackingEnabled: boolean;
  debugMode: boolean;
  
  // Event Tracking
  eventTracking: {
    pageViews: boolean;
    userSignups: boolean;
    bookings: boolean;
    payments: boolean;
    contractSigning: boolean;
    customEvents: GoogleAnalyticsCustomEvent[];
  };
  
  // Enhanced Measurement
  enhancedMeasurement: {
    scrolls: boolean;
    outboundClicks: boolean;
    siteSearch: boolean;
    videoEngagement: boolean;
    fileDownloads: boolean;
  };
  
  // User Properties
  userProperties: {
    role: boolean;
    organization: boolean;
    plan: boolean;
    customProperties: Record<string, any>;
  };
  
  // Consent
  consentMode: {
    analytics_storage: 'granted' | 'denied';
    ad_storage: 'granted' | 'denied';
    functionality_storage: 'granted' | 'denied';
    personalization_storage: 'granted' | 'denied';
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GoogleAnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  
  // Standard Parameters
  value?: number;
  currency?: string;
  transaction_id?: string;
  
  // Custom Parameters
  event_category?: string;
  event_label?: string;
  
  // User Context
  user_id?: string;
  user_properties?: Record<string, any>;
  
  // Timestamp
  timestamp?: Timestamp;
}

export interface GoogleAnalyticsCustomEvent {
  eventName: string;
  description: string;
  triggerType: 'click' | 'view' | 'submit' | 'custom';
  triggerElement?: string;
  parameters: GoogleAnalyticsEventParameter[];
  enabled: boolean;
}

export interface GoogleAnalyticsEventParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  source: 'static' | 'dynamic' | 'user' | 'page';
  value?: any;
  required: boolean;
}

// Google OAuth Types
export interface GoogleAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface GoogleAuthScopes {
  calendar: boolean;
  sheets: boolean;
  drive: boolean;
  maps: boolean;
  analytics: boolean;
}

// Sync Status Types
export interface GoogleSyncStatus {
  service: 'calendar' | 'sheets' | 'drive' | 'maps' | 'analytics';
  status: 'syncing' | 'success' | 'error' | 'idle';
  lastSync?: Timestamp;
  nextSync?: Timestamp;
  itemsSynced?: number;
  errors?: string[];
}

export interface GoogleIntegrationSummary {
  orgId: string;
  userId: string;
  
  // Service Status
  services: {
    calendar: boolean;
    sheets: boolean;
    drive: boolean;
    maps: boolean;
    analytics: boolean;
  };
  
  // Quick Stats
  stats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    lastSyncAt?: Timestamp;
    nextScheduledSync?: Timestamp;
  };
  
  // Storage
  storage: {
    driveUsed?: number;
    driveLimit?: number;
    sheetsCount?: number;
    calendarsCount?: number;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}