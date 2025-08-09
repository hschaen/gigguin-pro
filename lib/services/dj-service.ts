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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import {
  DJProfile,
  GigApplication,
  DJBookingRequest,
  DJPerformanceReview,
  DJSearchFilters,
  EPKTheme,
  DJAnalytics
} from '@/lib/types/dj-profile';

const DJ_PROFILES_COLLECTION = 'dj-profiles';
const GIG_APPLICATIONS_COLLECTION = 'gig-applications';
const BOOKING_REQUESTS_COLLECTION = 'dj-booking-requests';
const REVIEWS_COLLECTION = 'dj-reviews';
const EPK_THEMES_COLLECTION = 'epk-themes';
const ANALYTICS_COLLECTION = 'dj-analytics';

// DJ Profile Management

export async function createDJProfile(
  profileData: Omit<DJProfile, 'id' | 'createdAt' | 'updatedAt'>,
  profilePhoto?: File
): Promise<string> {
  try {
    // Generate slug from artist name
    const slug = generateSlug(profileData.artistName);
    
    // Check if slug exists
    const existingProfile = await getDJProfileBySlug(slug);
    if (existingProfile) {
      throw new Error('An artist with this name already exists');
    }
    
    let profilePhotoUrl = '';
    
    // Upload profile photo if provided
    if (profilePhoto) {
      const photoRef = ref(storage, `dj-profiles/${profileData.userId}/${Date.now()}-${profilePhoto.name}`);
      const snapshot = await uploadBytes(photoRef, profilePhoto);
      profilePhotoUrl = await getDownloadURL(snapshot.ref);
    }
    
    const profile: Omit<DJProfile, 'id'> = {
      ...profileData,
      slug,
      media: {
        ...profileData.media,
        profilePhoto: profilePhotoUrl || profileData.media?.profilePhoto
      },
      completionScore: calculateProfileCompletion(profileData),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, DJ_PROFILES_COLLECTION), profile);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating DJ profile:', error);
    throw error;
  }
}

