import { Timestamp } from 'firebase/firestore';

export interface BrandPack {
  id?: string;
  orgId: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
  
  // Brand Assets
  logo?: {
    url: string;
    publicUrl?: string;
    width?: number;
    height?: number;
  };
  
  logoVariants?: {
    light?: string;
    dark?: string;
    icon?: string;
    wordmark?: string;
  };
  
  // Brand Colors
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    success?: string;
    warning?: string;
    error?: string;
    custom?: Record<string, string>;
  };
  
  // Typography
  typography: {
    headingFont: string;
    bodyFont: string;
    accentFont?: string;
    sizes?: {
      h1?: string;
      h2?: string;
      h3?: string;
      body?: string;
      small?: string;
    };
  };
  
  // Social Media Templates
  socialTemplates?: {
    instagram?: {
      story?: AssetTemplate;
      post?: AssetTemplate;
      reel?: AssetTemplate;
    };
    facebook?: {
      post?: AssetTemplate;
      event?: AssetTemplate;
    };
    twitter?: {
      post?: AssetTemplate;
    };
  };
  
  // Marketing Copy Templates
  copyTemplates?: {
    eventAnnouncement?: string;
    lineupReveal?: string;
    earlyBird?: string;
    lastChance?: string;
    soldOut?: string;
    custom?: Record<string, string>;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy?: string;
}

export interface AssetTemplate {
  id?: string;
  name: string;
  type: 'flyer' | 'story' | 'post' | 'banner' | 'ticket';
  dimensions: {
    width: number;
    height: number;
  };
  
  // Canvas Configuration
  background?: {
    type: 'color' | 'gradient' | 'image';
    value: string;
    overlay?: {
      color: string;
      opacity: number;
    };
  };
  
  // Layout Elements
  elements: TemplateElement[];
  
  // Template Variables
  variables?: TemplateVariable[];
  
  // Preview
  previewUrl?: string;
  thumbnailUrl?: string;
  
  // Settings
  isPublic?: boolean;
  tags?: string[];
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'qrcode' | 'logo';
  
  // Position & Size
  position: {
    x: number | string; // Can be pixels or percentage
    y: number | string;
  };
  size?: {
    width: number | string;
    height: number | string;
  };
  rotation?: number;
  
  // Content
  content?: string | TemplateVariable;
  
  // Styling
  style?: {
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    fontSize?: number | string;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    letterSpacing?: number;
    lineHeight?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    shadow?: {
      x: number;
      y: number;
      blur: number;
      color: string;
    };
  };
  
  // Animations (for digital assets)
  animation?: {
    type: 'fade' | 'slide' | 'zoom' | 'rotate';
    duration: number;
    delay?: number;
    easing?: string;
  };
  
  // Conditionals
  visible?: boolean;
  condition?: string; // Expression to evaluate
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'image' | 'date' | 'number' | 'color';
  defaultValue?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
}

// AI Copy Generation Types
export interface CopyGenerationRequest {
  brandPackId?: string;
  eventDetails: {
    name: string;
    date: string;
    venue: string;
    description?: string;
    lineup?: string[];
    ticketPrice?: number;
    specialInfo?: string;
  };
  copyType: 'announcement' | 'reminder' | 'lineup' | 'soldout' | 'custom';
  platform: 'instagram' | 'facebook' | 'twitter' | 'email' | 'sms';
  tone?: 'formal' | 'casual' | 'exciting' | 'urgent' | 'mysterious';
  includeEmojis?: boolean;
  includeHashtags?: boolean;
  maxLength?: number;
  customPrompt?: string;
}

export interface GeneratedCopy {
  id?: string;
  content: string;
  platform: string;
  copyType: string;
  metadata?: {
    characterCount: number;
    wordCount: number;
    hashtags?: string[];
    emojis?: string[];
  };
  variations?: string[];
  createdAt: Timestamp;
  createdBy: string;
  eventId?: string;
  brandPackId?: string;
}

// Asset Generation Configuration
export interface AssetGenerationConfig {
  brandPackId: string;
  templateId?: string;
  eventId?: string;
  
  // Dynamic Content
  variables: Record<string, any>;
  
  // Output Settings
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  quality?: number; // 0-100 for jpg
  scale?: number; // Multiplier for resolution
  
  // Batch Generation
  batch?: {
    variations: Array<Record<string, any>>;
    namingPattern?: string;
  };
}

// Brand Pack Presets
export const BRAND_PACK_PRESETS = {
  minimal: {
    name: 'Minimal',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#FF0000',
      background: '#FAFAFA',
      text: '#333333'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    }
  },
  vibrant: {
    name: 'Vibrant',
    colors: {
      primary: '#FF006E',
      secondary: '#FB5607',
      accent: '#FFBE0B',
      background: '#3A86FF',
      text: '#FFFFFF'
    },
    typography: {
      headingFont: 'Montserrat',
      bodyFont: 'Open Sans'
    }
  },
  dark: {
    name: 'Dark Mode',
    colors: {
      primary: '#BB86FC',
      secondary: '#03DAC6',
      accent: '#CF6679',
      background: '#121212',
      text: '#FFFFFF'
    },
    typography: {
      headingFont: 'Roboto',
      bodyFont: 'Roboto'
    }
  },
  elegant: {
    name: 'Elegant',
    colors: {
      primary: '#D4AF37',
      secondary: '#1C1C1C',
      accent: '#FFFFFF',
      background: '#F5F5F5',
      text: '#2C2C2C'
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Lato'
    }
  }
};

// Template Dimensions Presets
export const ASSET_DIMENSIONS = {
  instagramStory: { width: 1080, height: 1920, label: 'Instagram Story' },
  instagramPost: { width: 1080, height: 1080, label: 'Instagram Post' },
  instagramReel: { width: 1080, height: 1920, label: 'Instagram Reel Cover' },
  facebookPost: { width: 1200, height: 630, label: 'Facebook Post' },
  facebookEvent: { width: 1920, height: 1080, label: 'Facebook Event' },
  twitterPost: { width: 1024, height: 512, label: 'Twitter Post' },
  flyer: { width: 2480, height: 3508, label: 'A4 Flyer' }, // A4 at 300 DPI
  poster: { width: 2480, height: 3508, label: 'Poster' },
  ticket: { width: 1500, height: 500, label: 'Ticket' },
  banner: { width: 1920, height: 480, label: 'Web Banner' }
};