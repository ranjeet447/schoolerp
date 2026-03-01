# Refocus Naming + SEO Audit (2026-02-26)

## Executive Summary

Scope audited:
- `apps/web` UI naming/copy refocus (role shells + key subpages)
- `apps/marketing` homepage/features/use-cases/pricing/integrations SEO-first refocus
- shared UI marketing copy/schema components in `packages/ui`
- tracking replacement (`docs/feature-tracking/refocus.json` + verifier + optional platform status page)
- refocus validation tests (Playwright, deterministic/mocked where needed)

Constraints respected:
- No API routes changed
- No business logic changed
- URL paths unchanged except optional internal platform status page addition (`/platform/refocus-status`)
- Changes are UI text, headings, metadata, schema, tracking, and test infrastructure only

Outcome (current working tree state):
- `apps/web` pillar naming is consistent across admin/parent/teacher/accountant/student shells and key requested subpages ✅
- `apps/marketing` is now pillar-first with pricing/add-ons/credits explanation and improved metadata/schema coverage ✅
- Machine-readable tracking system + verifier + optional internal status page implemented ✅
- Deterministic refocus Playwright checks implemented and passing (with mocked web admin + marketing smoke) ✅
- Remaining terminology debt exists in long-tail content datasets (blogs/templates/taxonomy labels), but core funnel + requested high-traffic pages are refocused ⚠️

## Phase 0 — Exact Inventory Of Changes (Diff-Based)

### Diff summary (`git diff --stat`)

```text
apps/marketing/src/app/blog/page.tsx               |  13 +++
.../marketing/src/app/book-demo/BookDemoClient.tsx |   6 +-
apps/marketing/src/app/features/FeaturesClient.tsx |  26 +++--
apps/marketing/src/app/features/[slug]/page.tsx    |  21 +++-
apps/marketing/src/app/features/page.tsx           |  20 +++-
.../marketing/src/app/integrations/[slug]/page.tsx |  19 +++-
apps/marketing/src/app/integrations/data.ts        |   6 +-
apps/marketing/src/app/integrations/page.tsx       |  23 ++++-
apps/marketing/src/app/layout.tsx                  |  24 +++--
apps/marketing/src/app/page.tsx                    | 108 +++++++++++++++++++--
apps/marketing/src/app/pricing/page.tsx            |  26 ++++-
apps/marketing/src/app/product/page.tsx            |  20 ++--
.../marketing/src/app/use-cases/UseCasesClient.tsx |  16 ++-
apps/marketing/src/app/use-cases/[slug]/page.tsx   |  16 ++-
apps/marketing/src/app/use-cases/page.tsx          |  14 ++-
apps/marketing/test-results/.last-run.json         |   2 +-
... (see full file inventory below)
```

### Exact changed files (grouped)

#### `apps/web` (UI-visible refocus + tests)

