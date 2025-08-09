'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventPipelineBoard } from '@/components/events/event-pipeline-board';
import { Plus, BarChart, Calendar, List } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUserOrganizations } from '@/lib/services/organization-service';
import { Organization } from '@/lib/types/organization';

export default function EventPipelinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

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
        setSelectedOrg(orgs[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event pipeline...</p>
        </div>
      </div>
    );
  }

  if (!selectedOrg) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Organization Found</CardTitle>
            <CardDescription>
              You need to create or join an organization to manage events.
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Event Pipeline</h1>
            <p className="text-gray-600">
              Manage your events through their lifecycle stages
            </p>
          </div>
          <Button onClick={() => router.push('/events/create')}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
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
              value={selectedOrg.id}
              onChange={(e) => {
                const org = organizations.find(o => o.id === e.target.value);
                if (org) setSelectedOrg(org);
              }}
              className="w-full p-2 border rounded-md"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.type})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board">
            <BarChart className="h-4 w-4 mr-2" />
            Pipeline Board
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <EventPipelineBoard orgId={selectedOrg.id!} />
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                View your events in a calendar format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Calendar view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>List View</CardTitle>
              <CardDescription>
                View all events in a table format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">List view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}