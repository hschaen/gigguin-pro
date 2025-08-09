import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// Check if Firestore is available and configured
export async function checkFirestoreStatus(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    // Try a simple read operation to test connectivity
    const testDocRef = doc(db, 'test', 'connectivity');
    await getDoc(testDocRef);
    return { available: true };
  } catch (error: any) {
    console.log("Firestore not available:", error?.message);
    
    if (error?.message?.includes('PERMISSION_DENIED') || 
        error?.message?.includes('has not been used') ||
        error?.code === 'permission-denied') {
      return { 
        available: false, 
        error: "Firestore API is not enabled. Please enable it in your Firebase Console." 
      };
    }
    
    return { 
      available: false, 
      error: "Firestore connection failed. Check your Firebase configuration." 
    };
  }
}