'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building, 
  MapPin, 
  Users, 
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Clock,
  CheckCircle,
  Star,
  Music,
  Wifi,
  Car,
  Shield,
  Coffee,
  Volume2,
  Monitor,
  Sparkles,
  Edit,
  Plus
} from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { 
  getVenueBySlug,
  getVenueCalendar,
  isVenueAvailable,
  createBookingRequest
} from '@/lib/services/venue-service';
import { Venue, VenueCalendarEvent, VenueBookingRequest } from '@/lib/types/venue';
import { Timestamp } from 'firebase/firestore';

export default function VenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<VenueCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    eventName: '',
    eventType: 'public',
    expectedAttendance: 0,
    headline: '',
    supportActs: '',
    techRequirements: '',
    specialRequests: '',
    proposedTerms: {
      ticketPrice: 0
    }
  });

  useEffect(() => {
    if (params.slug) {
      loadVenue(params.slug as string);
    }
  }, [params.slug]);

  useEffect(() => {
    if (venue?.id) {
      loadCalendarEvents();
    }
  }, [venue, currentMonth]);

  const loadVenue = async (slug: string) => {
    try {
      setLoading(true);
      const venueData = await getVenueBySlug(slug);
      if (venueData) {
        setVenue(venueData);
      } else {
        router.push('/venues');
      }
    } catch (error) {
      console.error('Error loading venue:', error);
      router.push('/venues');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    if (!venue?.id) return;
    
    try {
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      const events = await getVenueCalendar(venue.id, startDate, endDate);
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  };

  const checkAvailability = async (date: Date) => {
    if (!venue?.id) return false;
    
    try {
      return await isVenueAvailable(venue.id, date);
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  const handleBookingRequest = async () => {
    if (!venue?.id || !user || !selectedDate) return;
    
    try {
      const request: Omit<VenueBookingRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        venueId: venue.id,
        promoterId: user.uid,
        eventName: bookingForm.eventName,
        eventType: bookingForm.eventType,
        proposedDate: Timestamp.fromDate(selectedDate),
        expectedAttendance: bookingForm.expectedAttendance,
        headline: bookingForm.headline,
        supportActs: bookingForm.supportActs.split(',').map(s => s.trim()).filter(Boolean),
        techRequirements: bookingForm.techRequirements.split(',').map(s => s.trim()).filter(Boolean),
        specialRequests: bookingForm.specialRequests.split(',').map(s => s.trim()).filter(Boolean),
        proposedTerms: bookingForm.proposedTerms,
        status: 'pending'
      };
      
      await createBookingRequest(request);
      setBookingDialogOpen(false);
      alert('Booking request sent successfully!');
    } catch (error) {
      console.error('Error sending booking request:', error);
      alert('Failed to send booking request');
    }
  };

  const getEventDatesForCalendar = () => {
    const eventDates: Record<string, VenueCalendarEvent> = {};
    calendarEvents.forEach(event => {
      const dateStr = format(event.startDate.toDate(), 'yyyy-MM-dd');
      eventDates[dateStr] = event;
    });
    return eventDates;
  };

  const eventDates = getEventDatesForCalendar();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading venue...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{venue.name}</h1>
              {venue.isVerified && (
                <Badge variant="default">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{venue.address.city}, {venue.address.state}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Capacity: {venue.capacity.total}</span>
              </div>
              {venue.stats?.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{venue.stats.rating.toFixed(1)} ({venue.stats.reviews} reviews)</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Save
            </Button>
            {user && venue.settings.acceptsOnlineBookings && (
              <Button onClick={() => setBookingDialogOpen(true)}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Request Booking
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {venue.description || 'No description available.'}
                  </p>
                </CardContent>
              </Card>

              {/* Capacity */}
              <Card>
                <CardHeader>
                  <CardTitle>Capacity & Layout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Total</Label>
                      <p className="text-2xl font-bold">{venue.capacity.total}</p>
                    </div>
                    {venue.capacity.standing && (
                      <div>
                        <Label className="text-sm text-gray-600">Standing</Label>
                        <p className="text-2xl font-bold">{venue.capacity.standing}</p>
                      </div>
                    )}
                    {venue.capacity.seated && (
                      <div>
                        <Label className="text-sm text-gray-600">Seated</Label>
                        <p className="text-2xl font-bold">{venue.capacity.seated}</p>
                      </div>
                    )}
                    {venue.capacity.vip && (
                      <div>
                        <Label className="text-sm text-gray-600">VIP</Label>
                        <p className="text-2xl font-bold">{venue.capacity.vip}</p>
                      </div>
                    )}
                  </div>
                  
                  {venue.areas && venue.areas.length > 0 && (
                    <div className="mt-6">
                      <Label className="text-sm text-gray-600 mb-2">Areas</Label>
                      <div className="space-y-2">
                        {venue.areas.map((area) => (
                          <div key={area.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{area.name}</p>
                              <p className="text-sm text-gray-600">Capacity: {area.capacity}</p>
                            </div>
                            <Badge variant="outline">{area.type}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Amenities */}
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {venue.amenities.parking && (
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-gray-500" />
                        <span>Parking Available</span>
                      </div>
                    )}
                    {venue.amenities.vipArea && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-gray-500" />
                        <span>VIP Area</span>
                      </div>
                    )}
                    {venue.amenities.greenRoom && (
                      <div className="flex items-center gap-2">
                        <Coffee className="h-5 w-5 text-gray-500" />
                        <span>Green Room</span>
                      </div>
                    )}
                    {venue.amenities.security && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-gray-500" />
                        <span>Security Provided</span>
                      </div>
                    )}
                    {venue.amenities.catering && (
                      <div className="flex items-center gap-2">
                        <Coffee className="h-5 w-5 text-gray-500" />
                        <span>Catering Available</span>
                      </div>
                    )}
                    {venue.amenities.production && (
                      <div className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-gray-500" />
                        <span>Production Support</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Type</Label>
                    <Badge variant="secondary" className="mt-1">
                      {venue.type}
                    </Badge>
                  </div>
                  
                  {venue.website && (
                    <div>
                      <Label className="text-sm text-gray-600">Website</Label>
                      <a 
                        href={venue.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline mt-1"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Visit Website</span>
                      </a>
                    </div>
                  )}
                  
                  {venue.phone && (
                    <div>
                      <Label className="text-sm text-gray-600">Phone</Label>
                      <p className="flex items-center gap-1 mt-1">
                        <Phone className="h-4 w-4" />
                        {venue.phone}
                      </p>
                    </div>
                  )}
                  
                  {venue.email && (
                    <div>
                      <Label className="text-sm text-gray-600">Email</Label>
                      <p className="flex items-center gap-1 mt-1">
                        <Mail className="h-4 w-4" />
                        {venue.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing */}
              {venue.rentalFee && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Rental Fee</Label>
                      <p className="text-2xl font-bold mt-1">
                        {venue.rentalFee.currency} {venue.rentalFee.baseRate}
                        <span className="text-sm text-gray-600 font-normal">
                          /{venue.rentalFee.billingPeriod}
                        </span>
                      </p>
                    </div>
                    
                    {venue.barMinimum && (
                      <div>
                        <Label className="text-sm text-gray-600">Bar Minimum</Label>
                        <p className="text-xl font-semibold mt-1">
                          {venue.barMinimum.currency} {venue.barMinimum.amount}
                        </p>
                      </div>
                    )}
                    
                    {venue.bookingPolicies.depositRequired && (
                      <div>
                        <Label className="text-sm text-gray-600">Deposit Required</Label>
                        <p className="mt-1">
                          {venue.bookingPolicies.depositAmount 
                            ? `${venue.rentalFee.currency} ${venue.bookingPolicies.depositAmount}`
                            : 'Yes'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Availability Calendar</CardTitle>
              <CardDescription>
                View available dates and existing bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="rounded-md border"
                    modifiers={{
                      booked: (date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        return dateStr in eventDates && eventDates[dateStr].status === 'confirmed';
                      },
                      hold: (date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        return dateStr in eventDates && eventDates[dateStr].type === 'hold';
                      }
                    }}
                    modifiersStyles={{
                      booked: { backgroundColor: '#ef4444', color: 'white' },
                      hold: { backgroundColor: '#f59e0b', color: 'white' }
                    }}
                  />
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-amber-500 rounded"></div>
                      <span>On Hold</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Booked</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  {selectedDate && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">
                        {format(selectedDate, 'MMMM d, yyyy')}
                      </h3>
                      
                      {(() => {
                        const dateStr = format(selectedDate, 'yyyy-MM-dd');
                        const event = eventDates[dateStr];
                        
                        if (event) {
                          return (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">{event.title}</CardTitle>
                                <CardDescription>
                                  <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                                    {event.status}
                                  </Badge>
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                {event.organizerName && (
                                  <p className="text-sm text-gray-600">
                                    Organizer: {event.organizerName}
                                  </p>
                                )}
                                {event.expectedAttendance && (
                                  <p className="text-sm text-gray-600">
                                    Expected: {event.expectedAttendance} guests
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          );
                        } else {
                          return (
                            <Card>
                              <CardContent className="text-center py-8">
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                                <p className="text-lg font-semibold">Available</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  This date is available for booking
                                </p>
                                {user && venue.settings.acceptsOnlineBookings && (
                                  <Button 
                                    className="mt-4"
                                    onClick={() => setBookingDialogOpen(true)}
                                  >
                                    Request This Date
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {venue.techSpecs.soundSystem && (
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Volume2 className="h-4 w-4" />
                    Sound System
                  </Label>
                  <p className="text-gray-600">{venue.techSpecs.soundSystem}</p>
                </div>
              )}
              
              {venue.techSpecs.djBooth && (
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Music className="h-4 w-4" />
                    DJ Booth
                  </Label>
                  <p className="text-gray-600">{venue.techSpecs.djBooth}</p>
                </div>
              )}
              
              {venue.techSpecs.lighting && (
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4" />
                    Lighting
                  </Label>
                  <p className="text-gray-600">{venue.techSpecs.lighting}</p>
                </div>
              )}
              
              {venue.techSpecs.visualsScreens && (
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Monitor className="h-4 w-4" />
                    Visuals & Screens
                  </Label>
                  <p className="text-gray-600">{venue.techSpecs.visualsScreens}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Booking Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {venue.bookingPolicies.minLeadTime && (
                <div>
                  <Label>Minimum Lead Time</Label>
                  <p className="text-gray-600">
                    {venue.bookingPolicies.minLeadTime} days advance notice required
                  </p>
                </div>
              )}
              
              {venue.bookingPolicies.cancellationPolicy && (
                <div>
                  <Label>Cancellation Policy</Label>
                  <p className="text-gray-600">{venue.bookingPolicies.cancellationPolicy}</p>
                </div>
              )}
              
              {venue.bookingPolicies.ageRestriction && (
                <div>
                  <Label>Age Restriction</Label>
                  <p className="text-gray-600">{venue.bookingPolicies.ageRestriction}+</p>
                </div>
              )}
              
              {venue.bookingPolicies.dressCode && (
                <div>
                  <Label>Dress Code</Label>
                  <p className="text-gray-600">{venue.bookingPolicies.dressCode}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              {venue.contacts && venue.contacts.length > 0 ? (
                <div className="space-y-4">
                  {venue.contacts.map((contact) => (
                    <div key={contact.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{contact.name}</p>
                          <Badge variant="outline" className="mt-1">{contact.role}</Badge>
                        </div>
                        {contact.isPrimary && (
                          <Badge variant="default">Primary</Badge>
                        )}
                      </div>
                      <div className="mt-3 space-y-1">
                        {contact.email && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {contact.email}
                          </p>
                        )}
                        {contact.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {contact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No contact information available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Request Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Booking</DialogTitle>
            <DialogDescription>
              Submit a booking request for {venue.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                value={bookingForm.eventName}
                onChange={(e) => setBookingForm({...bookingForm, eventName: e.target.value})}
                placeholder="Summer Music Festival"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-type">Event Type</Label>
                <select
                  id="event-type"
                  className="w-full p-2 border rounded-md"
                  value={bookingForm.eventType}
                  onChange={(e) => setBookingForm({...bookingForm, eventType: e.target.value})}
                >
                  <option value="public">Public Event</option>
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
                  onChange={(e) => setBookingForm({...bookingForm, expectedAttendance: parseInt(e.target.value) || 0})}
                  placeholder="500"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="headline">Headline Act</Label>
              <Input
                id="headline"
                value={bookingForm.headline}
                onChange={(e) => setBookingForm({...bookingForm, headline: e.target.value})}
                placeholder="DJ Name"
              />
            </div>
            
            <div>
              <Label htmlFor="support">Support Acts (comma separated)</Label>
              <Input
                id="support"
                value={bookingForm.supportActs}
                onChange={(e) => setBookingForm({...bookingForm, supportActs: e.target.value})}
                placeholder="DJ Alpha, DJ Beta"
              />
            </div>
            
            <div>
              <Label htmlFor="tech">Technical Requirements</Label>
              <Textarea
                id="tech"
                value={bookingForm.techRequirements}
                onChange={(e) => setBookingForm({...bookingForm, techRequirements: e.target.value})}
                placeholder="Special lighting, fog machine, etc."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="ticket-price">Proposed Ticket Price</Label>
              <Input
                id="ticket-price"
                type="number"
                value={bookingForm.proposedTerms.ticketPrice}
                onChange={(e) => setBookingForm({
                  ...bookingForm, 
                  proposedTerms: {...bookingForm.proposedTerms, ticketPrice: parseFloat(e.target.value) || 0}
                })}
                placeholder="25"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBookingRequest}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}