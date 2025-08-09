import { headers } from 'next/headers';
import { getOrganizationBySubdomain, getOrganizationByDomain } from '@/lib/services/organization-service';
import { Organization } from '@/lib/types/organization';

export interface OrganizationContext {
  organization: Organization | null;
  isSubdomain: boolean;
  isCustomDomain: boolean;
}

// Get organization from request headers/domain
export async function getOrganizationContext(): Promise<OrganizationContext> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Check if it's a subdomain
  const isGigguinDomain = hostname.endsWith('.gigguin.com') || hostname.endsWith('.localhost');
  
  if (isGigguinDomain) {
    // Extract subdomain
    const subdomain = hostname.split('.')[0];
    
    // Skip if it's www or app
    if (subdomain === 'www' || subdomain === 'app' || subdomain === 'localhost') {
      return {
        organization: null,
        isSubdomain: false,
        isCustomDomain: false
      };
    }
    
    const organization = await getOrganizationBySubdomain(subdomain);
    return {
      organization,
      isSubdomain: true,
      isCustomDomain: false
    };
  }
  
  // Check for custom domain
  const organization = await getOrganizationByDomain(hostname);
  return {
    organization,
    isSubdomain: false,
    isCustomDomain: !!organization
  };
}

// Helper to require organization context
export function requireOrganization(context: OrganizationContext): Organization {
  if (!context.organization) {
    throw new Error('Organization context required');
  }
  return context.organization;
}