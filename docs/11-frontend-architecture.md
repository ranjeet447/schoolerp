# 11 - Frontend Architecture

## Stack
- **Framework**: Next.js (App Router).
- **Runtime**: TypeScript.
- **Styling**: Tailwind CSS + `shadcn/ui`.
- **I18n**: `next-intl`.

## App Layouts
- `/admin/*`: Dark mode default, complex data tables, audit logs.
- `/teacher/*`: Action-oriented, bulk attendance, marks entry.
- `/parent/*`: Lean, read-heavy, fee payments, mobile-first.

## Data Fetching
- **Server Components**: Prefer for initial page load and SEO.
- **Client Components**: Only for interactivity (forms, modals, filters).
- **API Client**: A shared `fetch` wrapper that:
  - Injects `X-Request-ID`.
  - Handles auth token refreshing.
  - Consistent error handling (Toasts).

## I18n & Terminology Overrides
- Default translations in `/locales`.
- Shared Terminologies (e.g., "Standard" vs "Grade", "Fees" vs "Contributions").
- Implementation: Custom hook merges global i18n with `tenant_config` overrides.

## PWA & Mobile
- Service worker for offline asset caching.
- Capacitor wrapper for native push.
