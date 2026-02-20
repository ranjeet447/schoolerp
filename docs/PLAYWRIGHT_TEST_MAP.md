# Playwright Test Coverage Map (Monorepo)

**Last Updated:** 2026-02-20  
**Scope:** Entire repository (`apps/*`, `packages/*`, `services/*`)

## Status Legend
- `[x]` Implemented and discoverable
- `[~]` Configured (Playwright-backed), but not mapped as direct Playwright specs here
- `[-]` No Playwright test harness in this workspace

---

## Project-Wide Coverage Matrix

| Workspace | Test Harness | Playwright Entry | Status | Count | Notes |
|---|---|---|---|---:|---|
| `apps/web` | Playwright (`@playwright/test`) | `apps/web/playwright.config.ts` + `apps/web/src/tests/*.spec.ts` | [x] | 25 | Primary product E2E smoke suite |
| `apps/marketing` | Playwright (`@playwright/test`) | default config + `apps/marketing/tests/*.spec.ts` | [x] | 10 | Public site and funnel regression |
| `packages/storybook` | Vitest Browser + Playwright provider | `packages/storybook/vitest.config.ts` (`@vitest/browser-playwright`) | [~] | N/A | Story-driven browser tests are configured via Vitest, not direct Playwright spec files |
| `apps/mobile` | None | — | [-] | 0 | No Playwright setup |
| `packages/ui` | None | — | [-] | 0 | No Playwright setup |
| `packages/config` | None | — | [-] | 0 | Config-only package |
| `services/api` | Go tests | `services/api/go.mod` | [-] | 0 | Backend service (non-Playwright) |
| `services/worker` | Go tests | `services/worker/go.mod` | [-] | 0 | Worker service (non-Playwright) |

**Direct Playwright total:** **35 tests** (`25 web + 10 marketing`)

---

## Direct Playwright Inventory

| App | File | Tests |
|---|---|---:|
| web | `apps/web/src/tests/auth-smoke.spec.ts` | 3 |
| web | `apps/web/src/tests/sis-smoke.spec.ts` | 4 |
| web | `apps/web/src/tests/attendance-smoke.spec.ts` | 2 |
| web | `apps/web/src/tests/notice-smoke.spec.ts` | 2 |
| web | `apps/web/src/tests/exam-smoke.spec.ts` | 3 |
| web | `apps/web/src/tests/finance-smoke.spec.ts` | 3 |
| web | `apps/web/src/tests/operations-smoke.spec.ts` | 8 |
| marketing | `apps/marketing/tests/smoke.spec.ts` | 5 |
| marketing | `apps/marketing/tests/demo-booking.spec.ts` | 1 |
| marketing | `apps/marketing/tests/growth.spec.ts` | 4 |
|  | **Total** | **35** |

---

## Complete Direct Playwright Case List (35/35)

### Web (`apps/web/src/tests`)

