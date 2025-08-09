'use client';

import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from 'firebase/auth';

export interface UserLinkRecord {
  id: string;
  djBookingToolUid: string;
  djBookingToolEmail: string;
  gigguinUserId?: string;
  gigguinEmail?: string;
  linkingToken?: string;
  linkingTokenExpiry?: Timestamp | Date;
  isLinked: boolean;
  linkedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    linkingSource: 'dj_booking_tool' | 'gigguin' | 'admin';
  };
}

export interface LinkingRequest {
  token: string;
  targetEmail: string;
  expiresAt: Date;
}

export class UserLinkingService {
  private static instance: UserLinkingService;

  static getInstance(): UserLinkingService {
    if (!UserLinkingService.instance) {
      UserLinkingService.instance = new UserLinkingService();
    }
    return UserLinkingService.instance;
  }

  /**
   * Create a linking record for a DJ Booking Tool user
   */
  async createLinkingRecord(
    user: User,
    metadata?: UserLinkRecord['metadata']
  ): Promise<UserLinkRecord> {
    const linkingRecord: Omit<UserLinkRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      djBookingToolUid: user.uid,
      djBookingToolEmail: user.email || '',
      isLinked: false,
      metadata: {
        linkingSource: 'dj_booking_tool',
        ...metadata,
      },
    };

