'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  MapPin, 
  Users, 
  Calendar,
  Star,
  Search,
  Filter,
  Plus,
  Music,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUserOrganizations } from '@/lib/services/organization-service';
import { 
  searchVenues, 
  getOrganizationVenues 
} from '@/lib/services/venue-service';
import { Venue, VenueSearchFilters } from '@/lib/types/venue';
import { Organization } from '@/lib/types/organization';

export default function VenuesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [myVenues, setMyVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<VenueSearchFilters>({});

  useEffect(() => {
    if (user) {
      loadOrganizations();
      loadVenues();
    } else {
      router.push('/auth/signin');
    }
  }, [user, router]);

  useEffect(() => {
    if (selectedOrg) {
      loadMyVenues();
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    if (!user) return;
    
    try {
      const orgs = await getUserOrganizations(user.uid);
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setSelectedOrg(orgs[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const loadVenues = async () => {
    try {
      setLoading(true);
      const venuesList = await searchVenues(filters);
      setVenues(venuesList);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyVenues = async () => {
    if (!selectedOrg?.id) return;
    
    try {
      const venuesList = await getOrganizationVenues(selectedOrg.id);
      setMyVenues(venuesList);
    } catch (error) {
      console.error('Error loading my venues:', error);
    }
  };

  const handleSearch = () => {
    const searchFilters: VenueSearchFilters = {
      ...filters
    };
    
    if (searchQuery) {
      // Filter by city if search query matches
      searchFilters.city = searchQuery;
    }
    
    setFilters(searchFilters);
    loadVenues();
  };

  const renderVenueCard = (venue: Venue) => (
    <Card 
      key={venue.id} 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/venues/${venue.slug}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {venue.name}
              {venue.isVerified && (
                <CheckCircle className="h-5 w-5 text-blue-500" />
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {venue.address.city}, {venue.address.state}
            </CardDescription>
          </div>
          <Badge variant="secondary">{venue.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span>Capacity: {venue.capacity.total}</span>
            </div>
            {venue.stats?.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{venue.stats.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          {venue.amenities && (
            <div className="flex flex-wrap gap-2">
              {venue.amenities.parking && (
                <Badge variant="outline" className="text-xs">Parking</Badge>
              )}
              {venue.amenities.vipArea && (
                <Badge variant="outline" className="text-xs">VIP Area</Badge>
              )}
              {venue.amenities.greenRoom && (
                <Badge variant="outline" className="text-xs">Green Room</Badge>
              )}
              {venue.amenities.catering && (
                <Badge variant="outline" className="text-xs">Catering</Badge>
              )}
            </div>
          )}
          
          {venue.rentalFee && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>
                {venue.rentalFee.currency} {venue.rentalFee.baseRate}/{venue.rentalFee.billingPeriod}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Venues</h1>
            <p className="text-gray-600">
              Discover and manage performance venues
            </p>
          </div>
          {selectedOrg && (
            <Button onClick={() => router.push('/venues/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by city, name, or type..."
                className="pl-10"
              />
            </div>
            
            {/* Filter Options */}
            <select
              className="px-3 py-2 border rounded-md"
              onChange={(e) => setFilters({...filters, type: e.target.value ? [e.target.value] : undefined})}
            >
              <option value="">All Types</option>
              <option value="nightclub">Nightclub</option>
              <option value="bar">Bar</option>
              <option value="lounge">Lounge</option>
              <option value="restaurant">Restaurant</option>
              <option value="outdoor">Outdoor</option>
              <option value="warehouse">Warehouse</option>
              <option value="concert_hall">Concert Hall</option>
            </select>
            
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant={filters.verified ? "default" : "outline"}
              onClick={() => setFilters({...filters, verified: !filters.verified})}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified Only
            </Button>
            <Button
              size="sm"
              variant={filters.hasParking ? "default" : "outline"}
              onClick={() => setFilters({...filters, hasParking: !filters.hasParking})}
            >
              Parking Available
            </Button>
            <Button
              size="sm"
              variant={filters.hasVIP ? "default" : "outline"}
              onClick={() => setFilters({...filters, hasVIP: !filters.hasVIP})}
            >
              VIP Area
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="discover" className="space-y-4">
        <TabsList>
          <TabsTrigger value="discover">
            <Search className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
          {selectedOrg && (
            <TabsTrigger value="my-venues">
              <Building className="h-4 w-4 mr-2" />
              My Venues ({myVenues.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="favorites">
            <Star className="h-4 w-4 mr-2" />
            Favorites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map(renderVenueCard)}
            
            {venues.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Venues Found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search filters or explore different locations
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-venues">
          {selectedOrg ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myVenues.map(renderVenueCard)}
              
              {myVenues.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-12">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Venues Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Add your first venue to start managing bookings
                    </p>
                    <Button onClick={() => router.push('/venues/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Venue
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">
                  Select an organization to view your venues
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardContent className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Favorite Venues</h3>
              <p className="text-gray-600">
                Save your favorite venues for quick access (coming soon)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}