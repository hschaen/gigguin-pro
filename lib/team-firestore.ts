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
  name: string;
  email: string;
  phone: string;
  preferredRoles: string[]; // Array of roles they can do
  defaultPaymentAmount: number;
  isVolunteerByDefault: boolean;
  notes: string;
  eventsWorked: string; // Comma-separated list of events
  teamType: 'management' | 'team'; // Default team type
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

// Bulk create team members (for CSV import)
export async function createTeamMembersBulk(teamMembersData: Omit<TeamMemberData, 'id' | 'createdAt' | 'updatedAt'>[]) {
  try {
    const promises = teamMembersData.map(teamMemberData => 
      addDoc(collection(db, TEAM_MEMBERS_COLLECTION), {
        ...teamMemberData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    );
    
    const results = await Promise.all(promises);
    console.log(`${results.length} team members created successfully`);
    return results.map(result => result.id);
  } catch (error) {
    console.error("Error bulk creating team members: ", error);
    throw new Error("Failed to bulk create team members");
  }
}

// Get all team members
export async function getAllTeamMembers(): Promise<TeamMemberData[]> {
  try {
    const q = query(
      collection(db, TEAM_MEMBERS_COLLECTION), 
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
    console.error("Error getting team members: ", error);
    throw new Error("Failed to get team members");
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
      return null;
    }
  } catch (error) {
    console.error("Error getting team member: ", error);
    throw new Error("Failed to get team member");
  }
}

// Update a team member
export async function updateTeamMember(teamMemberId: string, updateData: Partial<Omit<TeamMemberData, 'id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const docRef = doc(db, TEAM_MEMBERS_COLLECTION, teamMemberId);
    await updateDoc(docRef, {
      ...updateData,
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

// Search team members by name
export async function searchTeamMembersByName(searchTerm: string): Promise<TeamMemberData[]> {
  try {
    const q = query(
      collection(db, TEAM_MEMBERS_COLLECTION),
      orderBy("name")
    );
    
    const querySnapshot = await getDocs(q);
    const teamMembers: TeamMemberData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as TeamMemberData;
      if (data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.preferredRoles?.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))) {
        teamMembers.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return teamMembers;
  } catch (error) {
    console.error("Error searching team members: ", error);
    throw new Error("Failed to search team members");
  }
}

// Check for duplicate team member names
export async function checkDuplicateTeamMemberName(name: string): Promise<TeamMemberData[]> {
  try {
    const q = query(
      collection(db, TEAM_MEMBERS_COLLECTION),
      where("name", "==", name)
    );
    
    const querySnapshot = await getDocs(q);
    const duplicates: TeamMemberData[] = [];
    
    querySnapshot.forEach((doc) => {
      duplicates.push({
        id: doc.id,
        ...doc.data()
      } as TeamMemberData);
    });
    
    return duplicates;
  } catch (error) {
    console.error("Error checking for duplicate team member names: ", error);
    throw new Error("Failed to check for duplicates");
  }
}

// Get team members by role
export async function getTeamMembersByRole(role: string): Promise<TeamMemberData[]> {
  try {
    const q = query(
      collection(db, TEAM_MEMBERS_COLLECTION),
      orderBy("name")
    );
    
    const querySnapshot = await getDocs(q);
    const teamMembers: TeamMemberData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as TeamMemberData;
      if (data.preferredRoles?.some(r => r.toLowerCase().includes(role.toLowerCase()))) {
        teamMembers.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return teamMembers;
  } catch (error) {
    console.error("Error getting team members by role: ", error);
    throw new Error("Failed to get team members by role");
  }
}

// Get team members by team type
export async function getTeamMembersByTeamType(teamType: 'management' | 'team'): Promise<TeamMemberData[]> {
  try {
    const q = query(
      collection(db, TEAM_MEMBERS_COLLECTION),
      where("teamType", "==", teamType),
      orderBy("name")
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
    console.error("Error getting team members by team type: ", error);
    throw new Error("Failed to get team members by team type");
  }
}

// Common roles for dropdowns
export const COMMON_TEAM_ROLES = [
  "Event Coordinator",
  "Security",
  "Setup Crew",
  "Cleanup Crew",
  "Bar Staff",
  "Door Staff",
  "Photography",
  "Videography",
  "Sound Engineer",
  "Lighting",
  "Promoter",
  "VIP Host",
  "Stage Manager",
  "Social Media",
  "Merchandising"
];

// Default payment amounts by role (can be overridden per person)
export const DEFAULT_ROLE_PAYMENTS = {
  "Event Coordinator": 200,
  "Security": 150,
  "Setup Crew": 100,
  "Cleanup Crew": 100,
  "Bar Staff": 120,
  "Door Staff": 100,
  "Photography": 250,
  "Videography": 300,
  "Sound Engineer": 200,
  "Lighting": 150,
  "Promoter": 150,
  "VIP Host": 120,
  "Stage Manager": 180,
  "Social Media": 100,
  "Merchandising": 80
};