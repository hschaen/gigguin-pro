import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  startAt,
  endAt
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Venue, 
  VenueCalendarEvent, 
  VenueAvailabilityRule,
  VenuePromoterRelationship,
  VenueSearchFilters,
  VenueBookingRequest,
  VenueAnalytics
} from '@/lib/types/venue';

const VENUES_COLLECTION = 'venues';
const CALENDAR_COLLECTION = 'venue-calendar';
const AVAILABILITY_COLLECTION = 'venue-availability';
const RELATIONSHIPS_COLLECTION = 'venue-promoter-relationships';
const BOOKING_REQUESTS_COLLECTION = 'venue-booking-requests';
const ANALYTICS_COLLECTION = 'venue-analytics';

// Venue CRUD Operations

export async function createVenue(
  venueData: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // Generate slug from name
    const slug = generateSlug(venueData.name);
    
    // Check if slug exists
    const existingVenue = await getVenueBySlug(slug);
    if (existingVenue) {
      throw new Error('A venue with this name already exists');
    }
    
    const docRef = await addDoc(collection(db, VENUES_COLLECTION), {
      ...venueData,
      slug,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating venue:', error);
    throw error;
  }
}

export async function getVenueById(venueId: string): Promise<Venue | null> {
  try {
    const docRef = doc(db, VENUES_COLLECTION, venueId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Venue;
    }
    return null;
  } catch (error) {
    console.error('Error getting venue:', error);
    throw error;
  }
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  try {
    const q = query(
      collection(db, VENUES_COLLECTION),
      where('slug', '==', slug),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Venue;
    }
    return null;
  } catch (error) {
    console.error('Error getting venue by slug:', error);
    throw error;
  }
}

export async function updateVenue(
  venueId: string,
  updates: Partial<Venue>
): Promise<void> {
  try {
    const docRef = doc(db, VENUES_COLLECTION, venueId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating venue:', error);
    throw error;
  }
}

export async function deleteVenue(venueId: string): Promise<void> {
  try {
    // Soft delete
    await updateVenue(venueId, {
      isActive: false,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting venue:', error);
    throw error;
  }
}

// Venue Search & Discovery

export async function searchVenues(filters: VenueSearchFilters): Promise<Venue[]> {
  try {
    let q = query(
      collection(db, VENUES_COLLECTION),
      where('isActive', '==', true)
    );
    
    // Apply filters
    if (filters.city) {
      q = query(q, where('address.city', '==', filters.city));
    }
    
    if (filters.state) {
      q = query(q, where('address.state', '==', filters.state));
    }
    
    if (filters.type && filters.type.length > 0) {
      q = query(q, where('type', 'in', filters.type));
    }
    
    if (filters.verified !== undefined) {
      q = query(q, where('isVerified', '==', filters.verified));
    }
    
    const querySnapshot = await getDocs(q);
    const venues: Venue[] = [];
    
    querySnapshot.forEach((doc) => {
      const venue = {
        id: doc.id,
        ...doc.data()
      } as Venue;
      
      // Apply client-side filters for complex conditions
      if (filters.minCapacity && venue.capacity.total < filters.minCapacity) {
        return;
      }
      
      if (filters.maxCapacity && venue.capacity.total > filters.maxCapacity) {
        return;
      }
      
      if (filters.hasParking !== undefined && venue.amenities.parking !== filters.hasParking) {
        return;
      }
      
      if (filters.hasVIP !== undefined && venue.amenities.vipArea !== filters.hasVIP) {
        return;
      }
      
      venues.push(venue);
    });
    
    return venues;
  } catch (error) {
    console.error('Error searching venues:', error);
    throw error;
  }
}

export async function getOrganizationVenues(orgId: string): Promise<Venue[]> {
  try {
    const q = query(
      collection(db, VENUES_COLLECTION),
      where('orgId', '==', orgId),
      where('isActive', '==', true),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    const venues: Venue[] = [];
    
    querySnapshot.forEach((doc) => {
      venues.push({
        id: doc.id,
        ...doc.data()
      } as Venue);
    });
    
    return venues;
  } catch (error) {
    console.error('Error getting organization venues:', error);
    throw error;
  }
}

// Calendar Management

export async function getVenueCalendar(
  venueId: string,
  startDate: Date,
  endDate: Date
): Promise<VenueCalendarEvent[]> {
  try {
    const q = query(
      collection(db, CALENDAR_COLLECTION),
      where('venueId', '==', venueId),
      where('startDate', '>=', Timestamp.fromDate(startDate)),
      where('startDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('startDate')
    );
    
    const querySnapshot = await getDocs(q);
    const events: VenueCalendarEvent[] = [];
    
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      } as VenueCalendarEvent);
    });
    
    return events;
  } catch (error) {
    console.error('Error getting venue calendar:', error);
    throw error;
  }
}

export async function createCalendarEvent(
  eventData: Omit<VenueCalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // Check for conflicts
    const conflicts = await checkCalendarConflicts(
      eventData.venueId,
      eventData.startDate.toDate(),
      eventData.endDate.toDate(),
      undefined
    );
    
    if (conflicts.length > 0) {
      throw new Error('This time slot conflicts with existing events');
    }
    
    const docRef = await addDoc(collection(db, CALENDAR_COLLECTION), {
      ...eventData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<VenueCalendarEvent>
): Promise<void> {
  try {
    // If dates are changing, check for conflicts
    if (updates.startDate || updates.endDate) {
      const event = await getCalendarEvent(eventId);
      if (event) {
        const conflicts = await checkCalendarConflicts(
          event.venueId,
          (updates.startDate || event.startDate).toDate(),
          (updates.endDate || event.endDate).toDate(),
          eventId
        );
        
        if (conflicts.length > 0) {
          throw new Error('This time slot conflicts with existing events');
        }
      }
    }
    
    const docRef = doc(db, CALENDAR_COLLECTION, eventId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

async function getCalendarEvent(eventId: string): Promise<VenueCalendarEvent | null> {
  try {
    const docRef = doc(db, CALENDAR_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as VenueCalendarEvent;
    }
    return null;
  } catch (error) {
    console.error('Error getting calendar event:', error);
    throw error;
  }
}

export async function checkCalendarConflicts(
  venueId: string,
  startDate: Date,
  endDate: Date,
  excludeEventId?: string
): Promise<VenueCalendarEvent[]> {
  try {
    // Get all events that might overlap
    const q = query(
      collection(db, CALENDAR_COLLECTION),
      where('venueId', '==', venueId),
      where('status', '!=', 'cancelled')
    );
    
    const querySnapshot = await getDocs(q);
    const conflicts: VenueCalendarEvent[] = [];
    
    querySnapshot.forEach((doc) => {
      if (doc.id === excludeEventId) return;
      
      const event = {
        id: doc.id,
        ...doc.data()
      } as VenueCalendarEvent;
      
      const eventStart = event.startDate.toDate();
      const eventEnd = event.endDate.toDate();
      
      // Check for overlap
      if (
        (startDate >= eventStart && startDate < eventEnd) ||
        (endDate > eventStart && endDate <= eventEnd) ||
        (startDate <= eventStart && endDate >= eventEnd)
      ) {
        conflicts.push(event);
      }
    });
    
    return conflicts;
  } catch (error) {
    console.error('Error checking calendar conflicts:', error);
    throw error;
  }
}

// Availability Management

export async function getVenueAvailability(venueId: string): Promise<VenueAvailabilityRule[]> {
  try {
    const q = query(
      collection(db, AVAILABILITY_COLLECTION),
      where('venueId', '==', venueId),
      orderBy('priority', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const rules: VenueAvailabilityRule[] = [];
    
    querySnapshot.forEach((doc) => {
      rules.push({
        id: doc.id,
        ...doc.data()
      } as VenueAvailabilityRule);
    });
    
    return rules;
  } catch (error) {
    console.error('Error getting venue availability:', error);
    throw error;
  }
}

export async function createAvailabilityRule(
  ruleData: Omit<VenueAvailabilityRule, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, AVAILABILITY_COLLECTION), {
      ...ruleData,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating availability rule:', error);
    throw error;
  }
}

export async function isVenueAvailable(
  venueId: string,
  date: Date,
  eventType?: string
): Promise<boolean> {
  try {
    // Check calendar events first
    const calendarEvents = await getVenueCalendar(
      venueId,
      date,
      new Date(date.getTime() + 24 * 60 * 60 * 1000)
    );
    
    if (calendarEvents.some(e => e.status === 'confirmed')) {
      return false;
    }
    
    // Check availability rules
    const rules = await getVenueAvailability(venueId);
    let isAvailable = true; // Default to available
    
    for (const rule of rules) {
      if (doesRuleApply(rule, date, eventType)) {
        isAvailable = rule.isAvailable;
        // Don't break - higher priority rules can override
      }
    }
    
    return isAvailable;
  } catch (error) {
    console.error('Error checking venue availability:', error);
    throw error;
  }
}

function doesRuleApply(
  rule: VenueAvailabilityRule,
  date: Date,
  eventType?: string
): boolean {
  // Check event type restrictions
  if (rule.restrictions) {
    if (eventType) {
      if (rule.restrictions.allowedEventTypes && 
          !rule.restrictions.allowedEventTypes.includes(eventType)) {
        return false;
      }
      
      if (rule.restrictions.blockedEventTypes && 
          rule.restrictions.blockedEventTypes.includes(eventType)) {
        return false;
      }
    }
  }
  
  // Check date applicability
  switch (rule.type) {
    case 'recurring':
      if (!rule.recurring) return false;
      
      if (rule.recurring.frequency === 'weekly') {
        const dayOfWeek = date.getDay();
        return rule.recurring.daysOfWeek?.includes(dayOfWeek) || false;
      }
      
      if (rule.recurring.frequency === 'monthly') {
        const dayOfMonth = date.getDate();
        return rule.recurring.daysOfMonth?.includes(dayOfMonth) || false;
      }
      
      return true; // Daily
      
    case 'date_range':
      if (!rule.dateRange) return false;
      const ruleStart = rule.dateRange.startDate.toDate();
      const ruleEnd = rule.dateRange.endDate.toDate();
      return date >= ruleStart && date <= ruleEnd;
      
    case 'specific_dates':
      if (!rule.specificDates) return false;
      return rule.specificDates.some(d => {
        const ruleDate = d.toDate();
        return ruleDate.toDateString() === date.toDateString();
      });
      
    default:
      return false;
  }
}

// Promoter Relationships

export async function getVenuePromoterRelationships(
  venueId: string
): Promise<VenuePromoterRelationship[]> {
  try {
    const q = query(
      collection(db, RELATIONSHIPS_COLLECTION),
      where('venueId', '==', venueId),
      where('status', '==', 'active'),
      orderBy('type')
    );
    
    const querySnapshot = await getDocs(q);
    const relationships: VenuePromoterRelationship[] = [];
    
    querySnapshot.forEach((doc) => {
      relationships.push({
        id: doc.id,
        ...doc.data()
      } as VenuePromoterRelationship);
    });
    
    return relationships;
  } catch (error) {
    console.error('Error getting venue-promoter relationships:', error);
    throw error;
  }
}

export async function createPromoterRelationship(
  relationshipData: Omit<VenuePromoterRelationship, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // Check if relationship already exists
    const existing = await getPromoterRelationship(
      relationshipData.venueId,
      relationshipData.promoterId
    );
    
    if (existing) {
      throw new Error('Relationship already exists');
    }
    
    const docRef = await addDoc(collection(db, RELATIONSHIPS_COLLECTION), {
      ...relationshipData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating promoter relationship:', error);
    throw error;
  }
}

async function getPromoterRelationship(
  venueId: string,
  promoterId: string
): Promise<VenuePromoterRelationship | null> {
  try {
    const q = query(
      collection(db, RELATIONSHIPS_COLLECTION),
      where('venueId', '==', venueId),
      where('promoterId', '==', promoterId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as VenuePromoterRelationship;
    }
    return null;
  } catch (error) {
    console.error('Error getting promoter relationship:', error);
    throw error;
  }
}

// Booking Requests

export async function createBookingRequest(
  requestData: Omit<VenueBookingRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BOOKING_REQUESTS_COLLECTION), {
      ...requestData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // TODO: Send notification to venue
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking request:', error);
    throw error;
  }
}

export async function getVenueBookingRequests(
  venueId: string,
  status?: string
): Promise<VenueBookingRequest[]> {
  try {
    let q = query(
      collection(db, BOOKING_REQUESTS_COLLECTION),
      where('venueId', '==', venueId),
      orderBy('createdAt', 'desc')
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const requests: VenueBookingRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      } as VenueBookingRequest);
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting booking requests:', error);
    throw error;
  }
}

export async function respondToBookingRequest(
  requestId: string,
  response: NonNullable<VenueBookingRequest['venueResponse']>
): Promise<void> {
  try {
    const docRef = doc(db, BOOKING_REQUESTS_COLLECTION, requestId);
    
    await updateDoc(docRef, {
      venueResponse: response,
      status: response.decision === 'approved' ? 'approved' : 
              response.decision === 'rejected' ? 'rejected' : 'negotiating',
      updatedAt: Timestamp.now()
    });
    
    // If approved, create calendar event
    if (response.decision === 'approved') {
      const requestDoc = await getDoc(docRef);
      if (requestDoc.exists()) {
        const request = requestDoc.data() as VenueBookingRequest;
        
        await createCalendarEvent({
          venueId: request.venueId,
          title: request.eventName,
          type: 'confirmed',
          status: 'tentative',
          startDate: request.proposedDate,
          endDate: request.proposedDate, // TODO: Calculate actual end time
          organizerId: request.promoterId,
          organizerName: request.eventName,
          createdBy: response.respondedBy
        });
      }
    }
    
    // TODO: Send notification to promoter
  } catch (error) {
    console.error('Error responding to booking request:', error);
    throw error;
  }
}

// Analytics

export async function getVenueAnalytics(
  venueId: string,
  startDate: Date,
  endDate: Date
): Promise<VenueAnalytics[]> {
  try {
    const q = query(
      collection(db, ANALYTICS_COLLECTION),
      where('venueId', '==', venueId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const analytics: VenueAnalytics[] = [];
    
    querySnapshot.forEach((doc) => {
      analytics.push({
        ...doc.data()
      } as VenueAnalytics);
    });
    
    return analytics;
  } catch (error) {
    console.error('Error getting venue analytics:', error);
    throw error;
  }
}

// Helper Functions

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}