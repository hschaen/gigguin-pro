'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Type, 
  Image, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  Copy,
  Download,
  Upload,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUserOrganizations } from '@/lib/services/organization-service';
import { 
  getOrgBrandPacks, 
  createBrandPack,
  updateBrandPack,
  deleteBrandPack,
  setDefaultBrandPack,
  createBrandPackFromPreset
} from '@/lib/services/brand-pack-service';
import { BrandPack, BRAND_PACK_PRESETS } from '@/lib/types/brand-pack';
import { Organization } from '@/lib/types/organization';

export default function BrandPacksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [brandPacks, setBrandPacks] = useState<BrandPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<BrandPack | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#FF0000',
      background: '#F5F5F5',
      text: '#333333'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    }
  });

  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      router.push('/auth/signin');
    }
  }, [user, router]);

  useEffect(() => {
    if (selectedOrg) {
      loadBrandPacks();
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

  const loadBrandPacks = async () => {
    if (!selectedOrg?.id) return;
    
    try {
      setLoading(true);
      const packs = await getOrgBrandPacks(selectedOrg.id);
      setBrandPacks(packs);
    } catch (error) {
      console.error('Error loading brand packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrandPack = async () => {
    if (!selectedOrg?.id || !user) return;
    
    try {
      await createBrandPack({
        ...formData,
        orgId: selectedOrg.id,
        isActive: true,
        isDefault: brandPacks.length === 0,
        createdBy: user.uid
      });
      
      setCreateDialogOpen(false);
      resetForm();
      await loadBrandPacks();
    } catch (error) {
      console.error('Error creating brand pack:', error);
      alert('Failed to create brand pack');
    }
  };

  const handleCreateFromPreset = async (presetKey: keyof typeof BRAND_PACK_PRESETS) => {
    if (!selectedOrg?.id || !user) return;
    
    try {
      await createBrandPackFromPreset(
        selectedOrg.id,
        presetKey,
        user.uid,
        undefined
      );
      
      await loadBrandPacks();
    } catch (error) {
      console.error('Error creating brand pack from preset:', error);
      alert('Failed to create brand pack from preset');
    }
  };

  const handleUpdateBrandPack = async () => {
    if (!editingPack?.id) return;
    
    try {
      await updateBrandPack(editingPack.id, {
        name: editingPack.name,
        description: editingPack.description,
        colors: editingPack.colors,
        typography: editingPack.typography
      });
      
      setEditingPack(null);
      await loadBrandPacks();
    } catch (error) {
      console.error('Error updating brand pack:', error);
      alert('Failed to update brand pack');
    }
  };

  const handleDeleteBrandPack = async (packId: string) => {
    if (!confirm('Are you sure you want to delete this brand pack?')) return;
    
    try {
      await deleteBrandPack(packId);
      await loadBrandPacks();
    } catch (error) {
      console.error('Error deleting brand pack:', error);
      alert('Failed to delete brand pack');
    }
  };

  const handleSetDefault = async (packId: string) => {
    if (!selectedOrg?.id) return;
    
    try {
      await setDefaultBrandPack(selectedOrg.id, packId);
      await loadBrandPacks();
    } catch (error) {
      console.error('Error setting default brand pack:', error);
      alert('Failed to set default brand pack');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#FF0000',
        background: '#F5F5F5',
        text: '#333333'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter'
      }
    });
  };

  const renderColorPalette = (colors: any) => {
    return (
      <div className="flex gap-2">
        {Object.entries(colors).slice(0, 5).map(([key, value]) => (
          <div key={key} className="text-center">
            <div 
              className="w-12 h-12 rounded-lg border shadow-sm"
              style={{ backgroundColor: value as string }}
              title={key}
            />
            <span className="text-xs text-gray-500 mt-1">{key}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading brand packs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Brand Packs</h1>
            <p className="text-gray-600">
              Manage your brand assets, colors, and templates
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Brand Pack
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Brand Pack</DialogTitle>
                <DialogDescription>
                  Set up your brand colors, fonts, and templates
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="custom" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                </TabsList>
                
                <TabsContent value="custom" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Brand Pack Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Summer Vibes"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief description of this brand pack"
                    />
                  </div>
                  
                  <div>
                    <Label>Brand Colors</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {Object.entries(formData.colors).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Label className="text-sm w-24">{key}</Label>
                          <Input
                            type="color"
                            value={value}
                            onChange={(e) => setFormData({
                              ...formData,
                              colors: { ...formData.colors, [key]: e.target.value }
                            })}
                            className="w-20 h-10"
                          />
                          <Input
                            value={value}
                            onChange={(e) => setFormData({
                              ...formData,
                              colors: { ...formData.colors, [key]: e.target.value }
                            })}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Typography</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <Label className="text-sm">Heading Font</Label>
                        <Input
                          value={formData.typography.headingFont}
                          onChange={(e) => setFormData({
                            ...formData,
                            typography: { ...formData.typography, headingFont: e.target.value }
                          })}
                          placeholder="e.g., Inter"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Body Font</Label>
                        <Input
                          value={formData.typography.bodyFont}
                          onChange={(e) => setFormData({
                            ...formData,
                            typography: { ...formData.typography, bodyFont: e.target.value }
                          })}
                          placeholder="e.g., Inter"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateBrandPack}>
                      Create Brand Pack
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="presets" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(BRAND_PACK_PRESETS).map(([key, preset]) => (
                      <Card 
                        key={key} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleCreateFromPreset(key as keyof typeof BRAND_PACK_PRESETS)}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">{preset.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 mb-3">
                            {Object.entries(preset.colors).slice(0, 5).map(([colorKey, colorValue]) => (
                              <div
                                key={colorKey}
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: colorValue }}
                                title={colorKey}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">
                            {preset.typography.headingFont} / {preset.typography.bodyFont}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Organization Selector */}
      {organizations.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedOrg?.id}
              onChange={(e) => {
                const org = organizations.find(o => o.id === e.target.value);
                if (org) setSelectedOrg(org);
              }}
              className="w-full p-2 border rounded-md"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Brand Packs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brandPacks.map((pack) => (
          <Card key={pack.id} className="relative">
            {pack.isDefault && (
              <Badge className="absolute top-4 right-4">
                <Star className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle>{pack.name}</CardTitle>
              {pack.description && (
                <CardDescription>{pack.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600 mb-2">Colors</Label>
                {renderColorPalette(pack.colors)}
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">Typography</Label>
                <p className="text-sm">
                  {pack.typography.headingFont} / {pack.typography.bodyFont}
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/studio/asset-generator?brandPackId=${pack.id}`)}
                >
                  <Image className="h-4 w-4 mr-1" />
                  Use
                </Button>
                
                {!pack.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetDefault(pack.id!)}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Set Default
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingPack(pack)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteBrandPack(pack.id!)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {brandPacks.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Brand Packs Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first brand pack to start generating consistent marketing materials
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Brand Pack
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      {editingPack && (
        <Dialog open={true} onOpenChange={() => setEditingPack(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Brand Pack</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingPack.name}
                  onChange={(e) => setEditingPack({...editingPack, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingPack.description || ''}
                  onChange={(e) => setEditingPack({...editingPack, description: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Brand Colors</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {Object.entries(editingPack.colors).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Label className="text-sm w-24">{key}</Label>
                      <Input
                        type="color"
                        value={value as string}
                        onChange={(e) => setEditingPack({
                          ...editingPack,
                          colors: { ...editingPack.colors, [key]: e.target.value }
                        })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={value as string}
                        onChange={(e) => setEditingPack({
                          ...editingPack,
                          colors: { ...editingPack.colors, [key]: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPack(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateBrandPack}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}