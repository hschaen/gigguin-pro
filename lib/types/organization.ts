import { Timestamp } from 'firebase/firestore';

export interface Organization {
  id?: string;
  name: string;
  slug: string; // URL-safe identifier for subdomain
  type: 'promoter' | 'venue' | 'agency';
  
  // Branding
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  
  // Contact
  email: string;
  phone?: string;
  website?: string;
  
  // Address
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  
  // Social Media
  socials?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
  };
  
  // Domain Configuration
  subdomain: string; // e.g., "sushi-sundays" for sushi-sundays.gigguin.com
  customDomain?: string; // e.g., "sushisundays.com"
  customDomainVerified?: boolean;
  dnsRecords?: {
    type: string;
    name: string;
    value: string;
    verified: boolean;
  }[];
  
  // Settings
  settings?: {
    timezone: string;
    currency: string;
    dateFormat: string;
    allowPublicBookings: boolean;
    requireApproval: boolean;
    autoInvoicing: boolean;
  };
  
  // Subscription/Billing
  subscription?: {
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'trial' | 'suspended' | 'cancelled';
    trialEndsAt?: Timestamp;
    billingEmail?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  
  // Permissions
  owner: string; // User ID of the organization owner
  admins: string[]; // User IDs with admin access
  members: string[]; // User IDs with member access
  
  // Metadata
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy: string;
}

export interface OrganizationInvite {
  id?: string;
  orgId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  token: string;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  createdAt?: Timestamp;
}