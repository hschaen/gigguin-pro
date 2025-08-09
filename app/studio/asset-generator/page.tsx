'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Download, 
  Upload, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Sparkles,
  Copy,
  RefreshCw,
  Wand2,
  Save,
  Share2,
  Grid,
  Layers
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUserOrganizations } from '@/lib/services/organization-service';
import { 
  getOrgBrandPacks,
  getBrandPackById,
  generateMarketingCopy,
  generateAssetFromTemplate
} from '@/lib/services/brand-pack-service';
import { 
  BrandPack, 
  AssetTemplate, 
  CopyGenerationRequest,
  ASSET_DIMENSIONS 
} from '@/lib/types/brand-pack';
import { Organization } from '@/lib/types/organization';

function AssetGeneratorContent() {
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [brandPacks, setBrandPacks] = useState<BrandPack[]>([]);
  const [selectedBrandPack, setSelectedBrandPack] = useState<BrandPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Asset configuration
  const [assetConfig, setAssetConfig] = useState({
    type: 'instagramPost',
    eventName: '',
    eventDate: '',
    venue: '',
    lineup: '',
    ticketPrice: '',
    specialInfo: '',
    includeQR: false,
    qrData: ''
  });
  
  // Copy generation state
  const [copyConfig, setCopyConfig] = useState<Partial<CopyGenerationRequest>>({
    copyType: 'announcement',
    platform: 'instagram',
    tone: 'exciting',
    includeEmojis: true,
    includeHashtags: true,
    maxLength: 280
  });
  
  const [generatedCopy, setGeneratedCopy] = useState<string[]>([]);
  const [selectedCopy, setSelectedCopy] = useState('');
  
  // Canvas state
  const [canvasElements, setCanvasElements] = useState<any[]>([]);
  const [selectedElement, setSelectedElement] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user]);

  useEffect(() => {
    const brandPackId = searchParams.get('brandPackId');
    if (brandPackId && brandPacks.length > 0) {
      const pack = brandPacks.find(p => p.id === brandPackId);
      if (pack) setSelectedBrandPack(pack);
    }
  }, [searchParams, brandPacks]);

  useEffect(() => {
    if (selectedOrg) {
      loadBrandPacks();
    }
  }, [selectedOrg]);

  useEffect(() => {
    if (selectedBrandPack) {
      applyBrandToCanvas();
    }
  }, [selectedBrandPack]);

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

  const loadBrandPacks = async () => {
    if (!selectedOrg?.id) return;
    
    try {
      const packs = await getOrgBrandPacks(selectedOrg.id);
      setBrandPacks(packs);
      if (packs.length > 0 && !selectedBrandPack) {
        setSelectedBrandPack(packs.find(p => p.isDefault) || packs[0]);
      }
    } catch (error) {
      console.error('Error loading brand packs:', error);
    }
  };

  const applyBrandToCanvas = () => {
    if (!canvasRef.current || !selectedBrandPack) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions based on asset type
    const dimensions = ASSET_DIMENSIONS[assetConfig.type as keyof typeof ASSET_DIMENSIONS];
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    // Apply brand colors as background
    ctx.fillStyle = selectedBrandPack.colors.background || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw brand elements
    drawCanvasElements(ctx);
  };

  const drawCanvasElements = (ctx: CanvasRenderingContext2D) => {
    if (!selectedBrandPack) return;
    
    // Clear canvas
    ctx.fillStyle = selectedBrandPack.colors.background || '#FFFFFF';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw title
    if (assetConfig.eventName) {
      ctx.fillStyle = selectedBrandPack.colors.text || '#000000';
      ctx.font = `bold 72px ${selectedBrandPack.typography.headingFont}`;
      ctx.textAlign = 'center';
      ctx.fillText(assetConfig.eventName, ctx.canvas.width / 2, 150);
    }
    
    // Draw date
    if (assetConfig.eventDate) {
      ctx.fillStyle = selectedBrandPack.colors.primary;
      ctx.font = `48px ${selectedBrandPack.typography.bodyFont}`;
      ctx.textAlign = 'center';
      ctx.fillText(assetConfig.eventDate, ctx.canvas.width / 2, 250);
    }
    
    // Draw venue
    if (assetConfig.venue) {
      ctx.fillStyle = selectedBrandPack.colors.text || '#000000';
      ctx.font = `36px ${selectedBrandPack.typography.bodyFont}`;
      ctx.textAlign = 'center';
      ctx.fillText(assetConfig.venue, ctx.canvas.width / 2, 320);
    }
    
    // Draw lineup
    if (assetConfig.lineup) {
      const lineupArray = assetConfig.lineup.split(',').map(l => l.trim());
      ctx.fillStyle = selectedBrandPack.colors.text || '#000000';
      ctx.font = `32px ${selectedBrandPack.typography.bodyFont}`;
      ctx.textAlign = 'center';
      
      lineupArray.forEach((artist, index) => {
        ctx.fillText(artist, ctx.canvas.width / 2, 420 + (index * 40));
      });
    }
    
    // Add accent elements
    ctx.fillStyle = selectedBrandPack.colors.accent || selectedBrandPack.colors.primary;
    ctx.fillRect(0, ctx.canvas.height - 100, ctx.canvas.width, 100);
    
    // Add ticket info
    if (assetConfig.ticketPrice) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 36px ${selectedBrandPack.typography.bodyFont}`;
      ctx.textAlign = 'center';
      ctx.fillText(`Tickets: $${assetConfig.ticketPrice}`, ctx.canvas.width / 2, ctx.canvas.height - 40);
    }
  };

  const handleGenerateCopy = async () => {
    if (!selectedBrandPack || !user) return;
    
    try {
      setGenerating(true);
      
      const request: CopyGenerationRequest = {
        brandPackId: selectedBrandPack.id,
        eventDetails: {
          name: assetConfig.eventName,
          date: assetConfig.eventDate,
          venue: assetConfig.venue,
          lineup: assetConfig.lineup.split(',').map(l => l.trim()),
          ticketPrice: parseFloat(assetConfig.ticketPrice) || undefined,
          specialInfo: assetConfig.specialInfo
        },
        ...copyConfig
      } as CopyGenerationRequest;
      
      const result = await generateMarketingCopy(request, user.uid);
      
      setGeneratedCopy([result.content, ...(result.variations || [])]);
      if (result.content) {
        setSelectedCopy(result.content);
      }
    } catch (error) {
      console.error('Error generating copy:', error);
      alert('Failed to generate marketing copy');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadAsset = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `${assetConfig.eventName || 'asset'}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleGenerateVariations = async () => {
    // Generate multiple variations with different styles
    const variations = ['vibrant', 'minimal', 'dark', 'elegant'];
    
    for (const style of variations) {
      // Apply different brand preset temporarily
      applyBrandToCanvas();
      
      // Auto-download each variation
      setTimeout(() => {
        handleDownloadAsset();
      }, 500);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Asset Studio</h1>
        <p className="text-gray-600">
          Create branded marketing materials with AI assistance
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Brand Pack Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Pack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedBrandPack?.id}
                onValueChange={(value) => {
                  const pack = brandPacks.find(p => p.id === value);
                  if (pack) setSelectedBrandPack(pack);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand pack" />
                </SelectTrigger>
                <SelectContent>
                  {brandPacks.map((pack) => (
                    <SelectItem key={pack.id} value={pack.id!}>
                      {pack.name}
                      {pack.isDefault && ' (Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedBrandPack && (
                <div className="mt-4">
                  <div className="flex gap-2">
                    {Object.entries(selectedBrandPack.colors).slice(0, 5).map(([key, value]) => (
                      <div
                        key={key}
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: value as string }}
                        title={key}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="asset-type">Asset Type</Label>
                <Select
                  value={assetConfig.type}
                  onValueChange={(value) => setAssetConfig({...assetConfig, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSET_DIMENSIONS).map(([key, dim]) => (
                      <SelectItem key={key} value={key}>
                        {dim.label} ({dim.width}x{dim.height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="event-name">Event Name</Label>
                <Input
                  id="event-name"
                  value={assetConfig.eventName}
                  onChange={(e) => setAssetConfig({...assetConfig, eventName: e.target.value})}
                  placeholder="Summer Vibes Festival"
                />
              </div>
              
              <div>
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  value={assetConfig.eventDate}
                  onChange={(e) => setAssetConfig({...assetConfig, eventDate: e.target.value})}
                  placeholder="July 15, 2024"
                />
              </div>
              
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={assetConfig.venue}
                  onChange={(e) => setAssetConfig({...assetConfig, venue: e.target.value})}
                  placeholder="The Grand Ballroom"
                />
              </div>
              
              <div>
                <Label htmlFor="lineup">Lineup (comma separated)</Label>
                <Textarea
                  id="lineup"
                  value={assetConfig.lineup}
                  onChange={(e) => setAssetConfig({...assetConfig, lineup: e.target.value})}
                  placeholder="DJ Alpha, DJ Beta, DJ Gamma"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="ticket-price">Ticket Price</Label>
                <Input
                  id="ticket-price"
                  value={assetConfig.ticketPrice}
                  onChange={(e) => setAssetConfig({...assetConfig, ticketPrice: e.target.value})}
                  placeholder="25"
                />
              </div>
              
              <Button 
                className="w-full"
                onClick={() => applyBrandToCanvas()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Canvas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="design" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="copy">AI Copy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="design">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Canvas Preview</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleGenerateVariations}>
                        <Grid className="h-4 w-4 mr-1" />
                        Variations
                      </Button>
                      <Button size="sm" onClick={handleDownloadAsset}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto mx-auto"
                      style={{ maxHeight: '600px' }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="copy">
              <Card>
                <CardHeader>
                  <CardTitle>AI Copy Generator</CardTitle>
                  <CardDescription>
                    Generate marketing copy for your event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Copy Type</Label>
                      <Select
                        value={copyConfig.copyType}
                        onValueChange={(value) => setCopyConfig({...copyConfig, copyType: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="lineup">Lineup Reveal</SelectItem>
                          <SelectItem value="soldout">Sold Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Platform</Label>
                      <Select
                        value={copyConfig.platform}
                        onValueChange={(value) => setCopyConfig({...copyConfig, platform: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Tone</Label>
                      <Select
                        value={copyConfig.tone}
                        onValueChange={(value) => setCopyConfig({...copyConfig, tone: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="exciting">Exciting</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="mysterious">Mysterious</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Max Length</Label>
                      <Input
                        type="number"
                        value={copyConfig.maxLength}
                        onChange={(e) => setCopyConfig({...copyConfig, maxLength: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={copyConfig.includeEmojis}
                        onCheckedChange={(checked) => setCopyConfig({...copyConfig, includeEmojis: checked})}
                      />
                      <Label>Include Emojis</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={copyConfig.includeHashtags}
                        onCheckedChange={(checked) => setCopyConfig({...copyConfig, includeHashtags: checked})}
                      />
                      <Label>Include Hashtags</Label>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleGenerateCopy}
                    disabled={generating}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? 'Generating...' : 'Generate Copy'}
                  </Button>
                  
                  {generatedCopy.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <Label>Generated Variations</Label>
                      {generatedCopy.map((copy, index) => (
                        <Card key={index} className="p-3">
                          <p className="text-sm mb-2">{copy}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCopy(copy)}
                            >
                              Use This
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigator.clipboard.writeText(copy)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function EnhancedAssetGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading asset studio...</p>
        </div>
      </div>
    }>
      <AssetGeneratorContent />
    </Suspense>
  );
}