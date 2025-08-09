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

export interface GuestListEntry {
  id?: string;
  eventInstanceId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  
  // Who this guest list belongs to
  assigneeType: 'dj' | 'team_member';
  assigneeId: string; // DJ ID or Team Member ID
  assigneeName: string;
  assigneeEmail: string;
  assigneeRole?: string; // For team members
  
  // Guest list link (manually entered by user)
  guestListLink: string;
  
  // RSVP token for form access
  rsvpToken?: string;
  
  // Guest list metadata
  maxGuests?: number;
  description?: string;
  notes?: string;
  
  // Status and tracking
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CheckInRecord {
  id?: string;
  guestListId: string;
  eventInstanceId: string;
  
  // Guest information
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  
  // Check-in details
  checkedInAt: Timestamp;
  checkedInBy: string; // Host/staff member who checked them in
  
  // Additional info
  partySize: number;
  notes?: string;
  
  createdAt?: Timestamp;
}

// Collection references
const GUEST_LISTS_COLLECTION = "guest-lists";
const CHECK_INS_COLLECTION = "check-ins";

// Guest List Management Functions

// Create a new guest list
export async function createGuestList(guestListData: Omit<GuestListEntry, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Filter out undefined values to avoid Firestore errors
    const cleanData = Object.entries(guestListData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof typeof guestListData] = value;
      }
      return acc;
    }, {} as any);
    
    const docRef = await addDoc(collection(db, GUEST_LISTS_COLLECTION), {
      ...cleanData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("Guest list created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating guest list: ", error);
    throw new Error("Failed to create guest list");
  }
}

// Get all guest lists for an event instance
export async function getGuestListsByEventInstanceId(eventInstanceId: string): Promise<GuestListEntry[]> {
  try {
    const q = query(
      collection(db, GUEST_LISTS_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId),
      orderBy("assigneeName", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const guestLists: GuestListEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      guestLists.push({
        id: doc.id,
        ...doc.data()
      } as GuestListEntry);
    });
    
    return guestLists;
  } catch (error) {
    console.error("Error getting guest lists by event instance ID: ", error);
    throw new Error("Failed to get guest lists by event instance ID");
  }
}

// Get guest list by assignee (DJ or team member) for specific event instance
export async function getGuestListByAssignee(eventInstanceId: string, assigneeId: string, assigneeType: 'dj' | 'team_member'): Promise<GuestListEntry | null> {
  try {
    const q = query(
      collection(db, GUEST_LISTS_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId),
      where("assigneeId", "==", assigneeId),
      where("assigneeType", "==", assigneeType)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as GuestListEntry;
  } catch (error) {
    console.error("Error getting guest list by assignee: ", error);
    throw new Error("Failed to get guest list by assignee");
  }
}

// Update a guest list
export async function updateGuestList(guestListId: string, updatedData: Partial<GuestListEntry>) {
  try {
    // Filter out undefined values to avoid Firestore errors
    const cleanData = Object.entries(updatedData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof typeof updatedData] = value;
      }
      return acc;
    }, {} as any);
    
    const docRef = doc(db, GUEST_LISTS_COLLECTION, guestListId);
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: Timestamp.now()
    });
    
    console.log("Guest list updated successfully");
  } catch (error) {
    console.error("Error updating guest list: ", error);
    throw new Error("Failed to update guest list");
  }
}

// Delete a guest list
export async function deleteGuestList(guestListId: string) {
  try {
    const docRef = doc(db, GUEST_LISTS_COLLECTION, guestListId);
    await deleteDoc(docRef);
    
    console.log("Guest list deleted successfully");
  } catch (error) {
    console.error("Error deleting guest list: ", error);
    throw new Error("Failed to delete guest list");
  }
}

