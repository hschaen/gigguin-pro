'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { getUserOrganizations } from '@/lib/services/organization-service';
import { createEventWithPipeline } from '@/lib/services/event-pipeline-service';
import { Organization } from '@/lib/types/organization';
import { Timestamp } from 'firebase/firestore';

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    date: new Date(),
    venueId: '',
    venueName: '',
    orgId: '',
    description: '',
    capacity: 0,
    ticketPrice: 0,
    djBookings: [] as any[]
  });

  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      router.push('/auth/signin');
    }
  }, [user, router]);

  const loadOrganizations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const orgs = await getUserOrganizations(user.uid);
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setFormData(prev => ({ ...prev, orgId: orgs[0].id! }));
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.orgId) {
      alert('Please select an organization');
      return;
    }

    try {
      setSaving(true);
      
      const eventData = {
        name: formData.name,
        date: Timestamp.fromDate(formData.date),
        venueId: formData.venueId || 'temp-venue',
        venueName: formData.venueName,
        orgId: formData.orgId,
        description: formData.description,
        capacity: formData.capacity,
        ticketPrice: formData.ticketPrice,
        djBookings: formData.djBookings,
        status: 'draft' as const
      };

      await createEventWithPipeline(eventData, user.uid);
      
      router.push('/events/pipeline');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const addDJBooking = () => {
    setFormData(prev => ({
      ...prev,
      djBookings: [
        ...prev.djBookings,
        {
          djId: '',
          djName: '',
          djEmail: '',
          status: 'pending',
          fee: 0,
          setTime: '',
          setDuration: 60,
          notes: ''
        }
      ]
    }));
  };

  const removeDJBooking = (index: number) => {
    setFormData(prev => ({
      ...prev,
      djBookings: prev.djBookings.filter((_, i) => i !== index)
    }));
  };

  const updateDJBooking = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      djBookings: prev.djBookings.map((dj, i) => 
        i === index ? { ...dj, [field]: value } : dj
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Organization Found</CardTitle>
            <CardDescription>
              You need to create or join an organization to create events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/settings/organization')}>
              Create Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
        <p className="text-gray-600">
          Create a new event and it will automatically enter the pipeline workflow
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="org">Organization</Label>
                <Select
                  value={formData.orgId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, orgId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id!}>
                        {org.name} ({org.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Summer Vibes Festival"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Event Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="venue">Venue Name</Label>
                <Input
                  id="venue"
                  value={formData.venueName}
                  onChange={(e) => setFormData(prev => ({ ...prev, venueName: e.target.value }))}
                  placeholder="Enter venue name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your event..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    placeholder="Max attendees"
                  />
                </div>

                <div>
                  <Label htmlFor="price">Ticket Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, ticketPrice: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DJ Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>DJ Bookings</CardTitle>
              <CardDescription>
                Add DJs to your event lineup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.djBookings.map((dj, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">DJ {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDJBooking(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>DJ Name</Label>
                      <Input
                        value={dj.djName}
                        onChange={(e) => updateDJBooking(index, 'djName', e.target.value)}
                        placeholder="DJ name"
                      />
                    </div>
                    
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={dj.djEmail}
                        onChange={(e) => updateDJBooking(index, 'djEmail', e.target.value)}
                        placeholder="dj@example.com"
                      />
                    </div>
                    
                    <div>
                      <Label>Fee ($)</Label>
                      <Input
                        type="number"
                        value={dj.fee}
                        onChange={(e) => updateDJBooking(index, 'fee', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <Label>Set Time</Label>
                      <Input
                        value={dj.setTime}
                        onChange={(e) => updateDJBooking(index, 'setTime', e.target.value)}
                        placeholder="10:00 PM"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={dj.notes}
                      onChange={(e) => updateDJBooking(index, 'notes', e.target.value)}
                      placeholder="Any special requirements..."
                    />
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addDJBooking}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add DJ
              </Button>
            </CardContent>
          </Card>

          {/* Pipeline Information */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Information</CardTitle>
              <CardDescription>
                Your event will start in the "Hold" stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Once created, your event will:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Enter the "Hold" stage with a 7-day expiry</li>
                  <li>Be visible in your pipeline dashboard</li>
                  <li>Send automatic notifications to relevant parties</li>
                  <li>Track all stage transitions and history</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/events/pipeline')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating Event...' : 'Create Event'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}