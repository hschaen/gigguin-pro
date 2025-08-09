'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  FileSpreadsheet,
  HardDrive,
  Map,
  BarChart3,
  Settings,
  Link,
  Unlink,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Clock,
  Database,
  Cloud,
  Globe,
  Key,
  Shield,
  Zap,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/use-organization';
import {
  GoogleCalendarService,
  GoogleSheetsService,
  GoogleDriveService,
  GoogleMapsService,
  GoogleAnalyticsService,
  getIntegrationSummary
} from '@/lib/services/google-integration-service';
import {
  GoogleIntegrationSummary,
  GoogleCalendarSync,
  GoogleSheetsSync
} from '@/lib/types/google-integrations';

export default function GoogleIntegrationsPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<GoogleIntegrationSummary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Service instances
  const calendarService = GoogleCalendarService.getInstance();
  const sheetsService = GoogleSheetsService.getInstance();
  const driveService = GoogleDriveService.getInstance();
  const mapsService = GoogleMapsService.getInstance();
  const analyticsService = GoogleAnalyticsService.getInstance();
  
  // Calendar sync state
  const [calendarSyncs, setCalendarSyncs] = useState<GoogleCalendarSync[]>([]);
  const [newCalendarSync, setNewCalendarSync] = useState({
    calendarId: '',
    calendarName: '',
    syncDirection: 'two-way' as const,
    syncFrequency: 'hourly' as const
  });
  
  // Sheets sync state
  const [sheetsSyncs, setSheetsSyncs] = useState<GoogleSheetsSync[]>([]);
  const [newSheetsSync, setNewSheetsSync] = useState({
    spreadsheetId: '',
    spreadsheetName: '',
    syncType: 'bidirectional' as const,
    syncFrequency: 'daily' as const,
    dataType: 'events' as const
  });
  
  useEffect(() => {
    if (user && currentOrg) {
      loadIntegrationData();
    }
  }, [user, currentOrg]);
  
  const loadIntegrationData = async () => {
    if (!user || !currentOrg) return;
    
    try {
      setLoading(true);
      
      // Load integration summary
      const integrationSummary = await getIntegrationSummary(currentOrg.id!, user.uid);
      setSummary(integrationSummary);
      
      // Load calendar syncs
      const userCalendarSyncs = await calendarService.getUserCalendarSyncs(user.uid);
      setCalendarSyncs(userCalendarSyncs);
      
      // TODO: Load other service data
    } catch (error) {
      console.error('Error loading integration data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnectService = async (service: string) => {
    // TODO: Implement OAuth flow for each service
    console.log('Connecting service:', service);
    
    // For now, show a placeholder
    alert(`OAuth flow for ${service} would be initiated here`);
  };
  
  const handleSetupCalendarSync = async () => {
    if (!user || !currentOrg) return;
    
    try {
      const syncId = await calendarService.setupCalendarSync({
        orgId: currentOrg.id!,
        userId: user.uid,
        calendarId: newCalendarSync.calendarId,
        calendarName: newCalendarSync.calendarName,
        syncEnabled: true,
        syncDirection: newCalendarSync.syncDirection,
        syncFrequency: newCalendarSync.syncFrequency,
        eventMapping: {
          includePrivateEvents: false,
          fieldMapping: {
            title: 'summary',
            description: 'description',
            location: 'location',
            startTime: 'start',
            endTime: 'end'
          }
        },
        status: 'active'
      });
      
      alert('Calendar sync set up successfully!');
      await loadIntegrationData();
      
      // Reset form
      setNewCalendarSync({
        calendarId: '',
        calendarName: '',
        syncDirection: 'two-way',
        syncFrequency: 'hourly'
      });
    } catch (error) {
      console.error('Error setting up calendar sync:', error);
      alert('Failed to set up calendar sync');
    }
  };
  
  const handleSetupSheetsSync = async () => {
    if (!user || !currentOrg) return;
    
    try {
      const syncId = await sheetsService.setupSheetsSync({
        orgId: currentOrg.id!,
        userId: user.uid,
        spreadsheetId: newSheetsSync.spreadsheetId,
        spreadsheetName: newSheetsSync.spreadsheetName,
        syncType: newSheetsSync.syncType,
        syncFrequency: newSheetsSync.syncFrequency,
        dataType: newSheetsSync.dataType,
        fieldMapping: [], // TODO: Add field mapping UI
        options: {
          skipHeader: true,
          dateFormat: 'YYYY-MM-DD',
          numberFormat: '0.00',
          emptyValueHandling: 'skip',
          duplicateHandling: 'overwrite'
        },
        status: 'active'
      });
      
      alert('Sheets sync set up successfully!');
      await loadIntegrationData();
      
      // Reset form
      setNewSheetsSync({
        spreadsheetId: '',
        spreadsheetName: '',
        syncType: 'bidirectional',
        syncFrequency: 'daily',
        dataType: 'events'
      });
    } catch (error) {
      console.error('Error setting up sheets sync:', error);
      alert('Failed to set up sheets sync');
    }
  };
  
  const handleSyncNow = async (service: string, syncId: string) => {
    try {
      if (service === 'calendar') {
        await calendarService.syncCalendar(syncId);
      } else if (service === 'sheets') {
        await sheetsService.syncSheet(syncId);
      }
      
      alert('Sync completed successfully!');
      await loadIntegrationData();
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Sync failed');
    }
  };
  
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'calendar':
        return <Calendar className="h-5 w-5" />;
      case 'sheets':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'drive':
        return <HardDrive className="h-5 w-5" />;
      case 'maps':
        return <Map className="h-5 w-5" />;
      case 'analytics':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };
  
  const getServiceStatus = (service: keyof NonNullable<typeof summary>['services']) => {
    if (!summary) return false;
    return summary.services[service];
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Google Integrations</h1>
        <p className="text-gray-600">
          Connect and sync with Google Workspace services
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="sheets">Sheets</TabsTrigger>
          <TabsTrigger value="drive">Drive</TabsTrigger>
          <TabsTrigger value="maps">Maps</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Service Cards */}
            {['calendar', 'sheets', 'drive', 'maps', 'analytics'].map((service) => (
              <Card key={service}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getServiceIcon(service)}
                      <CardTitle className="capitalize">{service}</CardTitle>
                    </div>
                    <Badge variant={getServiceStatus(service as any) ? 'default' : 'secondary'}>
                      {getServiceStatus(service as any) ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {service === 'calendar' && 'Sync events and bookings with Google Calendar'}
                    {service === 'sheets' && 'Import/export data with Google Sheets'}
                    {service === 'drive' && 'Store and manage files in Google Drive'}
                    {service === 'maps' && 'Geocoding and venue mapping'}
                    {service === 'analytics' && 'Track user behavior and conversions'}
                  </p>
                  
                  {getServiceStatus(service as any) ? (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setActiveTab(service)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-red-600"
                        onClick={() => console.log('Disconnect', service)}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleConnectService(service)}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Integration Stats */}
          {summary && summary.stats && (
            <Card>
              <CardHeader>
                <CardTitle>Sync Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Syncs</p>
                    <p className="text-2xl font-bold">{summary.stats.totalSyncs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Successful</p>
                    <p className="text-2xl font-bold text-green-600">
                      {summary.stats.successfulSyncs}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {summary.stats.failedSyncs}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Sync</p>
                    <p className="text-sm">
                      {summary.stats.lastSyncAt
                        ? new Date(summary.stats.lastSyncAt.toDate()).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="calendar">
          <div className="space-y-6">
            {/* Existing Calendar Syncs */}
            {calendarSyncs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Calendar Syncs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {calendarSyncs.map((sync) => (
                      <div
                        key={sync.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold">{sync.calendarName}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Direction: {sync.syncDirection}</span>
                            <span>Frequency: {sync.syncFrequency}</span>
                            <span>
                              Status:{' '}
                              <Badge
                                variant={sync.status === 'active' ? 'default' : 'destructive'}
                              >
                                {sync.status}
                              </Badge>
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncNow('calendar', sync.id!)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Add New Calendar Sync */}
            <Card>
              <CardHeader>
                <CardTitle>Add Calendar Sync</CardTitle>
                <CardDescription>
                  Set up a new Google Calendar synchronization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="calendar-id">Calendar ID</Label>
                      <Input
                        id="calendar-id"
                        value={newCalendarSync.calendarId}
                        onChange={(e) =>
                          setNewCalendarSync({ ...newCalendarSync, calendarId: e.target.value })
                        }
                        placeholder="calendar-id@group.calendar.google.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="calendar-name">Calendar Name</Label>
                      <Input
                        id="calendar-name"
                        value={newCalendarSync.calendarName}
                        onChange={(e) =>
                          setNewCalendarSync({ ...newCalendarSync, calendarName: e.target.value })
                        }
                        placeholder="My Events Calendar"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sync-direction">Sync Direction</Label>
                      <Select
                        value={newCalendarSync.syncDirection}
                        onValueChange={(value: any) =>
                          setNewCalendarSync({ ...newCalendarSync, syncDirection: value })
                        }
                      >
                        <SelectTrigger id="sync-direction">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-way">One-way (Google → App)</SelectItem>
                          <SelectItem value="two-way">Two-way</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sync-frequency">Sync Frequency</Label>
                      <Select
                        value={newCalendarSync.syncFrequency}
                        onValueChange={(value: any) =>
                          setNewCalendarSync({ ...newCalendarSync, syncFrequency: value })
                        }
                      >
                        <SelectTrigger id="sync-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={handleSetupCalendarSync}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Set Up Calendar Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sheets">
          <div className="space-y-6">
            {/* Add New Sheets Sync */}
            <Card>
              <CardHeader>
                <CardTitle>Add Sheets Sync</CardTitle>
                <CardDescription>
                  Set up data synchronization with Google Sheets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="spreadsheet-id">Spreadsheet ID</Label>
                      <Input
                        id="spreadsheet-id"
                        value={newSheetsSync.spreadsheetId}
                        onChange={(e) =>
                          setNewSheetsSync({ ...newSheetsSync, spreadsheetId: e.target.value })
                        }
                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="spreadsheet-name">Spreadsheet Name</Label>
                      <Input
                        id="spreadsheet-name"
                        value={newSheetsSync.spreadsheetName}
                        onChange={(e) =>
                          setNewSheetsSync({ ...newSheetsSync, spreadsheetName: e.target.value })
                        }
                        placeholder="Event Data Sheet"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sync-type">Sync Type</Label>
                      <Select
                        value={newSheetsSync.syncType}
                        onValueChange={(value: any) =>
                          setNewSheetsSync({ ...newSheetsSync, syncType: value })
                        }
                      >
                        <SelectTrigger id="sync-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="import">Import Only</SelectItem>
                          <SelectItem value="export">Export Only</SelectItem>
                          <SelectItem value="bidirectional">Bidirectional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="data-type">Data Type</Label>
                      <Select
                        value={newSheetsSync.dataType}
                        onValueChange={(value: any) =>
                          setNewSheetsSync({ ...newSheetsSync, dataType: value })
                        }
                      >
                        <SelectTrigger id="data-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="events">Events</SelectItem>
                          <SelectItem value="venues">Venues</SelectItem>
                          <SelectItem value="djs">DJs</SelectItem>
                          <SelectItem value="contracts">Contracts</SelectItem>
                          <SelectItem value="finances">Finances</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sheets-frequency">Sync Frequency</Label>
                      <Select
                        value={newSheetsSync.syncFrequency}
                        onValueChange={(value: any) =>
                          setNewSheetsSync({ ...newSheetsSync, syncFrequency: value })
                        }
                      >
                        <SelectTrigger id="sheets-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={handleSetupSheetsSync}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Set Up Sheets Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="drive">
          <Card>
            <CardHeader>
              <CardTitle>Google Drive Integration</CardTitle>
              <CardDescription>
                Automatically backup and sync files with Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Auto-upload Contracts</p>
                    <p className="text-sm text-gray-600">
                      Automatically upload signed contracts to Drive
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Auto-upload Event Assets</p>
                    <p className="text-sm text-gray-600">
                      Save generated assets and flyers to Drive
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Create Monthly Folders</p>
                    <p className="text-sm text-gray-600">
                      Organize files in monthly folders automatically
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Button className="w-full">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Configure Drive Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maps">
          <Card>
            <CardHeader>
              <CardTitle>Google Maps Configuration</CardTitle>
              <CardDescription>
                Configure mapping and geocoding services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maps-api-key">API Key</Label>
                  <Input
                    id="maps-api-key"
                    type="password"
                    placeholder="AIza..."
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Your Google Maps Platform API key
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default-lat">Default Latitude</Label>
                    <Input
                      id="default-lat"
                      type="number"
                      placeholder="40.7128"
                      step="0.0001"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="default-lng">Default Longitude</Label>
                    <Input
                      id="default-lng"
                      type="number"
                      placeholder="-74.0060"
                      step="0.0001"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Map Features</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="show-venues" />
                      <Label htmlFor="show-venues" className="font-normal">
                        Show venue locations on maps
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="show-traffic" />
                      <Label htmlFor="show-traffic" className="font-normal">
                        Display traffic information
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="geocoding-cache" />
                      <Label htmlFor="geocoding-cache" className="font-normal">
                        Enable geocoding cache
                      </Label>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full">
                  <Map className="h-4 w-4 mr-2" />
                  Save Maps Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Google Analytics 4</CardTitle>
              <CardDescription>
                Track user behavior and conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="measurement-id">Measurement ID</Label>
                  <Input
                    id="measurement-id"
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Your GA4 measurement ID
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Event Tracking</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="track-signups" defaultChecked />
                      <Label htmlFor="track-signups" className="font-normal">
                        Track user signups
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="track-bookings" defaultChecked />
                      <Label htmlFor="track-bookings" className="font-normal">
                        Track booking events
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="track-payments" defaultChecked />
                      <Label htmlFor="track-payments" className="font-normal">
                        Track payment events
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="track-contracts" defaultChecked />
                      <Label htmlFor="track-contracts" className="font-normal">
                        Track contract signing
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Debug Mode</p>
                    <p className="text-sm text-gray-600">
                      Enable GA4 debug view for testing
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Button className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Save Analytics Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}