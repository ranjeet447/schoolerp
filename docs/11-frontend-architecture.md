# 11 - Frontend Architecture

## Stack
- **Framework**: Next.js (App Router).
- **Runtime**: TypeScript.
- **Styling**: Tailwind CSS + `shadcn/ui`.
- **I18n**: `next-intl`.

## App Layouts
The web app serves 4 distinct role-based shells:

| Layout | Path | Description |
|---|---|---|
| **Admin** | `/admin/*` | Dark mode default, complex data tables, audit logs, 27+ page directories |
| **Teacher** | `/teacher/*` | Action-oriented: attendance marking, homework creation, marks entry |
| **Parent** | `/parent/*` | Read-heavy, mobile-first: fees, notices, results, child profiles |
| **Platform** | `/platform/*` | Super Admin control plane: tenants, plans, billing, monitoring |

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
- ErrorState component for offline detection.

## Related Docs
- [UI Screen Checklist](./UI_SCREEN_CHECKLIST.md) — Pages & Storybook coverage
- [Storybook & Component System](./12-storybook-component-system.md)
