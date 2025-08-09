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
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  PublicPage,
  EventPublicPage,
  DJPublicProfile,
  VenuePublicPage,
  SEOMetadata,
  PageContent,
  PageTheme,
  PageSettings,
  SiteMap,
  SearchResult,
  SocialPost,
  PageAnalytics,
  DiscoverySettings
} from '@/lib/types/public-pages';

const PUBLIC_PAGES_COLLECTION = 'public_pages';
const ANALYTICS_COLLECTION = 'page_analytics';
const SOCIAL_POSTS_COLLECTION = 'social_posts';
const DISCOVERY_COLLECTION = 'discovery_settings';
const SITEMAP_COLLECTION = 'sitemaps';

// Public Pages Service
export class PublicPagesService {
  private static instance: PublicPagesService;
  
  static getInstance(): PublicPagesService {
    if (!this.instance) {
      this.instance = new PublicPagesService();
    }
    return this.instance;
  }
  
  // Create/Update Public Page
  async createPublicPage(
    page: Omit<PublicPage, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      // Check if slug is unique
      const existingPage = await this.getPageBySlug(page.slug);
      if (existingPage) {
        throw new Error('Slug already exists');
      }
      
      const newPage: Omit<PublicPage, 'id'> = {
        ...page,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, PUBLIC_PAGES_COLLECTION), newPage);
      