| Path | What changed | Classification |
|---|---|---|
| `apps/web/src/app/(admin)/admin-layout-client.tsx` | Admin sidebar labels/group headers refocused to 4 pillars + `Advanced Modules` collapsible grouping | Core pillars + Advanced modules |
| `apps/web/src/app/(admin)/admin/dashboard/page.tsx` | Dashboard widgets/copy reprioritized to pillar language | Core pillars |
| `apps/web/src/app/(admin)/admin/finance/page.tsx` | Page H1/subcopy/tabs refocused to fees/dues/reminders/receipts | Core pillar (Fees) |
| `apps/web/src/app/(admin)/admin/finance/setup/page.tsx` | H1/subcopy refocused to fee collection & dues setup wording | Core pillar (Fees) |
| `apps/web/src/app/(admin)/admin/finance/collect/page.tsx` | H1/subcopy refocused to fee collection/dues + receipts/UPI | Core pillar (Fees) |
| `apps/web/src/app/(admin)/admin/finance/counter/page.tsx` | Counter page H1/subcopy refocused to fee collection & dues counter | Core pillar (Fees) |
| `apps/web/src/app/(admin)/admin/finance/charts/page.tsx` | Chart page H1/subcopy refocused to dues dashboard wording | Core pillar (Fees) |
| `apps/web/src/app/(admin)/admin/communication/page.tsx` | H1/helper copy/card title refocused to parent communication | Core pillar (Parent communication) |
| `apps/web/src/app/(admin)/admin/communication/logs/page.tsx` | H1/helper copy refocused to parent communication delivery center | Core pillar (Parent communication) |
| `apps/web/src/app/(admin)/admin/communication/gateways/page.tsx` | H1/breadcrumb/helper copy refocused to parent communication gateways | Core pillar (Parent communication) |
| `apps/web/src/app/(admin)/admin/notices/page.tsx` | H1/helper copy/section heading refocused to notices & circulars under parent communication | Core pillar (Parent communication) |
| `apps/web/src/app/(admin)/admin/exams/page.tsx` | Admin exams H1 standardized to “Exam Management, Results & Report Cards” | Core pillar (Exams) |
| `apps/web/src/app/(admin)/admin/students/[id]/student-profile-client.tsx` | Removed `Student 360` wording in H1/loading/tab labels | Core pillar-adjacent (`Student Profile`) |
| `apps/web/src/app/(parent)/parent-layout-client.tsx` | Parent nav labels + “Parent App / Parent Portal” terminology | Core pillars (Parent app/fees/exams/notices) |
| `apps/web/src/app/(parent)/parent/dashboard/page.tsx` | Parent dashboard wording updated to parent app + communication | Core pillar (Parent communication/Parent App) |
| `apps/web/src/app/(parent)/parent/fees/page.tsx` | H1/subcopy uses “Fees & Dues” wording | Core pillar (Fees) |
| `apps/web/src/app/(parent)/parent/notices/page.tsx` | H1 updated to parent communication + notices | Core pillar (Parent communication) |
| `apps/web/src/app/(parent)/parent/results/page.tsx` | H1 updated to exams/results/report cards wording | Core pillar (Exams) |
| `apps/web/src/app/(parent)/parent/children/[id]/child-profile-client.tsx` | Child tabs renamed (`Fees & Dues`, `Exams & Results`, `Parent Communication`) | Core pillars + Student Profile |
| `apps/web/src/app/(parent)/parent/children/page.tsx` | Parent portal copy alignment (children/student profile wording) | Student Profile |
| `apps/web/src/app/(teacher)/teacher-layout-client.tsx` | Teacher nav labels + fallback branding `Teacher App` | Core pillars |
| `apps/web/src/app/(teacher)/teacher/dashboard/page.tsx` | H1/subcopy/CTA copy refocused (`Teacher App Dashboard`, `Attendance Management`) | Core pillars |
| `apps/web/src/app/(teacher)/teacher/attendance/page.tsx` | Attendance wording standardized | Core pillar (Attendance) |
| `apps/web/src/app/(teacher)/teacher/exams/marks/page.tsx` | H1 refocused to `Exams & Report Cards (Marks Entry)` | Core pillar (Exams) |
| `apps/web/src/app/(teacher)/teacher/homework/page.tsx` | H1/subcopy ties homework to parent app visibility | Core pillar (Parent app) |
| `apps/web/src/app/(teacher)/teacher/notices/page.tsx` | H1 refocused to parent communication + notices | Core pillar (Parent communication) |
| `apps/web/src/app/(accountant)/accountant-layout-client.tsx` | Fallback branding updated to `Fee Desk` | Core pillar (Fees) |
| `apps/web/src/app/(accountant)/accountant/dashboard/page.tsx` | Fee/dues oriented visible copy refinements | Core pillar (Fees) |
| `apps/web/src/app/(accountant)/accountant/fees/page.tsx` | Fees page visible copy alignment | Core pillar (Fees) |
| `apps/web/src/app/(student)/student-layout-client.tsx` | Student shell naming/copy alignment | Core pillar-adjacent |
| `apps/web/src/components/route-title-sync.tsx` | Browser tab/route title labels mapped to new terms | Cross-cutting UI naming |
| `apps/web/src/app/(platform)/platform-layout-client.tsx` | Added platform nav link for refocus tracker status page | Tracking/ops UI |
| `apps/web/src/app/(platform)/platform/refocus-status/page.tsx` | New internal status page reading JSON tracker and rendering progress | Tracking/ops UI |
| `apps/web/src/tests/exam-smoke.spec.ts` | Updated selectors/text for renamed exam wording | Verification |
| `apps/web/src/tests/notice-smoke.spec.ts` | Updated selectors/text for renamed notices/communication wording | Verification |
| `apps/web/src/tests/refocus-admin-nav.mock.spec.ts` (new) | Deterministic mocked refocus smoke for admin nav grouping + Advanced Modules collapse | Verification |
| `apps/web/playwright.refocus.config.ts` (new) | Refocus-only Playwright config with deterministic test selection and local server | Verification infra |

#### `apps/marketing` (SEO-first copy refocus + metadata + tests)

| Path | What changed | Classification |
|---|---|---|
| `apps/marketing/src/app/page.tsx` | Homepage hero/pillar sections/internal links/pricing explainer refocused to 4 pillars | Core pillars + SEO funnel |
| `apps/marketing/src/app/layout.tsx` | Global metadata keywords/description + `WebSiteSchema` inclusion | SEO infra |
| `apps/marketing/src/app/features/page.tsx` | `/features` metadata keyword cluster/canonical/openGraph updated | SEO |
| `apps/marketing/src/app/features/FeaturesClient.tsx` | Pillar-first categories, H1, search placeholder, internal links; `Advanced Modules` label | Core pillars + Advanced modules |
| `apps/marketing/src/app/features/[slug]/page.tsx` | Dynamic metadata keyword/canonical logic; H2 copy refocused | SEO + detail page copy |
| `apps/marketing/src/app/use-cases/page.tsx` | `/use-cases` metadata keyword cluster/canonical updated | SEO |
| `apps/marketing/src/app/use-cases/UseCasesClient.tsx` | H1/search/internal links refocused to fees/parent app/attendance/exams | Core pillars |
| `apps/marketing/src/app/use-cases/[slug]/page.tsx` | Dynamic metadata and detail-page H2 copy (`Workflow details for schools`) | SEO + detail page copy |
| `apps/marketing/src/app/pricing/page.tsx` | Metadata + explicit add-ons monthly / credits usage-based / top-up / cost-control explanation + internal links | Pricing + SEO |
| `apps/marketing/src/app/integrations/page.tsx` | Metadata + category/hero copy and card status wording `Available / Beta` | Integrations parity + SEO |
| `apps/marketing/src/app/integrations/[slug]/page.tsx` | Dynamic metadata + rollout availability note to avoid overclaims | Integrations parity + SEO |
| `apps/marketing/src/app/integrations/data.ts` | Integration status wording/parity updates (Google/Microsoft/Tally copy/status) | Integrations parity |
| `apps/marketing/src/app/product/page.tsx` | Product page metadata and screenshot labels aligned to core pillars (`Fee Collection & Dues`, `Parent App`, etc.) | Core pillars + SEO |
| `apps/marketing/src/app/book-demo/BookDemoClient.tsx` | Demo CTA flow copy refocused to core pillars and problem-first wording | Conversion copy |
| `apps/marketing/src/app/blog/page.tsx` | Added/internal linking and pillar-focused copy adjustments | SEO/internal linking |
| `apps/marketing/playwright.config.ts` (new) | Stable local host binding (`127.0.0.1`) for Playwright in sandbox/elevated runs | Verification infra |
| `apps/marketing/src/tests/refocus-marketing.spec.ts` (new) | Deterministic homepage/pricing refocus smoke assertions | Verification |
| `apps/marketing/test-results/.last-run.json` | Playwright generated artifact from local runs (not product code) | Generated artifact |

