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
  Timestamp,
  onSnapshot,
  Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import QRCode from 'qrcode';

export interface RSVPData {
  id?: string;
  eventInstanceId: string;
  assigneeType: 'dj' | 'team_member';
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  
  // Guest information
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  instagram?: string;
  partySize: number;
  plusOneName?: string;
  
  // QR code data
  qrCodeData: string; // Format: {eventInstanceId}-{rsvpId}
  qrCodeUrl?: string; // Base64 encoded QR code image
  
  // Check-in tracking
  checkedIn: boolean;
  checkedInAt?: Timestamp;
  checkedInBy?: string;
  
  // Unique RSVP link
  rsvpToken: string;
  
  // Metadata
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection reference
const RSVP_COLLECTION = "guest-rsvps";

// Generate unique RSVP token
export function generateRSVPToken(): string {
  return `rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Generate QR code data
export function generateQRCodeData(eventInstanceId: string, rsvpId: string): string {
  return `${eventInstanceId}-${rsvpId}`;
}

// Parse QR code data
export function parseQRCodeData(qrData: string): { eventInstanceId: string; rsvpId: string } | null {
  const parts = qrData.split('-');
  if (parts.length !== 2) return null;
  
  return {
    eventInstanceId: parts[0],
    rsvpId: parts[1]
  };
}

// Generate QR code image as base64
export async function generateQRCodeImage(qrData: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

// Create a new RSVP
export async function createRSVP(rsvpData: Omit<RSVPData, 'id' | 'qrCodeData' | 'qrCodeUrl' | 'rsvpToken' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const rsvpToken = generateRSVPToken();
    
    // Create initial RSVP document
    const docRef = await addDoc(collection(db, RSVP_COLLECTION), {
      ...rsvpData,
      rsvpToken,
      checkedIn: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      qrCodeData: '', // Will be updated after we get the ID
      qrCodeUrl: ''
    });
    
    // Generate QR code data using the document ID
    const qrCodeData = generateQRCodeData(rsvpData.eventInstanceId, docRef.id);
    const qrCodeUrl = await generateQRCodeImage(qrCodeData);
    
    // Update the document with QR code data
    await updateDoc(docRef, {
      qrCodeData,
      qrCodeUrl,
      updatedAt: Timestamp.now()
    });
    
    console.log("RSVP created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating RSVP: ", error);
    throw new Error("Failed to create RSVP");
  }
}

// Get RSVP by ID
export async function getRSVPById(rsvpId: string): Promise<RSVPData | null> {
  try {
    const docRef = doc(db, RSVP_COLLECTION, rsvpId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as RSVPData;
    } else {
      console.log("No RSVP found with ID: ", rsvpId);
      return null;
    }
  } catch (error) {
    console.error("Error getting RSVP: ", error);
    throw new Error("Failed to get RSVP");
  }
}

// Get RSVP by QR code data
export async function getRSVPByQRCode(qrCodeData: string): Promise<RSVPData | null> {
  try {
    const q = query(
      collection(db, RSVP_COLLECTION),
      where("qrCodeData", "==", qrCodeData)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as RSVPData;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting RSVP by QR code: ", error);
    throw new Error("Failed to get RSVP by QR code");
  }
}

// Get RSVP by token
export async function getRSVPByToken(token: string): Promise<RSVPData | null> {
  try {
    const q = query(
      collection(db, RSVP_COLLECTION),
      where("rsvpToken", "==", token)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as RSVPData;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting RSVP by token: ", error);
    throw new Error("Failed to get RSVP by token");
  }
}

// Get all RSVPs for an event instance
export async function getRSVPsByEventInstance(eventInstanceId: string): Promise<RSVPData[]> {
  try {
    const q = query(
      collection(db, RSVP_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const rsvps: RSVPData[] = [];
    
    querySnapshot.forEach((doc) => {
      rsvps.push({
        id: doc.id,
        ...doc.data()
      } as RSVPData);
    });
    
    return rsvps;
  } catch (error) {
    console.error("Error getting RSVPs by event instance: ", error);
    throw new Error("Failed to get RSVPs by event instance");
  }
}

// Get RSVPs for a specific assignee
export async function getRSVPsByAssignee(eventInstanceId: string, assigneeEmail: string): Promise<RSVPData[]> {
  try {
    const q = query(
      collection(db, RSVP_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId),
      where("assigneeEmail", "==", assigneeEmail),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const rsvps: RSVPData[] = [];
    
    querySnapshot.forEach((doc) => {
      rsvps.push({
        id: doc.id,
        ...doc.data()
      } as RSVPData);
    });
    
    return rsvps;
  } catch (error) {
    console.error("Error getting RSVPs by assignee: ", error);
    throw new Error("Failed to get RSVPs by assignee");
  }
}

// Update RSVP
export async function updateRSVP(rsvpId: string, updatedData: Partial<RSVPData>): Promise<void> {
  try {
    const docRef = doc(db, RSVP_COLLECTION, rsvpId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("RSVP updated successfully");
  } catch (error) {
    console.error("Error updating RSVP: ", error);
    throw new Error("Failed to update RSVP");
  }
}

// Check in/out RSVP
export async function checkInRSVP(rsvpId: string, checkedInBy: string, checkedIn: boolean = true): Promise<void> {
  try {
    const updateData: Partial<RSVPData> = {
      checkedIn,
      checkedInBy,
      updatedAt: Timestamp.now()
    };
    
    if (checkedIn) {
      updateData.checkedInAt = Timestamp.now();
    } else {
      updateData.checkedInAt = undefined;
    }
    
    await updateRSVP(rsvpId, updateData);
    console.log(`RSVP ${checkedIn ? 'checked in' : 'checked out'} successfully`);
  } catch (error) {
    console.error(`Error ${checkedIn ? 'checking in' : 'checking out'} RSVP: `, error);
    throw new Error(`Failed to ${checkedIn ? 'check in' : 'check out'} RSVP`);
  }
}

// Delete RSVP
export async function deleteRSVP(rsvpId: string): Promise<void> {
  try {
    const docRef = doc(db, RSVP_COLLECTION, rsvpId);
    await deleteDoc(docRef);
    
    console.log("RSVP deleted successfully");
  } catch (error) {
    console.error("Error deleting RSVP: ", error);
    throw new Error("Failed to delete RSVP");
  }
}

// Generate RSVP link for assignee with proper route format
export async function generateRSVPLink(
  eventInstanceId: string,
  assigneeType: 'dj' | 'team_member',
  assigneeId: string,
  assigneeName: string,
  assigneeEmail: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
): Promise<string> {
  try {
    // Import the guest list management function
    const { createOrUpdateGuestList } = await import('./guest-list-firestore');
    
    // Generate a unique RSVP token
    const rsvpToken = `rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create or update guest list entry to ensure assignee can receive RSVPs
    await createOrUpdateGuestList(
      eventInstanceId,
      assigneeId,
      assigneeType,
      {
        eventName: '', // Will be filled by the function if missing
        eventDate: '', // Will be filled by the function if missing
        venue: '', // Will be filled by the function if missing
        assigneeName,
        assigneeEmail,
        guestListLink: '', // Can be filled later with actual guest list
        rsvpToken, // Store the token for validation
        isActive: true
      }
    );
    
    // Generate RSVP link with proper route format: /rsvp/[instanceId]/[assigneeId]/[token]
    const rsvpLink = `${baseUrl}/rsvp/${eventInstanceId}/${assigneeId}/${rsvpToken}`;
    
    return rsvpLink;
  } catch (error) {
    console.error("Error generating RSVP link: ", error);
    throw new Error("Failed to generate RSVP link");
  }
}

