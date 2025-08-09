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

// Import guest list functions
import { createOrUpdateGuestList } from "./guest-list-firestore";

// n8n webhook URL for DJ assignments
const DJ_ASSIGNMENT_WEBHOOK_URL = "https://harrisonheights.app.n8n.cloud/webhook/b8aaec68-699c-4889-baca-5407f6f1d051";

export interface DJAssignment {
  djId?: string;
  djName: string;
  djLegalName: string;
  email: string;
  phone: string;
  paymentAmount: string;
  setStartTime: string;
  setEndTime?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  assignedAt: Timestamp;
  agreementSentManually?: boolean;
  guestListLink?: string; // Google Sheets URL for viewing RSVP responses
  rsvpLink?: string; // RSVP form link for guests
  paymentRecordId?: string; // Link to payment record
  paymentStatus?: 'not_created' | 'pending' | 'processing' | 'completed' | 'failed' | 'overdue';
  paymentDueDate?: Timestamp;
  paidAt?: Timestamp;
}

export interface AssetInfo {
  url: string;
  templateId: string;
  aspectRatio: string; // "1:1", "4:5", "9:16"
  createdAt: Timestamp;
  filename?: string;
}

export interface TeamMember {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  paymentAmount: number;
  isVolunteer: boolean;
  teamType: 'management' | 'team'; // Management team or regular team
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  assignedAt: Timestamp;
  notes?: string;
  guestListLink?: string; // Google Sheets URL for viewing RSVP responses
  rsvpLink?: string; // RSVP form link for guests
}

export interface EventInstanceData {
  id?: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  djAssignments: DJAssignment[];
  totalPayment: string;
  budget?: number;
  revenue?: number;
  notes?: string;
  assetsGenerated?: boolean;
  assetUrls?: string[]; // Keep for backward compatibility
  assets?: AssetInfo[]; // New detailed asset information
  teamMembers?: TeamMember[]; // Team and management staff
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection reference
const EVENT_INSTANCES_COLLECTION = "event-instances";

// Create a new event instance
export async function createEventInstance(instanceData: Omit<EventInstanceData, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, EVENT_INSTANCES_COLLECTION), {
      ...instanceData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("Event instance created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating event instance: ", error);
    throw new Error("Failed to create event instance");
  }
}

