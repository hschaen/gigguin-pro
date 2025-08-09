'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Music,
  MapPin,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  Globe,
  Instagram,
  Youtube,
  Play,
  Calendar,
  Mail,
  Phone,
  Award,
  Headphones,
  Users,
  Share2,
  ExternalLink,
  Quote,
  Disc,
  Radio,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import {
  getDJProfileBySlug,
  getDJReviews,
  createDJBookingRequest
} from '@/lib/services/dj-service';
import {
  DJProfile,
  DJPerformanceReview,
  DJBookingRequest,
  MixLink,
  VideoLink,
  PressQuote,
  Achievement,
  Residency,
  Release
} from '@/lib/types/dj-profile';
import { Timestamp } from 'firebase/firestore';

export default function DJProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [dj, setDJ] = useState<DJProfile | null>(null);
  const [reviews, setReviews] = useState<DJPerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedMix, setSelectedMix] = useState<MixLink | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoLink | null>(null);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    eventName: '',
    eventDate: '',
    venueName: '',
    eventType: 'club',
    expectedAttendance: 0,
    proposedFee: 0,
    setLength: 60,
    timeSlot: '',
    eventDescription: '',
    specialRequests: ''
  });

  useEffect(() => {
    if (params.slug) {
      loadDJProfile(params.slug as string);
    }
  }, [params.slug]);

  const loadDJProfile = async (slug: string) => {
    try {
      setLoading(true);
      const profile = await getDJProfileBySlug(slug);
      if (profile) {
        setDJ(profile);
        if (profile.id) {
          const djReviews = await getDJReviews(profile.id);
          setReviews(djReviews);
        }
      } else {
        router.push('/djs');
      }
    } catch (error) {
      console.error('Error loading DJ profile:', error);
      router.push('/djs');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingRequest = async () => {
    if (!dj?.id || !user) return;

    try {
      const request: Omit<DJBookingRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        djId: dj.id,
        requesterId: user.uid,
        eventName: bookingForm.eventName,
        eventDate: Timestamp.fromDate(new Date(bookingForm.eventDate)),
        venueName: bookingForm.venueName,
        eventType: bookingForm.eventType,
        expectedAttendance: bookingForm.expectedAttendance,
        proposedFee: bookingForm.proposedFee,
        setLength: bookingForm.setLength,
        timeSlot: bookingForm.timeSlot,
        eventDescription: bookingForm.eventDescription,
        specialRequests: bookingForm.specialRequests,
        status: 'pending'
      };

      await createDJBookingRequest(request);
      setBookingDialogOpen(false);
      alert('Booking request sent successfully!');
    } catch (error) {
      console.error('Error sending booking request:', error);
      alert('Failed to send booking request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading DJ profile...</p>
        </div>
      </div>
    );
  }

  if (!dj) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative mb-8">
        <div className="h-64 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg relative overflow-hidden">
          {dj.media?.coverPhoto && (
            <img
              src={dj.media.coverPhoto}
              alt={dj.artistName}
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end gap-6">
            <div className="w-32 h-32 bg-white rounded-lg shadow-lg overflow-hidden">
              {dj.media?.profilePhoto ? (
                <img
                  src={dj.media.profilePhoto}
                  alt={dj.artistName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Music className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{dj.artistName}</h1>
                {dj.isVerified && (
                  <Badge className="bg-blue-500 text-white">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-sm">
                {dj.currentCity && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {dj.currentCity}
                  </span>
                )}
                {dj.yearsActive && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {dj.yearsActive} years active
                  </span>
                )}
                {dj.stats?.averageRating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {dj.stats.averageRating.toFixed(1)} ({dj.stats.reviewCount} reviews)
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 mt-3">
                {dj.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/djs/${dj.slug}/epk`)}
                variant="outline"
                className="bg-white"
              >
                <Globe className="h-4 w-4 mr-2" />
                View EPK
              </Button>
              {user && dj.settings.acceptsDirectBookings && (
                <Button onClick={() => setBookingDialogOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="press">Press & Achievements</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <Card>
                <CardHeader>
                  <CardTitle>Biography</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {dj.bio}
                  </p>
                </CardContent>
              </Card>

              {/* Performance Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Performance Types</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {dj.performanceTypes.map((type) => (
                          <Badge key={type} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600">Set Length</Label>
                      <p className="mt-1">
                        {dj.setLengthMin} - {dj.setLengthMax} minutes
                      </p>
                    </div>
                    
                    {dj.travelRadius && (
                      <div>
                        <Label className="text-sm text-gray-600">Travel Radius</Label>
                        <p className="mt-1">{dj.travelRadius} miles</p>
                      </div>
                    )}
                    
                    {dj.preferences?.minimumNotice && (
                      <div>
                        <Label className="text-sm text-gray-600">Minimum Notice</Label>
                        <p className="mt-1">{dj.preferences.minimumNotice} days</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              {dj.stats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {dj.stats.totalGigs && (
                        <div className="text-center">
                          <p className="text-3xl font-bold">{dj.stats.totalGigs}</p>
                          <p className="text-sm text-gray-600">Total Gigs</p>
                        </div>
                      )}
                      {dj.stats.totalVenues && (
                        <div className="text-center">
                          <p className="text-3xl font-bold">{dj.stats.totalVenues}</p>
                          <p className="text-sm text-gray-600">Venues Played</p>
                        </div>
                      )}
                      {dj.stats.repeatBookings && (
                        <div className="text-center">
                          <p className="text-3xl font-bold">{dj.stats.repeatBookings}</p>
                          <p className="text-sm text-gray-600">Repeat Bookings</p>
                        </div>
                      )}
                      {dj.stats.averageRating && (
                        <div className="text-center">
                          <p className="text-3xl font-bold flex items-center justify-center">
                            {dj.stats.averageRating.toFixed(1)}
                            <Star className="h-6 w-6 text-yellow-500 ml-1" />
                          </p>
                          <p className="text-sm text-gray-600">Average Rating</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dj.baseRate && dj.settings.showRates && (
                    <div>
                      <Label className="text-sm text-gray-600">Base Rate</Label>
                      <p className="text-2xl font-bold mt-1">
                        ${dj.baseRate.amount}
                        <span className="text-sm text-gray-600 font-normal">/{dj.baseRate.per}</span>
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm text-gray-600">Availability</Label>
                    <Badge
                      variant={dj.availability.general === 'available' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {dj.availability.general}
                    </Badge>
                  </div>
                  
                  {dj.hometown && (
                    <div>
                      <Label className="text-sm text-gray-600">Hometown</Label>
                      <p className="mt-1">{dj.hometown}</p>
                    </div>
                  )}
                  
                  {dj.style && (
                    <div>
                      <Label className="text-sm text-gray-600">Style</Label>
                      <p className="mt-1">{dj.style}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Social Media */}
              {dj.social && Object.keys(dj.social).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connect</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {dj.social.instagram && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://instagram.com/${dj.social.instagram}`, '_blank')}
                        >
                          <Instagram className="h-4 w-4 mr-2" />
                          Instagram
                        </Button>
                      )}
                      {dj.social.soundcloud && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://soundcloud.com/${dj.social.soundcloud}`, '_blank')}
                        >
                          <Radio className="h-4 w-4 mr-2" />
                          SoundCloud
                        </Button>
                      )}
                      {dj.social.youtube && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://youtube.com/@${dj.social.youtube}`, '_blank')}
                        >
                          <Youtube className="h-4 w-4 mr-2" />
                          YouTube
                        </Button>
                      )}
                      {dj.social.spotify && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(dj.social.spotify, '_blank')}
                        >
                          <Disc className="h-4 w-4 mr-2" />
                          Spotify
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact */}
              {(dj.email || dj.phone) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dj.settings.bookingEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{dj.settings.bookingEmail}</span>
                      </div>
                    )}
                    {dj.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{dj.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="music">
          <div className="space-y-6">
            {/* Mixes */}
            {dj.media?.mixLinks && dj.media.mixLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Mixes & Sets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dj.media.mixLinks.map((mix) => (
                      <div
                        key={mix.id}
                        className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => window.open(mix.url, '_blank')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{mix.title}</h4>
                            {mix.genre && (
                              <p className="text-sm text-gray-600">{mix.genre}</p>
                            )}
                            {mix.duration && (
                              <p className="text-sm text-gray-600">{mix.duration} minutes</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{mix.platform}</Badge>
                            {mix.featured && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        {(mix.plays || mix.likes) && (
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            {mix.plays && <span>{mix.plays} plays</span>}
                            {mix.likes && <span>{mix.likes} likes</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Videos */}
            {dj.media?.videoLinks && dj.media.videoLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dj.media.videoLinks.map((video) => (
                      <div
                        key={video.id}
                        className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        {video.thumbnail && (
                          <div className="aspect-video bg-gray-200 relative">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="h-12 w-12 text-white bg-black bg-opacity-50 rounded-full p-3" />
                            </div>
                          </div>
                        )}
                        <div className="p-3">
                          <h4 className="font-semibold">{video.title}</h4>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-xs">{video.type}</Badge>
                            <Badge variant="outline" className="text-xs">{video.platform}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Releases */}
            {dj.press?.releases && dj.press.releases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Releases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {dj.press.releases.map((release) => (
                      <div key={release.id} className="text-center">
                        {release.artwork ? (
                          <img
                            src={release.artwork}
                            alt={release.title}
                            className="w-full aspect-square object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                            <Disc className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <h4 className="font-semibold">{release.title}</h4>
                        {release.label && (
                          <p className="text-sm text-gray-600">{release.label}</p>
                        )}
                        <Badge variant="outline" className="mt-1">{release.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="press">
          <div className="space-y-6">
            {/* Press Quotes */}
            {dj.press?.quotes && dj.press.quotes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Press Quotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dj.press.quotes.map((quote) => (
                      <div key={quote.id} className="border-l-4 border-primary pl-4">
                        <Quote className="h-6 w-6 text-gray-400 mb-2" />
                        <p className="italic text-lg mb-2">"{quote.quote}"</p>
                        <p className="text-sm text-gray-600">
                          — {quote.source}
                          {quote.date && `, ${format(quote.date.toDate(), 'MMM yyyy')}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {dj.press?.achievements && dj.press.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dj.press.achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start gap-3">
                        <Award className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold">{achievement.title}</h4>
                          {achievement.description && (
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          )}
                          {achievement.year && (
                            <p className="text-sm text-gray-500 mt-1">{achievement.year}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Residencies */}
            {dj.press?.residencies && dj.press.residencies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Residencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dj.press.residencies.map((residency) => (
                      <div key={residency.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{residency.venueName}</h4>
                          {residency.frequency && (
                            <p className="text-sm text-gray-600">{residency.frequency}</p>
                          )}
                        </div>
                        <Badge variant={residency.active ? 'default' : 'secondary'}>
                          {residency.active ? 'Active' : 'Past'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="technical">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Equipment */}
            {dj.technical?.equipment && dj.technical.equipment.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {dj.technical.equipment.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-gray-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Software */}
            {dj.technical?.software && dj.technical.software.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Software</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {dj.technical.software.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Disc className="h-4 w-4 text-gray-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Technical Requirements */}
            {dj.technicalRequirements && dj.technicalRequirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Technical Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {dj.technicalRequirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dj.technical?.canStream !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Can Stream Sets</span>
                      <Badge variant={dj.technical.canStream ? 'default' : 'secondary'}>
                        {dj.technical.canStream ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                  {dj.technical?.hasOwnSound !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Has Own Sound System</span>
                      <Badge variant={dj.technical.hasOwnSound ? 'default' : 'secondary'}>
                        {dj.technical.hasOwnSound ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                  {dj.technical?.hasOwnLighting !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Has Own Lighting</span>
                      <Badge variant={dj.technical.hasOwnLighting ? 'default' : 'secondary'}>
                        {dj.technical.hasOwnLighting ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                  {dj.technical?.needsHospitality && (
                    <div>
                      <span className="text-sm text-gray-600">Hospitality Requirements</span>
                      <p className="mt-1">{dj.technical.needsHospitality}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600">
                    This DJ hasn't received any reviews yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          <div className="flex items-center gap-2">
                            <span>{review.ratings.overall}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.ratings.overall
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </CardTitle>
                        <CardDescription>
                          {format(review.eventDate.toDate(), 'MMMM d, yyyy')}
                        </CardDescription>
                      </div>
                      {review.wouldBookAgain && (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Would Book Again
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {review.review && (
                      <p className="text-gray-600 mb-4">{review.review}</p>
                    )}
                    
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600">Mixing</p>
                        <p className="font-semibold">{review.ratings.mixing}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Crowd Reading</p>
                        <p className="font-semibold">{review.ratings.crowdReading}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Professionalism</p>
                        <p className="font-semibold">{review.ratings.professionalism}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Punctuality</p>
                        <p className="font-semibold">{review.ratings.punctuality}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Communication</p>
                        <p className="font-semibold">{review.ratings.communication}/5</p>
                      </div>
                      {review.crowdResponse && (
                        <div className="text-center">
                          <p className="text-gray-600">Crowd Response</p>
                          <p className="font-semibold capitalize">{review.crowdResponse}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Booking Request Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book {dj.artistName}</DialogTitle>
            <DialogDescription>
              Send a booking request to {dj.artistName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                value={bookingForm.eventName}
                onChange={(e) => setBookingForm({ ...bookingForm, eventName: e.target.value })}
                placeholder="Summer Music Festival"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-date">Event Date</Label>
                <Input
                  id="event-date"
                  type="datetime-local"
                  value={bookingForm.eventDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="venue-name">Venue Name</Label>
                <Input
                  id="venue-name"
                  value={bookingForm.venueName}
                  onChange={(e) => setBookingForm({ ...bookingForm, venueName: e.target.value })}
                  placeholder="The Music Hall"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-type">Event Type</Label>
                <select
                  id="event-type"
                  className="w-full p-2 border rounded-md"
                  value={bookingForm.eventType}
                  onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                >
                  <option value="club">Club Night</option>
                  <option value="festival">Festival</option>
                  <option value="private">Private Event</option>
                  <option value="corporate">Corporate</option>
                  <option value="wedding">Wedding</option>
                </select>
              </div>

              <div>
                <Label htmlFor="attendance">Expected Attendance</Label>
                <Input
                  id="attendance"
                  type="number"
                  value={bookingForm.expectedAttendance}
                  onChange={(e) => setBookingForm({ ...bookingForm, expectedAttendance: parseInt(e.target.value) || 0 })}
                  placeholder="500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fee">Proposed Fee ($)</Label>
                <Input
                  id="fee"
                  type="number"
                  value={bookingForm.proposedFee}
                  onChange={(e) => setBookingForm({ ...bookingForm, proposedFee: parseFloat(e.target.value) || 0 })}
                  placeholder="1000"
                />
              </div>

              <div>
                <Label htmlFor="set-length">Set Length (minutes)</Label>
                <Input
                  id="set-length"
                  type="number"
                  value={bookingForm.setLength}
                  onChange={(e) => setBookingForm({ ...bookingForm, setLength: parseInt(e.target.value) || 60 })}
                  placeholder="60"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="time-slot">Time Slot</Label>
              <Input
                id="time-slot"
                value={bookingForm.timeSlot}
                onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                placeholder="10:00 PM - 12:00 AM"
              />
            </div>

            <div>
              <Label htmlFor="description">Event Description</Label>
              <Textarea
                id="description"
                value={bookingForm.eventDescription}
                onChange={(e) => setBookingForm({ ...bookingForm, eventDescription: e.target.value })}
                placeholder="Tell the DJ about your event..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="special">Special Requests</Label>
              <Textarea
                id="special"
                value={bookingForm.specialRequests}
                onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                placeholder="Any special requirements or requests..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBookingRequest}>
                Send Booking Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}