import { Timestamp } from 'firebase/firestore';

// Contract Types
export interface Contract {
  id?: string;
  orgId: string; // Organization that created the contract
  
  // Contract Details
  type: 'dj_performance' | 'venue_rental' | 'sponsorship' | 'vendor' | 'employment' | 'nda' | 'custom';
  templateId?: string; // If created from template
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'viewed' | 'negotiating' | 'signed' | 'active' | 'completed' | 'cancelled' | 'expired';
  
  // Parties
  parties: ContractParty[];
  
  // Event/Booking Reference
  eventId?: string;
  eventInstanceId?: string;
  bookingId?: string;
  venueId?: string;
  djId?: string;
  
  // Contract Content
  sections: ContractSection[];
  terms: ContractTerms;
  
  // Financial Terms
  financial?: FinancialTerms;
  
  // Signatures
  signatures: ContractSignature[];
  signatureRequired: boolean;
  signatureDeadline?: Timestamp;
  
  // Documents
  attachments?: ContractAttachment[];
  
  // Versioning
  version: number;
  previousVersionId?: string;
  amendments?: ContractAmendment[];
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastModifiedBy?: string;
  effectiveDate?: Timestamp;
  expirationDate?: Timestamp;
  completedDate?: Timestamp;
  cancelledDate?: Timestamp;
  
  // Notifications
  reminders?: ContractReminder[];
  lastReminderSent?: Timestamp;
}

// Contract Party
export interface ContractParty {
  id: string;
  type: 'individual' | 'organization';
  role: 'client' | 'vendor' | 'performer' | 'venue' | 'sponsor' | 'other';
  
  // Individual
  name: string;
  email: string;
  phone?: string;
  
  // Organization
  organizationName?: string;
  representativeName?: string;
  representativeTitle?: string;
  
  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Signature Requirements
  mustSign: boolean;
  signatureOrder?: number;
  hasSigned?: boolean;
  signedAt?: Timestamp;
}

// Contract Section
export interface ContractSection {
  id: string;
  title: string;
  order: number;
  content: string; // HTML or Markdown
  isEditable: boolean;
  isRequired: boolean;
  
  // Clauses
  clauses?: ContractClause[];
}

export interface ContractClause {
  id: string;
  title?: string;
  content: string;
  order: number;
  isOptional?: boolean;
  isNegotiable?: boolean;
  
  // Variables for template
  variables?: Record<string, any>;
}

// Contract Terms
export interface ContractTerms {
  // Performance Terms
  performanceDate?: Timestamp;
  performanceTime?: string;
  performanceDuration?: number; // minutes
  soundCheckTime?: string;
  loadInTime?: string;
  
  // Venue Terms
  venueName?: string;
  venueAddress?: string;
  venueCapacity?: number;
  
  // Technical Requirements
  technicalRequirements?: string[];
  equipmentProvided?: string[];
  equipmentRequired?: string[];
  
  // Hospitality
  hospitality?: {
    meals?: boolean;
    drinks?: boolean;
    accommodation?: boolean;
    transportation?: boolean;
    greenRoom?: boolean;
    parking?: boolean;
    guestList?: number;
  };
  
  // Cancellation Policy
  cancellationPolicy?: {
    notice?: number; // days
    fee?: number;
    refundPolicy?: string;
    forceMAjeure?: boolean;
  };
  
  // Additional Terms
  additionalTerms?: string[];
  specialConditions?: string[];
  restrictions?: string[];
}

// Financial Terms
export interface FinancialTerms {
  currency: string;
  
  // Fee Structure
  baseFee?: number;
  performanceFee?: number;
  
  // Additional Fees
  travelExpenses?: number;
  accommodationExpenses?: number;
  equipmentRental?: number;
  additionalFees?: FinancialLineItem[];
  
  // Total
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  
  // Payment Terms
  paymentSchedule: PaymentSchedule[];
  paymentMethod?: 'bank_transfer' | 'check' | 'cash' | 'stripe' | 'paypal' | 'other';
  paymentDetails?: string;
  
  // Deposit
  depositRequired?: boolean;
  depositAmount?: number;
  depositDueDate?: Timestamp;
  depositPaid?: boolean;
  depositPaidDate?: Timestamp;
  
