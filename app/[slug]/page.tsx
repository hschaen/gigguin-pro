'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PublicPagesService } from '@/lib/services/public-pages-service';
import { PublicPage, EventPublicPage, DJPublicProfile, VenuePublicPage } from '@/lib/types/public-pages';
import EventPage from '@/components/public/EventPage';
import DJProfile from '@/components/public/DJProfile';
import VenuePage from '@/components/public/VenuePage';
import LoadingPage from '@/components/public/LoadingPage';
import NotFoundPage from '@/components/public/NotFoundPage';

export default function PublicPageView() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<PublicPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const publicPagesService = PublicPagesService.getInstance();
  
  useEffect(() => {
    loadPage();
  }, [slug]);
  
  const loadPage = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const pageData = await publicPagesService.getPageBySlug(slug);
      
      if (pageData) {
        setPage(pageData);
        
        // Track page view
        const sessionId = `session_${Date.now()}`;
        await publicPagesService.trackPageView(
          pageData.id!,
          sessionId,
          document.referrer
        );
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error loading page:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingPage />;
  }
  
  if (error || !page) {
    return <NotFoundPage />;
  }
  
  // Render appropriate page component based on type
  switch (page.type) {
    case 'event':
      return <EventPage page={page as EventPublicPage} />;
    case 'dj':
      return <DJProfile page={page as DJPublicProfile} />;
    case 'venue':
      return <VenuePage page={page as VenuePublicPage} />;
    default:
      return <NotFoundPage />;
  }
}