// Get all event instances
export async function getAllEventInstances(): Promise<EventInstanceData[]> {
  try {
    const q = query(
      collection(db, EVENT_INSTANCES_COLLECTION), 
      orderBy("eventDate", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const instances: EventInstanceData[] = [];
    
    querySnapshot.forEach((doc) => {
      instances.push({
        id: doc.id,
        ...doc.data()
      } as EventInstanceData);
    });
    
    return instances;
  } catch (error) {
    console.error("Error getting event instances: ", error);
    throw new Error("Failed to get event instances");
  }
}

// Get event instances by event ID
export async function getEventInstancesByEventId(eventId: string): Promise<EventInstanceData[]> {
  try {
    const q = query(
      collection(db, EVENT_INSTANCES_COLLECTION),
      where("eventId", "==", eventId),
      orderBy("eventDate", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const instances: EventInstanceData[] = [];
    
    querySnapshot.forEach((doc) => {
      instances.push({
        id: doc.id,
        ...doc.data()
      } as EventInstanceData);
    });
    
    return instances;
  } catch (error) {
    console.error("Error getting event instances by event ID: ", error);
    throw new Error("Failed to get event instances by event ID");
  }
}

// Get upcoming event instances
export async function getUpcomingEventInstances(): Promise<EventInstanceData[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, EVENT_INSTANCES_COLLECTION),
      where("eventDate", ">=", today),
      where("status", "in", ["scheduled", "ongoing"]),
      orderBy("eventDate", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const instances: EventInstanceData[] = [];
    
    querySnapshot.forEach((doc) => {
      instances.push({
        id: doc.id,
        ...doc.data()
      } as EventInstanceData);
    });
    
    return instances;
  } catch (error) {
    console.error("Error getting upcoming event instances: ", error);
    throw new Error("Failed to get upcoming event instances");
  }
}

// Get past event instances
export async function getPastEventInstances(): Promise<EventInstanceData[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, EVENT_INSTANCES_COLLECTION),
      where("eventDate", "<", today),
      orderBy("eventDate", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const instances: EventInstanceData[] = [];
    
    querySnapshot.forEach((doc) => {
      instances.push({
        id: doc.id,
        ...doc.data()
      } as EventInstanceData);
    });
    
    return instances;
  } catch (error) {
    console.error("Error getting past event instances: ", error);
    throw new Error("Failed to get past event instances");
  }
}

// Get a specific event instance by ID
export async function getEventInstanceById(instanceId: string): Promise<EventInstanceData | null> {
  try {
    const docRef = doc(db, EVENT_INSTANCES_COLLECTION, instanceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EventInstanceData;
    } else {
      console.log("No event instance found with ID: ", instanceId);
      return null;
    }
  } catch (error) {
    console.error("Error getting event instance: ", error);
    throw new Error("Failed to get event instance");
  }
}

// Update an event instance
export async function updateEventInstance(instanceId: string, updatedData: Partial<EventInstanceData>) {
  try {
    const docRef = doc(db, EVENT_INSTANCES_COLLECTION, instanceId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("Event instance updated successfully");
  } catch (error) {
    console.error("Error updating event instance: ", error);
    throw new Error("Failed to update event instance");
  }
}

// Delete an event instance
export async function deleteEventInstance(instanceId: string) {
  try {
    const docRef = doc(db, EVENT_INSTANCES_COLLECTION, instanceId);
    await deleteDoc(docRef);
    
    console.log("Event instance deleted successfully");
  } catch (error) {
    console.error("Error deleting event instance: ", error);
    throw new Error("Failed to delete event instance");
  }
}

// Add DJ assignment to event instance
export async function addDJAssignment(instanceId: string, djAssignment: Omit<DJAssignment, 'assignedAt'>) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    let rsvpLink = '';
    
    // Generate RSVP link for this DJ assignment
    try {
      const { generateRSVPLink } = await import('./rsvp-firestore');
      
      // Generate RSVP link for the DJ
      rsvpLink = await generateRSVPLink(
        instanceId,
        'dj',
        djAssignment.djId || djAssignment.email,
        djAssignment.djName,
        djAssignment.email
      );
      console.log(`Generated RSVP link for ${djAssignment.djName}: ${rsvpLink}`);
    } catch (rsvpError) {
      console.error('Error generating RSVP link for DJ:', rsvpError);
      // Continue with assignment even if RSVP link generation fails
    }

    const newAssignment: DJAssignment = {
      ...djAssignment,
      guestListLink: '', // Will be updated after webhook response
      rsvpLink, // Store the RSVP form link
      assignedAt: Timestamp.now()
    };

    const updatedAssignments = [...(instance.djAssignments || []), newAssignment];
    
    await updateEventInstance(instanceId, {
      djAssignments: updatedAssignments
    });
    
    // Trigger n8n webhook and get the returned guestListLink
    try {
      const webhookResponse = await triggerDJAssignmentWebhook({
        ...djAssignment,
        eventDate: instance.eventDate,
        eventName: instance.eventName,
        venue: instance.venue || ''
      });
      
      // If webhook returns a guestListLink, update the assignment in Firebase
      if (webhookResponse && webhookResponse.guestListLink) {
        const returnedGuestListLink = webhookResponse.guestListLink;
        console.log(`Received guestListLink from webhook: ${returnedGuestListLink}`);
        
        // Update the DJ assignment with the returned guestListLink
        const updatedAssignmentsWithGuestList = updatedAssignments.map(assignment => 
          assignment.email === djAssignment.email 
            ? { ...assignment, guestListLink: returnedGuestListLink }
            : assignment
        );
        
        await updateEventInstance(instanceId, {
          djAssignments: updatedAssignmentsWithGuestList
        });
        
        // Also update the guest list entry in Firebase
        await createOrUpdateGuestList(
          instanceId,
          djAssignment.email,
          'dj',
          {
            eventName: instance.eventName,
            eventDate: instance.eventDate,
            venue: instance.venue || '',
            assigneeName: djAssignment.djName,
            assigneeEmail: djAssignment.email,
            guestListLink: returnedGuestListLink, // Store the webhook-returned URL
            isActive: true
          }
        );
        
        console.log(`Updated DJ assignment with guestListLink: ${returnedGuestListLink}`);
      }
    } catch (webhookError) {
      console.error('Error triggering DJ assignment webhook:', webhookError);
      // Continue even if webhook fails
    }
    
    console.log("DJ assignment added successfully with Google Sheet integration");
  } catch (error) {
    console.error("Error adding DJ assignment: ", error);
    throw new Error("Failed to add DJ assignment");
  }
}

// Update DJ assignment status
export async function updateDJAssignmentStatus(instanceId: string, djEmail: string, status: DJAssignment['status']) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    const updatedAssignments = instance.djAssignments.map(assignment => 
      assignment.email === djEmail ? { ...assignment, status } : assignment
    );
    
    await updateEventInstance(instanceId, {
      djAssignments: updatedAssignments
    });
    
    console.log("DJ assignment status updated successfully");
  } catch (error) {
    console.error("Error updating DJ assignment status: ", error);
    throw new Error("Failed to update DJ assignment status");
  }
}