// Subscribe to RSVPs for an event instance (real-time updates)
export function subscribeToEventRSVPs(
  eventInstanceId: string,
  callback: (rsvps: RSVPData[]) => void
): Unsubscribe {
  const q = query(
    collection(db, RSVP_COLLECTION),
    where("eventInstanceId", "==", eventInstanceId),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const rsvps: RSVPData[] = [];
    querySnapshot.forEach((doc) => {
      rsvps.push({
        id: doc.id,
        ...doc.data()
      } as RSVPData);
    });
    callback(rsvps);
  });
}

// Get RSVP statistics for an event instance
export function calculateRSVPStats(rsvps: RSVPData[]): {
  totalRSVPs: number;
  checkedIn: number;
  notCheckedIn: number;
  totalGuests: number;
  assigneeStats: { [assigneeName: string]: { total: number; checkedIn: number; guests: number } };
} {
  const stats = {
    totalRSVPs: rsvps.length,
    checkedIn: 0,
    notCheckedIn: 0,
    totalGuests: 0,
    assigneeStats: {} as { [assigneeName: string]: { total: number; checkedIn: number; guests: number } }
  };
  
  rsvps.forEach(rsvp => {
    if (rsvp.checkedIn) {
      stats.checkedIn++;
    } else {
      stats.notCheckedIn++;
    }
    
    stats.totalGuests += rsvp.partySize;
    
    if (!stats.assigneeStats[rsvp.assigneeName]) {
      stats.assigneeStats[rsvp.assigneeName] = { total: 0, checkedIn: 0, guests: 0 };
    }
    
    stats.assigneeStats[rsvp.assigneeName].total++;
    stats.assigneeStats[rsvp.assigneeName].guests += rsvp.partySize;
    
    if (rsvp.checkedIn) {
      stats.assigneeStats[rsvp.assigneeName].checkedIn++;
    }
  });
  
  return stats;
}

// Validate QR code format
export function isValidQRCodeFormat(qrData: string): boolean {
  const parts = qrData.split('-');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

// Update guest list link for DJ or team member
export async function updateGuestListLink(
  eventInstanceId: string,
  assigneeEmail: string,
  assigneeType: 'dj' | 'team_member'
): Promise<string> {
  try {
    // Import the appropriate function based on assignee type
    if (assigneeType === 'dj') {
      const { updateDJGuestListLinks } = await import('./event-instances-firestore');
      const rsvpLink = await generateRSVPLink(eventInstanceId, assigneeType, assigneeEmail, '', assigneeEmail);
      await updateDJGuestListLinks(eventInstanceId, { [assigneeEmail]: rsvpLink });
      return rsvpLink;
    } else {
      // For team members, we'd need a similar function in the team member management
      // For now, just return the generated link
      return await generateRSVPLink(eventInstanceId, assigneeType, assigneeEmail, '', assigneeEmail);
    }
  } catch (error) {
    console.error("Error updating guest list link: ", error);
    throw new Error("Failed to update guest list link");
  }
}