import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'hi'],
  defaultLocale: 'en',
  localePrefix: 'never'
});

export function proxy(request: any) {
  const hostname = request.headers.get('host') || '';
  const parts = hostname.split('.');
  let tenant = '';

  if (parts.length >= 2) {
    if (parts[0] !== 'www' && parts[0] !== 'localhost') {
      tenant = parts[0];
    }
  }

  // Use intlMiddleware to handle locale cookies/headers
  const response = intlMiddleware(request);

  if (tenant) {
    response.headers.set('X-Tenant-ID', tenant);
  }

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
