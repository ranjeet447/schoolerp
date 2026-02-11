import createMiddleware from 'next-intl/middleware';

export default function middleware(request: any) {
  const url = new URL(request.url);
  const hostname = request.headers.get('host') || '';

  // Example: school1.schoolerp.com -> school1
  // Local: school1.localhost:3000 -> school1
  const parts = hostname.split('.');
  let tenant = '';

  if (parts.length >= 2) {
    if (parts[0] !== 'www' && parts[0] !== 'localhost') {
      tenant = parts[0];
    }
  }

  const response = createMiddleware({
    locales: ['en', 'hi'],
    defaultLocale: 'en',
    localePrefix: 'never'
  })(request);

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