#### `packages/ui` (shared marketing copy/schema)

| Path | What changed | Classification |
|---|---|---|
| `packages/ui/src/components/hero-section.tsx` | Homepage hero copy/CTA language aligned to market terms | Core pillars + SEO copy |
| `packages/ui/src/components/feature-tabs.tsx` | Pillar-first feature tabs and labels | Core pillars |
| `packages/ui/src/components/use-case-grid.tsx` | Use-case presentation copy and links aligned to pillar terms | Core pillars |
| `packages/ui/src/components/faq-section.tsx` | Messaging-cost FAQ updated + `FAQSchema` emission | SEO schema + pricing copy |
| `packages/ui/src/components/seo.tsx` | Added `WebSiteSchema` component and schema reuse helpers | SEO infra |
| `packages/ui/src/components/roadmap-section.tsx` | Replaced `SIS` wording with `Student Profile` wording in roadmap copy | Core pillar-adjacent |
| `packages/ui/src/constants/pricing.ts` | Pricing feature bullet changed from `SIS` phrasing to `Student profiles` | Pricing copy |
| `packages/ui/src/data/features.ts` | Marketing feature title/description changed from `Student 360` to `Student Profile` | Detail page marketing copy |
| `packages/ui/src/data/case-studies.ts` | Case-study narrative text changed from `Student 360` to `Student Profile` (2 occurrences) | Detail page marketing copy |

#### Tests / docs / tracking / scripts (cross-cutting)

| Path | What changed | Classification |
|---|---|---|
| `package.json` | Added `refocus:verify` script | Verification tooling |
| `docs/feature-tracking.md` | Replaced weak checklist with pointer/deprecation note to JSON+CLI tracker | Tracking docs |
| `docs/feature-tracking/refocus.json` (new) | Machine-readable tracker with pillars, keywords, checks, statuses | Tracking source of truth |
| `scripts/verify-refocus.ts` (new) | CLI validator enforcing `Done` items by file/string evidence | Tracking verification |

## Phase 1 — Refactor Quality Validation (No API/Logic Changes)

## 1A) UI Consistency Audit (`apps/web`)

### Role-by-role status (requested roles)

| Role | Sidebar / shell naming | Dashboard / key pages | Status | Evidence |
|---|---|---|---|---|
| `tenant_admin` | Pillar-first groups + `Advanced Modules` collapsible | Finance/Communication/Exams/Student Profile pages updated | ✅ | `apps/web/src/app/(admin)/admin-layout-client.tsx:96`, `apps/web/src/app/(admin)/admin-layout-client.tsx:100`, `apps/web/src/app/(admin)/admin/dashboard/page.tsx:173`, `apps/web/src/app/(admin)/admin/finance/page.tsx:213`, `apps/web/src/app/(admin)/admin/communication/page.tsx:242`, `apps/web/src/app/(admin)/admin/exams/page.tsx:469`, `apps/web/src/app/(admin)/admin/students/[id]/student-profile-client.tsx:361` |
| `teacher` | `Teacher App` shell + pillar labels (`Attendance Management`, `Exams & Report Cards`, `Parent Communication`) | Dashboard / attendance / marks / homework updated | ✅ | `apps/web/src/app/(teacher)/teacher-layout-client.tsx:26`, `apps/web/src/app/(teacher)/teacher-layout-client.tsx:32`, `apps/web/src/app/(teacher)/teacher-layout-client.tsx:96`, `apps/web/src/app/(teacher)/teacher/dashboard/page.tsx:120`, `apps/web/src/app/(teacher)/teacher/attendance/page.tsx:319`, `apps/web/src/app/(teacher)/teacher/exams/marks/page.tsx:218`, `apps/web/src/app/(teacher)/teacher/homework/page.tsx:229` |
| `accountant` | Fee-oriented shell naming (`Fee Desk`) | Fee/dues visible copy aligned | ✅ | `apps/web/src/app/(accountant)/accountant-layout-client.tsx` (branding fallback changed), `apps/web/src/app/(accountant)/accountant/dashboard/page.tsx`, `apps/web/src/app/(accountant)/accountant/fees/page.tsx` |
| `parent` | `Parent App / Parent Portal` terminology + notices/fees/results labels | Dashboard/fees/notices/results/child profile tabs aligned | ✅ | `apps/web/src/app/(parent)/parent-layout-client.tsx:27`, `apps/web/src/app/(parent)/parent-layout-client.tsx:232`, `apps/web/src/app/(parent)/parent/dashboard/page.tsx:177`, `apps/web/src/app/(parent)/parent/fees/page.tsx:196`, `apps/web/src/app/(parent)/parent/notices/page.tsx:101`, `apps/web/src/app/(parent)/parent/results/page.tsx:155`, `apps/web/src/app/(parent)/parent/children/[id]/child-profile-client.tsx:168` |
| `student` | Shell naming aligned (route title sync + student shell text) | Core student pages not deeply refocused in this pass | ⚠️ | `apps/web/src/app/(student)/student-layout-client.tsx`, `apps/web/src/components/route-title-sync.tsx:44` |
| `platform` | Optional `Refocus Status` page added for internal tracking visibility | Not a user-facing pillar role; tracking page works | ✅ | `apps/web/src/app/(platform)/platform-layout-client.tsx:81`, `apps/web/src/app/(platform)/platform/refocus-status/page.tsx:49` |

