"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import TemplateSelector, { Template, templates } from "./TemplateSelector";
import TextControls from "./TextControls";
import CanvasPreview from "./CanvasPreview";
import CompressionPanel from "./CompressionPanel";
import { TextElement, compressImage } from "@/lib/canvas-utils";
import { uploadCanvasAsAsset } from "@/lib/firebase-storage";
import { getEventById, EventData } from "@/lib/events-firestore";
import { checkFirestoreStatus } from "@/lib/firebase-status";
import { getEventInstancesByEventId, assignAssetToInstance, EventInstanceData } from "@/lib/event-instances-firestore";

// Function to get the next Sunday
const getNextSunday = () => {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7 || 7);
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'long', 
    day: 'numeric' 
  };
  return nextSunday.toLocaleDateString('en-US', options).toUpperCase();
};

export default function AssetGenerator() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const instanceId = searchParams.get('instanceId');
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const [currentCanvas, setCurrentCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Instance assignment state
  const [instances, setInstances] = useState<EventInstanceData[]>([]);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(instanceId || '');
  const [lastGeneratedAssetUrl, setLastGeneratedAssetUrl] = useState<string | null>(null);
  const [isAssigningAsset, setIsAssigningAsset] = useState(false);
  
  // Export settings
  const [format, setFormat] = useState<"png" | "jpeg">("jpeg");
  const [quality, setQuality] = useState(0.85);
  const [saveToCloud, setSaveToCloud] = useState(false);

  // Text elements
  const [dateText, setDateText] = useState<TextElement>({
    id: "date",
    text: getNextSunday(),
    x: 500,
    y: 300,
    fontSize: 48,
    fontWeight: "700",
    color: "#ffffff",
  });

  const [djNamesText, setDjNamesText] = useState<TextElement>({
    id: "djnames",
    text: "DJ NAME 1\nDJ NAME 2\nDJ NAME 3\nDJ NAME 4",
    x: 500,
    y: 600,
    fontSize: 60,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 60,
  });

  // Load event data and instances if eventId is provided
  useEffect(() => {
    const loadEventAndInstances = async () => {
      if (!eventId) return;
      
      setLoading(true);
      try {
        const firestoreStatus = await checkFirestoreStatus();
        if (!firestoreStatus.available) {
          console.log("Firestore not available:", firestoreStatus.error);
          return;
        }

        const [eventData, instancesData] = await Promise.all([
          getEventById(eventId),
          getEventInstancesByEventId(eventId)
        ]);
        
        if (eventData) {
          setEvent(eventData);
        }
        
        setInstances(instancesData);

        // If instanceId is provided, populate with instance-specific data
        if (instanceId) {
          const currentInstance = instancesData.find(inst => inst.id === instanceId);
          if (currentInstance) {
            // Set date from instance (month and day only, uppercase)
            // Parse date as local date to avoid timezone issues
            const dateParts = currentInstance.eventDate.split('-');
            const instanceDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            const options: Intl.DateTimeFormatOptions = { 
              month: 'long', 
              day: 'numeric' 
            };
            const formattedDate = instanceDate.toLocaleDateString('en-US', options).toUpperCase();
            
            setDateText(prev => ({
              ...prev,
              text: formattedDate
            }));

            // Set DJ names from assignments, sorted by set time (earliest at bottom, latest at top)
            if (currentInstance.djAssignments && currentInstance.djAssignments.length > 0) {
              const sortedDJs = currentInstance.djAssignments
                .slice() // Create a copy to avoid mutating original array
                .sort((a, b) => {
                  // Convert time strings to comparable format (assuming HH:MM format)
                  const timeA = a.setStartTime || '23:59'; // Default to late time if no time set
                  const timeB = b.setStartTime || '23:59';
                  
                  // Compare times - we want latest first (descending order)
                  return timeB.localeCompare(timeA);
                })
                .map(assignment => assignment.djName.toUpperCase()) // Convert to uppercase
                .join('\n');
              
              setDjNamesText(prev => ({
                ...prev,
                text: sortedDJs
              }));
            }
          }
        }
      } catch (error) {
        console.error("Failed to load event and instances:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEventAndInstances();
  }, [eventId, instanceId]);

  // Update text position based on template
  useEffect(() => {
    // Load the template image to get actual dimensions
    const img = new Image();
    img.onload = () => {
      const centerX = img.width / 2;
      
      // Adjust default positions based on template aspect ratio and screenshot
      // Date: move up additional 5px, DJ names: keep previous position
      if (selectedTemplate.aspectRatio === "9:16") {
        // Story format - taller, larger fonts, adjusted positioning
        setDateText(prev => ({ 
          ...prev, 
          x: centerX - 8, 
          y: (img.height * 0.20) + 60 + 40 - 10 - 5 - 2 - 2,
          fontSize: 60
        }));
        setDjNamesText(prev => ({ 
          ...prev, 
          x: centerX, 
          y: (img.height * 0.55) + 60 - 100 - 10 - 200 + 20,
          fontSize: 72,
          lineHeight: 75
        }));
      } else if (selectedTemplate.aspectRatio === "4:5") {
        // Portrait format - date down 20px, DJ names up 50px from current position
        setDateText(prev => ({ 
          ...prev, 
          x: centerX - 2, 
          y: (img.height * 0.22) + 60 + 40 - 10 - 5 + 20,
          fontSize: 48
        }));
        setDjNamesText(prev => ({ 
          ...prev, 
          x: centerX, 
          y: (img.height * 0.58) + 60 - 100 - 10 - 50,
          fontSize: 60,
          lineHeight: 60
        }));
      } else {
        // Square format - based on screenshot positioning
        setDateText(prev => ({ 
          ...prev, 
          x: centerX - 2, 
          y: (img.height * 0.20) + 60 + 40 - 10 - 5,
          fontSize: 48
        }));
        setDjNamesText(prev => ({ 
          ...prev, 
          x: centerX, 
          y: (img.height * 0.55) + 60 - 100 - 10,
          fontSize: 60,
          lineHeight: 60
        }));
      }
    };
    img.src = selectedTemplate.path;
  }, [selectedTemplate]);

  // Estimate file size when settings change
  useEffect(() => {
    if (!currentCanvas) return;

    const estimateSize = async () => {
      try {
        const blob = await compressImage(currentCanvas, format, quality);
        setEstimatedSize(blob.size);
      } catch (error) {
        console.error("Error estimating size:", error);
      }
    };

    estimateSize();
  }, [currentCanvas, format, quality]);

  const handleTextPositionChange = useCallback((id: string, x: number, y: number) => {
    if (id === "date") {
      setDateText(prev => ({ ...prev, x, y }));
    } else if (id === "djnames") {
      setDjNamesText(prev => ({ ...prev, x, y }));
    }
  }, []);

  const createExportCanvas = (templatePath: string) => {
    return new Promise<HTMLCanvasElement>((resolve, reject) => {
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        exportCanvas.width = img.width;
        exportCanvas.height = img.height;
        exportCtx.drawImage(img, 0, 0);

        // Draw text elements on export canvas
        // Draw date text
        exportCtx.font = `${dateText.fontWeight} ${dateText.fontSize}px 'Montserrat', sans-serif`;
        exportCtx.fillStyle = dateText.color;
        exportCtx.textAlign = "center";
        exportCtx.textBaseline = "middle";
        exportCtx.fillText(dateText.text, dateText.x, dateText.y);

        // Draw DJ names
        exportCtx.font = `${djNamesText.fontWeight} ${djNamesText.fontSize}px 'Montserrat', sans-serif`;
        exportCtx.fillStyle = djNamesText.color;
        const lines = djNamesText.text.split("\n");
        const lineHeight = djNamesText.lineHeight || djNamesText.fontSize * 1.2;
        lines.forEach((line, index) => {
          const yOffset = (index - (lines.length - 1) / 2) * lineHeight;
          exportCtx.fillText(line, djNamesText.x, djNamesText.y + yOffset);
        });

        resolve(exportCanvas);
      };
      img.onerror = () => reject(new Error('Failed to load template image'));
      img.src = templatePath;
    });
  };

  const handleDownload = async () => {
    if (!currentCanvas) return;

    setIsGenerating(true);
    try {
      const exportCanvas = await createExportCanvas(selectedTemplate.path);
      const blob = await compressImage(exportCanvas, format, quality);
      
      // Save to Firebase Storage if enabled
      let assetUrl: string | null = null;
      if (saveToCloud) {
        try {
          const uploadResult = await uploadCanvasAsAsset(exportCanvas, selectedTemplate.id, format, quality);
          console.log("Asset saved to cloud:", uploadResult.url);
          assetUrl = uploadResult.url;
          setLastGeneratedAssetUrl(assetUrl);
        } catch (cloudError) {
          console.warn("Failed to save to cloud, using dummy URL for testing:", cloudError);
          // For development: create a dummy URL if cloud save fails
          const dummyUrl = `https://example.com/dummy-asset-${selectedTemplate.id}-${Date.now()}.${format}`;
          setLastGeneratedAssetUrl(dummyUrl);
          alert("Cloud save failed, using dummy URL for testing. Check Firebase Storage rules.");
        }
      }
      
      // Download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const eventName = event?.name ? event.name.toLowerCase().replace(/\s+/g, '-') : 'event';
      a.download = `${eventName}-${selectedTemplate.id}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("Failed to download image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAssignToInstance = async () => {
    if (!lastGeneratedAssetUrl || !selectedInstanceId) {
      alert("Please generate and save an asset to cloud first, then select an instance.");
      return;
    }

    setIsAssigningAsset(true);
    try {
      await assignAssetToInstance(
        selectedInstanceId, 
        lastGeneratedAssetUrl, 
        selectedTemplate.id, 
        selectedTemplate.aspectRatio
      );
      alert("Asset successfully assigned to instance!");
      setShowInstanceModal(false);
    } catch (error) {
      console.error("Error assigning asset:", error);
      alert("Failed to assign asset to instance. Please try again.");
    } finally {
      setIsAssigningAsset(false);
    }
  };

  const handleShowInstanceModal = () => {
    if (!lastGeneratedAssetUrl) {
      // For testing: create a dummy URL if no cloud URL exists
      const dummyUrl = `https://example.com/dummy-asset-${Date.now()}.jpeg`;
      setLastGeneratedAssetUrl(dummyUrl);
      alert("Using dummy URL for testing - Firebase Storage needs to be configured.");
    }
    setShowInstanceModal(true);
  };


  return (
    <>
      {/* Add Montserrat font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      
      <div className="space-y-6">
        {/* Event Info */}
        {event && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{event.name}</h2>
                <p className="text-sm text-gray-600">{event.venue}</p>
                {instanceId && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Auto-populated from instance
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {instanceId && (
                  <Link href={`/events/instances/${instanceId}`} className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    Back to Instance
                  </Link>
                )}
                <Link href={`/events/${event.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Back to Event
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Top Row - Template Selector */}
        <TemplateSelector
          selectedTemplate={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
        />
        
        {/* Main Content - Canvas and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Text Controls */}
          <div className="lg:col-span-1">
            <TextControls
              dateText={dateText}
              djNamesText={djNamesText}
              onDateChange={(updates) => setDateText(prev => ({ ...prev, ...updates }))}
              onDjNamesChange={(updates) => setDjNamesText(prev => ({ ...prev, ...updates }))}
            />
          </div>
          
          {/* Right Column - Large Canvas Preview */}
          <div className="lg:col-span-2">
            <CanvasPreview
              templatePath={selectedTemplate.path}
              textElements={[dateText, djNamesText]}
              onTextPositionChange={handleTextPositionChange}
              onCanvasReady={setCurrentCanvas}
            />
          </div>
        </div>
        
        {/* Bottom Row - Export Settings */}
        <CompressionPanel
          format={format}
          quality={quality}
          estimatedSize={estimatedSize}
          saveToCloud={saveToCloud}
          onFormatChange={setFormat}
          onQualityChange={setQuality}
          onSaveToCloudChange={setSaveToCloud}
          onDownload={handleDownload}
          isGenerating={isGenerating}
        />

        {/* Asset Assignment */}
        {instances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assign to Event Instance</CardTitle>
              <CardDescription>
                Assign generated assets to specific event instances for easy access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {lastGeneratedAssetUrl ? (
                      <span className="text-green-600">✓ Asset saved to cloud and ready to assign</span>
                    ) : (
                      "Generate and save to cloud to assign to an instance"
                    )}
                  </p>
                </div>
                <Button 
                  onClick={handleShowInstanceModal}
                  disabled={!lastGeneratedAssetUrl}
                  variant="outline"
                >
                  Assign to Instance
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instance Selection Modal */}
        {showInstanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Assign Asset to Instance</CardTitle>
                <CardDescription>
                  Select which event instance to assign this asset to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="instanceSelect">Select Instance</Label>
                  <Select
                    value={selectedInstanceId}
                    onValueChange={setSelectedInstanceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an instance" />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((instance) => {
                        // Parse date as local date to avoid timezone issues
                        const dateParts = instance.eventDate.split('-');
                        const instanceDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                        const formattedDate = instanceDate.toLocaleDateString();
                        
                        return (
                          <SelectItem key={instance.id} value={instance.id!}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {formattedDate} - {instance.venue}
                              </span>
                              {instance.assetsGenerated && (
                                <Badge variant="secondary" className="ml-2">
                                  {instance.assetUrls?.length || 0} assets
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAssignToInstance}
                    disabled={isAssigningAsset || !selectedInstanceId}
                    className="flex-1"
                  >
                    {isAssigningAsset ? "Assigning..." : "Assign Asset"}
                  </Button>
                  <Button 
                    onClick={() => setShowInstanceModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}