// Remove DJ assignment from event instance
export async function removeDJAssignment(instanceId: string, djEmail: string) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    const updatedAssignments = instance.djAssignments.filter(assignment => 
      assignment.email !== djEmail
    );
    
    await updateEventInstance(instanceId, {
      djAssignments: updatedAssignments
    });
    
    console.log("DJ assignment removed successfully");
  } catch (error) {
    console.error("Error removing DJ assignment: ", error);
    throw new Error("Failed to remove DJ assignment");
  }
}

// Mark DJ agreement as sent manually
export async function markDJAgreementSentManually(instanceId: string, djEmail: string) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    const updatedAssignments = instance.djAssignments.map(assignment => 
      assignment.email === djEmail 
        ? { ...assignment, agreementSentManually: true } 
        : assignment
    );
    
    await updateEventInstance(instanceId, {
      djAssignments: updatedAssignments
    });
    
    console.log("DJ agreement marked as sent manually");
  } catch (error) {
    console.error("Error marking DJ agreement as sent manually: ", error);
    throw new Error("Failed to mark DJ agreement as sent manually");
  }
}

// Update guest list links for DJ assignments
export async function updateDJGuestListLinks(instanceId: string, guestListLinks: {[email: string]: string}) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    const updatedAssignments = instance.djAssignments.map(assignment => {
      const newGuestListLink = guestListLinks[assignment.email] || assignment.guestListLink;
      const updatedAssignment = { ...assignment };
      
      // Only include guestListLink if it has a value
      if (newGuestListLink) {
        updatedAssignment.guestListLink = newGuestListLink;
      }
      
      return updatedAssignment;
    });
    
    await updateEventInstance(instanceId, {
      djAssignments: updatedAssignments
    });
    
    console.log("DJ guest list links updated successfully");
  } catch (error) {
    console.error("Error updating DJ guest list links: ", error);
    throw new Error("Failed to update DJ guest list links");
  }
}

// Get event instances by date range
export async function getEventInstancesByDateRange(startDate: Date, endDate: Date): Promise<EventInstanceData[]> {
  try {
    const q = query(
      collection(db, EVENT_INSTANCES_COLLECTION),
      where("eventDate", ">=", startDate.toISOString().split('T')[0]),
      where("eventDate", "<=", endDate.toISOString().split('T')[0]),
      orderBy("eventDate", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const instances: EventInstanceData[] = [];
    
    querySnapshot.forEach((doc) => {
      instances.push({
        id: doc.id,
        ...doc.data()
      } as EventInstanceData);
    });
    
    return instances;
  } catch (error) {
    console.error("Error getting event instances by date range: ", error);
    throw new Error("Failed to get event instances by date range");
  }
}

// Assign asset to an event instance with metadata
export async function assignAssetToInstance(instanceId: string, assetUrl: string, templateId?: string, aspectRatio?: string) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    // Create new asset info
    const newAssetInfo: AssetInfo = {
      url: assetUrl,
      templateId: templateId || 'unknown',
      aspectRatio: aspectRatio || '1:1',
      createdAt: Timestamp.now(),
      filename: assetUrl.split('/').pop() || 'unknown'
    };

    const currentAssets = instance.assets || [];
    const updatedAssets = [...currentAssets, newAssetInfo];

    // Also update legacy assetUrls for backward compatibility
    const currentUrls = instance.assetUrls || [];
    const updatedUrls = [...currentUrls, assetUrl];
    
    await updateEventInstance(instanceId, {
      assets: updatedAssets,
      assetUrls: updatedUrls,
      assetsGenerated: true
    });
    
    console.log("Asset assigned to instance successfully");
    return updatedAssets;
  } catch (error) {
    console.error("Error assigning asset to instance: ", error);
    throw new Error("Failed to assign asset to instance");
  }
}