### Requested high-traffic pages (deepened in this pass)

- Admin finance family (all requested routes):
  - `/admin/finance` → `apps/web/src/app/(admin)/admin/finance/page.tsx:213`
  - `/admin/finance/setup` → `apps/web/src/app/(admin)/admin/finance/setup/page.tsx:341`
  - `/admin/finance/collect` → `apps/web/src/app/(admin)/admin/finance/collect/page.tsx:200`
  - `/admin/finance/counter` → `apps/web/src/app/(admin)/admin/finance/counter/page.tsx:209`
  - `/admin/finance/charts` → `apps/web/src/app/(admin)/admin/finance/charts/page.tsx:201`
- Admin parent communication family:
  - `/admin/communication` → `apps/web/src/app/(admin)/admin/communication/page.tsx:242`
  - `/admin/communication/logs` → `apps/web/src/app/(admin)/admin/communication/logs/page.tsx:121`
  - `/admin/notices` → `apps/web/src/app/(admin)/admin/notices/page.tsx:222`
- Admin exams:
  - `/admin/exams` → `apps/web/src/app/(admin)/admin/exams/page.tsx:469`
- Admin student profile wording:
  - `/admin/students/[id]` → `apps/web/src/app/(admin)/admin/students/[id]/student-profile-client.tsx:361`
- Parent portal pages:
  - `/parent/dashboard` → `apps/web/src/app/(parent)/parent/dashboard/page.tsx:177`
  - `/parent/fees` → `apps/web/src/app/(parent)/parent/fees/page.tsx:196`
  - `/parent/notices` → `apps/web/src/app/(parent)/parent/notices/page.tsx:101`
  - `/parent/results` → `apps/web/src/app/(parent)/parent/results/page.tsx:155`
- Teacher pages:
  - `/teacher/dashboard` → `apps/web/src/app/(teacher)/teacher/dashboard/page.tsx:120`
  - `/teacher/attendance` → `apps/web/src/app/(teacher)/teacher/attendance/page.tsx:319`
  - `/teacher/exams/marks` → `apps/web/src/app/(teacher)/teacher/exams/marks/page.tsx:218`
  - `/teacher/homework` → `apps/web/src/app/(teacher)/teacher/homework/page.tsx:229`

### Remaining old-term exceptions (line-level, audit findings)

These are not API/logic issues, but copy/taxonomy debt remaining outside the requested high-traffic pages:

| Location | Residual term | Impact | Recommendation |
|---|---|---|---|
| `apps/web/src/app/(admin)/admin/reports/page.tsx:98` | `Finance` report tab label | Medium (admin reports UI) | Rename to `Fee Collection & Accounting` in future copy sweep |
| `apps/marketing/src/app/templates/page.tsx:17` | Template category includes `Finance` / `Communication` | Low (taxonomy, not funnel headline) | Consider pillar-aligned category aliases while keeping filter IDs |
| `packages/ui/src/data/blog-posts.ts` (multiple, e.g. `:375`, `:383`, `:418`) | `SIS` in long-form blog content | Low (legacy editorial content) | Editorial pass; preserve historical references where intentional |
| `packages/ui/src/data/templates.ts` (multiple, e.g. `:21`, `:358`) | `SIS` in long-form template prose | Low | Editorial content refresh backlog |
| `apps/web/src/tests/sis-smoke.spec.ts:3` | Test name `SIS Smoke Tests` | Low (test-only) | Rename in test hygiene pass (no product impact) |

## 1B) Marketing SEO Audit (`apps/marketing`)

### SEO quality checks summary

- Homepage is pillar-first with 4 explicit sections and keyword-aligned copy ✅
  - `apps/marketing/src/app/page.tsx:78`, `apps/marketing/src/app/page.tsx:85`, `apps/marketing/src/app/page.tsx:92`, `apps/marketing/src/app/page.tsx:99`
- `/features` grouped by core pillars + `Advanced Modules` ✅
  - `apps/marketing/src/app/features/FeaturesClient.tsx:11`–`apps/marketing/src/app/features/FeaturesClient.tsx:16`
- `/pricing` clearly explains optional monthly add-ons + included credits + top-ups beyond limits + cost control ✅
  - `apps/marketing/src/app/pricing/page.tsx:47`–`apps/marketing/src/app/pricing/page.tsx:67`
- `/integrations` and `/integrations/[slug]` copy avoids overclaiming deployment availability ✅
  - `apps/marketing/src/app/integrations/page.tsx:107`
  - `apps/marketing/src/app/integrations/[slug]/page.tsx:155`