      // Update sitemap
      await this.updateSitemap();
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating public page:', error);
      throw error;
    }
  }
  
  async updatePublicPage(
    pageId: string,
    updates: Partial<PublicPage>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, PUBLIC_PAGES_COLLECTION, pageId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      // Update sitemap if URL changed
      if (updates.slug || updates.customDomain) {
        await this.updateSitemap();
      }
    } catch (error) {
      console.error('Error updating public page:', error);
      throw error;
    }
  }
  
  async publishPage(pageId: string): Promise<void> {
    try {
      await updateDoc(doc(db, PUBLIC_PAGES_COLLECTION, pageId), {
        isPublished: true,
        publishedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error publishing page:', error);
      throw error;
    }
  }
  
  async unpublishPage(pageId: string): Promise<void> {
    try {
      await updateDoc(doc(db, PUBLIC_PAGES_COLLECTION, pageId), {
        isPublished: false,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error unpublishing page:', error);
      throw error;
    }
  }
  
  // Get Public Pages
  async getPageBySlug(slug: string): Promise<PublicPage | null> {
    try {
      const q = query(
        collection(db, PUBLIC_PAGES_COLLECTION),
        where('slug', '==', slug),
        where('isPublished', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as PublicPage;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting page by slug:', error);
      return null;
    }
  }
  
  async getPageById(pageId: string): Promise<PublicPage | null> {
    try {
      const docRef = doc(db, PUBLIC_PAGES_COLLECTION, pageId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as PublicPage;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting page by id:', error);
      return null;
    }
  }
  
  async getPagesByEntity(
    entityId: string,
    entityType: string
  ): Promise<PublicPage[]> {
    try {
      const q = query(
        collection(db, PUBLIC_PAGES_COLLECTION),
        where('entityId', '==', entityId),
        where('type', '==', entityType)
      );
      
      const querySnapshot = await getDocs(q);
      const pages: PublicPage[] = [];
      
      querySnapshot.forEach((doc) => {
        pages.push({
          id: doc.id,
          ...doc.data()
        } as PublicPage);
      });
      
      return pages;
    } catch (error) {
      console.error('Error getting pages by entity:', error);
      return [];
    }
  }
  
  // Event Pages
  async createEventPage(
    eventId: string,
    eventData: EventPublicPage['eventData'],
    theme?: Partial<PageTheme>
  ): Promise<string> {
    try {
      const slug = this.generateSlug(eventData.name);
      
      const page: Omit<EventPublicPage, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'event',
        entityId: eventId,
        slug,
        isPublished: false,
        seo: {
          title: eventData.name,
          description: eventData.description,
          ogType: 'event'
        },
        content: this.generateEventContent(eventData),
        theme: this.getDefaultTheme(theme),
        socialLinks: {},
        settings: {
          showComments: true,
          showSharing: true,
          showRSVP: true,
          showTickets: true
        },
        eventData
      };
      
      return await this.createPublicPage(page);
    } catch (error) {
      console.error('Error creating event page:', error);
      throw error;
    }
  }
  
  private generateEventContent(eventData: EventPublicPage['eventData']): PageContent {
    return {
      hero: {
        title: eventData.name,
        subtitle: `${eventData.venue.name} • ${eventData.date}`,
        description: eventData.description,
        cta: eventData.tickets ? [
          {
            label: 'Get Tickets',
            url: '#tickets',
            type: 'primary'
          }
        ] : []
      },
      sections: [
        {
          id: 'about',
          type: 'about',
          title: 'About',
          content: eventData.description,
          order: 1,
          isVisible: true
        },
        {
          id: 'lineup',
          type: 'lineup',
          title: 'Lineup',
          content: eventData.lineup,
          order: 2,
          isVisible: !!eventData.lineup?.length
        },
        {
          id: 'schedule',
          type: 'schedule',
          title: 'Schedule',
          content: eventData.schedule,
          order: 3,
          isVisible: !!eventData.schedule?.length
        },
        {
          id: 'tickets',
          type: 'tickets',
          title: 'Tickets',
          content: eventData.tickets,
          order: 4,
          isVisible: !!eventData.tickets?.length
        },
        {
          id: 'location',
          type: 'location',
          title: 'Location',
          content: eventData.venue,
          order: 5,
          isVisible: true
        }
      ]
    };
  }
  
  // DJ Profiles
  async createDJProfile(
    djId: string,
    profileData: DJPublicProfile['profileData'],
    theme?: Partial<PageTheme>
  ): Promise<string> {
    try {
      const slug = this.generateSlug(profileData.stageName || profileData.name);
      
      const page: Omit<DJPublicProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'dj',
        entityId: djId,
        slug,
        isPublished: false,
        seo: {
          title: `${profileData.stageName || profileData.name} - DJ Profile`,
          description: profileData.bio,
          ogType: 'profile'
        },
        content: this.generateDJContent(profileData),
        theme: this.getDefaultTheme(theme),
        socialLinks: {},
        settings: {
          showComments: false,
          showSharing: true,
          contactFormEmail: profileData.bookingInfo?.contactEmail
        },
        profileData
      };
      
      return await this.createPublicPage(page);
    } catch (error) {
      console.error('Error creating DJ profile:', error);
      throw error;
    }
  }
  
  private generateDJContent(profileData: DJPublicProfile['profileData']): PageContent {
    return {
      hero: {
        title: profileData.stageName || profileData.name,
        subtitle: profileData.genres.join(' • '),
        description: profileData.bio,
        image: profileData.coverImage || profileData.image,
        cta: profileData.bookingInfo?.bookingForm ? [
          {
            label: 'Book Now',
            url: '#booking',
            type: 'primary'
          }
        ] : []
      },
      sections: [
        {
          id: 'about',
          type: 'about',
          title: 'About',
          content: profileData.bio,
          order: 1,
          isVisible: true
        },
        {
          id: 'gallery',
          type: 'gallery',
          title: 'Gallery',
          content: profileData.photos,
          order: 2,
          isVisible: !!profileData.photos?.length
        },
        {
          id: 'mixes',
          type: 'custom',
          title: 'Mixes',
          content: profileData.mixes,
          order: 3,
          isVisible: !!profileData.mixes?.length
        },
        {
          id: 'upcoming',
          type: 'schedule',
          title: 'Upcoming Events',
          content: profileData.upcomingEvents,
          order: 4,
          isVisible: !!profileData.upcomingEvents?.length
        },
        {
          id: 'testimonials',
          type: 'testimonials',
          title: 'Testimonials',
          content: profileData.testimonials,
          order: 5,
          isVisible: !!profileData.testimonials?.length
        },
        {
          id: 'contact',
          type: 'contact',
          title: 'Booking',
          content: profileData.bookingInfo,
          order: 6,
          isVisible: !!profileData.bookingInfo?.available
        }
      ]
    };
  }
  
  // Venue Pages
  async createVenuePage(
    venueId: string,
    venueData: VenuePublicPage['venueData'],
    theme?: Partial<PageTheme>
  ): Promise<string> {
    try {
      const slug = this.generateSlug(venueData.name);
      
      const page: Omit<VenuePublicPage, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'venue',
        entityId: venueId,
        slug,
        isPublished: false,
        seo: {
          title: `${venueData.name} - ${venueData.city}`,
          description: venueData.description,
          ogType: 'place'
        },
        content: this.generateVenueContent(venueData),
        theme: this.getDefaultTheme(theme),
        socialLinks: {},
        settings: {
          showComments: true,
          showSharing: true,
          contactFormEmail: venueData.bookingInfo?.contactEmail
        },
        venueData
      };
      
      return await this.createPublicPage(page);
    } catch (error) {
      console.error('Error creating venue page:', error);
      throw error;
    }
  }
  
  private generateVenueContent(venueData: VenuePublicPage['venueData']): PageContent {
    return {
      hero: {
        title: venueData.name,
        subtitle: `${venueData.city}, ${venueData.state}`,
        description: venueData.description,
        image: venueData.photos?.[0]?.url,
        cta: venueData.bookingInfo?.bookingForm ? [
          {
            label: 'Book Venue',
            url: '#booking',
            type: 'primary'
          }
        ] : []
      },
      sections: [
        {
          id: 'about',
          type: 'about',
          title: 'About',
          content: venueData.description,
          order: 1,
          isVisible: true
        },
        {
          id: 'gallery',
          type: 'gallery',
          title: 'Gallery',
          content: venueData.photos,
          order: 2,
          isVisible: !!venueData.photos?.length
        },
        {
          id: 'amenities',
          type: 'custom',
          title: 'Amenities',
          content: venueData.amenities,
          order: 3,
          isVisible: !!venueData.amenities?.length
        },
        {
          id: 'upcoming',
          type: 'schedule',
          title: 'Upcoming Events',
          content: venueData.upcomingEvents,
          order: 4,
          isVisible: !!venueData.upcomingEvents?.length
        },
        {
          id: 'location',
          type: 'location',
          title: 'Location',
          content: {
            address: venueData.address,
            city: venueData.city,
            coordinates: venueData.coordinates,
            parkingInfo: venueData.parkingInfo,
            publicTransport: venueData.publicTransport
          },
          order: 5,
          isVisible: true
        },
        {
          id: 'reviews',
          type: 'custom',
          title: 'Reviews',
          content: venueData.reviews,
          order: 6,
          isVisible: !!venueData.reviews?.length
        }
      ]
    };
  }
  
  // SEO & Discovery
  async updateSEO(pageId: string, seo: SEOMetadata): Promise<void> {
    try {
      await updateDoc(doc(db, PUBLIC_PAGES_COLLECTION, pageId), {
        seo,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating SEO:', error);
      throw error;
    }
  }
  
  async generateStructuredData(page: PublicPage): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gigguin.com';
    
    switch (page.type) {
      case 'event':
        const eventPage = page as EventPublicPage;
        return {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: eventPage.eventData.name,
          description: eventPage.eventData.description,
          startDate: eventPage.eventData.date.toDate().toISOString(),
          location: {
            '@type': 'Place',
            name: eventPage.eventData.venue.name,
            address: {
              '@type': 'PostalAddress',
              streetAddress: eventPage.eventData.venue.address,
              addressLocality: eventPage.eventData.venue.city
            }
          },
          url: `${baseUrl}/${page.slug}`,
          image: page.content.hero?.image,
          performer: eventPage.eventData.lineup?.map(item => ({
            '@type': 'Person',
            name: item.name
          }))
        };
        
      case 'dj':
        const djPage = page as DJPublicProfile;
        return {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: djPage.profileData.name,
          alternateName: djPage.profileData.stageName,
          description: djPage.profileData.bio,
          jobTitle: 'DJ',
          url: `${baseUrl}/${page.slug}`,
          image: djPage.profileData.image,
          sameAs: Object.values(page.socialLinks || {})
        };
        
      case 'venue':
        const venuePage = page as VenuePublicPage;
        return {
          '@context': 'https://schema.org',
          '@type': 'EventVenue',
          name: venuePage.venueData.name,
          description: venuePage.venueData.description,
          address: {
            '@type': 'PostalAddress',
            streetAddress: venuePage.venueData.address,
            addressLocality: venuePage.venueData.city,
            addressRegion: venuePage.venueData.state,
            postalCode: venuePage.venueData.postalCode,
            addressCountry: venuePage.venueData.country
          },
          url: `${baseUrl}/${page.slug}`,
          image: page.content.hero?.image,
          maximumAttendeeCapacity: venuePage.venueData.capacity,
          aggregateRating: venuePage.venueData.rating ? {
            '@type': 'AggregateRating',
            ratingValue: venuePage.venueData.rating,
            reviewCount: venuePage.venueData.reviews?.length || 0
          } : undefined
        };
        
      default:
        return null;
    }
  }
  
  async updateSitemap(): Promise<void> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gigguin.com';
      
      // Get all published pages
      const q = query(
        collection(db, PUBLIC_PAGES_COLLECTION),
        where('isPublished', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const urls: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const page = doc.data() as PublicPage;
        urls.push({
          loc: `${baseUrl}/${page.slug}`,
          lastmod: page.updatedAt.toDate().toISOString(),
          changefreq: 'weekly',
          priority: page.type === 'event' ? 0.9 : 0.7
        });
      });
      
      const sitemap: SiteMap = {
        urls,
        lastModified: Timestamp.now()
      };
      
      // Save sitemap
      await addDoc(collection(db, SITEMAP_COLLECTION), sitemap);
    } catch (error) {
      console.error('Error updating sitemap:', error);
    }
  }
  
  // Search & Discovery
  async searchPublicPages(
    searchTerm: string,
    filters?: {
      type?: string[];
      location?: string;
      dateRange?: { start: Date; end: Date };
      priceRange?: { min: number; max: number };
    }
  ): Promise<SearchResult[]> {
    try {
      let q = query(
        collection(db, PUBLIC_PAGES_COLLECTION),
        where('isPublished', '==', true)
      );
      
      if (filters?.type?.length) {
        q = query(q, where('type', 'in', filters.type));
      }
      
      const querySnapshot = await getDocs(q);
      const results: SearchResult[] = [];
      
      querySnapshot.forEach((doc) => {
        const page = doc.data() as PublicPage;
        
        // Simple text search (in production, use proper search service)
        const searchableText = `${page.seo.title} ${page.seo.description}`.toLowerCase();
        if (searchableText.includes(searchTerm.toLowerCase())) {
          results.push({
            id: doc.id,
            type: page.type as 'event' | 'venue' | 'dj',
            title: page.seo.title,
            description: page.seo.description,
            url: `/${page.slug}`,
            image: page.content.hero?.image,
            relevanceScore: this.calculateRelevance(searchTerm, searchableText)
          });
        }
      });
      
      // Sort by relevance
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      return results;
    } catch (error) {
      console.error('Error searching pages:', error);
      return [];
    }
  }
  
  private calculateRelevance(searchTerm: string, text: string): number {
    const term = searchTerm.toLowerCase();
    const content = text.toLowerCase();
    
    // Exact match
    if (content === term) return 1;
    
    // Contains exact phrase
    if (content.includes(term)) return 0.8;
    
    // Contains all words
    const words = term.split(' ');
    const allWordsFound = words.every(word => content.includes(word));
    if (allWordsFound) return 0.6;
    
    // Contains some words
    const someWordsFound = words.some(word => content.includes(word));
    if (someWordsFound) return 0.4;
    
    return 0;
  }
  
  // Analytics
  async trackPageView(
    pageId: string,
    sessionId: string,
    referrer?: string
  ): Promise<void> {
    try {
      // Update page analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const analyticsId = `${pageId}_${today.getTime()}`;
      const analyticsRef = doc(db, ANALYTICS_COLLECTION, analyticsId);
      
      const analyticsDoc = await getDoc(analyticsRef);
      
      if (analyticsDoc.exists()) {
        // Update existing analytics
        await updateDoc(analyticsRef, {
          views: increment(1),
          uniqueVisitors: increment(1), // TODO: Track unique properly
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new analytics record
        const analytics: PageAnalytics = {
          pageId,
          date: Timestamp.fromDate(today),
          views: 1,
          uniqueVisitors: 1,
          sessions: 1,
          avgSessionDuration: 0,
          bounceRate: 0,
          trafficSources: {
            direct: referrer ? 0 : 1,
            organic: 0,
            social: 0,
            referral: referrer ? 1 : 0,
            email: 0,
            paid: 0
          },
          devices: {
            desktop: 0,
            mobile: 0,
            tablet: 0
          }
        };
        
        await updateDoc(analyticsRef, analytics as any);
      }
      
      // Update page view count
      await updateDoc(doc(db, PUBLIC_PAGES_COLLECTION, pageId), {
        'analytics.views': increment(1)
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }
  
  async getPageAnalytics(
    pageId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<PageAnalytics[]> {
    try {
      let q = query(
        collection(db, ANALYTICS_COLLECTION),
        where('pageId', '==', pageId),
        orderBy('date', 'desc')
      );
      
      if (dateRange) {
        q = query(
          q,
          where('date', '>=', Timestamp.fromDate(dateRange.start)),
          where('date', '<=', Timestamp.fromDate(dateRange.end))
        );
      }
      
      const querySnapshot = await getDocs(q);
      const analytics: PageAnalytics[] = [];
      
      querySnapshot.forEach((doc) => {
        analytics.push({
          id: doc.id,
          ...doc.data()
        } as PageAnalytics);
      });
      
      return analytics;
    } catch (error) {
      console.error('Error getting page analytics:', error);
      return [];
    }
  }
  
  // Social Media Integration
  async scheduleSocialPost(
    post: Omit<SocialPost, 'id' | 'postedAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, SOCIAL_POSTS_COLLECTION), post);
      
      // TODO: Integrate with social media APIs for actual posting
      
      return docRef.id;
    } catch (error) {
      console.error('Error scheduling social post:', error);
      throw error;
    }
  }
  
  async getSocialPosts(
    entityId: string,
    platform?: string
  ): Promise<SocialPost[]> {
    try {
      let q = query(
        collection(db, SOCIAL_POSTS_COLLECTION),
        where('entityId', '==', entityId)
      );
      
      if (platform) {
        q = query(q, where('platform', '==', platform));
      }
      
      const querySnapshot = await getDocs(q);
      const posts: SocialPost[] = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as SocialPost);
      });
      
      return posts;
    } catch (error) {
      console.error('Error getting social posts:', error);
      return [];
    }
  }
  
  // Helper Methods
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  private getDefaultTheme(customTheme?: Partial<PageTheme>): PageTheme {
    return {
      template: 'modern',
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
        muted: '#6B7280',
        ...customTheme?.colors
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        fontSize: 'medium',
        ...customTheme?.typography
      },
      layout: {
        containerWidth: 'medium',
        spacing: 'normal',
        ...customTheme?.layout
      },
      ...customTheme
    };
  }
}

// SEO Service
export class SEOService {
  private static instance: SEOService;
  
  static getInstance(): SEOService {
    if (!this.instance) {
      this.instance = new SEOService();
    }
    return this.instance;
  }
  
  generateMetaTags(page: PublicPage): Record<string, string> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gigguin.com';
    const pageUrl = `${baseUrl}/${page.slug}`;
    
    return {
      title: page.seo.title,
      description: page.seo.description,
      keywords: page.seo.keywords?.join(', ') || '',
      author: page.seo.author || 'Gigguin',
      robots: page.seo.robots || 'index, follow',
      canonical: page.seo.canonicalUrl || pageUrl,
      
      // Open Graph
      'og:title': page.seo.ogTitle || page.seo.title,
      'og:description': page.seo.ogDescription || page.seo.description,
      'og:image': page.seo.ogImage || page.content.hero?.image || '',
      'og:url': pageUrl,
      'og:type': page.seo.ogType || 'website',
      
      // Twitter
      'twitter:card': page.seo.twitterCard || 'summary_large_image',
      'twitter:title': page.seo.twitterTitle || page.seo.title,
      'twitter:description': page.seo.twitterDescription || page.seo.description,
      'twitter:image': page.seo.twitterImage || page.seo.ogImage || '',
      'twitter:creator': page.seo.twitterCreator || '@gigguin'
    };
  }
  
  generateRobotsTxt(): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gigguin.com';
    
    return `
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/

Sitemap: ${baseUrl}/sitemap.xml
    `.trim();
  }
}