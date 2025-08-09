'use client';

import { VenuePublicPage } from '@/lib/types/public-pages';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Car, Train, Star, Calendar, Users, Accessibility } from 'lucide-react';
import Image from 'next/image';
import Head from 'next/head';
import { SEOService } from '@/lib/services/public-pages-service';

interface VenuePageProps {
  page: VenuePublicPage;
}

export default function VenuePage({ page }: VenuePageProps) {
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
        <meta property="og:type" content="place" />
        <meta name="twitter:card" content={metaTags['twitter:card']} />
        <meta name="twitter:title" content={metaTags['twitter:title']} />
        <meta name="twitter:description" content={metaTags['twitter:description']} />
        <meta name="twitter:image" content={metaTags['twitter:image']} />
      </Head>
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] bg-gradient-to-b from-primary/10 to-background">
          {page.venueData.photos && page.venueData.photos[0] && (
            <div className="absolute inset-0">
              <Image
                src={page.venueData.photos[0].url}
                alt={page.venueData.name}
                fill
                className="object-cover opacity-30"
              />
            </div>
          )}
          
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {page.venueData.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">
                    {page.venueData.city}, {page.venueData.state}
                  </span>
                </div>
                {page.venueData.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(page.venueData.rating!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{page.venueData.rating.toFixed(1)}</span>
                    {page.venueData.reviews && (
                      <span className="text-muted-foreground">
                        ({page.venueData.reviews.length} reviews)
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <p className="text-xl mb-8 text-muted-foreground">
                {page.venueData.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                {page.venueData.bookingInfo?.available && (
                  <Button size="lg">
                    Book This Venue
                  </Button>
                )}
                <Button size="lg" variant="outline">
                  <Phone className="h-5 w-5 mr-2" />
                  Contact
                </Button>
                <Button size="lg" variant="outline">
                  <MapPin className="h-5 w-5 mr-2" />
                  Get Directions
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About {page.venueData.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap mb-6">{page.venueData.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {page.venueData.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Capacity: {page.venueData.capacity.toLocaleString()}</span>
                      </div>
                    )}
                    {page.venueData.type && page.venueData.type.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {page.venueData.type.join(', ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Gallery */}
              {page.venueData.photos && page.venueData.photos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {page.venueData.photos.slice(0, 6).map((photo) => (
                        <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden">
                          <Image
                            src={photo.url}
                            alt={photo.title || page.venueData.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Amenities */}
              {page.venueData.amenities && page.venueData.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {page.venueData.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Reviews */}
              {page.venueData.reviews && page.venueData.reviews.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {page.venueData.reviews.slice(0, 5).map((review) => (
                        <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{review.author}</p>
                              <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(review.date.toDate()).toLocaleDateString()}
                            </p>
                          </div>
                          {review.title && (
                            <h4 className="font-medium mb-1">{review.title}</h4>
                          )}
                          <p className="text-sm text-muted-foreground">{review.content}</p>
                          
                          {review.response && (
                            <div className="mt-3 pl-4 border-l-2 border-primary">
                              <p className="text-sm font-medium mb-1">Response from venue</p>
                              <p className="text-sm text-muted-foreground">{review.response.content}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Location & Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Location & Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold mb-1">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {page.venueData.address}<br />
                      {page.venueData.city}, {page.venueData.state} {page.venueData.postalCode}<br />
                      {page.venueData.country}
                    </p>
                  </div>
                  
                  {page.venueData.bookingInfo?.contactPhone && (
                    <div>
                      <p className="font-semibold mb-1">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {page.venueData.bookingInfo.contactPhone}
                      </p>
                    </div>
                  )}
                  
                  {page.venueData.bookingInfo?.contactEmail && (
                    <div>
                      <p className="font-semibold mb-1">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {page.venueData.bookingInfo.contactEmail}
                      </p>
                    </div>
                  )}
                  
                  {page.venueData.coordinates && (
                    <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
              
              {/* Hours */}
              {page.venueData.hours && (
                <Card>
                  <CardHeader>
                    <CardTitle>Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(page.venueData.hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="capitalize">{day}</span>
                          {hours.closed ? (
                            <span className="text-muted-foreground">Closed</span>
                          ) : (
                            <span>{hours.open} - {hours.close}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Getting There */}
              <Card>
                <CardHeader>
                  <CardTitle>Getting There</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {page.venueData.parkingInfo && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Car className="h-4 w-4" />
                        <span className="font-semibold text-sm">Parking</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {page.venueData.parkingInfo}
                      </p>
                    </div>
                  )}
                  
                  {page.venueData.publicTransport && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Train className="h-4 w-4" />
                        <span className="font-semibold text-sm">Public Transport</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {page.venueData.publicTransport}
                      </p>
                    </div>
                  )}
                  
                  {page.venueData.accessibility && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Accessibility className="h-4 w-4" />
                        <span className="font-semibold text-sm">Accessibility</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {page.venueData.accessibility}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Upcoming Events */}
              {page.venueData.upcomingEvents && page.venueData.upcomingEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {page.venueData.upcomingEvents.map((event) => (
                        <div key={event.id} className="space-y-1">
                          <h4 className="font-semibold text-sm">{event.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(event.date.toDate()).toLocaleDateString()}
                          </p>
                          {event.ticketUrl && (
                            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                                Get Tickets
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
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