import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";

export interface EventData {
  id?: string;
  name: string;
  venue: string;
  venueId?: string; // Reference to venue for multi-venue support
  description?: string;
  recurringDay?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  defaultStartTime: string;
  defaultEndTime?: string;
  defaultPayment: string;
  budget?: number; // Total budget for the event
  logoUrl?: string;
  assets?: {
    name: string;
    url: string;
    type: string;
  }[];
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection reference
const EVENTS_COLLECTION = "events";

// Create a new event
export async function createEvent(eventData: Omit<EventData, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("Event created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating event: ", error);
    throw new Error("Failed to create event");
  }
}

// Get all events
export async function getAllEvents(): Promise<EventData[]> {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION), 
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const events: EventData[] = [];
    
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      } as EventData);
    });
    
    return events;
  } catch (error) {
    console.error("Error getting events: ", error);
    throw new Error("Failed to get events");
  }
}

// Get active events only
export async function getActiveEvents(): Promise<EventData[]> {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where("isActive", "==", true),
      orderBy("name", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const events: EventData[] = [];
    
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      } as EventData);
    });
    
    return events;
  } catch (error) {
    console.error("Error getting active events: ", error);
    throw new Error("Failed to get active events");
  }
}

// Get a specific event by ID
export async function getEventById(eventId: string): Promise<EventData | null> {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EventData;
    } else {
      console.log("No event found with ID: ", eventId);
      return null;
    }
  } catch (error) {
    console.error("Error getting event: ", error);
    throw new Error("Failed to get event");
  }
}

// Update an event
export async function updateEvent(eventId: string, updatedData: Partial<EventData>) {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("Event updated successfully");
  } catch (error) {
    console.error("Error updating event: ", error);
    throw new Error("Failed to update event");
  }
}

// Delete an event
export async function deleteEvent(eventId: string) {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(docRef);
    
    console.log("Event deleted successfully");
  } catch (error) {
    console.error("Error deleting event: ", error);
    throw new Error("Failed to delete event");
  }
}

// Get events by recurring day
export async function getEventsByRecurringDay(day: string): Promise<EventData[]> {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where("recurringDay", "==", day),
      where("isActive", "==", true),
      orderBy("defaultStartTime", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const events: EventData[] = [];
    
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      } as EventData);
    });
    
    return events;
  } catch (error) {
    console.error("Error getting events by recurring day: ", error);
    throw new Error("Failed to get events by recurring day");
  }
}