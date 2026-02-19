# Playwright Regression Sanity Suite Map

**Last Updated:** 2026-02-19
**Framework:** Playwright (TypeScript)
**Location:** `tests/e2e/`

## Status Legend
- `[ ]` Not implemented
- `[x]` Implemented and passing

---

## Test Organization

```
tests/e2e/
├── auth/
│   ├── login.spec.ts
│   ├── forgot-password.spec.ts
│   └── mfa.spec.ts
├── admin/
│   ├── dashboard.spec.ts
│   ├── students/
│   │   ├── student-list.spec.ts
│   │   ├── student-create.spec.ts
│   │   └── student-profile.spec.ts
│   ├── finance/
│   │   ├── fee-heads.spec.ts
│   │   ├── fee-plans.spec.ts
│   │   ├── fee-collection.spec.ts
│   │   ├── receipts.spec.ts
│   │   └── tally-export.spec.ts
│   ├── attendance/
│   │   ├── mark-attendance.spec.ts
│   │   └── staff-attendance.spec.ts
│   ├── academics/
│   │   ├── homework.spec.ts
│   │   ├── lesson-plans.spec.ts
│   │   ├── timetable.spec.ts
│   │   └── certificates.spec.ts
│   ├── exams/
│   │   ├── exam-management.spec.ts
│   │   └── marks-entry.spec.ts
│   ├── notices/
│   │   └── notice-crud.spec.ts
│   ├── communication/
│   │   ├── ptm-events.spec.ts
│   │   └── chat.spec.ts
│   ├── safety/
│   │   ├── visitor-checkin.spec.ts
│   │   ├── emergency-broadcast.spec.ts
│   │   └── pickup-auth.spec.ts
│   ├── transport/
│   │   ├── vehicles.spec.ts
│   │   ├── routes.spec.ts
│   │   └── allocations.spec.ts
│   ├── library/
│   │   ├── book-crud.spec.ts
│   │   └── issue-return.spec.ts
│   ├── inventory/
│   │   ├── items.spec.ts
│   │   ├── purchase-orders.spec.ts
│   │   └── stock-transactions.spec.ts
│   ├── hrms/
│   │   ├── employees.spec.ts
│   │   ├── salary-structures.spec.ts
│   │   └── payroll.spec.ts
│   ├── admissions/
│   │   ├── enquiries.spec.ts
│   │   └── applications.spec.ts
│   ├── alumni/
│   │   └── alumni-drives.spec.ts
│   └── settings/
│       ├── roles.spec.ts
│       └── school-profile.spec.ts
├── parent/
│   ├── dashboard.spec.ts
│   ├── notices.spec.ts
│   ├── fees.spec.ts
│   ├── results.spec.ts
│   └── child-profile.spec.ts
├── teacher/
│   ├── attendance.spec.ts
│   └── homework.spec.ts
├── public/
│   ├── admissions-form.spec.ts
│   └── demo-booking.spec.ts
└── fixtures/
    ├── auth.fixture.ts
    ├── tenant.fixture.ts
    └── test-data.ts
```

---

## Sanity Suite — Critical Path Tests

### Tier 1: Auth & Navigation (must-pass gate)
| ID | Test | File | Status |
|---|---|---|---|
| T1-01 | Admin login with valid credentials | `auth/login.spec.ts` | [ ] |
| T1-02 | Admin login with invalid password shows error | `auth/login.spec.ts` | [ ] |
| T1-03 | Admin dashboard loads after login | `admin/dashboard.spec.ts` | [ ] |
| T1-04 | Sidebar navigation to all primary modules | `admin/dashboard.spec.ts` | [ ] |
| T1-05 | Parent login and dashboard load | `parent/dashboard.spec.ts` | [ ] |
| T1-06 | Teacher login and see class options | `teacher/attendance.spec.ts` | [ ] |

### Tier 2: Core Academic Flow (student lifecycle)
| ID | Test | File | Status |
|---|---|---|---|
| T2-01 | Create student with required fields | `admin/students/student-create.spec.ts` | [ ] |
| T2-02 | Search student by name/admission number | `admin/students/student-list.spec.ts` | [ ] |
| T2-03 | View student profile with tabs | `admin/students/student-profile.spec.ts` | [ ] |
| T2-04 | Mark attendance for a class section | `admin/attendance/mark-attendance.spec.ts` | [ ] |
| T2-05 | Create and publish notice | `admin/notices/notice-crud.spec.ts` | [ ] |
| T2-06 | Create exam + enter marks | `admin/exams/marks-entry.spec.ts` | [ ] |
| T2-07 | Create homework assignment | `admin/academics/homework.spec.ts` | [ ] |

