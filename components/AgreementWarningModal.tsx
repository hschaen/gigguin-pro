"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  X 
} from "lucide-react";
import { DJData } from "@/lib/dj-firestore";
import { getBookingFormUrl } from "@/lib/dj-agreement-verification";

interface AgreementWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  onSendAgreement: () => void;
  dj: DJData;
  eventDate: string;
  eventName: string;
}

export default function AgreementWarningModal({
  isOpen,
  onClose,
  onProceed,
  onSendAgreement,
  dj,
  eventDate,
  eventName
}: AgreementWarningModalProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  if (!isOpen) return null;

  const handleSendAgreement = () => {
    setIsNavigating(true);
    const bookingUrl = getBookingFormUrl(dj, eventDate);
    window.open(bookingUrl, '_blank');
    onSendAgreement();
  };

  const formatEventDate = (dateString: string) => {
    const dateParts = dateString.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <CardTitle className="text-lg">Agreement Required</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            This DJ has not received an agreement for this event
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* DJ Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{dj.djName}</span>
                <Badge variant="outline" className="text-red-600 border-red-600">
                  No Agreement
                </Badge>
              </div>
              {dj.fullName && (
                <p className="text-sm text-gray-600">
                  <strong>Legal Name:</strong> {dj.fullName}
                </p>
              )}
              {dj.email && (
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {dj.email}
                </p>
              )}
              {dj.phone && (
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> {dj.phone}
                </p>
              )}
            </div>
          </div>

          {/* Event Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Event Details</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Event:</strong> {eventName}</p>
              <p><strong>Date:</strong> {formatEventDate(eventDate)}</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Notice</p>
                <p>
                  DJs must receive and sign an agreement before being assigned to events. 
                  This ensures proper legal documentation and payment terms are established.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleSendAgreement}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isNavigating}
            >
              <FileText className="h-4 w-4 mr-2" />
              Send Agreement & Book DJ
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                onClick={onProceed}
                variant="outline" 
                className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Proceed Anyway
              </Button>
              <Button 
                onClick={onClose}
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-500 text-center border-t pt-3">
            <p>
              By proceeding without an agreement, you acknowledge that proper 
              documentation should be completed before the event.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}