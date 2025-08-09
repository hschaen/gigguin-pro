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

export interface TeamMemberData {
  id?: string;
  eventId: string;
  eventInstanceId?: string; // Optional - link to specific instance
  name: string;
  role: 'photographer' | 'videographer' | 'security' | 'manager' | 'assistant' | 'promoter' | 'technician' | 'other';
  email?: string;
  phone?: string;
  paymentAmount: number;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  paidAt?: Timestamp;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection reference
const TEAM_MEMBERS_COLLECTION = "team-members";

// Create a new team member
export async function createTeamMember(teamMemberData: Omit<TeamMemberData, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, TEAM_MEMBERS_COLLECTION), {
      ...teamMemberData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("Team member created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating team member: ", error);
    throw new Error("Failed to create team member");
  }
}

// Get all team members
export async function getAllTeamMembers(): Promise<TeamMemberData[]> {
  try {
    const q = query(
      collection(db, TEAM_MEMBERS_COLLECTION), 
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const teamMembers: TeamMemberData[] = [];
    
    querySnapshot.forEach((doc) => {
      teamMembers.push({
        id: doc.id,
        ...doc.data()
      } as TeamMemberData);
    });
    
    return teamMembers;
  } catch (error) {
    console.error("Error getting team members: ", error);
    throw new Error("Failed to get team members");
  }
}

// Get team members by event ID
export async function getTeamMembersByEventId(eventId: string): Promise<TeamMemberData[]> {
  try {
    const q = query(
      collection(db, TEAM_MEMBERS_COLLECTION),
      where("eventId", "==", eventId),
      orderBy("name", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const teamMembers: TeamMemberData[] = [];
    
    querySnapshot.forEach((doc) => {
      teamMembers.push({
        id: doc.id,
        ...doc.data()
      } as TeamMemberData);
    });
    
    return teamMembers;
  } catch (error) {
    console.error("Error getting team members by event ID: ", error);
    throw new Error("Failed to get team members by event ID");
  }
}

// Get team members by event instance ID
export async function getTeamMembersByEventInstanceId(eventInstanceId: string): Promise<TeamMemberData[]> {
  try {
    const q = query(
      collection(db, TEAM_MEMBERS_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId),
      orderBy("name", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const teamMembers: TeamMemberData[] = [];
    
    querySnapshot.forEach((doc) => {
      teamMembers.push({
        id: doc.id,
        ...doc.data()
      } as TeamMemberData);
    });
    
    return teamMembers;
  } catch (error) {
    console.error("Error getting team members by event instance ID: ", error);
    throw new Error("Failed to get team members by event instance ID");
  }
}

// Get a specific team member by ID
export async function getTeamMemberById(teamMemberId: string): Promise<TeamMemberData | null> {
  try {
    const docRef = doc(db, TEAM_MEMBERS_COLLECTION, teamMemberId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as TeamMemberData;
    } else {
      console.log("No team member found with ID: ", teamMemberId);
      return null;
    }
  } catch (error) {
    console.error("Error getting team member: ", error);
    throw new Error("Failed to get team member");
  }
}

// Update a team member
export async function updateTeamMember(teamMemberId: string, updatedData: Partial<TeamMemberData>) {
  try {
    const docRef = doc(db, TEAM_MEMBERS_COLLECTION, teamMemberId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("Team member updated successfully");
  } catch (error) {
    console.error("Error updating team member: ", error);
    throw new Error("Failed to update team member");
  }
}

// Delete a team member
export async function deleteTeamMember(teamMemberId: string) {
  try {
    const docRef = doc(db, TEAM_MEMBERS_COLLECTION, teamMemberId);
    await deleteDoc(docRef);
    
    console.log("Team member deleted successfully");
  } catch (error) {
    console.error("Error deleting team member: ", error);
    throw new Error("Failed to delete team member");
  }
}

// Calculate total team payments for an event
export async function calculateTeamPayments(eventId: string): Promise<number> {
  try {
    const teamMembers = await getTeamMembersByEventId(eventId);
    return teamMembers.reduce((total, member) => total + member.paymentAmount, 0);
  } catch (error) {
    console.error("Error calculating team payments: ", error);
    throw new Error("Failed to calculate team payments");
  }
}