- Canonical URLs present on major pages and dynamic detail pages ✅
  - `apps/marketing/src/app/page.tsx:29`
  - `apps/marketing/src/app/features/page.tsx:18`
  - `apps/marketing/src/app/pricing/page.tsx:20`
  - `apps/marketing/src/app/features/[slug]/page.tsx:47`
  - `apps/marketing/src/app/use-cases/[slug]/page.tsx:42`
  - `apps/marketing/src/app/integrations/[slug]/page.tsx:41`
- Schema coverage present:
  - `Organization` + `SoftwareApplication` + `WebSite` via root layout/components ✅
  - `FAQPage` via FAQ section ✅
  - `BreadcrumbList` via `Breadcrumbs` component ✅
  - Evidence: `apps/marketing/src/app/layout.tsx:101`, `apps/marketing/src/app/layout.tsx:105`, `apps/marketing/src/app/layout.tsx:106`, `packages/ui/src/components/faq-section.tsx:38`, `packages/ui/src/components/breadcrumbs.tsx:14`
- Duplicate H1 / keyword stuffing: no critical issues found on audited pages ✅
  - Spot-checked primary pages and detail templates; keyword phrases appear in metadata and one to two visible headings/sections, not repeated excessively.

### SEO Audit Table (major pages)

| Route | Title (code) | Meta Description (code) | Primary keyword | Schema types (page/runtime source) |
|---|---|---|---|---|
| `/` | `School Fee Management, Parent App, Attendance & Exams | School ERP` (`apps/marketing/src/app/page.tsx:18`) | `...online fee collection & dues management...` (`apps/marketing/src/app/page.tsx:19`) | `school fee management software` (`apps/marketing/src/app/page.tsx:21`) | `SoftwareApplication`, `WebSite`, `Organization` via `apps/marketing/src/app/layout.tsx:101-106`; `FAQPage` via `packages/ui/src/components/faq-section.tsx:38` |
| `/features` | `School ERP Features | Fee Collection, Parent App, Attendance & Exams` (`apps/marketing/src/app/features/page.tsx:7`) | Features summary with fee/parent app/attendance/exams (`apps/marketing/src/app/features/page.tsx:8`) | `school fee management software` (`apps/marketing/src/app/features/page.tsx:10`) | Root layout schemas + `OrganizationSchema` on page (`apps/marketing/src/app/features/page.tsx:31`) |
| `/features/[slug]` | Dynamic `\${feature.title} - School ERP Product Modules` (`apps/marketing/src/app/features/[slug]/page.tsx:44`) | `feature.longDescription` (`apps/marketing/src/app/features/[slug]/page.tsx:45`) | Keyword cluster from slug (`apps/marketing/src/app/features/[slug]/page.tsx:34`) | Root schemas + `SoftwareApplicationSchema` (`apps/marketing/src/app/features/[slug]/page.tsx:95`) + `BreadcrumbList` (`apps/marketing/src/app/features/[slug]/page.tsx:98`, `packages/ui/src/components/breadcrumbs.tsx:14`) |
| `/use-cases` | `School ERP Use Cases | Fees, Parent App, Attendance & Exams` (`apps/marketing/src/app/use-cases/page.tsx:7`) | Use-case summary (`apps/marketing/src/app/use-cases/page.tsx:8`) | `school fee collection software` (`apps/marketing/src/app/use-cases/page.tsx:10`) | Root layout schemas |
| `/use-cases/[slug]` | Dynamic `\${data.title} - Workflow Solution | SchoolERP` (`apps/marketing/src/app/use-cases/[slug]/page.tsx:33`) | Dynamic use-case description (`apps/marketing/src/app/use-cases/[slug]/page.tsx:34`) | `school fee collection software` / other core keywords (`apps/marketing/src/app/use-cases/[slug]/page.tsx:35`) | Root schemas + `SoftwareApplicationSchema` (`apps/marketing/src/app/use-cases/[slug]/page.tsx:78`) + `BreadcrumbList` (`apps/marketing/src/app/use-cases/[slug]/page.tsx:83`) |
| `/pricing` | `School ERP Pricing | Add-ons + Credits for SMS/WhatsApp` (`apps/marketing/src/app/pricing/page.tsx:11`) | Pricing with add-ons monthly + credits/top-ups (`apps/marketing/src/app/pricing/page.tsx:12`) | `school erp pricing` (`apps/marketing/src/app/pricing/page.tsx:14`) | Root schemas + `FAQPage` (FAQ section on page) |
| `/integrations` | `School ERP Integrations | Razorpay, PayU, Google, Microsoft, Tally` (`apps/marketing/src/app/integrations/page.tsx:14`) | Integrations description for payments/comms/live classes/exports/biometric (`apps/marketing/src/app/integrations/page.tsx:15`) | `razorpay school fee collection integration` (`apps/marketing/src/app/integrations/page.tsx:17`) | Root schemas + `BreadcrumbList` (`apps/marketing/src/app/integrations/page.tsx:45`) |
| `/integrations/[slug]` | Dynamic `\${integration.name} Integration for Schools | SchoolERP` (`apps/marketing/src/app/integrations/[slug]/page.tsx:31`) | `integration.shortDescription` (`apps/marketing/src/app/integrations/[slug]/page.tsx:32`) | Provider-specific integration keyword cluster (`apps/marketing/src/app/integrations/[slug]/page.tsx:33`) | Root schemas + `BreadcrumbList` (`apps/marketing/src/app/integrations/[slug]/page.tsx:74`) |
| `/product` | `School ERP Product Screenshots | Fee Collection, Parent App, Attendance, Exams` (`apps/marketing/src/app/product/page.tsx:16`) | Product screenshot gallery copy refocused to core pillars | `school ERP product screenshots` + pillar terms | Root schemas |
| `/book-demo` | Page-level H1 and conversion copy refocused in client component (`apps/marketing/src/app/book-demo/BookDemoClient.tsx:50`) | N/A (page metadata defined elsewhere) | `book school ERP demo` + pillar language in visible copy | Root schemas |