// Remove asset from an event instance
export async function removeAssetFromInstance(instanceId: string, assetUrl: string) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    // Remove from detailed assets array
    const currentAssets = instance.assets || [];
    const updatedAssets = currentAssets.filter(asset => asset.url !== assetUrl);

    // Remove from legacy URLs array
    const currentUrls = instance.assetUrls || [];
    const updatedUrls = currentUrls.filter(url => url !== assetUrl);
    
    await updateEventInstance(instanceId, {
      assets: updatedAssets,
      assetUrls: updatedUrls,
      assetsGenerated: updatedAssets.length > 0 || updatedUrls.length > 0
    });
    
    console.log("Asset removed from instance successfully");
    return updatedAssets;
  } catch (error) {
    console.error("Error removing asset from instance: ", error);
    throw new Error("Failed to remove asset from instance");
  }
}

// Add team member to event instance
export async function addTeamMember(instanceId: string, teamMember: Omit<TeamMember, 'id' | 'assignedAt'>) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    let rsvpLink = '';
    
    // Generate RSVP link for this team member assignment
    try {
      const { generateRSVPLink } = await import('./rsvp-firestore');
      
             // Generate RSVP link for the team member
       rsvpLink = await generateRSVPLink(
         instanceId,
         'team_member',
         teamMember.email, // Use email as the identifier since id is omitted
         teamMember.name,
         teamMember.email
       );
      console.log(`Generated RSVP link for ${teamMember.name}: ${rsvpLink}`);
    } catch (rsvpError) {
      console.error('Error generating RSVP link for team member:', rsvpError);
      // Continue with assignment even if RSVP link generation fails
    }

    const newTeamMember: TeamMember = {
      id: `tm_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...teamMember,
      guestListLink: '', // Will be updated after webhook response
      rsvpLink, // Store the RSVP form link
      status: 'pending',
      assignedAt: Timestamp.now()
    };

    const updatedTeamMembers = [...(instance.teamMembers || []), newTeamMember];
    
    await updateEventInstance(instanceId, {
      teamMembers: updatedTeamMembers
    });
    
    // Trigger n8n webhook and get the returned guestListLink
    try {
             // Get event start time from first DJ assignment or use default
       const eventStartTime = instance.djAssignments.length > 0 
         ? instance.djAssignments[0].setStartTime 
         : '18:00'; // Default to 6 PM if no DJ assignments

       const webhookResponse = await triggerTeamMemberAssignmentWebhook({
         teamMemberLegalName: teamMember.name, // Using name as legal name
         teamMemberName: teamMember.name,
         email: teamMember.email,
         phone: teamMember.phone,
         eventStartTime,
         eventDate: instance.eventDate,
         eventName: instance.eventName,
         venue: instance.venue || '',
         paymentAmount: teamMember.paymentAmount.toString(),
         role: teamMember.role.toUpperCase()
       });
      
      // If webhook returns a guestListLink, update the assignment in Firebase
      if (webhookResponse && webhookResponse.guestListLink) {
        const returnedGuestListLink = webhookResponse.guestListLink;
        console.log(`Received guestListLink from webhook: ${returnedGuestListLink}`);
        
        // Update the team member assignment with the returned guestListLink
        const updatedTeamMembersWithGuestList = updatedTeamMembers.map(member => 
          member.id === newTeamMember.id 
            ? { ...member, guestListLink: returnedGuestListLink }
            : member
        );
        
        await updateEventInstance(instanceId, {
          teamMembers: updatedTeamMembersWithGuestList
        });
        
        // Also update the guest list entry in Firebase
        await createOrUpdateGuestList(
          instanceId,
          teamMember.email,
          'team_member',
          {
            eventName: instance.eventName,
            eventDate: instance.eventDate,
            venue: instance.venue || '',
            assigneeName: teamMember.name,
            assigneeEmail: teamMember.email,
            assigneeRole: teamMember.role,
            guestListLink: returnedGuestListLink, // Store the webhook-returned URL
            isActive: true
          }
        );
        
        console.log(`Updated team member assignment with guestListLink: ${returnedGuestListLink}`);
      }
    } catch (webhookError) {
      console.error('Error triggering team member assignment webhook:', webhookError);
      // Continue even if webhook fails
    }
    
    console.log("Team member added successfully with webhook integration");
    return updatedTeamMembers;
  } catch (error) {
    console.error("Error adding team member:", error);
    throw new Error("Failed to add team member");
  }
}

// Update team member in event instance
export async function updateTeamMember(instanceId: string, teamMemberId: string, updatedData: Partial<TeamMember>) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    const updatedTeamMembers = (instance.teamMembers || []).map(member =>
      member.id === teamMemberId ? { ...member, ...updatedData } : member
    );
    
    await updateEventInstance(instanceId, {
      teamMembers: updatedTeamMembers
    });
    
    console.log("Team member updated successfully");
    return updatedTeamMembers;
  } catch (error) {
    console.error("Error updating team member:", error);
    throw new Error("Failed to update team member");
  }
}

// Remove team member from event instance
export async function removeTeamMember(instanceId: string, teamMemberId: string) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    const updatedTeamMembers = (instance.teamMembers || []).filter(member => member.id !== teamMemberId);
    
    await updateEventInstance(instanceId, {
      teamMembers: updatedTeamMembers
    });
    
    console.log("Team member removed successfully");
    return updatedTeamMembers;
  } catch (error) {
    console.error("Error removing team member:", error);
    throw new Error("Failed to remove team member");
  }
}

// Get team members by type (management or team)
export function getTeamMembersByType(instance: EventInstanceData, teamType: 'management' | 'team'): TeamMember[] {
  return (instance.teamMembers || []).filter(member => member.teamType === teamType);
}

// Calculate total team member costs
export function calculateTeamMemberCosts(instance: EventInstanceData): { total: number; management: number; team: number } {
  const teamMembers = instance.teamMembers || [];
  
  const management = teamMembers
    .filter(member => member.teamType === 'management' && !member.isVolunteer)
    .reduce((sum, member) => sum + member.paymentAmount, 0);
    
  const team = teamMembers
    .filter(member => member.teamType === 'team' && !member.isVolunteer)
    .reduce((sum, member) => sum + member.paymentAmount, 0);
    
  return {
    total: management + team,
    management,
    team
  };
}

// Payment-related functions for DJ assignments

// Create payment record for DJ assignment
export async function createPaymentForDJAssignment(instanceId: string, djEmail: string, dueDate: Date) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    const assignment = instance.djAssignments.find(a => a.email === djEmail);
    if (!assignment) {
      throw new Error("DJ assignment not found");
    }

    // Import payment functions dynamically to avoid circular dependency
    const { createPaymentRecord } = await import('./payment-firestore');
    
    const paymentData = {
      djId: assignment.djId || '',
      djName: assignment.djName,
      djEmail: assignment.email,
      eventInstanceId: instanceId,
      eventName: instance.eventName,
      eventDate: instance.eventDate,
      amount: parseFloat(assignment.paymentAmount) || 0,
      paymentMethod: 'stripe' as const,
      status: 'pending' as const,
      dueDate: Timestamp.fromDate(dueDate)
    };

    const paymentRecordId = await createPaymentRecord(paymentData);

    // Update DJ assignment with payment record reference
    const updatedAssignments = instance.djAssignments.map(a => 
      a.email === djEmail 
        ? { 
            ...a, 
            paymentRecordId,
            paymentStatus: 'pending' as const,
            paymentDueDate: Timestamp.fromDate(dueDate)
          }
        : a
    );

    await updateEventInstance(instanceId, {
      djAssignments: updatedAssignments
    });

    console.log("Payment record created for DJ assignment");
    return paymentRecordId;
  } catch (error) {
    console.error("Error creating payment for DJ assignment:", error);
    throw new Error("Failed to create payment for DJ assignment");
  }
}

// Update DJ assignment payment status
export async function updateDJAssignmentPaymentStatus(instanceId: string, djEmail: string, paymentStatus: DJAssignment['paymentStatus']) {
  try {
    const instance = await getEventInstanceById(instanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    const updatedAssignments = instance.djAssignments.map(assignment => 
      assignment.email === djEmail 
        ? { 
            ...assignment, 
            paymentStatus,
            ...(paymentStatus === 'completed' ? { paidAt: Timestamp.now() } : {})
          }
        : assignment
    );

    await updateEventInstance(instanceId, {
      djAssignments: updatedAssignments
    });

    console.log("DJ assignment payment status updated successfully");
  } catch (error) {
    console.error("Error updating DJ assignment payment status:", error);
    throw new Error("Failed to update DJ assignment payment status");
  }
}

// Get DJs with pending payments
export function getDJsWithPendingPayments(instance: EventInstanceData): DJAssignment[] {
  return instance.djAssignments.filter(assignment => 
    assignment.paymentStatus === 'pending' || assignment.paymentStatus === 'overdue'
  );
}

// Calculate total pending payments for event instance
export function calculatePendingPayments(instance: EventInstanceData): number {
  return getDJsWithPendingPayments(instance).reduce((total, assignment) => {
    return total + (parseFloat(assignment.paymentAmount) || 0);
  }, 0);
}

// Trigger n8n webhook for DJ assignment and return response with guestListLink
async function triggerDJAssignmentWebhook(data: {
  djLegalName: string;
  djName: string;
  email: string;
  phone: string;
  setStartTime: string;
  eventDate: string;
  eventName: string;
  venue: string;
  paymentAmount: string;
}): Promise<{ guestListLink?: string } | null> {
  try {
    // Format time from 24h to 12h format (e.g., "18:00" to "6:00 PM")
    let formattedTime = data.setStartTime;
    if (data.setStartTime && data.setStartTime.includes(":")) {
      const [hours, minutes] = data.setStartTime.split(":");
      const hour = parseInt(hours);
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      formattedTime = `${displayHour}:${minutes} ${period}`;
    }
    
    // Format date from YYYY-MM-DD to "Month Day" format
    let formattedDate = data.eventDate;
    if (data.eventDate && data.eventDate.includes("-")) {
      const [year, month, day] = data.eventDate.split("-");
      const months = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
      formattedDate = `${months[parseInt(month) - 1]} ${parseInt(day)}`;
    }

    const webhookPayload = {
      djLegalName: data.djLegalName,
      djName: data.djName,
      email: data.email,
      phone: data.phone,
      setStartTime: formattedTime,
      eventDate: formattedDate,
      eventName: data.eventName,
      venue: data.venue,
      paymentAmount: data.paymentAmount
    };

    console.log(`Triggering webhook for DJ ${data.djName} with payload:`, JSON.stringify(webhookPayload, null, 2));

    const response = await fetch(DJ_ASSIGNMENT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status: ${response.status}`);
    }

    // Parse the response to get the guestListLink
    const responseData = await response.json();
    console.log(`DJ assignment webhook response:`, JSON.stringify(responseData, null, 2));

    console.log(`DJ assignment webhook triggered successfully for ${data.djName}`);
    
    // Return the response data which should contain guestListLink
    return responseData;
  } catch (error) {
    console.error("Error triggering DJ assignment webhook:", error);
    return null; // Return null instead of throwing to prevent assignment failure
  }
}

