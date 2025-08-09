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

export interface PaymentRecord {
  id?: string;
  djId: string;
  djName: string;
  djEmail: string;
  eventInstanceId: string;
  eventName: string;
  eventDate: string;
  amount: number;
  paymentMethod: 'stripe' | 'apple_pay' | 'venmo' | 'zelle' | 'cash' | 'check' | 'manual';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  stripePaymentIntentId?: string;
  manualPaymentNote?: string;
  paidAt?: Timestamp;
  dueDate: Timestamp;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PaymentNotification {
  id?: string;
  djId: string;
  paymentRecordId: string;
  type: '7_day' | '14_day' | '30_day' | 'overdue';
  sentAt: Timestamp;
  acknowledged: boolean;
  createdAt?: Timestamp;
}

// Collection references
const PAYMENTS_COLLECTION = "payments";
const PAYMENT_NOTIFICATIONS_COLLECTION = "payment-notifications";

// Create a new payment record
export async function createPaymentRecord(paymentData: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
      ...paymentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("Payment record created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating payment record: ", error);
    throw new Error("Failed to create payment record");
  }
}

// Get all payment records
export async function getAllPaymentRecords(): Promise<PaymentRecord[]> {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION), 
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const payments: PaymentRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      } as PaymentRecord);
    });
    
    return payments;
  } catch (error) {
    console.error("Error getting payment records: ", error);
    throw new Error("Failed to get payment records");
  }
}

// Get payment records by DJ ID
export async function getPaymentRecordsByDJId(djId: string): Promise<PaymentRecord[]> {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where("djId", "==", djId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const payments: PaymentRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      } as PaymentRecord);
    });
    
    return payments;
  } catch (error) {
    console.error("Error getting payment records by DJ ID: ", error);
    throw new Error("Failed to get payment records by DJ ID");
  }
}

// Get payment records by event instance ID
export async function getPaymentRecordsByEventInstanceId(eventInstanceId: string): Promise<PaymentRecord[]> {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where("eventInstanceId", "==", eventInstanceId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const payments: PaymentRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      } as PaymentRecord);
    });
    
    return payments;
  } catch (error) {
    console.error("Error getting payment records by event instance ID: ", error);
    throw new Error("Failed to get payment records by event instance ID");
  }
}

// Get pending payments (for notifications)
export async function getPendingPayments(): Promise<PaymentRecord[]> {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where("status", "==", "pending"),
      orderBy("dueDate", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const payments: PaymentRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      } as PaymentRecord);
    });
    
    return payments;
  } catch (error) {
    console.error("Error getting pending payments: ", error);
    throw new Error("Failed to get pending payments");
  }
}

// Get overdue payments
export async function getOverduePayments(): Promise<PaymentRecord[]> {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where("status", "==", "pending"),
      where("dueDate", "<", now),
      orderBy("dueDate", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const payments: PaymentRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      } as PaymentRecord);
    });
    
    return payments;
  } catch (error) {
    console.error("Error getting overdue payments: ", error);
    throw new Error("Failed to get overdue payments");
  }
}

// Get a specific payment record by ID
export async function getPaymentRecordById(paymentId: string): Promise<PaymentRecord | null> {
  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as PaymentRecord;
    } else {
      console.log("No payment record found with ID: ", paymentId);
      return null;
    }
  } catch (error) {
    console.error("Error getting payment record: ", error);
    throw new Error("Failed to get payment record");
  }
}

// Update a payment record
export async function updatePaymentRecord(paymentId: string, updatedData: Partial<PaymentRecord>) {
  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("Payment record updated successfully");
  } catch (error) {
    console.error("Error updating payment record: ", error);
    throw new Error("Failed to update payment record");
  }
}

// Mark payment as completed
export async function markPaymentCompleted(paymentId: string, paymentMethod?: string, notes?: string) {
  try {
    const updateData: Partial<PaymentRecord> = {
      status: 'completed',
      paidAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod as PaymentRecord['paymentMethod'];
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(docRef, updateData);
    
    console.log("Payment marked as completed successfully");
  } catch (error) {
    console.error("Error marking payment as completed: ", error);
    throw new Error("Failed to mark payment as completed");
  }
}

// Record manual payment
export async function recordManualPayment(paymentId: string, paymentMethod: string, note: string) {
  try {
    const updateData: Partial<PaymentRecord> = {
      status: 'completed',
      paymentMethod: paymentMethod as PaymentRecord['paymentMethod'],
      manualPaymentNote: note,
      paidAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(docRef, updateData);
    
    console.log("Manual payment recorded successfully");
  } catch (error) {
    console.error("Error recording manual payment: ", error);
    throw new Error("Failed to record manual payment");
  }
}

// Delete a payment record
export async function deletePaymentRecord(paymentId: string) {
  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await deleteDoc(docRef);
    
    console.log("Payment record deleted successfully");
  } catch (error) {
    console.error("Error deleting payment record: ", error);
    throw new Error("Failed to delete payment record");
  }
}

// Payment notification functions

// Create a payment notification
export async function createPaymentNotification(notificationData: Omit<PaymentNotification, 'id' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, PAYMENT_NOTIFICATIONS_COLLECTION), {
      ...notificationData,
      createdAt: Timestamp.now()
    });
    
    console.log("Payment notification created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating payment notification: ", error);
    throw new Error("Failed to create payment notification");
  }
}

// Get payment notifications by payment record ID
export async function getPaymentNotificationsByPaymentId(paymentRecordId: string): Promise<PaymentNotification[]> {
  try {
    const q = query(
      collection(db, PAYMENT_NOTIFICATIONS_COLLECTION),
      where("paymentRecordId", "==", paymentRecordId),
      orderBy("sentAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: PaymentNotification[] = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as PaymentNotification);
    });
    
    return notifications;
  } catch (error) {
    console.error("Error getting payment notifications: ", error);
    throw new Error("Failed to get payment notifications");
  }
}

// Acknowledge a payment notification
export async function acknowledgePaymentNotification(notificationId: string) {
  try {
    const docRef = doc(db, PAYMENT_NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, {
      acknowledged: true
    });
    
    console.log("Payment notification acknowledged successfully");
  } catch (error) {
    console.error("Error acknowledging payment notification: ", error);
    throw new Error("Failed to acknowledge payment notification");
  }
}

// Get payment statistics
export async function getPaymentStatistics() {
  try {
    const allPayments = await getAllPaymentRecords();
    
    const stats = {
      totalPayments: allPayments.length,
      completedPayments: allPayments.filter(p => p.status === 'completed').length,
      pendingPayments: allPayments.filter(p => p.status === 'pending').length,
      overduePayments: 0,
      totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
      completedAmount: allPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: allPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    };
    
    // Calculate overdue payments
    const now = Timestamp.now();
    stats.overduePayments = allPayments.filter(p => 
      p.status === 'pending' && p.dueDate.toMillis() < now.toMillis()
    ).length;
    
    return stats;
  } catch (error) {
    console.error("Error getting payment statistics: ", error);
    throw new Error("Failed to get payment statistics");
  }
}