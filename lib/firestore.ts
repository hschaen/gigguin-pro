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
import { gigguinNotificationService } from './gigguin-notification-service';

export interface BookingData {
  id?: string;
  djId?: string; // Reference to the DJ from the DJs collection
  djLegalName: string;
  djName: string;
  email: string;
  phone: string;
  setStartTime: string;
  eventDate: string;
  paymentAmount: string;
  agreementSentManually?: boolean; // If true, skip automated email
  guestListLink?: string; // Guest list link from webhook response
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection reference
const BOOKINGS_COLLECTION = "bookings";

// Create a new booking
export async function createBooking(bookingData: Omit<BookingData, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
      ...bookingData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("Booking created with ID: ", docRef.id);

    // Send notification to Gigguin if DJ has linked account
    try {
      const fullBookingData = { ...bookingData, id: docRef.id } as BookingData;
      await gigguinNotificationService.sendBookingRequest(docRef.id, fullBookingData);
    } catch (notificationError) {
      console.error('Error sending Gigguin notification:', notificationError);
      // Don't fail the booking creation if notification fails
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating booking: ", error);
    throw new Error("Failed to create booking");
  }
}

// Get all bookings
export async function getAllBookings(): Promise<BookingData[]> {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION), 
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const bookings: BookingData[] = [];
    
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      } as BookingData);
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting bookings: ", error);
    throw new Error("Failed to get bookings");
  }
}

// Get a specific booking by ID
export async function getBooking(bookingId: string): Promise<BookingData | null> {
  return getBookingById(bookingId);
}

export async function getBookingById(bookingId: string): Promise<BookingData | null> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as BookingData;
    } else {
      console.log("No booking found with ID: ", bookingId);
      return null;
    }
  } catch (error) {
    console.error("Error getting booking: ", error);
    throw new Error("Failed to get booking");
  }
}

// Update a booking
export async function updateBooking(bookingId: string, updatedData: Partial<BookingData>) {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    
    // Get the current booking data to send complete info to Gigguin
    const currentBooking = await getBookingById(bookingId);
    if (!currentBooking) {
      throw new Error("Booking not found");
    }
    
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("Booking updated successfully");
    
    // Send update notification to Gigguin if DJ has linked account
    try {
      const fullBookingData = { ...currentBooking, ...updatedData, id: bookingId } as BookingData;
      await gigguinNotificationService.sendBookingUpdated(bookingId, fullBookingData);
    } catch (notificationError) {
      console.error('Error sending Gigguin update notification:', notificationError);
      // Don't fail the booking update if notification fails
    }
  } catch (error) {
    console.error("Error updating booking: ", error);
    throw new Error("Failed to update booking");
  }
}

// Delete a booking (sends cancellation to Gigguin)
export async function deleteBooking(bookingId: string) {
  try {
    // Get the booking data before deleting to send to Gigguin
    const bookingData = await getBookingById(bookingId);
    
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await deleteDoc(docRef);
    
    console.log("Booking deleted successfully");
    
    // Send cancellation notification to Gigguin if DJ has linked account
    if (bookingData) {
      try {
        await gigguinNotificationService.sendBookingCancellation(bookingId, bookingData);
      } catch (notificationError) {
        console.error('Error sending Gigguin cancellation notification:', notificationError);
        // Don't fail the booking deletion if notification fails
      }
    }
  } catch (error) {
    console.error("Error deleting booking: ", error);
    throw new Error("Failed to delete booking");
  }
}

// Get bookings by date range
export async function getBookingsByDateRange(startDate: Date, endDate: Date): Promise<BookingData[]> {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where("eventDate", ">=", startDate.toISOString().split('T')[0]),
      where("eventDate", "<=", endDate.toISOString().split('T')[0]),
      orderBy("eventDate", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const bookings: BookingData[] = [];
    
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      } as BookingData);
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting bookings by date range: ", error);
    throw new Error("Failed to get bookings by date range");
  }
}

// Get bookings for a specific date
export async function getBookingsByDate(eventDate: string): Promise<BookingData[]> {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where("eventDate", "==", eventDate),
      orderBy("setStartTime", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const bookings: BookingData[] = [];
    
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      } as BookingData);
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting bookings by date: ", error);
    throw new Error("Failed to get bookings by date");
  }
}