## Phase 2 — Deepened Terminology Changes Beyond Top-Level Shells (Implemented)

### Web high-traffic pages (requested)

Implemented visible-string refactor on all requested subpages without route changes.

Examples (exact evidence):
- `apps/web/src/app/(admin)/admin/finance/collect/page.tsx:200` → `Fee Collection & Dues`
- `apps/web/src/app/(admin)/admin/finance/counter/page.tsx:209` → `Fee Collection & Dues Counter`
- `apps/web/src/app/(admin)/admin/finance/charts/page.tsx:201` → `Fee Collection & Dues Dashboard`
- `apps/web/src/app/(admin)/admin/communication/logs/page.tsx:121` → `Parent Communication Delivery Center`
- `apps/web/src/app/(admin)/admin/notices/page.tsx:222` → `Parent Communication: Notices & Circulars`
- `apps/web/src/app/(admin)/admin/students/[id]/student-profile-client.tsx:361` → `Student Profile`
- `apps/web/src/app/(parent)/parent/fees/page.tsx:196` → `Fees & Dues`
- `apps/web/src/app/(teacher)/teacher/exams/marks/page.tsx:218` → `Exams & Report Cards (Marks Entry)`
- `apps/web/src/app/(teacher)/teacher/homework/page.tsx:229` → `Homework & Parent App Updates`

### Marketing detail pages (deepened)

Implemented additional copy refocus beyond homepage/top-level list pages:
- `apps/marketing/src/app/product/page.tsx:16`, `:24`, `:28`, `:36`
- `apps/marketing/src/app/book-demo/BookDemoClient.tsx:50`
- `apps/marketing/src/app/features/[slug]/page.tsx:170`, `:185`
- `apps/marketing/src/app/use-cases/[slug]/page.tsx:143`
- Shared detail datasets (marketing-facing):
  - `packages/ui/src/data/features.ts:279`, `:281` (`Student Profile` wording)
  - `packages/ui/src/data/case-studies.ts:104`, `:489` (`Student Profile` wording)
  - `packages/ui/src/constants/pricing.ts:10` (removed `SIS` phrasing)

## Phase 3 — Feature Tracking System Replacement (Implemented)

### 3A) Machine-readable tracking file

- New source of truth: `docs/feature-tracking/refocus.json`
- Evidence:
  - version/owner/date fields: `docs/feature-tracking/refocus.json:2`–`docs/feature-tracking/refocus.json:4`
  - advanced modules policy: `docs/feature-tracking/refocus.json:5`–`docs/feature-tracking/refocus.json:14`
  - pillar structures and checks: `docs/feature-tracking/refocus.json:15` onward

### 3B) Validator script

- Script: `scripts/verify-refocus.ts`
- Root script wiring: `package.json:9`
- Validation behavior (evidence):
  - tracker path and status enum validation: `scripts/verify-refocus.ts:41`–`scripts/verify-refocus.ts:44`
  - file existence + string checks for `Done` items: `scripts/verify-refocus.ts:63`–`scripts/verify-refocus.ts:92`
  - completion summary output: `scripts/verify-refocus.ts:127`–`scripts/verify-refocus.ts:154`

### 3C) Optional internal progress page

- Route: `/platform/refocus-status`
- Page file: `apps/web/src/app/(platform)/platform/refocus-status/page.tsx`
- Nav wiring: `apps/web/src/app/(platform)/platform-layout-client.tsx:81`
- JSON read + rendering evidence:
  - file read from tracker path: `apps/web/src/app/(platform)/platform/refocus-status/page.tsx:35`
  - completion aggregation: `apps/web/src/app/(platform)/platform/refocus-status/page.tsx:61`–`apps/web/src/app/(platform)/platform/refocus-status/page.tsx:64`
  - pending item rendering: `apps/web/src/app/(platform)/platform/refocus-status/page.tsx:102`–`apps/web/src/app/(platform)/platform/refocus-status/page.tsx:115`

### Legacy markdown tracker replacement

- `docs/feature-tracking.md` is now a pointer to the JSON tracker + verifier command, not a standalone checklist.
- Evidence: `docs/feature-tracking.md:1`–`docs/feature-tracking.md:16`

## Phase 4 — Playwright Stabilization For Refocus Validation (Implemented)

### Stability approach selected

Approach used: **Mock API responses in Playwright for the refocus-sensitive web UI page**, plus deterministic assertions for marketing static pages.

Why this matches current repo practice:
- Existing web suite already includes mock-based specs (e.g., `*.mock.spec.ts` patterns)
- Avoids dependency on tenant seed data, random names, and backend availability for label-only validation
- Keeps refocus verification focused on text/navigation/SEO copy rather than business workflows

### What was added/updated

