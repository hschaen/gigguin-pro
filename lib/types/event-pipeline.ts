import { Timestamp } from 'firebase/firestore';

export type EventStage = 'hold' | 'offer' | 'confirmed' | 'marketing' | 'completed' | 'cancelled';

export interface EventPipeline {
  id?: string;
  eventId: string;
  orgId: string;
  stage: EventStage;
  previousStage?: EventStage;
  stageHistory: StageTransition[];
  
  // Hold stage fields
  holdExpiresAt?: Timestamp;
  holdNotes?: string;
  
  // Offer stage fields
  offerSentAt?: Timestamp;
  offerExpiresAt?: Timestamp;
  offerAmount?: number;
  offerTerms?: string;
  
  // Confirmed stage fields
  confirmedAt?: Timestamp;
  contractSigned?: boolean;
  depositReceived?: boolean;
  
  // Marketing stage fields
  marketingStartedAt?: Timestamp;
  flyerGenerated?: boolean;
  socialMediaScheduled?: boolean;
  ticketLinkActive?: boolean;
  
  // Completed stage fields
  completedAt?: Timestamp;
  finalAttendance?: number;
  finalRevenue?: number;
  settlementComplete?: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface StageTransition {
  from: EventStage;
  to: EventStage;
  transitionedAt: Timestamp;
  transitionedBy: string;
  notes?: string;
  automatic?: boolean;
}

export interface EventWithPipeline {
  id?: string;
  name: string;
  date: Timestamp;
  venueId: string;
  orgId: string;
  pipeline?: EventPipeline;
  djBookings?: DJBooking[];
  description?: string;
  capacity?: number;
  ticketPrice?: number;
  status: 'draft' | 'published' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DJBooking {
  djId: string;
  djName: string;
  djEmail?: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  fee: number;
  setTime?: string;
  setDuration?: number;
  notes?: string;
  confirmedAt?: Timestamp;
}

// Stage configuration with rules and automation
export const STAGE_CONFIG: Record<EventStage, {
  label: string;
  color: string;
  icon: string;
  nextStages: EventStage[];
  requiredFields?: string[];
  automations?: {
    onEnter?: string[];
    onExit?: string[];
    conditions?: string[];
  };
}> = {
  hold: {
    label: 'Hold',
    color: 'yellow',
    icon: 'Clock',
    nextStages: ['offer', 'cancelled'],
    requiredFields: ['holdExpiresAt'],
    automations: {
      onEnter: ['sendHoldConfirmation', 'scheduleHoldExpiry'],
      conditions: ['checkVenueAvailability']
    }
  },
  offer: {
    label: 'Offer',
    color: 'blue',
    icon: 'Send',
    nextStages: ['confirmed', 'hold', 'cancelled'],
    requiredFields: ['offerAmount', 'offerExpiresAt'],
    automations: {
      onEnter: ['sendOfferEmail', 'scheduleOfferReminder', 'scheduleOfferExpiry'],
      onExit: ['cancelOfferReminder']
    }
  },
  confirmed: {
    label: 'Confirmed',
    color: 'green',
    icon: 'CheckCircle',
    nextStages: ['marketing', 'cancelled'],
    requiredFields: ['contractSigned'],
    automations: {
      onEnter: ['sendConfirmationEmail', 'createCalendarEvent', 'requestDeposit'],
      conditions: ['checkContractSigned', 'checkDepositReceived']
    }
  },
  marketing: {
    label: 'Marketing',
    color: 'purple',
    icon: 'Megaphone',
    nextStages: ['completed'],
    automations: {
      onEnter: ['generateMarketingAssets', 'schedulePromoReminders', 'activateTicketing']
    }
  },
  completed: {
    label: 'Completed',
    color: 'gray',
    icon: 'CheckCircle2',
    nextStages: [],
    requiredFields: ['finalAttendance', 'settlementComplete'],
    automations: {
      onEnter: ['processSettlement', 'sendThankYouEmail', 'requestReviews']
    }
  },
  cancelled: {
    label: 'Cancelled',
    color: 'red',
    icon: 'XCircle',
    nextStages: [],
    automations: {
      onEnter: ['sendCancellationNotice', 'processRefunds', 'releaseVenueHold']
    }
  }
};

// Helper functions for stage management
export function canTransitionTo(currentStage: EventStage, targetStage: EventStage): boolean {
  return STAGE_CONFIG[currentStage].nextStages.includes(targetStage);
}

export function getStageProgress(stage: EventStage): number {
  const stageOrder: EventStage[] = ['hold', 'offer', 'confirmed', 'marketing', 'completed'];
  const index = stageOrder.indexOf(stage);
  return index === -1 ? 0 : ((index + 1) / stageOrder.length) * 100;
}

export function getStageColor(stage: EventStage): string {
  return STAGE_CONFIG[stage].color;
}

export function getStageIcon(stage: EventStage): string {
  return STAGE_CONFIG[stage].icon;
}