import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import {
  Contract,
  ContractParty,
  ContractSection,
  ContractSignature,
  ContractAttachment,
  ContractAmendment,
  ContractTemplate,
  ContractActivity,
  ContractSearchFilters,
  ContractStats,
  FinancialTerms,
  ContractTerms
} from '@/lib/types/contract';

const CONTRACTS_COLLECTION = 'contracts';
const TEMPLATES_COLLECTION = 'contract-templates';
const ACTIVITIES_COLLECTION = 'contract-activities';

// Contract CRUD Operations

export async function createContract(
  contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<string> {
  try {
    const contract: Omit<Contract, 'id'> = {
      ...contractData,
      version: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, CONTRACTS_COLLECTION), contract);
    
    // Log activity
    await logContractActivity({
      contractId: docRef.id,
      type: 'created',
      description: `Contract "${contractData.title}" created`,
      userId: contractData.createdBy,
      timestamp: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
}

export async function getContractById(contractId: string): Promise<Contract | null> {
  try {
    const docRef = doc(db, CONTRACTS_COLLECTION, contractId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Contract;
    }
    return null;
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
}

export async function updateContract(
  contractId: string,
  updates: Partial<Contract>,
  userId: string
): Promise<void> {
  try {
    const docRef = doc(db, CONTRACTS_COLLECTION, contractId);
    
    // Get current contract for versioning
    const current = await getContractById(contractId);
    if (!current) throw new Error('Contract not found');
    
    // Update contract
    await updateDoc(docRef, {
      ...updates,
      version: current.version + 1,
      lastModifiedBy: userId,
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logContractActivity({
      contractId,
      type: 'edited',
      description: 'Contract updated',
      userId,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    throw error;
  }
}

export async function deleteContract(contractId: string): Promise<void> {
  try {
    const docRef = doc(db, CONTRACTS_COLLECTION, contractId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting contract:', error);
    throw error;
  }
}

// Contract Search & Filtering

export async function searchContracts(filters: ContractSearchFilters): Promise<Contract[]> {
  try {
    let q = query(collection(db, CONTRACTS_COLLECTION));
    
    if (filters.orgId) {
      q = query(q, where('orgId', '==', filters.orgId));
    }
    
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    
    if (filters.type && filters.type.length > 0) {
      q = query(q, where('type', 'in', filters.type));
    }
    
    if (filters.eventId) {
      q = query(q, where('eventId', '==', filters.eventId));
    }
    
    if (filters.venueId) {
      q = query(q, where('venueId', '==', filters.venueId));
    }
    
    if (filters.djId) {
      q = query(q, where('djId', '==', filters.djId));
    }
    
    if (filters.requiresSignature !== undefined) {
      q = query(q, where('signatureRequired', '==', filters.requiresSignature));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const contracts: Contract[] = [];
    
    querySnapshot.forEach((doc) => {
      const contract = {
        id: doc.id,
        ...doc.data()
      } as Contract;
      
      // Apply client-side filters
      if (filters.partyEmail) {
        const hasParty = contract.parties.some(p => p.email === filters.partyEmail);
        if (!hasParty) return;
      }
      
      if (filters.createdAfter) {
        if (contract.createdAt.toDate() < filters.createdAfter) return;
      }
      
      if (filters.createdBefore) {
        if (contract.createdAt.toDate() > filters.createdBefore) return;
      }
      
      if (filters.expiringWithinDays) {
        const daysUntilExpiration = getDaysUntilExpiration(contract);
        if (!daysUntilExpiration || daysUntilExpiration > filters.expiringWithinDays) return;
      }
      
      if (filters.hasAmendments !== undefined) {
        const hasAmendments = contract.amendments && contract.amendments.length > 0;
        if (hasAmendments !== filters.hasAmendments) return;
      }
      
      contracts.push(contract);
    });
    
    return contracts;
  } catch (error) {
    console.error('Error searching contracts:', error);
    throw error;
  }
}

export async function getContractsByParty(partyEmail: string): Promise<Contract[]> {
  try {
    const contracts = await searchContracts({ partyEmail });
    return contracts;
  } catch (error) {
    console.error('Error getting contracts by party:', error);
    throw error;
  }
}

export async function getExpiringContracts(daysAhead: number = 30): Promise<Contract[]> {
  try {
    const contracts = await searchContracts({ expiringWithinDays: daysAhead });
    return contracts.filter(c => c.status === 'active');
  } catch (error) {
    console.error('Error getting expiring contracts:', error);
    throw error;
  }
}

// Contract Templates

export async function createContractTemplate(
  templateData: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const template: Omit<ContractTemplate, 'id'> = {
      ...templateData,
      usageCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), template);
    return docRef.id;
  } catch (error) {
    console.error('Error creating contract template:', error);
    throw error;
  }
}

export async function getContractTemplates(
  orgId?: string,
  includeSystem: boolean = true
): Promise<ContractTemplate[]> {
  try {
    let q = query(collection(db, TEMPLATES_COLLECTION));
    
    if (orgId) {
      // Get org templates and system templates
      q = query(q, where('orgId', 'in', [orgId, null]));
    } else if (!includeSystem) {
      // Only get system templates
      q = query(q, where('isSystem', '==', true));
    }
    
    const querySnapshot = await getDocs(q);
    const templates: ContractTemplate[] = [];
    
    querySnapshot.forEach((doc) => {
      const template = {
        id: doc.id,
        ...doc.data()
      } as ContractTemplate;
      
      if (!includeSystem && template.isSystem) return;
      
      templates.push(template);
    });
    
    return templates;
  } catch (error) {
    console.error('Error getting contract templates:', error);
    throw error;
  }
}

export async function getTemplateById(templateId: string): Promise<ContractTemplate | null> {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ContractTemplate;
    }
    return null;
  } catch (error) {
    console.error('Error getting template:', error);
    throw error;
  }
}

export async function createContractFromTemplate(
  templateId: string,
  data: {
    orgId: string;
    parties: ContractParty[];
    variables?: Record<string, any>;
    eventId?: string;
    venueId?: string;
    djId?: string;
    createdBy: string;
  }
): Promise<string> {
  try {
    const template = await getTemplateById(templateId);
    if (!template) throw new Error('Template not found');
    
    // Process template variables
    let sections = template.sections;
    let terms = template.defaultTerms || {};
    let financial = template.defaultFinancial || {};
    
    if (data.variables) {
      sections = processTemplateVariables(sections, data.variables);
      terms = processTemplateVariables(terms, data.variables) as ContractTerms;
      financial = processTemplateVariables(financial, data.variables) as Partial<FinancialTerms>;
    }
    
    const contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      orgId: data.orgId,
      type: template.type,
      templateId,
      title: template.name,
      description: template.description,
      status: 'draft',
      parties: data.parties,
      eventId: data.eventId,
      venueId: data.venueId,
      djId: data.djId,
      sections,
      terms,
      financial: financial as FinancialTerms,
      signatures: [],
      signatureRequired: template.requiresSignature,
      createdBy: data.createdBy
    };
    
    const contractId = await createContract(contract);
    
    // Update template usage
    await updateDoc(doc(db, TEMPLATES_COLLECTION, templateId), {
      usageCount: (template.usageCount || 0) + 1,
      lastUsed: Timestamp.now()
    });
    
    return contractId;
  } catch (error) {
    console.error('Error creating contract from template:', error);
    throw error;
  }
}

// Contract Signatures

export async function addSignature(
  contractId: string,
  signature: Omit<ContractSignature, 'id' | 'signedAt'>
): Promise<void> {
  try {
    const contract = await getContractById(contractId);
    if (!contract) throw new Error('Contract not found');
    
    const newSignature: ContractSignature = {
      ...signature,
      id: generateId(),
      signedAt: Timestamp.now(),
      isVerified: true // TODO: Implement verification
    };
    
    const signatures = [...(contract.signatures || []), newSignature];
    
    // Update party status
    const parties = contract.parties.map(party => {
      if (party.id === signature.partyId) {
        return {
          ...party,
          hasSigned: true,
          signedAt: Timestamp.now()
        };
      }
      return party;
    });
    
    // Check if all required signatures are complete
    const allSigned = parties.filter(p => p.mustSign).every(p => p.hasSigned);
    const newStatus = allSigned ? 'signed' : contract.status;
    
    await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), {
      signatures,
      parties,
      status: newStatus,
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logContractActivity({
      contractId,
      type: 'signed',
      description: `Contract signed by ${signature.partyName}`,
      userEmail: signature.partyName,
      timestamp: Timestamp.now()
    });
    
    // If all signed, activate contract
    if (allSigned && contract.effectiveDate) {
      await activateContract(contractId);
    }
  } catch (error) {
    console.error('Error adding signature:', error);
    throw error;
  }
}

export async function uploadSignatureImage(
  contractId: string,
  partyId: string,
  signatureFile: File
): Promise<string> {
  try {
    const fileRef = ref(storage, `contracts/${contractId}/signatures/${partyId}-${Date.now()}`);
    const snapshot = await uploadBytes(fileRef, signatureFile);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading signature:', error);
    throw error;
  }
}

// Contract Amendments

export async function proposeAmendment(
  contractId: string,
  amendment: Omit<ContractAmendment, 'id' | 'contractId' | 'amendmentNumber' | 'proposedAt'>
): Promise<void> {
  try {
    const contract = await getContractById(contractId);
    if (!contract) throw new Error('Contract not found');
    
    const amendmentNumber = (contract.amendments?.length || 0) + 1;
    
    const newAmendment: ContractAmendment = {
      ...amendment,
      id: generateId(),
      contractId,
      amendmentNumber,
      proposedAt: Timestamp.now()
    };
    
    const amendments = [...(contract.amendments || []), newAmendment];
    
    await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), {
      amendments,
      status: 'negotiating',
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logContractActivity({
      contractId,
      type: 'amended',
      description: `Amendment #${amendmentNumber} proposed`,
      userId: amendment.proposedBy,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error proposing amendment:', error);
    throw error;
  }
}

export async function approveAmendment(
  contractId: string,
  amendmentId: string,
  approvedBy: string
): Promise<void> {
  try {
    const contract = await getContractById(contractId);
    if (!contract) throw new Error('Contract not found');
    
    const amendments = contract.amendments?.map(a => {
      if (a.id === amendmentId) {
        return {
          ...a,
          status: 'approved' as const,
          approvedBy,
          approvedAt: Timestamp.now()
        };
      }
      return a;
    });
    
    await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), {
      amendments,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error approving amendment:', error);
    throw error;
  }
}

// Contract Attachments

export async function uploadAttachment(
  contractId: string,
  file: File,
  type: ContractAttachment['type'],
  uploadedBy: string
): Promise<void> {
  try {
    const contract = await getContractById(contractId);
    if (!contract) throw new Error('Contract not found');
    
    // Upload file
    const fileRef = ref(storage, `contracts/${contractId}/attachments/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    const attachment: ContractAttachment = {
      id: generateId(),
      name: file.name,
      type,
      fileUrl: downloadUrl,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: Timestamp.now(),
      uploadedBy
    };
    
    const attachments = [...(contract.attachments || []), attachment];
    
    await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), {
      attachments,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
}

// Contract Status Management

export async function sendContract(
  contractId: string,
  sentBy: string
): Promise<void> {
  try {
    await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), {
      status: 'sent',
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logContractActivity({
      contractId,
      type: 'sent',
      description: 'Contract sent for review/signature',
      userId: sentBy,
      timestamp: Timestamp.now()
    });
    
    // TODO: Send email notifications to parties
  } catch (error) {
    console.error('Error sending contract:', error);
    throw error;
  }
}

export async function markContractViewed(
  contractId: string,
  viewedBy: string
): Promise<void> {
  try {
    const contract = await getContractById(contractId);
    if (!contract) throw new Error('Contract not found');
    
    if (contract.status === 'sent') {
      await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), {
        status: 'viewed',
        updatedAt: Timestamp.now()
      });
    }
    
    // Log activity
    await logContractActivity({
      contractId,
      type: 'viewed',
      description: 'Contract viewed',
      userEmail: viewedBy,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking contract viewed:', error);
    throw error;
  }
}

export async function activateContract(contractId: string): Promise<void> {
  try {
    await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), {
      status: 'active',
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error activating contract:', error);
    throw error;
  }
}

export async function completeContract(contractId: string): Promise<void> {
  try {
    await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), {
      status: 'completed',
      completedDate: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error completing contract:', error);
    throw error;
  }
}

export async function cancelContract(
  contractId: string,
  reason?: string,
  cancelledBy?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), {
      status: 'cancelled',
      cancelledDate: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logContractActivity({
      contractId,
      type: 'cancelled',
      description: reason || 'Contract cancelled',
      userId: cancelledBy,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error cancelling contract:', error);
    throw error;
  }
}

// Contract Statistics

export async function getContractStats(orgId: string): Promise<ContractStats> {
  try {
    const contracts = await searchContracts({ orgId });
    
    const stats: ContractStats = {
      total: contracts.length,
      byStatus: {} as Record<Contract['status'], number>,
      byType: {} as Record<Contract['type'], number>,
      awaitingSignature: 0,
      signedThisMonth: 0,
      expiringThisMonth: 0,
      expiredCount: 0
    };
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    let totalValue = 0;
    let valueCount = 0;
    
    contracts.forEach(contract => {
      // Status counts
      stats.byStatus[contract.status] = (stats.byStatus[contract.status] || 0) + 1;
      
      // Type counts
      stats.byType[contract.type] = (stats.byType[contract.type] || 0) + 1;
      
      // Awaiting signature
      if (contract.status === 'sent' || contract.status === 'viewed') {
        stats.awaitingSignature++;
      }
      
      // Signed this month
      const signedThisMonth = contract.signatures?.some(
        sig => sig.signedAt.toDate() >= thisMonth
      );
      if (signedThisMonth) {
        stats.signedThisMonth++;
      }
      
      // Expiring/expired
      if (contract.expirationDate) {
        const daysUntilExpiration = getDaysUntilExpiration(contract);
        if (daysUntilExpiration !== null) {
          if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
            stats.expiringThisMonth++;
          } else if (daysUntilExpiration <= 0) {
            stats.expiredCount++;
          }
        }
      }
      
      // Financial
      if (contract.financial?.total) {
        totalValue += contract.financial.total;
        valueCount++;
      }
    });
    
    // Calculate averages
    if (valueCount > 0) {
      stats.totalValue = totalValue;
      stats.averageValue = totalValue / valueCount;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting contract stats:', error);
    throw error;
  }
}

// Activity Logging

async function logContractActivity(
  activity: Omit<ContractActivity, 'id'>
): Promise<void> {
  try {
    await addDoc(collection(db, ACTIVITIES_COLLECTION), activity);
  } catch (error) {
    console.error('Error logging contract activity:', error);
  }
}

export async function getContractActivities(
  contractId: string,
  limitCount: number = 50
): Promise<ContractActivity[]> {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('contractId', '==', contractId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const activities: ContractActivity[] = [];
    
    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data()
      } as ContractActivity);
    });
    
    return activities;
  } catch (error) {
    console.error('Error getting contract activities:', error);
    throw error;
  }
}

// Helper Functions

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getDaysUntilExpiration(contract: Contract): number | null {
  if (!contract.expirationDate) return null;
  
  const now = new Date();
  const expiration = contract.expirationDate.toDate();
  const diffTime = expiration.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function processTemplateVariables(
  obj: any,
  variables: Record<string, any>
): any {
  if (typeof obj === 'string') {
    // Replace variables in string
    return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  } else if (Array.isArray(obj)) {
    return obj.map(item => processTemplateVariables(item, variables));
  } else if (typeof obj === 'object' && obj !== null) {
    const processed: any = {};
    for (const key in obj) {
      processed[key] = processTemplateVariables(obj[key], variables);
    }
    return processed;
  }
  return obj;
}

// Initialize System Templates (run once)
export async function initializeSystemTemplates(): Promise<void> {
  try {
    const templates: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'DJ Performance Agreement',
        description: 'Standard DJ performance contract template',
        type: 'dj_performance',
        category: 'Performance',
        tags: ['dj', 'performance', 'music'],
        sections: [
          {
            id: '1',
            title: 'Performance Details',
            order: 1,
            content: 'This agreement is entered into between {{venueName}} ("Venue") and {{djName}} ("Artist") for a performance on {{eventDate}}.',
            isEditable: true,
            isRequired: true
          },
          {
            id: '2',
            title: 'Compensation',
            order: 2,
            content: 'The Artist shall receive a performance fee of {{performanceFee}} payable as follows: {{paymentTerms}}',
            isEditable: true,
            isRequired: true
          },
          {
            id: '3',
            title: 'Technical Requirements',
            order: 3,
            content: 'The Venue agrees to provide the following technical equipment: {{technicalRequirements}}',
            isEditable: true,
            isRequired: false
          }
        ],
        variables: [
          {
            id: 'venueName',
            name: 'venueName',
            label: 'Venue Name',
            type: 'text',
            required: true
          },
          {
            id: 'djName',
            name: 'djName',
            label: 'DJ/Artist Name',
            type: 'text',
            required: true
          },
          {
            id: 'eventDate',
            name: 'eventDate',
            label: 'Event Date',
            type: 'date',
            required: true
          },
          {
            id: 'performanceFee',
            name: 'performanceFee',
            label: 'Performance Fee',
            type: 'number',
            required: true
          }
        ],
        isPublic: true,
        isSystem: true,
        requiresSignature: true
      },
      {
        name: 'Venue Rental Agreement',
        description: 'Standard venue rental contract template',
        type: 'venue_rental',
        category: 'Venue',
        tags: ['venue', 'rental', 'event'],
        sections: [
          {
            id: '1',
            title: 'Rental Terms',
            order: 1,
            content: 'The Venue agrees to rent the premises located at {{venueAddress}} to the Client for the event on {{eventDate}}.',
            isEditable: true,
            isRequired: true
          },
          {
            id: '2',
            title: 'Rental Fee',
            order: 2,
            content: 'The total rental fee is {{rentalFee}} with a deposit of {{depositAmount}} due upon signing.',
            isEditable: true,
            isRequired: true
          }
        ],
        variables: [
          {
            id: 'venueAddress',
            name: 'venueAddress',
            label: 'Venue Address',
            type: 'text',
            required: true
          },
          {
            id: 'eventDate',
            name: 'eventDate',
            label: 'Event Date',
            type: 'date',
            required: true
          },
          {
            id: 'rentalFee',
            name: 'rentalFee',
            label: 'Rental Fee',
            type: 'number',
            required: true
          },
          {
            id: 'depositAmount',
            name: 'depositAmount',
            label: 'Deposit Amount',
            type: 'number',
            required: true
          }
        ],
        isPublic: true,
        isSystem: true,
        requiresSignature: true
      }
    ];
    
    // Check if templates already exist
    const existingTemplates = await getContractTemplates(undefined, true);
    const systemTemplates = existingTemplates.filter(t => t.isSystem);
    
    if (systemTemplates.length === 0) {
      // Create system templates
      for (const template of templates) {
        await createContractTemplate(template);
      }
      console.log('System templates initialized');
    }
  } catch (error) {
    console.error('Error initializing system templates:', error);
  }
}