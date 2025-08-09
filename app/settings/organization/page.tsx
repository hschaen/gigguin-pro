'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building, Globe, Users, Settings, CreditCard, Shield } from 'lucide-react';
import { createOrganization, updateOrganization, getUserOrganizations, generateSlug } from '@/lib/services/organization-service';
import { Organization } from '@/lib/types/organization';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state for new organization
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    type: 'promoter' as 'promoter' | 'venue' | 'agency',
    email: '',
    phone: '',
    website: '',
    description: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadOrganizations(currentUser.uid);
      } else {
        router.push('/auth/signin');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadOrganizations = async (userId: string) => {
    try {
      setLoading(true);
      const orgs = await getUserOrganizations(userId);
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setSelectedOrg(orgs[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      const slug = generateSlug(newOrgForm.name);
      const subdomain = slug;
      
      const orgId = await createOrganization({
        ...newOrgForm,
        slug,
        subdomain,
        owner: user.uid,
        admins: [],
        members: [],
        isActive: true,
        createdBy: user.uid,
        settings: {
          timezone: 'America/Los_Angeles',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          allowPublicBookings: true,
          requireApproval: false,
          autoInvoicing: true
        },
        subscription: {
          plan: 'free',
          status: 'active'
        }
      });
      
      // Reload organizations
      await loadOrganizations(user.uid);
      
      // Reset form
      setNewOrgForm({
        name: '',
        type: 'promoter',
        email: '',
        phone: '',
        website: '',
        description: ''
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOrganization = async () => {
    if (!selectedOrg?.id) return;
    
    try {
      setSaving(true);
      await updateOrganization(selectedOrg.id, selectedOrg);
      alert('Organization updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
        <p className="text-gray-600">Manage your organizations and their settings</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Building className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="domains">
            <Globe className="h-4 w-4 mr-2" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Organization Selector */}
        {organizations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedOrg?.id || ''}
                onValueChange={(value) => {
                  const org = organizations.find(o => o.id === value);
                  setSelectedOrg(org || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id!}>
                      {org.name} ({org.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedOrg ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        value={selectedOrg.name}
                        onChange={(e) => setSelectedOrg({...selectedOrg, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={selectedOrg.type}
                        onValueChange={(value: any) => setSelectedOrg({...selectedOrg, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="promoter">Promoter</SelectItem>
                          <SelectItem value="venue">Venue</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={selectedOrg.description || ''}
                      onChange={(e) => setSelectedOrg({...selectedOrg, description: e.target.value})}
                      placeholder="Brief description of your organization"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={selectedOrg.email}
                        onChange={(e) => setSelectedOrg({...selectedOrg, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={selectedOrg.phone || ''}
                        onChange={(e) => setSelectedOrg({...selectedOrg, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={selectedOrg.website || ''}
                      onChange={(e) => setSelectedOrg({...selectedOrg, website: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>

                  <Button onClick={handleUpdateOrganization} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">Create your first organization to get started</p>
                  
                  <div>
                    <Label htmlFor="new-name">Organization Name</Label>
                    <Input
                      id="new-name"
                      value={newOrgForm.name}
                      onChange={(e) => setNewOrgForm({...newOrgForm, name: e.target.value})}
                      placeholder="e.g., Sushi Sundays"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-type">Type</Label>
                    <Select
                      value={newOrgForm.type}
                      onValueChange={(value: any) => setNewOrgForm({...newOrgForm, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promoter">Promoter</SelectItem>
                        <SelectItem value="venue">Venue</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newOrgForm.email}
                      onChange={(e) => setNewOrgForm({...newOrgForm, email: e.target.value})}
                      placeholder="contact@example.com"
                    />
                  </div>

                  <Button 
                    onClick={handleCreateOrganization} 
                    disabled={saving || !newOrgForm.name || !newOrgForm.email}
                  >
                    {saving ? 'Creating...' : 'Create Organization'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>Domain Settings</CardTitle>
              <CardDescription>
                Configure your subdomain and custom domain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedOrg && (
                <>
                  <div>
                    <Label>Subdomain</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        {selectedOrg.subdomain}.gigguin.com
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Your organization's subdomain
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="custom-domain">Custom Domain</Label>
                    <Input
                      id="custom-domain"
                      value={selectedOrg.customDomain || ''}
                      onChange={(e) => setSelectedOrg({...selectedOrg, customDomain: e.target.value})}
                      placeholder="yourdomain.com"
                    />
                    {selectedOrg.customDomain && (
                      <div className="mt-2">
                        <Badge variant={selectedOrg.customDomainVerified ? 'default' : 'secondary'}>
                          {selectedOrg.customDomainVerified ? 'Verified' : 'Pending Verification'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {selectedOrg.dnsRecords && selectedOrg.dnsRecords.length > 0 && (
                    <div>
                      <Label>DNS Records</Label>
                      <div className="mt-2 space-y-2">
                        {selectedOrg.dnsRecords.map((record, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                            <div className="font-mono">
                              {record.type} {record.name} → {record.value}
                            </div>
                            <Badge variant={record.verified ? 'default' : 'secondary'} className="mt-1">
                              {record.verified ? 'Verified' : 'Not Verified'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedOrg && (
                <div className="space-y-4">
                  <div>
                    <Label>Owner</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {user?.email || 'You'}
                    </p>
                  </div>

                  <div>
                    <Label>Admins ({selectedOrg.admins?.length || 0})</Label>
                    {selectedOrg.admins && selectedOrg.admins.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {selectedOrg.admins.map((adminId) => (
                          <li key={adminId} className="text-sm text-gray-600">
                            {adminId}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">No admins added yet</p>
                    )}
                  </div>

                  <div>
                    <Label>Members ({selectedOrg.members?.length || 0})</Label>
                    {selectedOrg.members && selectedOrg.members.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {selectedOrg.members.map((memberId) => (
                          <li key={memberId} className="text-sm text-gray-600">
                            {memberId}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">No members added yet</p>
                    )}
                  </div>

                  <Button variant="outline">Invite Team Member</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Configure how your organization operates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedOrg && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Public Bookings</Label>
                      <p className="text-sm text-gray-600">
                        Allow DJs to apply for gigs publicly
                      </p>
                    </div>
                    <Switch
                      checked={selectedOrg.settings?.allowPublicBookings || false}
                      onCheckedChange={(checked) => 
                        setSelectedOrg({
                          ...selectedOrg,
                          settings: {
                            ...selectedOrg.settings!,
                            allowPublicBookings: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Approval</Label>
                      <p className="text-sm text-gray-600">
                        Bookings require admin approval
                      </p>
                    </div>
                    <Switch
                      checked={selectedOrg.settings?.requireApproval || false}
                      onCheckedChange={(checked) => 
                        setSelectedOrg({
                          ...selectedOrg,
                          settings: {
                            ...selectedOrg.settings!,
                            requireApproval: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Invoicing</Label>
                      <p className="text-sm text-gray-600">
                        Automatically generate invoices for bookings
                      </p>
                    </div>
                    <Switch
                      checked={selectedOrg.settings?.autoInvoicing || false}
                      onCheckedChange={(checked) => 
                        setSelectedOrg({
                          ...selectedOrg,
                          settings: {
                            ...selectedOrg.settings!,
                            autoInvoicing: checked
                          }
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedOrg && (
                <div className="space-y-4">
                  <div>
                    <Label>Current Plan</Label>
                    <div className="mt-1">
                      <Badge variant="default" className="capitalize">
                        {selectedOrg.subscription?.plan || 'Free'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedOrg.subscription?.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {selectedOrg.subscription?.status || 'Active'}
                      </Badge>
                    </div>
                  </div>

                  <Button variant="outline">Upgrade Plan</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}