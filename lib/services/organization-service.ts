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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Organization, OrganizationInvite } from '@/lib/types/organization';
// Remove crypto import - will use browser-compatible solution

const ORGS_COLLECTION = 'organizations';
const INVITES_COLLECTION = 'organization_invites';

// Create a new organization
export async function createOrganization(
  orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // Validate slug is unique
    const existingOrg = await getOrganizationBySlug(orgData.slug);
    if (existingOrg) {
      throw new Error('Organization slug already exists');
    }

    // Validate subdomain is unique
    const existingSubdomain = await getOrganizationBySubdomain(orgData.subdomain);
    if (existingSubdomain) {
      throw new Error('Subdomain already taken');
    }

    const docRef = await addDoc(collection(db, ORGS_COLLECTION), {
      ...orgData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

// Get organization by ID
export async function getOrganizationById(orgId: string): Promise<Organization | null> {
  try {
    const docRef = doc(db, ORGS_COLLECTION, orgId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Organization;
    }
    return null;
  } catch (error) {
    console.error('Error getting organization:', error);
    throw error;
  }
}

// Get organization by slug
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  try {
    const q = query(
      collection(db, ORGS_COLLECTION),
      where('slug', '==', slug),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Organization;
    }
    return null;
  } catch (error) {
    console.error('Error getting organization by slug:', error);
    throw error;
  }
}

// Get organization by subdomain
export async function getOrganizationBySubdomain(subdomain: string): Promise<Organization | null> {
  try {
    const q = query(
      collection(db, ORGS_COLLECTION),
      where('subdomain', '==', subdomain),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Organization;
    }
    return null;
  } catch (error) {
    console.error('Error getting organization by subdomain:', error);
    throw error;
  }
}

// Get organization by custom domain
export async function getOrganizationByDomain(domain: string): Promise<Organization | null> {
  try {
    const q = query(
      collection(db, ORGS_COLLECTION),
      where('customDomain', '==', domain),
      where('customDomainVerified', '==', true),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Organization;
    }
    return null;
  } catch (error) {
    console.error('Error getting organization by domain:', error);
    throw error;
  }
}

// Get organizations for a user
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const orgs: Organization[] = [];
    
    // Get orgs where user is owner
    const ownerQuery = query(
      collection(db, ORGS_COLLECTION),
      where('owner', '==', userId),
      where('isActive', '==', true)
    );
    
    const ownerSnapshot = await getDocs(ownerQuery);
    ownerSnapshot.forEach((doc) => {
      orgs.push({
        id: doc.id,
        ...doc.data()
      } as Organization);
    });

    // Get orgs where user is admin
    const adminQuery = query(
      collection(db, ORGS_COLLECTION),
      where('admins', 'array-contains', userId),
      where('isActive', '==', true)
    );
    
    const adminSnapshot = await getDocs(adminQuery);
    adminSnapshot.forEach((doc) => {
      const org = {
        id: doc.id,
        ...doc.data()
      } as Organization;
      
      // Avoid duplicates if user is both owner and admin
      if (!orgs.find(o => o.id === org.id)) {
        orgs.push(org);
      }
    });

    // Get orgs where user is member
    const memberQuery = query(
      collection(db, ORGS_COLLECTION),
      where('members', 'array-contains', userId),
      where('isActive', '==', true)
    );
    
    const memberSnapshot = await getDocs(memberQuery);
    memberSnapshot.forEach((doc) => {
      const org = {
        id: doc.id,
        ...doc.data()
      } as Organization;
      
      // Avoid duplicates
      if (!orgs.find(o => o.id === org.id)) {
        orgs.push(org);
      }
    });

    return orgs;
  } catch (error) {
    console.error('Error getting user organizations:', error);
    throw error;
  }
}