export async function getDJProfileById(profileId: string): Promise<DJProfile | null> {
  try {
    const docRef = doc(db, DJ_PROFILES_COLLECTION, profileId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as DJProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting DJ profile:', error);
    throw error;
  }
}

export async function getDJProfileByUserId(userId: string): Promise<DJProfile | null> {
  try {
    const q = query(
      collection(db, DJ_PROFILES_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as DJProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting DJ profile by user ID:', error);
    throw error;
  }
}

export async function getDJProfileBySlug(slug: string): Promise<DJProfile | null> {
  try {
    const q = query(
      collection(db, DJ_PROFILES_COLLECTION),
      where('slug', '==', slug),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as DJProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting DJ profile by slug:', error);
    throw error;
  }
}

export async function updateDJProfile(
  profileId: string,
  updates: Partial<DJProfile>,
  newProfilePhoto?: File
): Promise<void> {
  try {
    let profilePhotoUrl = updates.media?.profilePhoto;
    
    // Upload new profile photo if provided
    if (newProfilePhoto) {
      const profile = await getDJProfileById(profileId);
      
      // Delete old photo if exists
      if (profile?.media?.profilePhoto) {
        try {
          const oldPhotoRef = ref(storage, profile.media.profilePhoto);
          await deleteObject(oldPhotoRef);
        } catch (err) {
          console.warn('Could not delete old profile photo:', err);
        }
      }
      
      // Upload new photo
      const photoRef = ref(storage, `dj-profiles/${profile?.userId}/${Date.now()}-${newProfilePhoto.name}`);
      const snapshot = await uploadBytes(photoRef, newProfilePhoto);
      profilePhotoUrl = await getDownloadURL(snapshot.ref);
      
      updates.media = {
        ...updates.media,
        profilePhoto: profilePhotoUrl
      };
    }
    
    // Recalculate completion score
    const currentProfile = await getDJProfileById(profileId);
    if (currentProfile) {
      updates.completionScore = calculateProfileCompletion({ ...currentProfile, ...updates });
    }
    
    const docRef = doc(db, DJ_PROFILES_COLLECTION, profileId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating DJ profile:', error);
    throw error;
  }
}

// DJ Search & Discovery

export async function searchDJs(filters: DJSearchFilters): Promise<DJProfile[]> {
  try {
    let q = query(
      collection(db, DJ_PROFILES_COLLECTION),
      where('isActive', '==', true),
      where('settings.publicProfile', '==', true)
    );
    
    // Apply filters
    if (filters.genres && filters.genres.length > 0) {
      q = query(q, where('genres', 'array-contains-any', filters.genres));
    }
    
    if (filters.city) {
      q = query(q, where('currentCity', '==', filters.city));
    }
    
    if (filters.verified) {
      q = query(q, where('isVerified', '==', true));
    }
    
    if (filters.rating) {
      q = query(q, where('stats.averageRating', '>=', filters.rating));
    }
    
    const querySnapshot = await getDocs(q);
    const djs: DJProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      const dj = {
        id: doc.id,
        ...doc.data()
      } as DJProfile;
      
      // Apply client-side filters
      if (filters.priceRange) {
        if (dj.baseRate) {
          if (filters.priceRange.min && dj.baseRate.amount < filters.priceRange.min) {
            return;
          }
          if (filters.priceRange.max && dj.baseRate.amount > filters.priceRange.max) {
            return;
          }
        }
      }
      
      if (filters.yearsExperience && dj.yearsActive) {
        if (dj.yearsActive < filters.yearsExperience) {
          return;
        }
      }
      
      if (filters.willingToTravel !== undefined) {
        if (dj.preferences?.willingToTravel !== filters.willingToTravel) {
          return;
        }
      }
      
      if (filters.hasVideo && !dj.media?.videoLinks?.length) {
        return;
      }
      
      if (filters.hasMixes && !dj.media?.mixLinks?.length) {
        return;
      }
      
      djs.push(dj);
    });
    
    return djs;
  } catch (error) {
    console.error('Error searching DJs:', error);
    throw error;
  }
}

export async function getFeaturedDJs(limitCount: number = 10): Promise<DJProfile[]> {
  try {
    const q = query(
      collection(db, DJ_PROFILES_COLLECTION),
      where('isActive', '==', true),
      where('isVerified', '==', true),
      where('settings.publicProfile', '==', true),
      orderBy('stats.averageRating', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const djs: DJProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      djs.push({
        id: doc.id,
        ...doc.data()
      } as DJProfile);
    });
    
    return djs;
  } catch (error) {
    console.error('Error getting featured DJs:', error);
    throw error;
  }
}

// Gig Applications

export async function createGigApplication(
  applicationData: Omit<GigApplication, 'id' | 'submittedAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, GIG_APPLICATIONS_COLLECTION), {
      ...applicationData,
      status: 'pending',
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // TODO: Send notification to event organizer
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating gig application:', error);
    throw error;
  }
}

export async function getDJApplications(djId: string): Promise<GigApplication[]> {
  try {
    const q = query(
      collection(db, GIG_APPLICATIONS_COLLECTION),
      where('djId', '==', djId),
      orderBy('submittedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const applications: GigApplication[] = [];
    
    querySnapshot.forEach((doc) => {
      applications.push({
        id: doc.id,
        ...doc.data()
      } as GigApplication);
    });
    
    return applications;
  } catch (error) {
    console.error('Error getting DJ applications:', error);
    throw error;
  }
}

export async function getEventApplications(
  eventId: string,
  status?: string
): Promise<GigApplication[]> {
  try {
    let q = query(
      collection(db, GIG_APPLICATIONS_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('submittedAt', 'desc')
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const applications: GigApplication[] = [];
    
    querySnapshot.forEach((doc) => {
      applications.push({
        id: doc.id,
        ...doc.data()
      } as GigApplication);
    });
    
    return applications;
  } catch (error) {
    console.error('Error getting event applications:', error);
    throw error;
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: GigApplication['status'],
  response?: GigApplication['organizerResponse']
): Promise<void> {
  try {
    const updates: any = {
      status,
      updatedAt: Timestamp.now()
    };
    
    if (response) {
      updates.organizerResponse = response;
    }
    
    const docRef = doc(db, GIG_APPLICATIONS_COLLECTION, applicationId);
    await updateDoc(docRef, updates);
    
    // TODO: Send notification to DJ
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
}

// Booking Requests (from Promoters/Venues to DJs)

export async function createDJBookingRequest(
  requestData: Omit<DJBookingRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BOOKING_REQUESTS_COLLECTION), {
      ...requestData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // TODO: Send notification to DJ
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating DJ booking request:', error);
    throw error;
  }
}

export async function getDJBookingRequests(
  djId: string,
  status?: string
): Promise<DJBookingRequest[]> {
  try {
    let q = query(
      collection(db, BOOKING_REQUESTS_COLLECTION),
      where('djId', '==', djId),
      orderBy('createdAt', 'desc')
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const requests: DJBookingRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      } as DJBookingRequest);
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting DJ booking requests:', error);
    throw error;
  }
}

export async function respondToBookingRequest(
  requestId: string,
  response: DJBookingRequest['djResponse']
): Promise<void> {
  try {
    const docRef = doc(db, BOOKING_REQUESTS_COLLECTION, requestId);
    
    let status: DJBookingRequest['status'] = 'pending';
    if (response?.decision === 'accepted') {
      status = 'accepted';
    } else if (response?.decision === 'declined') {
      status = 'declined';
    } else if (response?.decision === 'counter') {
      status = 'negotiating';
    }
    
    await updateDoc(docRef, {
      djResponse: response,
      status,
      updatedAt: Timestamp.now()
    });
    
    // TODO: Send notification to requester
  } catch (error) {
    console.error('Error responding to booking request:', error);
    throw error;
  }
}

// Performance Reviews

export async function createPerformanceReview(
  reviewData: Omit<DJPerformanceReview, 'id' | 'reviewDate' | 'verified'>
): Promise<string> {
  try {
    // Verify the event actually happened
    // TODO: Check event exists and is completed
    
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...reviewData,
      reviewDate: Timestamp.now(),
      verified: true // After verification
    });
    
    // Update DJ's average rating
    await updateDJRating(reviewData.djId);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating performance review:', error);
    throw error;
  }
}

export async function getDJReviews(djId: string): Promise<DJPerformanceReview[]> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('djId', '==', djId),
      where('verified', '==', true),
      orderBy('reviewDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reviews: DJPerformanceReview[] = [];
    
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      } as DJPerformanceReview);
    });
    
    return reviews;
  } catch (error) {
    console.error('Error getting DJ reviews:', error);
    throw error;
  }
}

