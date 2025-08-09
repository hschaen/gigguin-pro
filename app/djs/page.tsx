'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Music, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign,
  Filter,
  Grid,
  List,
  CheckCircle,
  Play,
  Video,
  Headphones
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { searchDJs, getFeaturedDJs } from '@/lib/services/dj-service';
import { DJProfile, DJSearchFilters } from '@/lib/types/dj-profile';

export default function DJsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [djs, setDJs] = useState<DJProfile[]>([]);
  const [featuredDJs, setFeaturedDJs] = useState<DJProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DJSearchFilters>({
    genres: [],
    verified: false,
    hasVideo: false,
    hasMixes: false
  });

  useEffect(() => {
    loadDJs();
    loadFeaturedDJs();
  }, [filters]);

  const loadDJs = async () => {
    try {
      setLoading(true);
      const results = await searchDJs(filters);
      
      // Client-side search filter
      if (searchTerm) {
        const filtered = results.filter(dj => 
          dj.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dj.genres.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
          dj.currentCity?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setDJs(filtered);
      } else {
        setDJs(results);
      }
    } catch (error) {
      console.error('Error loading DJs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedDJs = async () => {
    try {
      const featured = await getFeaturedDJs(6);
      setFeaturedDJs(featured);
    } catch (error) {
      console.error('Error loading featured DJs:', error);
    }
  };

  const handleFilterChange = (key: keyof DJSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      genres: [],
      verified: false,
      hasVideo: false,
      hasMixes: false
    });
    setSearchTerm('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Discover DJs</h1>
            <p className="text-gray-600">
              Browse and book talented DJs for your events
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by artist name, genre, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="absolute right-4 top-4"
            >
              Reset
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  placeholder="e.g. Los Angeles"
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Minimum Rating</Label>
                <Select
                  value={filters.rating?.toString() || ''}
                  onValueChange={(value) => handleFilterChange('rating', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any rating</SelectItem>
                    <SelectItem value="4">4+ stars</SelectItem>
                    <SelectItem value="4.5">4.5+ stars</SelectItem>
                    <SelectItem value="5">5 stars only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Experience</Label>
                <Select
                  value={filters.yearsExperience?.toString() || ''}
                  onValueChange={(value) => handleFilterChange('yearsExperience', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any experience</SelectItem>
                    <SelectItem value="1">1+ years</SelectItem>
                    <SelectItem value="3">3+ years</SelectItem>
                    <SelectItem value="5">5+ years</SelectItem>
                    <SelectItem value="10">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Price Range</Label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">$0</span>
                  <Slider
                    min={0}
                    max={5000}
                    step={100}
                    value={[filters.priceRange?.min || 0, filters.priceRange?.max || 5000]}
                    onValueChange={([min, max]) => handleFilterChange('priceRange', { min, max })}
                    className="flex-1"
                  />
                  <span className="text-sm">$5000+</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.verified || false}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                />
                <span className="text-sm">Verified Only</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasVideo || false}
                  onChange={(e) => handleFilterChange('hasVideo', e.target.checked)}
                />
                <span className="text-sm">Has Videos</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasMixes || false}
                  onChange={(e) => handleFilterChange('hasMixes', e.target.checked)}
                />
                <span className="text-sm">Has Mixes</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.willingToTravel || false}
                  onChange={(e) => handleFilterChange('willingToTravel', e.target.checked)}
                />
                <span className="text-sm">Willing to Travel</span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All DJs</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading DJs...</p>
              </div>
            </div>
          ) : (
            <>
              {djs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No DJs Found</h3>
                    <p className="text-gray-600">
                      Try adjusting your filters or search criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {djs.map((dj) => (
                    <DJCard
                      key={dj.id}
                      dj={dj}
                      viewMode={viewMode}
                      onClick={() => router.push(`/djs/${dj.slug}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="featured">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDJs.map((dj) => (
              <DJCard
                key={dj.id}
                dj={dj}
                viewMode="grid"
                featured
                onClick={() => router.push(`/djs/${dj.slug}`)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DJCard({ 
  dj, 
  viewMode, 
  featured = false,
  onClick 
}: { 
  dj: DJProfile; 
  viewMode: 'grid' | 'list';
  featured?: boolean;
  onClick: () => void;
}) {
  if (viewMode === 'list') {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            {dj.media?.profilePhoto ? (
              <img 
                src={dj.media.profilePhoto} 
                alt={dj.artistName}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Music className="h-8 w-8 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {dj.artistName}
                  {dj.isVerified && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  {dj.currentCity && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {dj.currentCity}
                    </span>
                  )}
                  {dj.yearsActive && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dj.yearsActive} years
                    </span>
                  )}
                  {dj.stats?.averageRating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {dj.stats.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  {dj.genres.slice(0, 3).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="text-right">
                {dj.baseRate && (
                  <div className="text-lg font-semibold">
                    ${dj.baseRate.amount}
                    <span className="text-sm text-gray-600">/{dj.baseRate.per}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  {dj.media?.mixLinks && dj.media.mixLinks.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Headphones className="h-3 w-3 mr-1" />
                      {dj.media.mixLinks.length} mixes
                    </Badge>
                  )}
                  {dj.media?.videoLinks && dj.media.videoLinks.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      {dj.media.videoLinks.length} videos
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      {featured && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-1 text-sm font-medium">
          Featured Artist
        </div>
      )}
      <div className="aspect-square bg-gray-200 relative">
        {dj.media?.profilePhoto ? (
          <img 
            src={dj.media.profilePhoto} 
            alt={dj.artistName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-16 w-16 text-gray-400" />
          </div>
        )}
        {dj.isVerified && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-500 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{dj.artistName}</span>
          {dj.stats?.averageRating && (
            <span className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              {dj.stats.averageRating.toFixed(1)}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2">
            {dj.currentCity && (
              <>
                <MapPin className="h-3 w-3" />
                <span>{dj.currentCity}</span>
              </>
            )}
            {dj.yearsActive && (
              <>
                <span>•</span>
                <span>{dj.yearsActive} years exp</span>
              </>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-3">
          {dj.genres.slice(0, 3).map((genre) => (
            <Badge key={genre} variant="secondary" className="text-xs">
              {genre}
            </Badge>
          ))}
        </div>
        
        {dj.baseRate && (
          <div className="text-lg font-semibold">
            ${dj.baseRate.amount}
            <span className="text-sm text-gray-600 font-normal">/{dj.baseRate.per}</span>
          </div>
        )}
        
        <div className="flex gap-3 mt-3 text-sm text-gray-600">
          {dj.media?.mixLinks && dj.media.mixLinks.length > 0 && (
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {dj.media.mixLinks.length} mixes
            </span>
          )}
          {dj.media?.videoLinks && dj.media.videoLinks.length > 0 && (
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              {dj.media.videoLinks.length} videos
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}