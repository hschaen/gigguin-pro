import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  StorageReference 
} from "firebase/storage";
import { storage } from "./firebase";

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
}

// Upload a file to Firebase Storage
export async function uploadFile(
  file: File | Blob, 
  path: string, 
  filename?: string
): Promise<UploadResult> {
  try {
    const finalFilename = filename || `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const storageRef = ref(storage, `${path}/${finalFilename}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      filename: finalFilename
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}

// Upload asset image (for asset generator exports)
export async function uploadAsset(
  blob: Blob, 
  templateId: string, 
  format: 'png' | 'jpeg' = 'jpeg'
): Promise<UploadResult> {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `sushi-sundays-${templateId}-${Date.now()}.${format}`;
  const path = `assets/${timestamp}`;
  
  return uploadFile(blob, path, filename);
}

// Delete a file from Firebase Storage
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    console.log("File deleted successfully");
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete file");
  }
}

// Get all files in a directory
export async function listFiles(path: string): Promise<StorageReference[]> {
  try {
    const listRef = ref(storage, path);
    const result = await listAll(listRef);
    return result.items;
  } catch (error) {
    console.error("Error listing files:", error);
    throw new Error("Failed to list files");
  }
}

// Get download URL for a file
export async function getFileURL(filePath: string): Promise<string> {
  try {
    const storageRef = ref(storage, filePath);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error getting file URL:", error);
    throw new Error("Failed to get file URL");
  }
}

// Convert canvas to blob and upload
export async function uploadCanvasAsAsset(
  canvas: HTMLCanvasElement,
  templateId: string,
  format: 'png' | 'jpeg' = 'jpeg',
  quality: number = 0.85
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to convert canvas to blob'));
        return;
      }
      
      try {
        const result = await uploadAsset(blob, templateId, format);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, mimeType, format === 'jpeg' ? quality : undefined);
  });
}