// Trigger n8n webhook for team member assignment and return response with guestListLink
async function triggerTeamMemberAssignmentWebhook(data: {
  teamMemberLegalName: string;
  teamMemberName: string;
  email: string;
  phone: string;
  eventStartTime: string;
  eventDate: string;
  eventName: string;
  venue: string;
  paymentAmount: string;
  role: string;
}): Promise<{ guestListLink?: string } | null> {
  try {
    // Format time from 24h to 12h format (e.g., "18:00" to "6:00 PM")
    let formattedTime = data.eventStartTime;
    if (data.eventStartTime && data.eventStartTime.includes(":")) {
      const [hours, minutes] = data.eventStartTime.split(":");
      const hour = parseInt(hours);
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      formattedTime = `${displayHour}:${minutes} ${period}`;
    }
    
    // Format date from YYYY-MM-DD to "Month Day" format
    let formattedDate = data.eventDate;
    if (data.eventDate && data.eventDate.includes("-")) {
      const [year, month, day] = data.eventDate.split("-");
      const months = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
      formattedDate = `${months[parseInt(month) - 1]} ${parseInt(day)}`;
    }

    // Map team member fields to expected webhook fields
    const webhookPayload = {
      djLegalName: data.teamMemberLegalName, // Map to expected field
      djName: data.teamMemberName, // Map to expected field
      email: data.email,
      phone: data.phone,
      setStartTime: formattedTime, // Map to expected field
      eventDate: formattedDate,
      eventName: data.eventName,
      venue: data.venue,
      paymentAmount: data.paymentAmount,
      role: data.role // Include role for team member
    };

    console.log(`Triggering webhook for team member ${data.teamMemberName} with payload:`, JSON.stringify(webhookPayload, null, 2));

    const response = await fetch(DJ_ASSIGNMENT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status: ${response.status}`);
    }

    // Parse the response to get the guestListLink
    const responseData = await response.json();
    console.log(`Team member assignment webhook response:`, JSON.stringify(responseData, null, 2));

    console.log(`Team member assignment webhook triggered successfully for ${data.teamMemberName}`);
    
    // Return the response data which should contain guestListLink
    return responseData;
  } catch (error) {
    console.error("Error triggering team member assignment webhook:", error);
    return null; // Return null instead of throwing to prevent assignment failure
  }
}