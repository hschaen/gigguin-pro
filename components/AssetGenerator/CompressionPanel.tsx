import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/canvas-utils";
import { Download, Archive } from "lucide-react";

interface CompressionPanelProps {
  format: "png" | "jpeg";
  quality: number;
  estimatedSize: number;
  saveToCloud: boolean;
  onFormatChange: (format: "png" | "jpeg") => void;
  onQualityChange: (quality: number) => void;
  onSaveToCloudChange: (saveToCloud: boolean) => void;
  onDownload: () => void;
  onDownloadZip?: () => void;
  isGenerating: boolean;
  showZipOption?: boolean;
}

export default function CompressionPanel({
  format,
  quality,
  estimatedSize,
  saveToCloud,
  onFormatChange,
  onQualityChange,
  onSaveToCloudChange,
  onDownload,
  onDownloadZip,
  isGenerating,
  showZipOption = false,
}: CompressionPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Export Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
        <div>
          <Label className="mb-2 block">Format</Label>
          <div className="flex gap-2">
            <Button
              variant={format === "png" ? "default" : "outline"}
              onClick={() => onFormatChange("png")}
              size="sm"
              className="flex-1"
            >
              PNG
            </Button>
            <Button
              variant={format === "jpeg" ? "default" : "outline"}
              onClick={() => onFormatChange("jpeg")}
              size="sm"
              className="flex-1"
            >
              JPEG
            </Button>
          </div>
        </div>
        
        <div>
          <Label className="mb-2 block">Save to Cloud</Label>
          <Button
            variant={saveToCloud ? "default" : "outline"}
            onClick={() => onSaveToCloudChange(!saveToCloud)}
            size="sm"
            className="w-full"
          >
            {saveToCloud ? "Enabled" : "Disabled"}
          </Button>
        </div>
        
        {format === "jpeg" && (
          <div className="lg:col-span-2">
            <Label htmlFor="quality" className="mb-2 block">
              Quality: {Math.round(quality * 100)}%
            </Label>
            <Slider
              id="quality"
              min={10}
              max={100}
              step={5}
              value={[quality * 100]}
              onValueChange={(value) => onQualityChange(value[0] / 100)}
            />
          </div>
        )}
        
        <div className={format === "png" ? "lg:col-span-2" : ""}>
          <div className="text-sm text-gray-600 mb-2">
            Estimated size: {formatFileSize(estimatedSize)}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onDownload}
              disabled={isGenerating}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Download Image"}
            </Button>
            {showZipOption && onDownloadZip && (
              <Button
                onClick={onDownloadZip}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                <Archive className="mr-2 h-4 w-4" />
                Download Zip
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}