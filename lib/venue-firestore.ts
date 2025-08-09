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

// Venue contact information
export interface VenueContact {
  id?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

// Venue technical specifications
export interface TechnicalSpecs {
  soundSystem: string;
  lightingRig: string;
  stageSize: string;
  powerRequirements: string;
  loadInDetails: string;
  parkingInfo: string;
  accessibilityInfo: string;
}

// Venue restrictions and regulations
export interface VenueRestrictions {
  curfew?: string;
  noiseOrdnance?: string;
  alcoholLicense?: boolean;
  smokingPolicy: string;
  ageRestrictions: string;
  dressCode?: string;
  specialRequirements?: string[];
}

// Venue settings and preferences
export interface VenueSettings {
  timezone: string;
  currency: string;
  defaultDJPayment: number;
  defaultStartTime: string;
  emailTemplates: {
    djConfirmation: string;
    eventReminder: string;
    cancellation: string;
  };
  notifications: {
    bookingAlerts: boolean;
    reminderTiming: number; // hours before event
    financialAlerts: boolean;
  };
  branding: {
    primaryColor: string;
    logoUrl?: string;
    websiteUrl?: string;
  };
}

// Main venue data interface
export interface VenueData {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
  
  // Venue details
  capacity: number;
  venueType: 'club' | 'festival' | 'outdoor' | 'theater' | 'bar' | 'restaurant' | 'private' | 'other';
  description?: string;
  website?: string;
  
  // Technical and operational info
  technicalSpecs: TechnicalSpecs;
  contacts: VenueContact[];
  restrictions: VenueRestrictions;
  settings: VenueSettings;
  
