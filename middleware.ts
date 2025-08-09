import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the hostname
  const hostname = request.headers.get('host') || '';
  
  // Remove port if present
  const currentHost = hostname.split(':')[0];
  
  // Parse subdomain
  const isLocalhost = currentHost.includes('localhost');
  const isProduction = currentHost.includes('gigguin.com');
  
  if (isLocalhost || isProduction) {
    const subdomain = currentHost.split('.')[0];
    
    // Main app routes (www, app, or root domain)
    const isMainApp = 
      subdomain === 'www' || 
      subdomain === 'app' || 
      subdomain === 'localhost' ||
      subdomain === 'gigguin';
    
    if (!isMainApp) {
      // This is a subdomain - could be organization or public page
      // The actual organization lookup will happen in the page components
      // For now, we'll just add a header to indicate subdomain
      const response = NextResponse.next();
      response.headers.set('x-subdomain', subdomain);
      return response;
    }
  }
  
  // Check if it's a custom domain
  const knownDomains = ['gigguin.com', 'localhost', 'vercel.app'];
  const isCustomDomain = !knownDomains.some(domain => currentHost.includes(domain));
  
  if (isCustomDomain) {
    // Add header to indicate custom domain
    const response = NextResponse.next();
    response.headers.set('x-custom-domain', currentHost);
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_vercel).*)',
  ],
};