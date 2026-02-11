import { NextResponse } from 'next/server';

export default function proxy(request: any) {
  const hostname = request.headers.get('host') || '';
  const parts = hostname.split('.');
  let tenant = '';

  if (parts.length >= 2) {
    if (parts[0] !== 'www' && parts[0] !== 'localhost' && !parts[0].includes('vercel')) {
      tenant = parts[0];
    }
  }

  const response = NextResponse.next();

  if (tenant) {
    response.headers.set('X-Tenant-ID', tenant);
  }

  // Diagnostic header to verify proxy inclusion
  response.headers.set('X-Proxy-Active', 'true');

  return response;
}

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /_static (inside /public)
  // - all root files inside /public (e.g. /favicon.ico)
  matcher: ['/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)']
};
