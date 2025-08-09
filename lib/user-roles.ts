import { Timestamp } from 'firebase/firestore';

// User role types based on DJ Management App requirements
export type UserRoleType = 'super_admin' | 'admin' | 'subscriber' | 'support' | 'lead' | 'photographer';

// Module permission levels
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

// User role interface
export interface UserRole {
  id?: string;
  userId: string;
  role: UserRoleType;
  venueAccess: string[]; // Array of venue IDs user can access
  modulePermissions: {
    events: PermissionLevel;
    djs: PermissionLevel;
    team: PermissionLevel;
    financials: PermissionLevel;
    analytics: PermissionLevel;
    media: PermissionLevel;
    campaigns: PermissionLevel;
    settings: PermissionLevel;
    assets: PermissionLevel;
  };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// User profile extension
export interface UserProfile {
  id?: string;
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: UserRoleType;
  venueAccess: string[];
  lastLogin?: Timestamp;
  preferences: {
    timezone: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    currency: string;
    notifications: {
      email: boolean;
      inApp: boolean;
      sms: boolean;
    };
  };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRoleType, UserRole['modulePermissions']> = {
  super_admin: {
    events: 'admin',
    djs: 'admin',
    team: 'admin',
    financials: 'admin',
    analytics: 'admin',
    media: 'admin',
    campaigns: 'admin',
    settings: 'admin',
    assets: 'admin',
  },
  admin: {
    events: 'admin',
    djs: 'admin',
    team: 'admin',
    financials: 'write',
    analytics: 'read',
    media: 'write',
    campaigns: 'write',
    settings: 'read',
    assets: 'write',
  },
  subscriber: {
    events: 'read',
    djs: 'read',
    team: 'read',
    financials: 'read',
    analytics: 'read',
    media: 'read',
    campaigns: 'none',
    settings: 'none',
    assets: 'read',
  },
  support: {
    events: 'write',
    djs: 'write',
    team: 'read',
    financials: 'read',
    analytics: 'read',
    media: 'read',
    campaigns: 'read',
    settings: 'none',
    assets: 'read',
  },
  lead: {
    events: 'write',
    djs: 'write',
    team: 'write',
    financials: 'write',
    analytics: 'read',
    media: 'write',
    campaigns: 'write',
    settings: 'none',
    assets: 'write',
  },
  photographer: {
    events: 'read',
    djs: 'read',
    team: 'none',
    financials: 'none',
    analytics: 'none',
    media: 'admin',
    campaigns: 'none',
    settings: 'none',
    assets: 'read',
  },
};

// Role display names and descriptions
export const ROLE_DEFINITIONS: Record<UserRoleType, { 
  name: string; 
  description: string; 
  color: string;
}> = {
  super_admin: {
    name: 'Super Admin',
    description: 'Full system access across all venues and modules',
    color: 'bg-red-100 text-red-800',
  },
  admin: {
    name: 'Admin',
    description: 'Venue-specific management with full operational control',
    color: 'bg-purple-100 text-purple-800',
  },
  subscriber: {
    name: 'Subscriber',
    description: 'View-only access for venue owners and clients',
    color: 'bg-blue-100 text-blue-800',
  },
  support: {
    name: 'Support',
    description: 'Customer support role with limited editing capabilities',
    color: 'bg-green-100 text-green-800',
  },
  lead: {
    name: 'Team Lead',
    description: 'Team leadership with module-specific management access',
    color: 'bg-yellow-100 text-yellow-800',
  },
  photographer: {
    name: 'Photographer',
    description: 'Media-focused role for event photography and content',
    color: 'bg-pink-100 text-pink-800',
  },
};

// Permission check utilities
export const hasPermission = (
  userRole: UserRole | null,
  module: keyof UserRole['modulePermissions'],
  requiredLevel: PermissionLevel
): boolean => {
  if (!userRole || !userRole.isActive) return false;
  
  const userPermission = userRole.modulePermissions[module];
  
  // Permission hierarchy: admin > write > read > none
  const permissionLevels: Record<PermissionLevel, number> = {
    none: 0,
    read: 1,
    write: 2,
    admin: 3,
  };
  
  return permissionLevels[userPermission] >= permissionLevels[requiredLevel];
};

export const canAccessVenue = (
  userRole: UserRole | null,
  venueId: string
): boolean => {
  if (!userRole || !userRole.isActive) return false;
  
  // Super admins can access all venues
  if (userRole.role === 'super_admin') return true;
  
  // Check if user has access to this specific venue
  return userRole.venueAccess.includes(venueId);
};

export const getUserDisplayRole = (roleType: UserRoleType): string => {
  return ROLE_DEFINITIONS[roleType]?.name || roleType;
};

export const getRoleColor = (roleType: UserRoleType): string => {
  return ROLE_DEFINITIONS[roleType]?.color || 'bg-gray-100 text-gray-800';
};

// Custom claims for Firebase Auth
export interface CustomClaims {
  role: UserRoleType;
  venueAccess: string[];
  permissions: UserRole['modulePermissions'];
}