#### Web (deterministic mocked admin nav refocus)
- Spec: `apps/web/src/tests/refocus-admin-nav.mock.spec.ts`
- Mock setup + session seeding:
  - localStorage auth seed: `apps/web/src/tests/refocus-admin-nav.mock.spec.ts:5`–`:13`
  - API route mocking: `apps/web/src/tests/refocus-admin-nav.mock.spec.ts:21`–`:54`
- Assertions:
  - pillar headings visible: `apps/web/src/tests/refocus-admin-nav.mock.spec.ts:62`–`:65`
  - `Advanced Modules` collapse behavior: `apps/web/src/tests/refocus-admin-nav.mock.spec.ts:67`–`:77`
- Refocus-only Playwright config (web): `apps/web/playwright.refocus.config.ts:3`–`:27`

#### Marketing (deterministic refocus + pricing copy)
- Spec: `apps/marketing/src/tests/refocus-marketing.spec.ts`
- Assertions:
  - 4 homepage pillars + internal links: `apps/marketing/src/tests/refocus-marketing.spec.ts:5`–`:16`
  - pricing add-ons/credits/cost-control copy: `apps/marketing/src/tests/refocus-marketing.spec.ts:18`–`:26`
- Stable host binding config: `apps/marketing/playwright.config.ts:11`–`:19`

### Sandbox constraint and mitigation

- Local sandbox blocked port binding (`EPERM` on `0.0.0.0`/`127.0.0.1`) for Playwright `webServer` runs.
- Mitigation used: reran Playwright commands outside the sandbox (elevated) and bound configs to `127.0.0.1`.
- Result: both new refocus specs passed.

## Verification Commands And Results

### Commands executed

1. `pnpm refocus:verify` ✅
- Result: `21/21 items complete (100%)`
- Evidence source: `scripts/verify-refocus.ts`

2. `RUN_MOCK_REFOCUS_UI=1 pnpm --filter @schoolerp/web exec playwright test -c playwright.refocus.config.ts src/tests/refocus-admin-nav.mock.spec.ts --reporter=line` ✅
- Result: `2 passed`
- Notes: Next dev logs tenant-config fetch warnings (`ECONNREFUSED`) are expected in mocked mode and do not affect assertions.

3. `pnpm --filter @schoolerp/marketing exec playwright test -c playwright.config.ts src/tests/refocus-marketing.spec.ts --reporter=line` ✅
- Result: `2 passed`
- Notes: harmless Framer Motion `AnimatePresence` warning appeared in dev logs; no test failure impact.

4. `pnpm build` ✅ (run twice; final pass after shared `packages/ui` wording cleanup)
- Final result: Turbo `3 successful, 3 total` for targeted packages (`web`, `marketing`, `mobile` in this run)
- Web build generated routes include new `/platform/refocus-status` page

### Link and metadata sanity (manual/static)

- Internal links added across marketing pages point to existing routes generated in build output (`/features`, `/use-cases`, `/pricing`, `/integrations`, `/book-demo`, `/blog`) ✅
- Canonicals present on major static + dynamic pages (see SEO table) ✅
- No metadata duplication issue found in audited pages (unique titles/descriptions per page templates and dynamic builders) ✅

## Remaining Work (Post-Refocus Backlog)

### P1 copy consistency (non-blocking for refocus completion)

- `apps/web/src/app/(admin)/admin/reports/page.tsx:98`
  - `Finance` label remains in reports filtering UI
- `apps/marketing/src/app/templates/page.tsx:17`
  - Template category filter still uses legacy taxonomy labels (`Finance`, `Communication`)

### P2 editorial debt (long-tail content datasets)

- `packages/ui/src/data/blog-posts.ts` contains historical `SIS` references in long-form blog content
- `packages/ui/src/data/templates.ts` contains `SIS` references in template prose
- These are content refresh tasks, not shell/SEO refocus blockers

## Final Status

### Done
- Core pillar naming refocus across `apps/web` shells and requested high-traffic pages
- Marketing 4-pillar SEO refocus (homepage/features/use-cases/pricing/integrations)
- Pricing add-ons/credits/cost-control copy
- Schema coverage improvements and verification
- Machine-readable tracker + verifier + optional internal status page
- Deterministic Playwright refocus validation (web mocked + marketing smoke)

### What remains (optional polish)
- Secondary taxonomy labels in admin reports/templates/blog/template datasets
- Broader editorial sweep to replace legacy `SIS` language in long-tail content only

## Quick Links

- Tracker source: `docs/feature-tracking/refocus.json`
- Tracker pointer doc: `docs/feature-tracking.md`
- Verifier: `scripts/verify-refocus.ts`
- Refocus audit (this file): `docs/audits/refocus-naming-seo-audit.md`
- Internal progress page: `/platform/refocus-status`

## Hardening Pass Summary (2026-02-26)

### Verification hardening (anti-gaming)

- Verifier now validates nav structure from typed config exports instead of checking UI strings:
  - `apps/web/src/config/nav/adminNav.ts`
  - `apps/web/src/config/nav/parentNav.ts`
  - `apps/web/src/config/nav/teacherNav.ts`
  - `apps/web/src/config/nav/accountantNav.ts`
  - `apps/web/src/config/nav/studentNav.ts`
  - `scripts/verify-refocus-lib.ts` (`validateAdminNavStructure`, `loadAdminNavConfig`)
  - `scripts/verify-refocus.ts`
