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

export interface DJPaymentPreferences {
  preferredMethod: 'stripe' | 'apple_pay' | 'venmo' | 'zelle' | 'cash' | 'check';
  venmoHandle?: string;
  zelleEmail?: string;
  zellePhone?: string;
  bankAccount?: string; // encrypted
  routingNumber?: string; // encrypted
  taxId?: string; // encrypted
  minimumPaymentAmount?: number;
  paymentNotes?: string;
}

export interface DJData {
  id?: string;
  djName: string;
  fullName: string;
  phone: string;
  email: string;
  instagram: string;
  eventsPlayed: string;
  averageGuestList: string;
  notes: string;
  paymentPreferences?: DJPaymentPreferences;
  gigguinUserId?: string; // Link to Gigguin user account
  isGigguinLinked?: boolean; // Quick check for linking status
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection reference
const DJS_COLLECTION = "djs";

// Create a new DJ
export async function createDJ(djData: Omit<DJData, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, DJS_COLLECTION), {
      ...djData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log("DJ created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating DJ: ", error);
    throw new Error("Failed to create DJ");
  }
}

// Bulk create DJs (for CSV import)
export async function createDJsBulk(djsData: Omit<DJData, 'id' | 'createdAt' | 'updatedAt'>[]) {
  try {
    const promises = djsData.map(djData => 
      addDoc(collection(db, DJS_COLLECTION), {
        ...djData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    );
    
    const results = await Promise.all(promises);
    console.log(`${results.length} DJs created successfully`);
    return results.map(result => result.id);
  } catch (error) {
    console.error("Error bulk creating DJs: ", error);
    throw new Error("Failed to bulk create DJs");
  }
}

// Get all DJs
export async function getAllDJs(): Promise<DJData[]> {
  try {
    const q = query(
      collection(db, DJS_COLLECTION), 
      orderBy("djName", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const djs: DJData[] = [];
    
    querySnapshot.forEach((doc) => {
      djs.push({
        id: doc.id,
        ...doc.data()
      } as DJData);
    });
    
    return djs;
  } catch (error) {
    console.error("Error getting DJs: ", error);
    throw new Error("Failed to get DJs");
  }
}

// Get a specific DJ by ID
export async function getDJById(djId: string): Promise<DJData | null> {
  try {
    const docRef = doc(db, DJS_COLLECTION, djId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as DJData;
    } else {
      console.log("No DJ found with ID: ", djId);
      return null;
    }
  } catch (error) {
    console.error("Error getting DJ: ", error);
    throw new Error("Failed to get DJ");
  }
}

// Search DJs by name
export async function searchDJsByName(searchTerm: string): Promise<DJData[]> {
  try {
    const q = query(
      collection(db, DJS_COLLECTION),
      orderBy("djName", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const djs: DJData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as DJData;
      if (
        data.djName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        djs.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return djs;
  } catch (error) {
    console.error("Error searching DJs: ", error);
    throw new Error("Failed to search DJs");
  }
}

// Update a DJ
export async function updateDJ(djId: string, updatedData: Partial<DJData>) {
  try {
    const docRef = doc(db, DJS_COLLECTION, djId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    
    console.log("DJ updated successfully");
  } catch (error) {
    console.error("Error updating DJ: ", error);
    throw new Error("Failed to update DJ");
  }
}

// Update DJ payment preferences
export async function updateDJPaymentPreferences(djId: string, paymentPreferences: DJPaymentPreferences) {
  try {
    const docRef = doc(db, DJS_COLLECTION, djId);
    await updateDoc(docRef, {
      paymentPreferences,
      updatedAt: Timestamp.now()
    });
    
    console.log("DJ payment preferences updated successfully");
  } catch (error) {
    console.error("Error updating DJ payment preferences: ", error);
    throw new Error("Failed to update DJ payment preferences");
  }
}

// Get DJ payment preferences
export async function getDJPaymentPreferences(djId: string): Promise<DJPaymentPreferences | null> {
  try {
    const djData = await getDJById(djId);
    return djData?.paymentPreferences || null;
  } catch (error) {
    console.error("Error getting DJ payment preferences: ", error);
    throw new Error("Failed to get DJ payment preferences");
  }
}

// Delete a DJ
export async function deleteDJ(djId: string) {
  try {
    const docRef = doc(db, DJS_COLLECTION, djId);
    await deleteDoc(docRef);
    
    console.log("DJ deleted successfully");
  } catch (error) {
    console.error("Error deleting DJ: ", error);
    throw new Error("Failed to delete DJ");
  }
}

// Check for duplicate DJ name
export async function checkDuplicateDJName(djName: string): Promise<DJData[]> {
  try {
    const q = query(
      collection(db, DJS_COLLECTION),
      where("djName", "==", djName.trim())
    );
    
    const querySnapshot = await getDocs(q);
    const duplicates: DJData[] = [];
    
    querySnapshot.forEach((doc) => {
      duplicates.push({
        id: doc.id,
        ...doc.data()
      } as DJData);
    });
    
    return duplicates;
  } catch (error) {
    console.error("Error checking for duplicate DJ name: ", error);
    throw new Error("Failed to check for duplicates");
  }
}

// Update DJ's Gigguin linking status
export async function updateDJGigguinLink(djId: string, gigguinUserId: string) {
  try {
    const docRef = doc(db, DJS_COLLECTION, djId);
    await updateDoc(docRef, {
      gigguinUserId,
      isGigguinLinked: true,
      updatedAt: Timestamp.now()
    });
    
    console.log("DJ Gigguin link updated successfully");
  } catch (error) {
    console.error("Error updating DJ Gigguin link: ", error);
    throw new Error("Failed to update DJ Gigguin link");
  }
}

// Remove DJ's Gigguin linking
export async function removeDJGigguinLink(djId: string) {
  try {
    const docRef = doc(db, DJS_COLLECTION, djId);
    await updateDoc(docRef, {
      gigguinUserId: null,
      isGigguinLinked: false,
      updatedAt: Timestamp.now()
    });
    
    console.log("DJ Gigguin link removed successfully");
  } catch (error) {
    console.error("Error removing DJ Gigguin link: ", error);
    throw new Error("Failed to remove DJ Gigguin link");
  }
}

// Find DJs by Gigguin User ID
export async function getDJByGigguinUserId(gigguinUserId: string): Promise<DJData | null> {
  try {
    const q = query(
      collection(db, DJS_COLLECTION),
      where("gigguinUserId", "==", gigguinUserId),
      where("isGigguinLinked", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as DJData;
    }
    
    return null;
  } catch (error) {
    console.error("Error finding DJ by Gigguin User ID: ", error);
    throw new Error("Failed to find DJ by Gigguin User ID");
  }
}

// Get all linked DJs
export async function getLinkedDJs(): Promise<DJData[]> {
  try {
    const q = query(
      collection(db, DJS_COLLECTION),
      where("isGigguinLinked", "==", true),
      orderBy("djName", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const djs: DJData[] = [];
    
    querySnapshot.forEach((doc) => {
      djs.push({
        id: doc.id,
        ...doc.data()
      } as DJData);
    });
    
    return djs;
  } catch (error) {
    console.error("Error getting linked DJs: ", error);
    throw new Error("Failed to get linked DJs");
  }
}

// Parse CSV data helper
export function parseCSVRow(csvRow: string): Omit<DJData, 'id' | 'createdAt' | 'updatedAt'> {
  // This function parses a single CSV row - you'll need to adjust based on your CSV format
  const columns = csvRow.split(',');
  
  return {
    djName: columns[0]?.trim() || '',
    fullName: columns[1]?.trim() || '',
    phone: columns[2]?.trim() || '',
    email: columns[3]?.trim() || '',
    instagram: columns[4]?.trim() || '',
    eventsPlayed: columns[5]?.trim() || '',
    averageGuestList: columns[6]?.trim() || '',
    notes: columns[7]?.trim() || ''
  };
}