// Update organization
export async function updateOrganization(
  orgId: string,
  updates: Partial<Organization>
): Promise<void> {
  try {
    const docRef = doc(db, ORGS_COLLECTION, orgId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}

// Add user to organization
export async function addUserToOrganization(
  orgId: string,
  userId: string,
  role: 'admin' | 'member'
): Promise<void> {
  try {
    const docRef = doc(db, ORGS_COLLECTION, orgId);
    const org = await getOrganizationById(orgId);
    
    if (!org) {
      throw new Error('Organization not found');
    }

    const updates: any = {
      updatedAt: Timestamp.now()
    };

    if (role === 'admin') {
      updates.admins = [...(org.admins || []), userId];
    } else {
      updates.members = [...(org.members || []), userId];
    }

    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error adding user to organization:', error);
    throw error;
  }
}

// Remove user from organization
export async function removeUserFromOrganization(
  orgId: string,
  userId: string
): Promise<void> {
  try {
    const org = await getOrganizationById(orgId);
    if (!org) {
      throw new Error('Organization not found');
    }

    const updates: any = {
      admins: (org.admins || []).filter(id => id !== userId),
      members: (org.members || []).filter(id => id !== userId),
      updatedAt: Timestamp.now()
    };

    const docRef = doc(db, ORGS_COLLECTION, orgId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error removing user from organization:', error);
    throw error;
  }
}

// Create organization invite
export async function createOrganizationInvite(
  orgId: string,
  email: string,
  role: 'admin' | 'member',
  invitedBy: string
): Promise<string> {
  try {
    // Generate unique token (browser-compatible)
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for server-side
      for (let i = 0; i < 32; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite: Omit<OrganizationInvite, 'id'> = {
      orgId,
      email,
      role,
      invitedBy,
      token,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, INVITES_COLLECTION), invite);
    return token;
  } catch (error) {
    console.error('Error creating organization invite:', error);
    throw error;
  }
}

// Accept organization invite
export async function acceptOrganizationInvite(
  token: string,
  userId: string
): Promise<string> {
  try {
    // Find invite by token
    const q = query(
      collection(db, INVITES_COLLECTION),
      where('token', '==', token)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('Invalid or expired invite token');
    }

    const inviteDoc = querySnapshot.docs[0];
    const invite = inviteDoc.data() as OrganizationInvite;

    // Check if invite is expired
    if (invite.expiresAt.toDate() < new Date()) {
      throw new Error('Invite has expired');
    }

    // Check if already accepted
    if (invite.acceptedAt) {
      throw new Error('Invite has already been accepted');
    }

    // Add user to organization
    await addUserToOrganization(invite.orgId, userId, invite.role);

    // Mark invite as accepted
    await updateDoc(doc(db, INVITES_COLLECTION, inviteDoc.id), {
      acceptedAt: Timestamp.now()
    });

    return invite.orgId;
  } catch (error) {
    console.error('Error accepting organization invite:', error);
    throw error;
  }
}

// Check user's role in organization
export function getUserRoleInOrganization(
  org: Organization,
  userId: string
): 'owner' | 'admin' | 'member' | null {
  if (org.owner === userId) return 'owner';
  if (org.admins?.includes(userId)) return 'admin';
  if (org.members?.includes(userId)) return 'member';
  return null;
}

// Verify custom domain ownership
export async function verifyCustomDomain(
  orgId: string,
  domain: string
): Promise<boolean> {
  try {
    // This would typically involve DNS verification
    // For now, we'll create the DNS records that need to be added
    const dnsRecords = [
      {
        type: 'CNAME',
        name: 'www',
        value: 'cname.vercel-dns.com',
        verified: false
      },
      {
        type: 'A',
        name: '@',
        value: '76.76.21.21',
        verified: false
      }
    ];

    await updateOrganization(orgId, {
      customDomain: domain,
      customDomainVerified: false,
      dnsRecords
    });

    // In production, you would verify DNS records here
    return true;
  } catch (error) {
    console.error('Error verifying custom domain:', error);
    throw error;
  }
}

// Generate unique slug from organization name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}