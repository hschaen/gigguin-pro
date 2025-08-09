"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Zap } from "lucide-react";
import QrScanner from "qr-scanner";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
}

export default function QRScanner({ isOpen, onClose, onScan, title = "Scan QR Code" }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);

  // Initialize scanner when dialog opens
  useEffect(() => {
    if (isOpen && videoRef.current && !scanner) {
      initializeScanner();
    }
    
    return () => {
      if (scanner) {
        scanner.stop();
        scanner.destroy();
        setScanner(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Check if camera is available
  useEffect(() => {
    QrScanner.hasCamera().then(setHasCamera);
  }, []);

  const initializeScanner = async () => {
    if (!videoRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (result.data && result.data !== lastScan) {
            setLastScan(result.data);
            onScan(result.data);
            handleClose(); // Close scanner after successful scan
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment' // Use back camera if available
        }
      );

      await qrScanner.start();
      setScanner(qrScanner);
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start QR scanner:", err);
      setError("Failed to access camera. Please make sure you have granted camera permissions.");
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    if (scanner) {
      scanner.stop();
      scanner.destroy();
      setScanner(null);
    }
    setIsScanning(false);
    setError(null);
    setLastScan(null);
    onClose();
  };

  const handleToggleFlash = () => {
    if (scanner) {
      scanner.toggleFlash().catch(err => {
        console.warn("Flash toggle failed:", err);
      });
    }
  };

  if (!hasCamera) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No camera detected on this device. Please use a device with a camera to scan QR codes.
                </p>
                <Button onClick={handleClose}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-red-600 mb-4">{error}</div>
                  <div className="space-x-2">
                    <Button onClick={initializeScanner}>Try Again</Button>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Camera viewport */}
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg"
                  style={{ objectFit: 'cover' }}
                />
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white rounded-lg w-48 h-48 relative">
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse" />
                      {/* Corner indicators */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                    </div>
                  </div>
                )}
                
                {/* Flash button */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleToggleFlash}
                >
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Instructions */}
              <div className="text-center text-sm text-gray-600">
                <p>Position the QR code within the frame</p>
                <p>The scan will happen automatically</p>
              </div>
              
              {/* Manual close button */}
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleClose}>
                  Cancel Scan
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}