# 12 - Storybook and Component System

## /packages/ui
This is the atomic UI library.
- Built on `shadcn/ui` (Radix).
- Strictly presentational. No API calls or business logic.

## Storybook Requirements
- Every new component MUST have a `.stories.tsx` file.
- **Variants**: Show all states (Loading, Error, Empty, Disabled).
- **I18n Stress Test**: One story specifically testing the component with a long Marathi or Tamil string to ensure layout resilience.

## Design Tokens
- Centralized in `tailwind.config.ts`.
- Branded via CSS Variables (for white-label support).

## Regression Testing
Playwright visual snapshots are taken of Storybook stories during CI to catch CSS regressions.