### Tier 3: Financial Flow (fee → receipt → reconciliation)
| ID | Test | File | Status |
|---|---|---|---|
| T3-01 | Create fee head | `admin/finance/fee-heads.spec.ts` | [ ] |
| T3-02 | Create fee plan with items | `admin/finance/fee-plans.spec.ts` | [ ] |
| T3-03 | Search student and collect fee | `admin/finance/fee-collection.spec.ts` | [ ] |
| T3-04 | Issue receipt with sequential numbering | `admin/finance/receipts.spec.ts` | [ ] |
| T3-05 | Cancel receipt with reason | `admin/finance/receipts.spec.ts` | [ ] |
| T3-06 | Tally export generates download | `admin/finance/tally-export.spec.ts` | [ ] |

### Tier 4: Operations & Safety
| ID | Test | File | Status |
|---|---|---|---|
| T4-01 | Create transport vehicle + route | `admin/transport/vehicles.spec.ts` | [ ] |
| T4-02 | CRUD library book + issue/return | `admin/library/book-crud.spec.ts` | [ ] |
| T4-03 | Create inventory item + PO | `admin/inventory/purchase-orders.spec.ts` | [ ] |
| T4-04 | Visitor check-in / check-out | `admin/safety/visitor-checkin.spec.ts` | [ ] |
| T4-05 | Send emergency broadcast | `admin/safety/emergency-broadcast.spec.ts` | [ ] |
| T4-06 | Create PTM event + book slot | `admin/communication/ptm-events.spec.ts` | [ ] |

### Tier 5: HRMS & Advanced
| ID | Test | File | Status |
|---|---|---|---|
| T5-01 | Create employee with salary structure | `admin/hrms/employees.spec.ts` | [ ] |
| T5-02 | Run payroll for a month | `admin/hrms/payroll.spec.ts` | [ ] |
| T5-03 | Create alumni profile | `admin/alumni/alumni-drives.spec.ts` | [ ] |
| T5-04 | Create admission enquiry + application | `admin/admissions/applications.spec.ts` | [ ] |

### Tier 6: Parent & Teacher Flows
| ID | Test | File | Status |
|---|---|---|---|
| T6-01 | Parent views child profile tabs | `parent/child-profile.spec.ts` | [ ] |
| T6-02 | Parent acknowledges notice | `parent/notices.spec.ts` | [ ] |
| T6-03 | Parent views fee summary + receipts | `parent/fees.spec.ts` | [ ] |
| T6-04 | Parent views exam results | `parent/results.spec.ts` | [ ] |
| T6-05 | Teacher marks attendance via class selector | `teacher/attendance.spec.ts` | [ ] |
| T6-06 | Teacher creates homework | `teacher/homework.spec.ts` | [ ] |

---

## Test Fixtures & Setup

### Auth Fixture (`fixtures/auth.fixture.ts`)
```typescript
// Provides: adminPage, parentPage, teacherPage
// Pre-authenticated browser contexts for each role
```

### Tenant Fixture (`fixtures/tenant.fixture.ts`)
```typescript
// Seeds: test tenant, academic year, classes, sections, subjects
// Creates: test students, guardians, employees
```

### Test Data (`fixtures/test-data.ts`)
```typescript
// Constants: student names, fee amounts, exam data
// Factory functions for generating test payloads
```

---

## CI/CD Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm run dev &
      - run: pnpm exec playwright test --project=chromium
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Implementation Priority

| Phase | Tests | Count |
|---|---|---|
| **Sprint 1** | Tier 1 (Auth) + Tier 2 (Academic) | 13 |
| **Sprint 2** | Tier 3 (Finance) + Tier 6 (Parent/Teacher) | 12 |
| **Sprint 3** | Tier 4 (Ops/Safety) + Tier 5 (HRMS/Advanced) | 10 |
| **Total** | All sanity regression tests | **35** |