| ID | Test Case | File | Status |
|---|---|---|---|
| WEB-AUTH-01 | Login page loads correctly | `apps/web/src/tests/auth-smoke.spec.ts` | [x] |
| WEB-AUTH-02 | Quick access buttons work | `apps/web/src/tests/auth-smoke.spec.ts` | [x] |
| WEB-AUTH-03 | Invalid login shows toast error | `apps/web/src/tests/auth-smoke.spec.ts` | [x] |
| WEB-SIS-01 | Admin student list loads | `apps/web/src/tests/sis-smoke.spec.ts` | [x] |
| WEB-SIS-02 | Create student dialog opens and submits | `apps/web/src/tests/sis-smoke.spec.ts` | [x] |
| WEB-SIS-03 | Import wizard opens correctly | `apps/web/src/tests/sis-smoke.spec.ts` | [x] |
| WEB-SIS-04 | Parent can see children list | `apps/web/src/tests/sis-smoke.spec.ts` | [x] |
| WEB-ATT-01 | Teacher can load attendance marking page | `apps/web/src/tests/attendance-smoke.spec.ts` | [x] |
| WEB-ATT-02 | Parent can submit leave request | `apps/web/src/tests/attendance-smoke.spec.ts` | [x] |
| WEB-NOTICE-01 | Admin can publish a notice | `apps/web/src/tests/notice-smoke.spec.ts` | [x] |
| WEB-NOTICE-02 | Parent can view and acknowledge a notice | `apps/web/src/tests/notice-smoke.spec.ts` | [x] |
| WEB-EXAM-01 | Admin can manage exams | `apps/web/src/tests/exam-smoke.spec.ts` | [x] |
| WEB-EXAM-02 | Teacher can enter marks | `apps/web/src/tests/exam-smoke.spec.ts` | [x] |
| WEB-EXAM-03 | Parent can view child results | `apps/web/src/tests/exam-smoke.spec.ts` | [x] |
| WEB-FIN-01 | Accountant can load fee management and create a plan | `apps/web/src/tests/finance-smoke.spec.ts` | [x] |
| WEB-FIN-02 | Accountant can collect payment and issue receipt | `apps/web/src/tests/finance-smoke.spec.ts` | [x] |
| WEB-FIN-03 | Parent can see fee summary and history | `apps/web/src/tests/finance-smoke.spec.ts` | [x] |
| WEB-OPS-01 | Admin dashboard command center loads | `apps/web/src/tests/operations-smoke.spec.ts` | [x] |
| WEB-OPS-02 | Parent dashboard overview loads | `apps/web/src/tests/operations-smoke.spec.ts` | [x] |
| WEB-OPS-03 | Teacher homework workspace loads | `apps/web/src/tests/operations-smoke.spec.ts` | [x] |
| WEB-OPS-04 | Transport vehicles page loads | `apps/web/src/tests/operations-smoke.spec.ts` | [x] |
| WEB-OPS-05 | Transport routes page loads | `apps/web/src/tests/operations-smoke.spec.ts` | [x] |
| WEB-OPS-06 | Library catalog page loads | `apps/web/src/tests/operations-smoke.spec.ts` | [x] |
| WEB-OPS-07 | Inventory item master page loads | `apps/web/src/tests/operations-smoke.spec.ts` | [x] |
| WEB-OPS-08 | Admissions applications queue loads | `apps/web/src/tests/operations-smoke.spec.ts` | [x] |

### Marketing (`apps/marketing/tests`)

| ID | Test Case | File | Status |
|---|---|---|---|
| MKT-SMOKE-01 | Homepage loads with key sections | `apps/marketing/tests/smoke.spec.ts` | [x] |
| MKT-SMOKE-02 | Features page loads | `apps/marketing/tests/smoke.spec.ts` | [x] |
| MKT-SMOKE-03 | Pricing page toggles | `apps/marketing/tests/smoke.spec.ts` | [x] |
| MKT-SMOKE-04 | Blog listing loads | `apps/marketing/tests/smoke.spec.ts` | [x] |
| MKT-SMOKE-05 | Contact page loads | `apps/marketing/tests/smoke.spec.ts` | [x] |
| MKT-DEMO-01 | Should complete a booking flow | `apps/marketing/tests/demo-booking.spec.ts` | [x] |
| MKT-GROWTH-01 | Case study PDF download flow | `apps/marketing/tests/growth.spec.ts` | [x] |
| MKT-GROWTH-02 | Public review submission | `apps/marketing/tests/growth.spec.ts` | [x] |
| MKT-GROWTH-03 | Integrations directory and filtering | `apps/marketing/tests/growth.spec.ts` | [x] |
| MKT-GROWTH-04 | Partner application submission | `apps/marketing/tests/growth.spec.ts` | [x] |

---

## Execution Commands

```bash
# Direct Playwright suites
pnpm --filter @schoolerp/web test:e2e
pnpm --filter @schoolerp/marketing test

# Optional: Storybook browser tests (Playwright provider via Vitest)
pnpm --filter @schoolerp/storybook exec vitest run --config vitest.config.ts
```

---

## Verification Snapshot
- `pnpm --filter @schoolerp/web exec playwright test --list` -> 25 tests discovered
- `pnpm --filter @schoolerp/marketing exec playwright test --list` -> 10 tests discovered
- Combined direct Playwright discovery -> **35 tests**
