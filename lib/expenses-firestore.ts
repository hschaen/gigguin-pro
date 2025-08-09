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

export interface ExpenseData {
  id?: string;
  eventId: string;
  eventInstanceId?: string; // Optional - link to specific instance
  category: 'dj' | 'equipment' | 'venue' | 'marketing' | 'staff' | 'catering' | 'transportation' | 'other';
  description: string;
  amount: number;
  payee?: string;
  isPaid: boolean;
  paidAt?: Timestamp;
  dueDate?: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection reference
const EXPENSES_COLLECTION = "expenses";

// Create a new expense
export async function createExpense(expenseData: Omit<ExpenseData, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
      ...expenseData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("Expense created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating expense: ", error);
    throw new Error("Failed to create expense");
  }
}

// Get all expenses
export async function getAllExpenses(): Promise<ExpenseData[]> {
  try {
    const q = query(
      collection(db, EXPENSES_COLLECTION), 
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: ExpenseData[] = [];
    
    querySnapshot.forEach((doc) => {
      expenses.push({
        id: doc.id,
        ...doc.data()
      } as ExpenseData);
    });
    
    return expenses;
  } catch (error) {
    console.error("Error getting expenses: ", error);
    throw new Error("Failed to get expenses");
  }
}

// Get expenses by event ID
export async function getExpensesByEventId(eventId: string): Promise<ExpenseData[]> {
  try {
    const q = query(
      collection(db, EXPENSES_COLLECTION),
      where("eventId", "==", eventId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: ExpenseData[] = [];
    
    querySnapshot.forEach((doc) => {
      expenses.push({
        id: doc.id,
        ...doc.data()
      } as ExpenseData);
    });
    
    return expenses;
  } catch (error) {
    console.error("Error getting expenses by event ID: ", error);
    throw new Error("Failed to get expenses by event ID");
  }
}

// Get expenses by event instance ID
export async function getExpensesByEventInstanceId(eventInstanceId: string): Promise<ExpenseData[]> {
  try {
    const q = query(
      collection(db, EXPENSES_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: ExpenseData[] = [];
    
    querySnapshot.forEach((doc) => {
      expenses.push({
        id: doc.id,
        ...doc.data()
      } as ExpenseData);
    });
    
    return expenses;
  } catch (error) {
    console.error("Error getting expenses by event instance ID: ", error);
    throw new Error("Failed to get expenses by event instance ID");
  }
}

// Get a specific expense by ID
export async function getExpenseById(expenseId: string): Promise<ExpenseData | null> {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, expenseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ExpenseData;
    } else {
      console.log("No expense found with ID: ", expenseId);
      return null;
    }
  } catch (error) {
    console.error("Error getting expense: ", error);
    throw new Error("Failed to get expense");
  }
}

// Update an expense
export async function updateExpense(expenseId: string, updatedData: Partial<ExpenseData>) {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, expenseId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("Expense updated successfully");
  } catch (error) {
    console.error("Error updating expense: ", error);
    throw new Error("Failed to update expense");
  }
}

// Delete an expense
export async function deleteExpense(expenseId: string) {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, expenseId);
    await deleteDoc(docRef);
    
    console.log("Expense deleted successfully");
  } catch (error) {
    console.error("Error deleting expense: ", error);
    throw new Error("Failed to delete expense");
  }
}

// Calculate total expenses for an event
export async function calculateEventExpenses(eventId: string): Promise<number> {
  try {
    const expenses = await getExpensesByEventId(eventId);
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  } catch (error) {
    console.error("Error calculating event expenses: ", error);
    throw new Error("Failed to calculate event expenses");
  }
}