# 14 - Testing and Quality

## 1. Playwright (Mandatory)
Playwright is our primary integration testing tool.

### Smoke Suite
- Auth flow (OTP landing page).
- Tenant portal loading.
- Role-based menu visibility.

### Regression Suite
- Fee payment flow simulation.
- Student admission form submission.
- Language switcher verification.

## 2. Go Unit Tests
- Business logic in `pkg/` (policy engine, fine calculations).
- Mocking DB via `pgxmock`.

## 3. Storybook Interaction Tests
- Component behavior in isolation.

## 4. Linting & Type Checks
- `golangci-lint` for Go.
- `eslint` + `tsc` for TypeScript.

## 5. CI Gating
No PR is merged unless:
- All linters pass.
- All unit tests pass.
- Playwright smoke suite passes.
- Storybook build completes successfully.
