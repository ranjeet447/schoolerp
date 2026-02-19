# 12 - Storybook and Component System

## /packages/ui
This is the atomic UI library.
- Built on `shadcn/ui` (Radix) + Tailwind CSS.
- Strictly presentational. No API calls or business logic.
- Exported via barrel `index.ts` for clean imports.

## Current Component Inventory
> See [UI Screen Checklist](./UI_SCREEN_CHECKLIST.md) for full page + component status.

### Implemented Components (no Storybook stories yet)
- Button (primary, secondary, destructive, outline, ghost)
- Input / Label
- Select / MultiSelect
- Dialog / Modal
- Dropdown Menu
- Tabs
- Table (sortable, paginated)
- Card, Badge, Tooltip, Popover
- Skeleton Loader, Avatar, Progress Bar
- Toast (Sonner notifications)
- ErrorState (generic, offline, 404, server)

### Components Needed
- DatePicker
- FileUpload (drag-and-drop)
- QRCode (generation + display)
- RichTextEditor (notices/homework)
- MapView (transport GPS)
- Timeline (audit/incident logs)
- StatCard (dashboard metrics)
- EmptyState (no data illustration)

## Storybook Requirements
- Every new component MUST have a `.stories.tsx` file.
- **Variants**: Show all states (Loading, Error, Empty, Disabled).
- **I18n Stress Test**: One story specifically testing the component with a long Marathi or Tamil string to ensure layout resilience.

## Design Tokens
- Centralized in `tailwind.config.ts`.
- Branded via CSS Variables (for white-label support).

## Regression Testing
Playwright visual snapshots are taken of Storybook stories during CI to catch CSS regressions.

## Action Items
1. **Phase 1**: Create Storybook stories for all existing core components (Button, Input, Dialog, Table, Tabs, Card, Badge, Toast, ErrorState)
2. **Phase 2**: Build and story new components (DatePicker, FileUpload, QRCode, StatCard, EmptyState)
3. **Phase 3**: Page-level stories for key admin flows (student list, fee collection, attendance)
