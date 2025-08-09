import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserRole, UserProfile, UserRoleType, DEFAULT_ROLE_PERMISSIONS } from './user-roles';

// Re-export types for convenience
export type { UserProfile, UserRole, UserRoleType };

// Collection references
const USERS_COLLECTION = 'users';
const USER_ROLES_COLLECTION = 'user_roles';

// User Profile CRUD Operations
export const createUserProfile = async (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, USERS_COLLECTION), {
      ...profileData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, profileId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserProfile[];
  } catch (error) {
    console.error('Error getting all user profiles:', error);
    throw error;
  }
};

// User Role CRUD Operations
export const createUserRole = async (roleData: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, USER_ROLES_COLLECTION), {
      ...roleData,
      modulePermissions: roleData.modulePermissions || DEFAULT_ROLE_PERMISSIONS[roleData.role],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user role:', error);
    throw error;
  }
};

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const q = query(
      collection(db, USER_ROLES_COLLECTION), 
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as UserRole;
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
};

export const updateUserRole = async (roleId: string, updates: Partial<UserRole>): Promise<void> => {
  try {
    const docRef = doc(db, USER_ROLES_COLLECTION, roleId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const deleteUserRole = async (roleId: string): Promise<void> => {
  try {
    // Soft delete by setting isActive to false
    await updateUserRole(roleId, { isActive: false });
  } catch (error) {
    console.error('Error deleting user role:', error);
    throw error;
  }
};

export const getUsersByRole = async (role: UserRoleType): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION), 
      where('role', '==', role),
      where('isActive', '==', true),
      orderBy('displayName')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserProfile[];
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

export const getUsersByVenue = async (venueId: string): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION), 
      where('venueAccess', 'array-contains', venueId),
      where('isActive', '==', true),
      orderBy('displayName')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserProfile[];
  } catch (error) {
    console.error('Error getting users by venue:', error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToUserRole = (
  userId: string, 
  callback: (role: UserRole | null) => void
): (() => void) => {
  const q = query(
    collection(db, USER_ROLES_COLLECTION), 
    where('userId', '==', userId),
    where('isActive', '==', true),
    limit(1)
  );
  
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
    } else {
      const doc = snapshot.docs[0];
      callback({
        id: doc.id,
        ...doc.data()
      } as UserRole);
    }
  });
};

// Utility functions
export const assignUserToVenue = async (userId: string, venueId: string): Promise<void> => {
  try {
    const userRole = await getUserRole(userId);
    if (!userRole) {
      throw new Error('User role not found');
    }
    
    const updatedVenueAccess = [...new Set([...userRole.venueAccess, venueId])];
    await updateUserRole(userRole.id!, { venueAccess: updatedVenueAccess });
  } catch (error) {
    console.error('Error assigning user to venue:', error);
    throw error;
  }
};

export const removeUserFromVenue = async (userId: string, venueId: string): Promise<void> => {
  try {
    const userRole = await getUserRole(userId);
    if (!userRole) {
      throw new Error('User role not found');
    }
    
    const updatedVenueAccess = userRole.venueAccess.filter(id => id !== venueId);
    await updateUserRole(userRole.id!, { venueAccess: updatedVenueAccess });
  } catch (error) {
    console.error('Error removing user from venue:', error);
    throw error;
  }
};

export const changeUserRole = async (
  userId: string, 
  newRole: UserRoleType, 
  updatedBy: string
): Promise<void> => {
  try {
    const userRole = await getUserRole(userId);
    if (!userRole) {
      throw new Error('User role not found');
    }
    
    // Update role and reset permissions to defaults for new role
    await updateUserRole(userRole.id!, {
      role: newRole,
      modulePermissions: DEFAULT_ROLE_PERMISSIONS[newRole],
      createdBy: updatedBy,
    });
    
    // Also update the user profile
    const userProfile = await getUserProfile(userId);
    if (userProfile) {
      await updateUserProfile(userProfile.id!, { role: newRole });
    }
  } catch (error) {
    console.error('Error changing user role:', error);
    throw error;
  }
};

// Initialize default user for existing system
export const initializeDefaultUser = async (uid: string, email: string, displayName: string): Promise<void> => {
  try {
    // Check if user already exists
    const existingProfile = await getUserProfile(uid);
    if (existingProfile) {
      return; // User already initialized
    }
    
    // Create default user profile
    const profileId = await createUserProfile({
      uid,
      email,
      displayName,
      role: 'super_admin', // First user gets super admin by default
      venueAccess: [], // Will be populated when venues are created
      preferences: {
        timezone: 'America/New_York', // Default timezone
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        notifications: {
          email: true,
          inApp: true,
          sms: false,
        },
      },
      isActive: true,
    });
    
    // Create corresponding user role
    await createUserRole({
      userId: uid,
      role: 'super_admin',
      venueAccess: [], // Will be updated when venues are created
      modulePermissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
      isActive: true,
      createdBy: uid, // Self-created
    });
    
    console.log('Default user initialized:', profileId);
  } catch (error) {
    console.error('Error initializing default user:', error);
    throw error;
  }
};