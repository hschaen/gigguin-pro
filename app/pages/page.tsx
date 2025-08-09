'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Link as LinkIcon,
  BarChart,
  Settings,
  Share2,
  Calendar,
  Music,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/use-organization';
import { PublicPagesService } from '@/lib/services/public-pages-service';
import { PublicPage } from '@/lib/types/public-pages';
import Link from 'next/link';

export default function PagesManagementPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [pages, setPages] = useState<PublicPage[]>([]);
  
  const publicPagesService = PublicPagesService.getInstance();
  
  useEffect(() => {
    if (user && currentOrg) {
      loadPages();
    }
  }, [user, currentOrg]);
  
  const loadPages = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      
      // Load all pages for the organization
      const orgPages: PublicPage[] = [];
      
      // This would typically load pages by organization
      // For now, we'll simulate loading pages
      setPages(orgPages);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTogglePublish = async (pageId: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await publicPagesService.unpublishPage(pageId);
      } else {
        await publicPagesService.publishPage(pageId);
      }
      await loadPages();
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };
  
  const getPageIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'dj':
        return <Music className="h-4 w-4" />;
      case 'venue':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Public Pages</h1>
          <p className="text-gray-600">
            Create and manage public pages for events, DJs, and venues
          </p>
        </div>
        
        <Button asChild>
          <Link href="/pages/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Link>
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pages</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pages.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Published</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {pages.filter(p => p.isPublished).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Views</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {pages.reduce((sum, p) => sum + (p.analytics?.views || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg. Conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {pages.length > 0
                ? `${(pages.reduce((sum, p) => sum + (p.analytics?.conversionRate || 0), 0) / pages.length).toFixed(1)}%`
                : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Pages</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="djs">DJs</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="space-y-4">
            {pages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    No pages created yet
                  </p>
                  <Button asChild>
                    <Link href="/pages/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Page
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pages.map((page) => (
                <Card key={page.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getPageIcon(page.type)}
                        <div>
                          <CardTitle className="text-lg">
                            {page.seo.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            /{page.slug}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={page.isPublished ? 'default' : 'secondary'}>
                          {page.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {page.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{page.analytics?.views.toLocaleString() || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart className="h-4 w-4" />
                          <span>{page.analytics?.conversionRate?.toFixed(1) || 0}% conversion</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(page.id!, page.isPublished)}
                        >
                          {page.isPublished ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </Button>
                        
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/pages/${page.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                        
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/pages/${page.id}/analytics`}>
                            <BarChart className="h-4 w-4 mr-2" />
                            Analytics
                          </Link>
                        </Button>
                        
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                        
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="events">
          <div className="space-y-4">
            {pages.filter(p => p.type === 'event').length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    No event pages created yet
                  </p>
                  <Button asChild>
                    <Link href="/pages/create?type=event">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event Page
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pages.filter(p => p.type === 'event').map((page) => (
                <Card key={page.id}>
                  {/* Same card content as above */}
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="djs">
          <div className="space-y-4">
            {pages.filter(p => p.type === 'dj').length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    No DJ profiles created yet
                  </p>
                  <Button asChild>
                    <Link href="/pages/create?type=dj">
                      <Plus className="h-4 w-4 mr-2" />
                      Create DJ Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pages.filter(p => p.type === 'dj').map((page) => (
                <Card key={page.id}>
                  {/* Same card content as above */}
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="venues">
          <div className="space-y-4">
            {pages.filter(p => p.type === 'venue').length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    No venue pages created yet
                  </p>
                  <Button asChild>
                    <Link href="/pages/create?type=venue">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Venue Page
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pages.filter(p => p.type === 'venue').map((page) => (
                <Card key={page.id}>
                  {/* Same card content as above */}
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}