  // Metadata
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  
  // Optional fields for future use
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images?: string[];
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

// Collection reference
const VENUES_COLLECTION = 'venues';

// CRUD Operations
export const createVenue = async (venueData: Omit<VenueData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, VENUES_COLLECTION), {
      ...venueData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating venue:', error);
    throw error;
  }
};

export const getVenueById = async (venueId: string): Promise<VenueData | null> => {
  try {
    const docRef = doc(db, VENUES_COLLECTION, venueId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as VenueData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting venue:', error);
    throw error;
  }
};

export const getAllVenues = async (): Promise<VenueData[]> => {
  try {
    const q = query(collection(db, VENUES_COLLECTION), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VenueData[];
  } catch (error) {
    console.error('Error getting all venues:', error);
    throw error;
  }
};

export const getActiveVenues = async (): Promise<VenueData[]> => {
  try {
    const q = query(
      collection(db, VENUES_COLLECTION), 
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VenueData[];
  } catch (error) {
    console.error('Error getting active venues:', error);
    throw error;
  }
};

export const getVenuesByCity = async (city: string): Promise<VenueData[]> => {
  try {
    const q = query(
      collection(db, VENUES_COLLECTION), 
      where('city', '==', city),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VenueData[];
  } catch (error) {
    console.error('Error getting venues by city:', error);
    throw error;
  }
};

export const getVenuesByType = async (venueType: VenueData['venueType']): Promise<VenueData[]> => {
  try {
    const q = query(
      collection(db, VENUES_COLLECTION), 
      where('venueType', '==', venueType),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VenueData[];
  } catch (error) {
    console.error('Error getting venues by type:', error);
    throw error;
  }
};

export const updateVenue = async (venueId: string, updates: Partial<VenueData>): Promise<void> => {
  try {
    const docRef = doc(db, VENUES_COLLECTION, venueId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating venue:', error);
    throw error;
  }
};

export const deleteVenue = async (venueId: string): Promise<void> => {
  try {
    // Soft delete by setting isActive to false
    await updateVenue(venueId, { isActive: false });
  } catch (error) {
    console.error('Error deleting venue:', error);
    throw error;
  }
};

export const searchVenues = async (searchTerm: string): Promise<VenueData[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation that searches by name
    // For production, consider using Algolia or similar service
    const venues = await getAllVenues();
    
    return venues.filter(venue => 
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching venues:', error);
    throw error;
  }
};

// Real-time listener
export const subscribeToVenues = (callback: (venues: VenueData[]) => void): (() => void) => {
  const q = query(
    collection(db, VENUES_COLLECTION), 
    where('isActive', '==', true),
    orderBy('name', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const venues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VenueData[];
    callback(venues);
  });
};

// Utility functions
export const addVenueContact = async (venueId: string, contact: Omit<VenueContact, 'id'>): Promise<void> => {
  try {
    const venue = await getVenueById(venueId);
    if (!venue) throw new Error('Venue not found');
    
    const newContact: VenueContact = {
      id: `contact_${Date.now()}`,
      ...contact
    };
    
    const updatedContacts = [...venue.contacts, newContact];
    await updateVenue(venueId, { contacts: updatedContacts });
  } catch (error) {
    console.error('Error adding venue contact:', error);
    throw error;
  }
};

export const updateVenueContact = async (
  venueId: string, 
  contactId: string, 
  updates: Partial<VenueContact>
): Promise<void> => {
  try {
    const venue = await getVenueById(venueId);
    if (!venue) throw new Error('Venue not found');
    
    const updatedContacts = venue.contacts.map(contact => 
      contact.id === contactId ? { ...contact, ...updates } : contact
    );
    
    await updateVenue(venueId, { contacts: updatedContacts });
  } catch (error) {
    console.error('Error updating venue contact:', error);
    throw error;
  }
};

export const removeVenueContact = async (venueId: string, contactId: string): Promise<void> => {
  try {
    const venue = await getVenueById(venueId);
    if (!venue) throw new Error('Venue not found');
    
    const updatedContacts = venue.contacts.filter(contact => contact.id !== contactId);
    await updateVenue(venueId, { contacts: updatedContacts });
  } catch (error) {
    console.error('Error removing venue contact:', error);
    throw error;
  }
};

// Default venue settings
export const createDefaultVenueSettings = (timezone: string = 'America/New_York'): VenueSettings => ({
  timezone,
  currency: 'USD',
  defaultDJPayment: 150,
  defaultStartTime: '21:00',
  emailTemplates: {
    djConfirmation: 'default_dj_confirmation',
    eventReminder: 'default_event_reminder',
    cancellation: 'default_cancellation',
  },
  notifications: {
    bookingAlerts: true,
    reminderTiming: 24, // 24 hours before event
    financialAlerts: true,
  },
  branding: {
    primaryColor: '#3B82F6', // Blue-500
    logoUrl: '',
    websiteUrl: '',
  },
});

// Default technical specs
export const createDefaultTechnicalSpecs = (): TechnicalSpecs => ({
  soundSystem: 'To be specified',
  lightingRig: 'Basic lighting available',
  stageSize: 'To be measured',
  powerRequirements: 'Standard 110V available',
  loadInDetails: 'Contact venue for load-in information',
  parkingInfo: 'Parking available',
  accessibilityInfo: 'Please contact venue for accessibility details',
});

// Default restrictions
export const createDefaultRestrictions = (): VenueRestrictions => ({
  curfew: 'No specific curfew',
  noiseOrdnance: 'Standard city noise ordinances apply',
  alcoholLicense: true,
  smokingPolicy: 'No smoking indoors',
  ageRestrictions: '21+',
  dressCode: 'Smart casual',
  specialRequirements: [],
});

// Validate venue data
export const validateVenueData = (venueData: Partial<VenueData>): string[] => {
  const errors: string[] = [];
  
  if (!venueData.name?.trim()) {
    errors.push('Venue name is required');
  }
  
  if (!venueData.address?.trim()) {
    errors.push('Address is required');
  }
  
  if (!venueData.city?.trim()) {
    errors.push('City is required');
  }
  
  if (!venueData.timezone?.trim()) {
    errors.push('Timezone is required');
  }
  
  if (!venueData.capacity || venueData.capacity <= 0) {
    errors.push('Capacity must be greater than 0');
  }
  
  if (!venueData.venueType) {
    errors.push('Venue type is required');
  }
  
  return errors;
};