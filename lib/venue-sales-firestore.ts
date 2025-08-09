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

export interface EventSalesData {
  id?: string;
  eventInstanceId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  venueReportedSales: number;
  actualAttendance: number;
  guestListCount: number;
  barSales?: number;
  ticketSales?: number;
  coverCharge?: number;
  otherRevenue?: number;
  reportDate: Timestamp;
  verified: boolean;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EventFinancialSummary {
  id?: string;
  eventInstanceId: string;
  eventName: string;
  eventDate: string;
  totalRevenue: number; // from venue sales
  totalDJPayments: number;
  totalExpenses: number;
  totalTeamPayments: number;
  netProfit: number;
  profitMargin: number;
  costBreakdown: {
    djs: number;
    venue: number;
    marketing: number;
    equipment: number;
    staff: number;
    other: number;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection references
const VENUE_SALES_COLLECTION = "venue-sales";
const FINANCIAL_SUMMARY_COLLECTION = "financial-summaries";

// Venue Sales Data Functions

// Create venue sales data
export async function createVenueSalesData(salesData: Omit<EventSalesData, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, VENUE_SALES_COLLECTION), {
      ...salesData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("Venue sales data created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating venue sales data: ", error);
    throw new Error("Failed to create venue sales data");
  }
}

// Get venue sales data by event instance ID
export async function getVenueSalesDataByEventInstanceId(eventInstanceId: string): Promise<EventSalesData | null> {
  try {
    const q = query(
      collection(db, VENUE_SALES_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as EventSalesData;
  } catch (error) {
    console.error("Error getting venue sales data: ", error);
    throw new Error("Failed to get venue sales data");
  }
}

// Get all venue sales data
export async function getAllVenueSalesData(): Promise<EventSalesData[]> {
  try {
    const q = query(
      collection(db, VENUE_SALES_COLLECTION), 
      orderBy("eventDate", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const salesData: EventSalesData[] = [];
    
    querySnapshot.forEach((doc) => {
      salesData.push({
        id: doc.id,
        ...doc.data()
      } as EventSalesData);
    });
    
    return salesData;
  } catch (error) {
    console.error("Error getting all venue sales data: ", error);
    throw new Error("Failed to get all venue sales data");
  }
}

// Update venue sales data
export async function updateVenueSalesData(salesId: string, updatedData: Partial<EventSalesData>) {
  try {
    const docRef = doc(db, VENUE_SALES_COLLECTION, salesId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("Venue sales data updated successfully");
  } catch (error) {
    console.error("Error updating venue sales data: ", error);
    throw new Error("Failed to update venue sales data");
  }
}

// Verify venue sales data
export async function verifyVenueSalesData(salesId: string) {
  try {
    await updateVenueSalesData(salesId, { verified: true });
    console.log("Venue sales data verified successfully");
  } catch (error) {
    console.error("Error verifying venue sales data: ", error);
    throw new Error("Failed to verify venue sales data");
  }
}

// Delete venue sales data
export async function deleteVenueSalesData(salesId: string) {
  try {
    const docRef = doc(db, VENUE_SALES_COLLECTION, salesId);
    await deleteDoc(docRef);
    
    console.log("Venue sales data deleted successfully");
  } catch (error) {
    console.error("Error deleting venue sales data: ", error);
    throw new Error("Failed to delete venue sales data");
  }
}

// Financial Summary Functions

// Create or update financial summary
export async function createOrUpdateFinancialSummary(summaryData: Omit<EventFinancialSummary, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Check if summary already exists for this event instance
    const q = query(
      collection(db, FINANCIAL_SUMMARY_COLLECTION),
      where("eventInstanceId", "==", summaryData.eventInstanceId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Create new summary
      const docRef = await addDoc(collection(db, FINANCIAL_SUMMARY_COLLECTION), {
        ...summaryData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log("Financial summary created with ID: ", docRef.id);
      return docRef.id;
    } else {
      // Update existing summary
      const existingDoc = querySnapshot.docs[0];
      await updateDoc(existingDoc.ref, {
        ...summaryData,
        updatedAt: Timestamp.now()
      });
      
      console.log("Financial summary updated for event instance");
      return existingDoc.id;
    }
  } catch (error) {
    console.error("Error creating/updating financial summary: ", error);
    throw new Error("Failed to create/update financial summary");
  }
}

// Get financial summary by event instance ID
export async function getFinancialSummaryByEventInstanceId(eventInstanceId: string): Promise<EventFinancialSummary | null> {
  try {
    const q = query(
      collection(db, FINANCIAL_SUMMARY_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as EventFinancialSummary;
  } catch (error) {
    console.error("Error getting financial summary: ", error);
    throw new Error("Failed to get financial summary");
  }
}

// Get all financial summaries
export async function getAllFinancialSummaries(): Promise<EventFinancialSummary[]> {
  try {
    const q = query(
      collection(db, FINANCIAL_SUMMARY_COLLECTION), 
      orderBy("eventDate", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const summaries: EventFinancialSummary[] = [];
    
    querySnapshot.forEach((doc) => {
      summaries.push({
        id: doc.id,
        ...doc.data()
      } as EventFinancialSummary);
    });
    
    return summaries;
  } catch (error) {
    console.error("Error getting all financial summaries: ", error);
    throw new Error("Failed to get all financial summaries");
  }
}

// Calculate financial summary from event data
export async function calculateEventFinancialSummary(eventInstanceId: string): Promise<EventFinancialSummary> {
  try {
    // Import required functions
    const { getEventInstanceById } = await import('./event-instances-firestore');
    const { getExpensesByEventId } = await import('./expenses-firestore');
    const { calculateTeamMemberCosts } = await import('./event-instances-firestore');
    
    const instance = await getEventInstanceById(eventInstanceId);
    if (!instance) {
      throw new Error("Event instance not found");
    }

    // Get venue sales data
    const salesData = await getVenueSalesDataByEventInstanceId(eventInstanceId);
    const totalRevenue = salesData?.venueReportedSales || 0;

    // Calculate DJ payments
    const totalDJPayments = instance.djAssignments.reduce((total, assignment) => {
      return total + (parseFloat(assignment.paymentAmount) || 0);
    }, 0);

    // Calculate team payments
    const teamCosts = calculateTeamMemberCosts(instance);
    const totalTeamPayments = teamCosts.total;

    // Get expenses
    const expenses = await getExpensesByEventId(instance.eventId);
    const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);

    // Calculate cost breakdown
    const costBreakdown = {
      djs: totalDJPayments,
      venue: expenses.filter(e => e.category === 'venue').reduce((sum, e) => sum + e.amount, 0),
      marketing: expenses.filter(e => e.category === 'marketing').reduce((sum, e) => sum + e.amount, 0),
      equipment: expenses.filter(e => e.category === 'equipment').reduce((sum, e) => sum + e.amount, 0),
      staff: totalTeamPayments,
      other: expenses.filter(e => !['venue', 'marketing', 'equipment'].includes(e.category)).reduce((sum, e) => sum + e.amount, 0)
    };

    // Calculate profit
    const totalCosts = totalDJPayments + totalTeamPayments + totalExpenses;
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const summary: EventFinancialSummary = {
      eventInstanceId,
      eventName: instance.eventName,
      eventDate: instance.eventDate,
      totalRevenue,
      totalDJPayments,
      totalExpenses,
      totalTeamPayments,
      netProfit,
      profitMargin,
      costBreakdown
    };

    return summary;
  } catch (error) {
    console.error("Error calculating financial summary: ", error);
    throw new Error("Failed to calculate financial summary");
  }
}

// Get financial metrics across all events
export async function getOverallFinancialMetrics() {
  try {
    const summaries = await getAllFinancialSummaries();
    
    const metrics = {
      totalEvents: summaries.length,
      totalRevenue: summaries.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalCosts: summaries.reduce((sum, s) => sum + (s.totalDJPayments + s.totalTeamPayments + s.totalExpenses), 0),
      totalProfit: summaries.reduce((sum, s) => sum + s.netProfit, 0),
      averageProfitMargin: summaries.length > 0 ? summaries.reduce((sum, s) => sum + s.profitMargin, 0) / summaries.length : 0,
      profitableEvents: summaries.filter(s => s.netProfit > 0).length,
      unprofitableEvents: summaries.filter(s => s.netProfit <= 0).length
    };
    
    return metrics;
  } catch (error) {
    console.error("Error getting overall financial metrics: ", error);
    throw new Error("Failed to get overall financial metrics");
  }
}