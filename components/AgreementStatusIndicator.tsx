"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  ExternalLink,
  Clock,
  Check
} from "lucide-react";
import { AgreementStatus } from "@/lib/dj-agreement-verification";

interface AgreementStatusIndicatorProps {
  status: AgreementStatus;
  variant?: 'badge' | 'full' | 'compact';
  showActionButton?: boolean;
  onSendAgreement?: () => void;
  className?: string;
}

export default function AgreementStatusIndicator({
  status,
  variant = 'badge',
  showActionButton = false,
  onSendAgreement,
  className = ""
}: AgreementStatusIndicatorProps) {
  
  const getStatusConfig = () => {
    if (status.hasAgreement) {
      return {
        icon: CheckCircle,
        text: 'Agreement Sent',
        badgeVariant: 'default' as const,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        icon: AlertTriangle,
        text: 'No Agreement',
        badgeVariant: 'destructive' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (variant === 'badge') {
    return (
      <Badge 
        variant={config.badgeVariant}
        className={`inline-flex items-center space-x-1 ${className}`}
      >
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-sm ${config.color}`}>
          {config.text}
        </span>
      </div>
    );
  }

  // Full variant with detailed information
  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${config.color}`}>
                {config.text}
              </span>
              {status.hasAgreement && status.agreementDate && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(status.agreementDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {status.hasAgreement 
                ? `DJ has received agreement${status.agreementDate ? ` for ${status.agreementDate}` : ''}`
                : 'DJ needs to receive and sign an agreement before assignment'
              }
            </p>
            
            {!status.hasAgreement && showActionButton && (
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 text-xs"
                onClick={onSendAgreement}
              >
                <FileText className="h-3 w-3 mr-1" />
                Send Agreement
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for dropdown options
export function DJDropdownStatus({ 
  status, 
  djName 
}: { 
  status: AgreementStatus; 
  djName: string; 
}) {
  const config = status.hasAgreement 
    ? { icon: CheckCircle, color: 'text-green-600' }
    : { icon: AlertTriangle, color: 'text-amber-600' };
  
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between w-full">
      <span>{djName}</span>
      <Icon className={`h-4 w-4 ${config.color} flex-shrink-0`} />
    </div>
  );
}

// Helper component for assignment warnings
export function AssignmentWarning({ 
  status, 
  onSendAgreement,
  onMarkSentManually,
  isMarkedAsSent
}: { 
  status: AgreementStatus; 
  onSendAgreement?: () => void;
  onMarkSentManually?: () => void;
  isMarkedAsSent?: boolean;
}) {
  if (status.hasAgreement || isMarkedAsSent) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
      <div className="flex items-start space-x-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-800">
            <strong>Warning:</strong> This DJ has not received an agreement for this event.
          </p>
          <div className="flex items-center gap-2 mt-2">
            {onSendAgreement && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={onSendAgreement}
              >
                <FileText className="h-3 w-3 mr-1" />
                Send Agreement Now
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
            {onMarkSentManually && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={onMarkSentManually}
              >
                <Check className="h-3 w-3 mr-1" />
                Sent manually
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}