  // Revenue Share
  revenueShare?: {
    type: 'door' | 'bar' | 'merchandise' | 'total';
    percentage?: number;
    minimumGuarantee?: number;
    threshold?: number;
  };
}

export interface FinancialLineItem {
  id: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  isTaxable?: boolean;
}

export interface PaymentSchedule {
  id: string;
  description: string;
  amount: number;
  dueDate: Timestamp;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: Timestamp;
  paymentReference?: string;
}

// Contract Signature
export interface ContractSignature {
  id: string;
  partyId: string;
  partyName: string;
  signatureType: 'electronic' | 'docusign' | 'manual' | 'initials';
  
  // Electronic Signature
  signatureData?: string; // Base64 encoded signature image
  signatureIP?: string;
  signatureDevice?: string;
  signatureBrowser?: string;
  
  // DocuSign Integration
  docusignEnvelopeId?: string;
  docusignStatus?: string;
  
  // Manual Upload
  signatureFileUrl?: string;
  
  // Metadata
  signedAt: Timestamp;
  location?: string;
  witnessName?: string;
  witnessSignature?: string;
  
  // Verification
  isVerified: boolean;
  verificationMethod?: string;
  verificationCode?: string;
}

// Contract Attachment
export interface ContractAttachment {
  id: string;
  name: string;
  type: 'rider' | 'addendum' | 'exhibit' | 'schedule' | 'invoice' | 'receipt' | 'other';
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  isRequired?: boolean;
}

// Contract Amendment
export interface ContractAmendment {
  id: string;
  contractId: string;
  amendmentNumber: number;
  
  // Changes
  type: 'modification' | 'addition' | 'deletion' | 'extension';
  description: string;
  changes: {
    section?: string;
    originalText?: string;
    newText?: string;
    reason?: string;
  }[];
  
  // Approval
  status: 'proposed' | 'approved' | 'rejected' | 'signed';
  proposedBy: string;
  proposedAt: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
  
  // Signatures
  requiresSignature: boolean;
  signatures?: ContractSignature[];
  
  // Effective Date
  effectiveDate?: Timestamp;
}

// Contract Reminder
export interface ContractReminder {
  id: string;
  type: 'signature' | 'payment' | 'expiration' | 'renewal' | 'custom';
  message: string;
  sendTo: string[]; // Email addresses
  sendAt: Timestamp;
  sent: boolean;
  sentAt?: Timestamp;
}

// Contract Template
export interface ContractTemplate {
  id?: string;
  orgId?: string; // Null for system templates
  
  // Template Info
  name: string;
  description?: string;
  type: Contract['type'];
  category?: string;
  tags?: string[];
  
  // Template Content
  sections: ContractSection[];
  defaultTerms?: ContractTerms;
  defaultFinancial?: Partial<FinancialTerms>;
  
  // Variables
  variables?: TemplateVariable[];
  
  // Settings
  isPublic: boolean;
  isSystem: boolean; // System-provided template
  requiresSignature: boolean;
  
  // Usage
  usageCount?: number;
  lastUsed?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
}

export interface TemplateVariable {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'party' | 'financial';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[]; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Contract Activity Log
export interface ContractActivity {
  id?: string;
  contractId: string;
  
  // Activity Details
  type: 'created' | 'edited' | 'sent' | 'viewed' | 'signed' | 'amended' | 'cancelled' | 'expired' | 'reminder_sent' | 'payment_received';
  description: string;
  
  // User Info
  userId?: string;
  userName?: string;
  userEmail?: string;
  
  // Changes (for edits)
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  
  // Metadata
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// Contract Search Filters
export interface ContractSearchFilters {
  orgId?: string;
  status?: Contract['status'][];
  type?: Contract['type'][];
  partyEmail?: string;
  eventId?: string;
  venueId?: string;
  djId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  expiringWithinDays?: number;
  requiresSignature?: boolean;
  hasAmendments?: boolean;
}

// Contract Statistics
export interface ContractStats {
  total: number;
  byStatus: Record<Contract['status'], number>;
  byType: Record<Contract['type'], number>;
  
  // Financial
  totalValue?: number;
  averageValue?: number;
  
  // Signatures
  awaitingSignature: number;
  signedThisMonth: number;
  
  // Expiration
  expiringThisMonth: number;
  expiredCount: number;
  
  // Performance
  averageSigningTime?: number; // hours
  signatureCompletionRate?: number; // percentage
}