"use client";

import { Badge } from "@/components/ui/badge";
import { DJAssignment } from "@/lib/event-instances-firestore";

interface PaymentStatusBadgeProps {
  paymentStatus?: DJAssignment['paymentStatus'] | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  className?: string;
}

function PaymentStatusBadge({ paymentStatus, className }: PaymentStatusBadgeProps) {
  const getStatusVariant = (status?: DJAssignment['paymentStatus'] | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled') => {
    switch (status) {
      case 'completed':
        return 'default'; // Green
      case 'pending':
        return 'secondary'; // Yellow/Gray
      case 'processing':
        return 'outline'; // Blue outline
      case 'failed':
        return 'destructive'; // Red
      case 'overdue':
        return 'destructive'; // Red
      case 'cancelled':
        return 'destructive'; // Red
      case 'not_created':
      default:
        return 'outline'; // Gray outline
    }
  };

  const getStatusText = (status?: DJAssignment['paymentStatus'] | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled') => {
    switch (status) {
      case 'completed':
        return 'Paid';
      case 'pending':
        return 'Payment Due';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'overdue':
        return 'Overdue';
      case 'cancelled':
        return 'Cancelled';
      case 'not_created':
      default:
        return 'No Payment';
    }
  };

  return (
    <Badge 
      variant={getStatusVariant(paymentStatus)} 
      className={className}
    >
      {getStatusText(paymentStatus)}
    </Badge>
  );
}

export default PaymentStatusBadge;