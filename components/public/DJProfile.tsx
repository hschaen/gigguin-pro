'use client';

import { DJPublicProfile } from '@/lib/types/public-pages';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Calendar, Star, Mail, Globe, Instagram, Twitter, Youtube } from 'lucide-react';
import Image from 'next/image';
import Head from 'next/head';
import { SEOService } from '@/lib/services/public-pages-service';
import Link from 'next/link';

interface DJProfileProps {
  page: DJPublicProfile;
}

export default function DJProfile({ page }: DJProfileProps) {
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
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content={metaTags['twitter:card']} />
        <meta name="twitter:title" content={metaTags['twitter:title']} />
        <meta name="twitter:description" content={metaTags['twitter:description']} />
        <meta name="twitter:image" content={metaTags['twitter:image']} />
      </Head>
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] bg-gradient-to-b from-primary/10 to-background">
          {page.profileData.coverImage && (
            <div className="absolute inset-0">
              <Image
                src={page.profileData.coverImage}
                alt={page.profileData.stageName || page.profileData.name}
                fill
                className="object-cover opacity-30"
              />
            </div>
          )}
          
          <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
            <div className="flex items-end gap-6">
              {page.profileData.image && (
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-background shadow-xl">
                  <Image
                    src={page.profileData.image}
                    alt={page.profileData.stageName || page.profileData.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 pb-2">
                <h1 className="text-3xl md:text-5xl font-bold mb-2">
                  {page.profileData.stageName || page.profileData.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    <span>{page.profileData.genres.join(' • ')}</span>
                  </div>
                  {page.profileData.yearsActive && (
                    <Badge variant="secondary">
                      {page.profileData.yearsActive} years experience
                    </Badge>
                  )}
                </div>
              </div>
              
              {page.profileData.bookingInfo?.available && (
                <Button size="lg" className="mb-2">
                  <Mail className="h-5 w-5 mr-2" />
                  Book Now
                </Button>
              )}
            </div>
          </div>
        </section>
        
        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{page.profileData.bio}</p>
                </CardContent>
              </Card>
              
              {/* Mixes */}
              {page.profileData.mixes && page.profileData.mixes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mixes & Sets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {page.profileData.mixes.map((mix) => (
                        <div key={mix.id} className="border rounded-lg p-4">
                          <div className="flex items-start gap-4">
                            {mix.coverImage && (
                              <div className="relative w-20 h-20 rounded overflow-hidden">
                                <Image
                                  src={mix.coverImage}
                                  alt={mix.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{mix.title}</h3>
                              {mix.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {mix.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{Math.floor(mix.duration / 60)} min</span>
                                {mix.playCount && <span>{mix.playCount.toLocaleString()} plays</span>}
                                <Badge variant="outline">{mix.platform}</Badge>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={mix.url} target="_blank" rel="noopener noreferrer">
                                Play
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Residencies */}
              {page.profileData.residencies && page.profileData.residencies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Residencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {page.profileData.residencies.map((residency) => (
                        <div key={residency.id} className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{residency.venueName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {residency.location} • {residency.frequency}
                            </p>
                          </div>
                          {residency.current && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Testimonials */}
              {page.profileData.testimonials && page.profileData.testimonials.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Testimonials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {page.profileData.testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="border-l-2 border-primary pl-4">
                          <p className="italic mb-2">"{testimonial.content}"</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{testimonial.author}</p>
                            {testimonial.role && (
                              <p className="text-sm text-muted-foreground">
                                {testimonial.role} {testimonial.company && `at ${testimonial.company}`}
                              </p>
                            )}
                          </div>
                          {testimonial.rating && (
                            <div className="flex gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (testimonial.rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
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
              {/* Upcoming Events */}
              {page.profileData.upcomingEvents && page.profileData.upcomingEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {page.profileData.upcomingEvents.map((event) => (
                        <div key={event.id} className="space-y-1">
                          <h4 className="font-semibold">{event.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date.toDate()).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">{event.venue}</p>
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
              
              {/* Social Links */}
              {page.socialLinks && Object.keys(page.socialLinks).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connect</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {page.socialLinks.instagram && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={page.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4 mr-2" />
                            Instagram
                          </a>
                        </Button>
                      )}
                      {page.socialLinks.twitter && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={page.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4 mr-2" />
                            Twitter
                          </a>
                        </Button>
                      )}
                      {page.socialLinks.youtube && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={page.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                            <Youtube className="h-4 w-4 mr-2" />
                            YouTube
                          </a>
                        </Button>
                      )}
                      {page.socialLinks.spotify && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={page.socialLinks.spotify} target="_blank" rel="noopener noreferrer">
                            <Music className="h-4 w-4 mr-2" />
                            Spotify
                          </a>
                        </Button>
                      )}
                      {page.socialLinks.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={page.socialLinks.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Booking Info */}
              {page.profileData.bookingInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Booking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {page.profileData.bookingInfo.available ? (
                      <div className="space-y-3">
                        <Badge variant="default" className="w-full justify-center">
                          Available for Bookings
                        </Badge>
                        {page.profileData.bookingInfo.rates && (
                          <p className="text-sm text-muted-foreground">
                            Rates: {page.profileData.bookingInfo.rates}
                          </p>
                        )}
                        {page.profileData.bookingInfo.contactEmail && (
                          <Button className="w-full" asChild>
                            <a href={`mailto:${page.profileData.bookingInfo.contactEmail}`}>
                              <Mail className="h-4 w-4 mr-2" />
                              Contact for Booking
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="w-full justify-center">
                        Not Currently Booking
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Gallery Preview */}
              {page.profileData.photos && page.profileData.photos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {page.profileData.photos.slice(0, 4).map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded overflow-hidden">
                          <Image
                            src={photo.url}
                            alt={photo.title || 'Gallery image'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {page.profileData.photos.length > 4 && (
                      <Button variant="outline" className="w-full mt-3">
                        View All Photos
                      </Button>
                    )}
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