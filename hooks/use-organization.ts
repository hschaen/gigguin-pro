import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getOrganizationsByUser, getOrganizationById } from '@/lib/services/organization-service';
import { Organization } from '@/lib/types/organization';

export function useOrganization() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrg(null);
      setLoading(false);
    }
  }, [user]);

  const loadOrganizations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const orgs = await getOrganizationsByUser(user.uid);
      setOrganizations(orgs);
      
      // Set the first org as current if available
      if (orgs.length > 0) {
        // Check if there's a saved current org in localStorage
        const savedOrgId = localStorage.getItem('currentOrgId');
        const savedOrg = savedOrgId ? orgs.find(o => o.id === savedOrgId) : null;
        
        if (savedOrg) {
          setCurrentOrg(savedOrg);
        } else {
          setCurrentOrg(orgs[0]);
          localStorage.setItem('currentOrgId', orgs[0].id!);
        }
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    try {
      const org = await getOrganizationById(orgId);
      if (org) {
        setCurrentOrg(org);
        localStorage.setItem('currentOrgId', orgId);
      }
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  };

  const refreshOrganizations = async () => {
    await loadOrganizations();
  };

  return {
    organizations,
    currentOrg,
    loading,
    switchOrganization,
    refreshOrganizations
  };
}