    const docRef = doc(collection(db, 'userLinks'));
    await setDoc(docRef, {
      ...linkingRecord,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const createdDoc = await getDoc(docRef);
    return { id: docRef.id, ...createdDoc.data() } as UserLinkRecord;
  }

  /**
   * Generate a secure linking token for cross-app verification
   */
  async generateLinkingToken(djBookingToolUid: string): Promise<LinkingRequest> {
    // Generate a secure token
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

    // Find the user's linking record
    const linkingRecord = await this.getLinkingRecordByDjUid(djBookingToolUid);
    if (!linkingRecord) {
      throw new Error('User linking record not found');
    }

    // Update with linking token
    await updateDoc(doc(db, 'userLinks', linkingRecord.id), {
      linkingToken: token,
      linkingTokenExpiry: expiresAt,
      updatedAt: serverTimestamp(),
    });

    return {
      token,
      targetEmail: linkingRecord.djBookingToolEmail,
      expiresAt,
    };
  }

  /**
   * Verify and consume a linking token
   */
  async verifyLinkingToken(token: string): Promise<UserLinkRecord | null> {
    const q = query(
      collection(db, 'userLinks'),
      where('linkingToken', '==', token),
      where('isLinked', '==', false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const linkingRecord = { id: doc.id, ...doc.data() } as UserLinkRecord;

    // Check if token is expired
    if (linkingRecord.linkingTokenExpiry) {
      const expiryDate = linkingRecord.linkingTokenExpiry instanceof Date 
        ? linkingRecord.linkingTokenExpiry 
        : (linkingRecord.linkingTokenExpiry as any).toDate();
      
      if (new Date() > expiryDate) {
        // Clean up expired token
        await this.clearLinkingToken(linkingRecord.id);
        return null;
      }
    }

    return linkingRecord;
  }

  /**
   * Complete the linking process between DJ Booking Tool and Gigguin
   */
  async completeLinking(
    linkingRecordId: string,
    gigguinUserId: string,
    gigguinEmail: string
  ): Promise<UserLinkRecord> {
    const linkingRef = doc(db, 'userLinks', linkingRecordId);
    
    const updateData = {
      gigguinUserId,
      gigguinEmail,
      isLinked: true,
      linkedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      linkingToken: null,
      linkingTokenExpiry: null,
    };

    await updateDoc(linkingRef, updateData);

    // Get the updated record
    const updatedDoc = await getDoc(linkingRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as UserLinkRecord;
  }

  /**
   * Get linking record by DJ Booking Tool UID
   */
  async getLinkingRecordByDjUid(djBookingToolUid: string): Promise<UserLinkRecord | null> {
    const q = query(
      collection(db, 'userLinks'),
      where('djBookingToolUid', '==', djBookingToolUid)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserLinkRecord;
  }

  /**
   * Get linking record by Gigguin User ID
   */
  async getLinkingRecordByGigguinId(gigguinUserId: string): Promise<UserLinkRecord | null> {
    const q = query(
      collection(db, 'userLinks'),
      where('gigguinUserId', '==', gigguinUserId),
      where('isLinked', '==', true)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserLinkRecord;
  }

  /**
   * Check if a user is already linked
   */
  async isUserLinked(djBookingToolUid: string): Promise<boolean> {
    const linkingRecord = await this.getLinkingRecordByDjUid(djBookingToolUid);
    return linkingRecord?.isLinked || false;
  }

  /**
   * Unlink users (break the connection)
   */
  async unlinkUsers(djBookingToolUid: string): Promise<void> {
    const linkingRecord = await this.getLinkingRecordByDjUid(djBookingToolUid);
    if (!linkingRecord) {
      throw new Error('Linking record not found');
    }

    await updateDoc(doc(db, 'userLinks', linkingRecord.id), {
      isLinked: false,
      gigguinUserId: null,
      gigguinEmail: null,
      linkedAt: null,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete linking record completely
   */
  async deleteLinkingRecord(djBookingToolUid: string): Promise<void> {
    const linkingRecord = await this.getLinkingRecordByDjUid(djBookingToolUid);
    if (linkingRecord) {
      await deleteDoc(doc(db, 'userLinks', linkingRecord.id));
    }
  }

  /**
   * Clear expired linking token
   */
  private async clearLinkingToken(linkingRecordId: string): Promise<void> {
    await updateDoc(doc(db, 'userLinks', linkingRecordId), {
      linkingToken: null,
      linkingTokenExpiry: null,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Generate a cryptographically secure token
   */
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current user's linking status
   */
  async getCurrentUserLinkingStatus(): Promise<{
    isLinked: boolean;
    linkingRecord?: UserLinkRecord;
    djBookingToolUser?: User;
  }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { isLinked: false };
    }

    const linkingRecord = await this.getLinkingRecordByDjUid(currentUser.uid);
    
    return {
      isLinked: linkingRecord?.isLinked || false,
      linkingRecord: linkingRecord || undefined,
      djBookingToolUser: currentUser,
    };
  }

  /**
   * Search for users by email to facilitate linking
   */
  async searchUsersByEmail(email: string): Promise<UserLinkRecord[]> {
    const queries = [
      query(
        collection(db, 'userLinks'),
        where('djBookingToolEmail', '==', email)
      ),
      query(
        collection(db, 'userLinks'),
        where('gigguinEmail', '==', email)
      ),
    ];

    const results: UserLinkRecord[] = [];
    
    for (const q of queries) {
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        const record = { id: doc.id, ...doc.data() } as UserLinkRecord;
        // Avoid duplicates
        if (!results.some(r => r.id === record.id)) {
          results.push(record);
        }
      });
    }

    return results;
  }

  /**
   * Get linking statistics for admin dashboard
   */
  async getLinkingStatistics(): Promise<{
    totalRecords: number;
    linkedUsers: number;
    pendingLinks: number;
    recentLinks: number;
  }> {
    // Get all linking records
    const allRecordsQuery = query(collection(db, 'userLinks'));
    const allRecordsSnapshot = await getDocs(allRecordsQuery);
    
    // Get linked users
    const linkedQuery = query(
      collection(db, 'userLinks'),
      where('isLinked', '==', true)
    );
    const linkedSnapshot = await getDocs(linkedQuery);
    
    // Get pending links (have tokens but not linked)
    const pendingQuery = query(
      collection(db, 'userLinks'),
      where('isLinked', '==', false),
      where('linkingToken', '!=', null)
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    
    // Get recent links (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentQuery = query(
      collection(db, 'userLinks'),
      where('linkedAt', '>=', weekAgo)
    );
    const recentSnapshot = await getDocs(recentQuery);

    return {
      totalRecords: allRecordsSnapshot.size,
      linkedUsers: linkedSnapshot.size,
      pendingLinks: pendingSnapshot.size,
      recentLinks: recentSnapshot.size,
    };
  }
}

export const userLinkingService = UserLinkingService.getInstance();