- Added comment-stripping checks so keywords/labels in comments do not count:
  - `scripts/verify-refocus-lib.ts` (`stripComments`, `hasMetadataExport`)
- Marketing route enforcement now checks route-file existence + metadata + keyword cluster + sitemap/data coverage:
  - routes: `/`, `/features`, `/pricing`, `/use-cases`, `/integrations`, `/product`, `/book-demo`
  - `apps/marketing/src/app/sitemap.ts` coverage checks for `FEATURES_DATA`, `USE_CASES_DATA`, `INTEGRATIONS_DATA`

### Small-school usability hardening

- Added tenant-admin profile toggle to hide advanced modules from nav/dashboard while keeping direct URLs unchanged:
  - `apps/web/src/components/user-profile-page.tsx` (“Show advanced modules”)
  - `apps/web/src/lib/module-visibility.ts` (local preference store + sync event)
  - `apps/web/src/app/(admin)/admin-layout-client.tsx` (advanced section hidden when toggled off)
  - `apps/web/src/app/(admin)/admin/dashboard/page.tsx` (advanced modules discovery block shown only when enabled)

### Marketing clarity hardening

- Added explicit “Most schools start with these 4” message on:
  - `apps/marketing/src/app/page.tsx`
  - `apps/marketing/src/app/features/FeaturesClient.tsx`
- Added optional advanced modules CTA wording:
  - “Need hostel/transport/library? It’s available when you’re ready.”
  - `apps/marketing/src/app/features/FeaturesClient.tsx`
- Strengthened `/book-demo` metadata and keyword targeting:
  - `apps/marketing/src/app/book-demo/page.tsx`

### Hardening tests added/updated

- Verifier unit tests:
  - `scripts/__tests__/verify-refocus-lib.test.ts`
  - Covers missing nav IDs failure, comments-only keyword failure, and valid metadata pass case.
- Web Playwright refocus smoke:
  - `apps/web/src/tests/refocus-admin-nav.mock.spec.ts`
  - Added toggle flow asserting advanced modules disappear from sidebar.
- Marketing Playwright refocus smoke:
  - `apps/marketing/src/tests/refocus-marketing.spec.ts`
  - Added assertion for “Most schools start with these 4”.

### Tracking updates

- Added hardening items to tracker:
  - `verification_hardening`
  - `module_visibility_toggle`
  - `tests_updated`
- Source: `docs/feature-tracking/refocus.json`
- Visible in internal page: `apps/web/src/app/(platform)/platform/refocus-status/page.tsx`

## Finisher Pass Summary (2026-02-26)

### Phase A: Remaining terminology cleanup

- Admin reports tab label updated from legacy wording to pillar-aligned wording:
  - `apps/web/src/app/(admin)/admin/reports/page.tsx` → `Fee Collection & Accounting`
- Marketing templates display taxonomy updated while preserving category IDs:
  - `apps/marketing/src/app/templates/page.tsx`
  - Display labels now use `Fees & Dues` and `Parent Communication`

### Phase B: Tenant-persisted advanced module visibility

- Added tenant-scoped preferences endpoints (no existing routes changed):
  - `GET /v1/admin/settings/preferences`
  - `PUT /v1/admin/settings/preferences`
  - route registration: `services/api/cmd/api/main.go`
  - handlers: `services/api/internal/handler/tenant/handler.go` (`GetPreferences`, `UpdatePreferences`)
  - persistence in tenant config (`tenants.config` JSON `ui.hide_advanced_modules`):
    `services/api/internal/service/tenant/service.go` (`GetPreferences`, `UpdatePreferences`)
- Frontend module visibility now reads server preference first, persists updates to server, and falls back to local cache if API fails:
  - `apps/web/src/lib/module-visibility.ts`
  - toggle UI remains in: `apps/web/src/components/user-profile-page.tsx`
- Impersonation compatibility is preserved because admin calls remain tenant-contextual through existing auth/tenant middleware.

### Phase C: Real screenshot pillar visuals with frame component

- Added reusable frame wrapper:
  - `packages/ui/src/components/mockup-frame.tsx`
  - export: `packages/ui/src/index.tsx`
- Homepage 4-pillar cards now use framed real screenshots + SEO alt text:
  - `apps/marketing/src/app/page.tsx`
- `/features` now includes 4-pillar screenshot preview section using framed product screenshots:
  - `apps/marketing/src/app/features/FeaturesClient.tsx`

### Phase D: Tests and verifier updates

- Refocus verifier hardened for this pass:
  - terminology cleanup checks (`admin/reports`, `templates` labels)
  - tenant-persisted module visibility wiring checks (frontend endpoint usage + backend route/handler presence)
  - screenshot-frame usage checks on homepage/features
  - files: `scripts/verify-refocus.ts`, `scripts/verify-refocus-lib.ts`
- Verifier unit coverage extended:
  - `scripts/__tests__/verify-refocus-lib.test.ts`
- Backend preference helper tests added:
  - `services/api/internal/service/tenant/service_test.go`
  - Covers decoding `ui.hide_advanced_modules` and preserving existing tenant config while merging preferences.
- Playwright updates:
  - `apps/web/src/tests/refocus-admin-nav.mock.spec.ts`
    - now mocks `GET/PUT /admin/settings/preferences`
    - verifies toggle persists across reload
  - `apps/marketing/src/tests/refocus-marketing.spec.ts`
    - verifies updated template taxonomy labels
    - verifies framed pillar screenshot visibility
