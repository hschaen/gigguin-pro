"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDJsBulk, DJData } from "@/lib/dj-firestore";
import { checkFirestoreStatus } from "@/lib/firebase-status";
import { Upload, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

interface CSVUploadProps {
  onUploadComplete: () => void;
}

export default function CSVUpload({ onUploadComplete }: CSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  };

  const cleanEmailField = (email: string): string => {
    return email.replace(/^mailto:/, '').trim();
  };

  const cleanPhoneField = (phone: string): string => {
    return phone.replace(/["\n\r]/g, '').trim();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus({ type: null, message: "" });

    // Check if Firestore is available first
    const firestoreStatus = await checkFirestoreStatus();
    if (!firestoreStatus.available) {
      setUploadStatus({
        type: "error",
        message: firestoreStatus.error || "Database not available"
      });
      setIsUploading(false);
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      // Skip header row and process data
      const djsData: Omit<DJData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const columns = parseCSVLine(line);
        
        // Skip if DJ name is empty
        if (!columns[0] || columns[0].trim() === '') continue;
        
        const djData = {
          djName: columns[0]?.trim() || '',
          fullName: columns[1]?.trim() || '',
          phone: cleanPhoneField(columns[2] || ''),
          email: cleanEmailField(columns[3] || ''),
          instagram: columns[4]?.trim() || '',
          eventsPlayed: columns[5]?.trim() || '',
          averageGuestList: columns[6]?.trim() || '',
          notes: columns[7]?.trim() || ''
        };
        
        djsData.push(djData);
      }
      
      if (djsData.length === 0) {
        setUploadStatus({
          type: "error",
          message: "No valid DJ data found in the CSV file."
        });
        return;
      }
      
      // Upload in batches to avoid rate limits
      const BATCH_SIZE = 10;
      for (let i = 0; i < djsData.length; i += BATCH_SIZE) {
        const batch = djsData.slice(i, i + BATCH_SIZE);
        await createDJsBulk(batch);
        
        // Small delay between batches
        if (i + BATCH_SIZE < djsData.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setUploadStatus({
        type: "success",
        message: `Successfully uploaded ${djsData.length} DJs to the database!`
      });
      
      onUploadComplete();
      
    } catch (error) {
      console.error("CSV upload error:", error);
      setUploadStatus({
        type: "error",
        message: "Failed to upload CSV. Please check the format and try again."
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="h-5 w-5" />
        Upload DJ CSV
      </h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="csvFile">Select CSV File</Label>
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="mt-1"
          />
          <p className="text-sm text-gray-600 mt-1">
            Expected format: DJ Name, Full Name, Phone, Email, Instagram, Events Played, Average Guest List, Notes
          </p>
        </div>
        
        {uploadStatus.type && (
          <div className={`flex items-start gap-2 p-3 rounded-md ${
            uploadStatus.type === "success" 
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {uploadStatus.type === "success" ? (
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div>{uploadStatus.message}</div>
              {uploadStatus.type === "error" && uploadStatus.message.includes("Firestore API") && (
                <div className="mt-2">
                  <a 
                    href="https://console.firebase.google.com/project/dj-booking-tool-cdda5/firestore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Enable Firestore in Firebase Console
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
        {isUploading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Uploading DJs...</p>
          </div>
        )}
      </div>
    </div>
  );
}