async function updateDJRating(djId: string): Promise<void> {
  try {
    const reviews = await getDJReviews(djId);
    
    if (reviews.length === 0) return;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.ratings.overall, 0);
    const averageRating = totalRating / reviews.length;
    
    const profileRef = doc(db, DJ_PROFILES_COLLECTION, djId);
    await updateDoc(profileRef, {
      'stats.averageRating': averageRating,
      'stats.reviewCount': reviews.length,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating DJ rating:', error);
  }
}

// EPK Themes

export async function getEPKThemes(): Promise<EPKTheme[]> {
  try {
    const querySnapshot = await getDocs(collection(db, EPK_THEMES_COLLECTION));
    const themes: EPKTheme[] = [];
    
    querySnapshot.forEach((doc) => {
      themes.push({
        id: doc.id,
        ...doc.data()
      } as EPKTheme);
    });
    
    return themes;
  } catch (error) {
    console.error('Error getting EPK themes:', error);
    throw error;
  }
}

export async function createCustomEPKTheme(
  djId: string,
  theme: Omit<EPKTheme, 'id'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, EPK_THEMES_COLLECTION), {
      ...theme,
      djId,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating custom EPK theme:', error);
    throw error;
  }
}

// Analytics

export async function getDJAnalytics(
  djId: string,
  period: DJAnalytics['period']
): Promise<DJAnalytics | null> {
  try {
    const q = query(
      collection(db, ANALYTICS_COLLECTION),
      where('djId', '==', djId),
      where('period', '==', period),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as DJAnalytics;
    }
    
    // Generate analytics if not found
    return generateDJAnalytics(djId, period);
  } catch (error) {
    console.error('Error getting DJ analytics:', error);
    throw error;
  }
}

