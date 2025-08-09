'use client';

import { EventPublicPage } from '@/lib/types/public-pages';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users, Ticket, Share2, Heart } from 'lucide-react';
import Image from 'next/image';
import Head from 'next/head';
import { SEOService } from '@/lib/services/public-pages-service';

interface EventPageProps {
  page: EventPublicPage;
}

export default function EventPage({ page }: EventPageProps) {
  const seoService = SEOService.getInstance();
  const metaTags = seoService.generateMetaTags(page);
  
  return (
    <>
      <Head>
        <title>{metaTags.title}</title>
        <meta name="description" content={metaTags.description} />
        <meta property="og:title" content={metaTags['og:title']} />
        <meta property="og:description" content={metaTags['og:description']} />
        <meta property="og:image" content={metaTags['og:image']} />
        <meta property="og:type" content="event" />
        <meta name="twitter:card" content={metaTags['twitter:card']} />
        <meta name="twitter:title" content={metaTags['twitter:title']} />
        <meta name="twitter:description" content={metaTags['twitter:description']} />
        <meta name="twitter:image" content={metaTags['twitter:image']} />
      </Head>
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] bg-gradient-to-b from-primary/10 to-background">
          {page.content.hero?.image && (
            <div className="absolute inset-0">
              <Image
                src={page.content.hero.image}
                alt={page.eventData.name}
                fill
                className="object-cover opacity-20"
              />
            </div>
          )}
          
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {page.eventData.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6 text-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{new Date(page.eventData.date.toDate()).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{page.eventData.startTime} - {page.eventData.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{page.eventData.venue.name}</span>
                </div>
              </div>
              
              <p className="text-xl mb-8 text-muted-foreground">
                {page.eventData.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                {page.eventData.tickets && page.eventData.tickets.length > 0 && (
                  <Button size="lg" className="gap-2">
                    <Ticket className="h-5 w-5" />
                    Get Tickets
                  </Button>
                )}
                <Button size="lg" variant="outline" className="gap-2">
                  <Share2 className="h-5 w-5" />
                  Share
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Heart className="h-5 w-5" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Content Sections */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Lineup */}
              {page.eventData.lineup && page.eventData.lineup.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Lineup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {page.eventData.lineup.map((artist) => (
                        <div key={artist.id} className="flex items-center gap-4">
                          {artist.image && (
                            <div className="relative w-16 h-16 rounded-full overflow-hidden">
                              <Image
                                src={artist.image}
                                alt={artist.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{artist.name}</h3>
                              <Badge variant="secondary">{artist.role}</Badge>
                            </div>
                            {artist.performanceTime && (
                              <p className="text-sm text-muted-foreground">
                                {artist.performanceTime}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Schedule */}
              {page.eventData.schedule && page.eventData.schedule.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {page.eventData.schedule.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="text-sm font-medium w-20">
                            {item.time}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{page.eventData.description}</p>
                  
                  {(page.eventData.ageRestriction || page.eventData.dressCode) && (
                    <div className="mt-6 space-y-2">
                      {page.eventData.ageRestriction && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Age</Badge>
                          <span>{page.eventData.ageRestriction}</span>
                        </div>
                      )}
                      {page.eventData.dressCode && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Dress Code</Badge>
                          <span>{page.eventData.dressCode}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tickets */}
              {page.eventData.tickets && page.eventData.tickets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {page.eventData.tickets.map((ticket) => (
                        <div key={ticket.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{ticket.name}</h4>
                              {ticket.description && (
                                <p className="text-sm text-muted-foreground">
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {ticket.currency}{ticket.price}
                              </p>
                              {ticket.available > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {ticket.available} left
                                </p>
                              )}
                            </div>
                          </div>
                          <Button className="w-full" size="sm">
                            Select
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Venue Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Venue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">{page.eventData.venue.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {page.eventData.venue.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {page.eventData.venue.city}
                      </p>
                    </div>
                    
                    {page.eventData.venue.coordinates && (
                      <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    <Button variant="outline" className="w-full">
                      Get Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Capacity */}
              {page.eventData.capacity && (
                <Card>
                  <CardHeader>
                    <CardTitle>Event Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Capacity: {page.eventData.capacity} people
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}