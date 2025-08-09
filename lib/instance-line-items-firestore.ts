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

export interface LineItemData {
  id?: string;
  instanceId: string;
  type: 'revenue' | 'expense';
  category: string;
  description: string;
  amount: number;
  isPaid: boolean;
  paymentDate?: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const LINE_ITEMS_COLLECTION = "instance-line-items";

// Revenue categories
export const REVENUE_CATEGORIES = [
  { value: 'ticket_sales', label: 'Ticket Sales' },
  { value: 'bar_sales', label: 'Bar Sales' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'cover_charge', label: 'Cover Charge' },
  { value: 'vip_packages', label: 'VIP Packages' },
  { value: 'other', label: 'Other Revenue' }
];

// Expense categories  
export const EXPENSE_CATEGORIES = [
  { value: 'dj_payment', label: 'DJ Payment' },
  { value: 'staff_payment', label: 'Staff Payment' },
  { value: 'management_payment', label: 'Management Payment' },
  { value: 'team_payment', label: 'Team Member Payment' },
  { value: 'venue_rental', label: 'Venue Rental' },
  { value: 'equipment_rental', label: 'Equipment Rental' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'catering', label: 'Catering' },
  { value: 'security', label: 'Security' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'permits', label: 'Permits & Licenses' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'auto-sync-dj', label: 'DJ Payment (Auto-synced)' },
  { value: 'auto-sync-team', label: 'Team Payment (Auto-synced)' },
  { value: 'other', label: 'Other Expense' }
];

// Create a new line item
export async function createLineItem(lineItemData: Omit<LineItemData, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, LINE_ITEMS_COLLECTION), {
      ...lineItemData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("Line item created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating line item: ", error);
    throw new Error("Failed to create line item");
  }
}

// Get line items by instance ID
export async function getLineItemsByInstanceId(instanceId: string): Promise<LineItemData[]> {
  try {
    const q = query(
      collection(db, LINE_ITEMS_COLLECTION),
      where("instanceId", "==", instanceId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const lineItems: LineItemData[] = [];
    
    querySnapshot.forEach((doc) => {
      lineItems.push({
        id: doc.id,
        ...doc.data()
      } as LineItemData);
    });
    
    return lineItems;
  } catch (error) {
    console.error("Error getting line items: ", error);
    throw new Error("Failed to get line items");
  }
}

// Update a line item
export async function updateLineItem(lineItemId: string, updatedData: Partial<LineItemData>) {
  try {
    const docRef = doc(db, LINE_ITEMS_COLLECTION, lineItemId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("Line item updated successfully");
  } catch (error) {
    console.error("Error updating line item: ", error);
    throw new Error("Failed to update line item");
  }
}

// Delete a line item
export async function deleteLineItem(lineItemId: string) {
  try {
    const docRef = doc(db, LINE_ITEMS_COLLECTION, lineItemId);
    await deleteDoc(docRef);
    
    console.log("Line item deleted successfully");
  } catch (error) {
    console.error("Error deleting line item: ", error);
    throw new Error("Failed to delete line item");
  }
}

// Copy line items from one instance to another
export async function copyLineItemsToInstance(fromInstanceId: string, toInstanceId: string, lineItemIds: string[]) {
  try {
    const sourceLineItems = await getLineItemsByInstanceId(fromInstanceId);
    const itemsToCopy = sourceLineItems.filter(item => lineItemIds.includes(item.id!));
    
    const copyPromises = itemsToCopy.map(item => 
      createLineItem({
        instanceId: toInstanceId,
        type: item.type,
        category: item.category,
        description: `${item.description} (copied)`,
        amount: item.amount,
        isPaid: false, // Reset payment status for copied items
        notes: item.notes
      })
    );
    
    await Promise.all(copyPromises);
    console.log(`Copied ${itemsToCopy.length} line items to instance ${toInstanceId}`);
  } catch (error) {
    console.error("Error copying line items: ", error);
    throw new Error("Failed to copy line items");
  }
}

// Get financial summary for an instance including DJ payments and team member costs
export async function getInstanceFinancialSummary(instanceId: string, djAssignments: any[] = [], teamMembers: any[] = []) {
  try {
    const lineItems = await getLineItemsByInstanceId(instanceId);
    
    const revenue = lineItems
      .filter(item => item.type === 'revenue')
      .reduce((sum, item) => sum + item.amount, 0);
      
    // Only count manual line items, not auto-synced ones (to avoid double counting)
    const lineItemExpenses = lineItems
      .filter(item => item.type === 'expense' && item.category !== 'auto-sync-dj' && item.category !== 'auto-sync-team')
      .reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate DJ payment expenses from assignments
    const djExpenses = djAssignments.reduce((sum, assignment) => {
      return sum + (parseFloat(assignment.paymentAmount) || 0);
    }, 0);
    
    // Calculate team member payment expenses (excluding volunteers)
    const teamExpenses = teamMembers
      .filter(member => !member.isVolunteer)
      .reduce((sum, member) => sum + (member.paymentAmount || 0), 0);
    
    const totalExpenses = lineItemExpenses + djExpenses + teamExpenses;
    
    const paidRevenue = lineItems
      .filter(item => item.type === 'revenue' && item.isPaid)
      .reduce((sum, item) => sum + item.amount, 0);
      
    const paidLineItemExpenses = lineItems
      .filter(item => item.type === 'expense' && item.isPaid && item.category !== 'auto-sync-dj' && item.category !== 'auto-sync-team')
      .reduce((sum, item) => sum + item.amount, 0);
    
    // Count confirmed/completed DJ payments as paid
    const paidDJExpenses = djAssignments
      .filter(assignment => assignment.status === 'confirmed' || assignment.status === 'completed')
      .reduce((sum, assignment) => sum + (parseFloat(assignment.paymentAmount) || 0), 0);
    
    // For team members, we'll assume they're paid when they exist (since they're on payroll)
    // You could add a paid status to TeamMember interface in the future if needed
    const paidTeamExpenses = teamExpenses; // Assuming team members are always paid
    
    const totalPaidExpenses = paidLineItemExpenses + paidDJExpenses + paidTeamExpenses;
    
    return {
      totalRevenue: revenue,
      totalExpenses: totalExpenses,
      lineItemExpenses,
      djExpenses,
      teamExpenses,
      netProfit: revenue - totalExpenses,
      paidRevenue,
      paidExpenses: totalPaidExpenses,
      outstandingRevenue: revenue - paidRevenue,
      outstandingExpenses: totalExpenses - totalPaidExpenses
    };
  } catch (error) {
    console.error("Error getting financial summary: ", error);
    throw new Error("Failed to get financial summary");
  }
}