async function generateDJAnalytics(
  djId: string,
  period: DJAnalytics['period']
): Promise<DJAnalytics> {
  // TODO: Implement actual analytics generation
  return {
    djId,
    period,
    profileViews: 0,
    epkViews: 0,
    uniqueVisitors: 0,
    mixPlays: 0,
    videoViews: 0,
    socialClicks: 0,
    contactRequests: 0,
    bookingRequests: 0,
    bookingsConfirmed: 0,
    bookingsCompleted: 0,
    averageRating: 0,
    reviewsReceived: 0,
    topViewedMixes: [],
    topVenues: [],
    topCities: [],
    trends: {
      viewsChange: 0,
      bookingsChange: 0,
      revenueChange: 0
    }
  };
}

// DJ Availability

export async function checkDJAvailability(
  djId: string,
  date: Date
): Promise<boolean> {
  try {
    const profile = await getDJProfileById(djId);
    if (!profile) return false;
    
    // Check general availability
    if (profile.availability.general === 'not_booking') {
      return false;
    }
    
    // Check blackout dates
    if (profile.blackoutDates) {
      const dateStr = date.toISOString().split('T')[0];
      const isBlackout = profile.blackoutDates.some(blackoutDate => {
        const blackoutStr = blackoutDate.toDate().toISOString().split('T')[0];
        return blackoutStr === dateStr;
      });
      if (isBlackout) return false;
    }
    
    // Check calendar if exists
    if (profile.availability.calendar) {
      const dateStr = date.toISOString().split('T')[0];
      const dayStatus = profile.availability.calendar[dateStr];
      if (dayStatus && dayStatus.status !== 'available') {
        return false;
      }
    }
    
    // Check weekly schedule
    if (profile.availability.weeklySchedule) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const daySchedule = profile.availability.weeklySchedule[dayName];
      if (daySchedule && !daySchedule.available) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking DJ availability:', error);
    return false;
  }
}

export async function updateDJAvailability(
  djId: string,
  date: Date,
  status: 'available' | 'booked' | 'hold' | 'blackout',
  eventId?: string,
  notes?: string
): Promise<void> {
  try {
    const profile = await getDJProfileById(djId);
    if (!profile) throw new Error('DJ profile not found');
    
    const dateStr = date.toISOString().split('T')[0];
    const calendar = profile.availability.calendar || {};
    
    calendar[dateStr] = {
      status,
      eventId,
      notes
    };
    
    await updateDJProfile(djId, {
      availability: {
        ...profile.availability,
        calendar
      }
    });
  } catch (error) {
    console.error('Error updating DJ availability:', error);
    throw error;
  }
}

// Helper Functions

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function calculateProfileCompletion(profile: Partial<DJProfile>): number {
  const requiredFields = [
    'artistName',
    'email',
    'bio',
    'genres',
    'performanceTypes',
    'setLengthMin',
    'setLengthMax'
  ];
  
  const optionalFields = [
    'shortBio',
    'hometown',
    'currentCity',
    'yearsActive',
    'media.profilePhoto',
    'media.mixLinks',
    'social.instagram',
    'social.soundcloud',
    'baseRate',
    'technical.equipment'
  ];
  
  let completed = 0;
  let total = requiredFields.length + optionalFields.length;
  
  // Check required fields
  requiredFields.forEach(field => {
    if (getNestedProperty(profile, field)) {
      completed++;
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    if (getNestedProperty(profile, field)) {
      completed++;
    }
  });
  
  return Math.round((completed / total) * 100);
}

function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}