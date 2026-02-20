import { NextResponse } from 'next/server';

export default function proxy(request: any) {
  const hostname = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').toLowerCase();
  const normalizedHost = hostname.split(',')[0]?.trim().split(':')[0]?.trim() || '';

  const requestHeaders = new Headers(request.headers);
  if (normalizedHost && normalizedHost !== 'localhost' && !normalizedHost.includes('vercel.app')) {
    requestHeaders.set('X-Tenant-ID', normalizedHost);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

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