// Create or update guest list for an assignee
export async function createOrUpdateGuestList(
  eventInstanceId: string,
  assigneeId: string,
  assigneeType: 'dj' | 'team_member',
  guestListData: Partial<GuestListEntry>
) {
  try {
    const existingGuestList = await getGuestListByAssignee(eventInstanceId, assigneeId, assigneeType);
    
    if (existingGuestList) {
      // Update existing guest list
      await updateGuestList(existingGuestList.id!, guestListData);
      return existingGuestList.id!;
    } else {
      // Create new guest list
      const { eventInstanceId: _, assigneeId: __, assigneeType: ___, isActive: ____, ...restGuestListData } = guestListData;
      const newGuestListData: Omit<GuestListEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        eventInstanceId,
        assigneeId,
        assigneeType,
        isActive: true,
        eventName: guestListData.eventName || '',
        eventDate: guestListData.eventDate || '',
        venue: guestListData.venue || '',
        assigneeName: guestListData.assigneeName || '',
        assigneeEmail: guestListData.assigneeEmail || '',
        assigneeRole: guestListData.assigneeRole,
        guestListLink: guestListData.guestListLink || '',
        maxGuests: guestListData.maxGuests,
        description: guestListData.description,
        notes: guestListData.notes
      };
      
      return await createGuestList(newGuestListData);
    }
  } catch (error) {
    console.error("Error creating or updating guest list: ", error);
    throw new Error("Failed to create or update guest list");
  }
}

// Check-in Functions (for use by host check-in app)

// Record a guest check-in
export async function recordGuestCheckIn(checkInData: Omit<CheckInRecord, 'id' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, CHECK_INS_COLLECTION), {
      ...checkInData,
      createdAt: Timestamp.now()
    });
    
    console.log("Guest check-in recorded with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error recording guest check-in: ", error);
    throw new Error("Failed to record guest check-in");
  }
}

// Get all check-ins for an event instance
export async function getCheckInsByEventInstanceId(eventInstanceId: string): Promise<CheckInRecord[]> {
  try {
    const q = query(
      collection(db, CHECK_INS_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId),
      orderBy("checkedInAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const checkIns: CheckInRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      checkIns.push({
        id: doc.id,
        ...doc.data()
      } as CheckInRecord);
    });
    
    return checkIns;
  } catch (error) {
    console.error("Error getting check-ins by event instance ID: ", error);
    throw new Error("Failed to get check-ins by event instance ID");
  }
}

// Get check-ins for a specific guest list
export async function getCheckInsByGuestListId(guestListId: string): Promise<CheckInRecord[]> {
  try {
    const q = query(
      collection(db, CHECK_INS_COLLECTION),
      where("guestListId", "==", guestListId),
      orderBy("checkedInAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const checkIns: CheckInRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      checkIns.push({
        id: doc.id,
        ...doc.data()
      } as CheckInRecord);
    });
    
    return checkIns;
  } catch (error) {
    console.error("Error getting check-ins by guest list ID: ", error);
    throw new Error("Failed to get check-ins by guest list ID");
  }
}

// Get summary statistics for an event instance
export async function getEventCheckInSummary(eventInstanceId: string) {
  try {
    const [guestLists, checkIns] = await Promise.all([
      getGuestListsByEventInstanceId(eventInstanceId),
      getCheckInsByEventInstanceId(eventInstanceId)
    ]);
    
    const djGuestLists = guestLists.filter(gl => gl.assigneeType === 'dj');
    const teamGuestLists = guestLists.filter(gl => gl.assigneeType === 'team_member');
    
    const totalGuests = checkIns.reduce((sum, checkIn) => sum + checkIn.partySize, 0);
    
    return {
      totalGuestLists: guestLists.length,
      djGuestLists: djGuestLists.length,
      teamGuestLists: teamGuestLists.length,
      totalCheckIns: checkIns.length,
      totalGuests,
      checkInsByAssignee: guestLists.map(gl => ({
        assigneeName: gl.assigneeName,
        assigneeType: gl.assigneeType,
        assigneeRole: gl.assigneeRole,
        guestListLink: gl.guestListLink,
        checkInCount: checkIns.filter(ci => ci.guestListId === gl.id).length,
        totalGuests: checkIns
          .filter(ci => ci.guestListId === gl.id)
          .reduce((sum, ci) => sum + ci.partySize, 0)
      }))
    };
  } catch (error) {
    console.error("Error getting event check-in summary: ", error);
    throw new Error("Failed to get event check-in summary");
  }
}