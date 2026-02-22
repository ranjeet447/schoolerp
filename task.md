# SchoolERP Task Tracker

## Phase 1: Login Redirection & Role Fixes
- [x] Create student dashboard frontend structure
- [x] Fix missing `dashboard:view` permission for `parent`/`student`
- [x] Register student role routes in API gateway
- [ ] **Role-based Verification**
    - [ ] Admin login -> `/admin/dashboard`
    - [ ] Teacher login -> `/teacher/dashboard`
    - [ ] Accountant login -> `/finance/dashboard`
    - [ ] Parent login -> `/parent/dashboard`
    - [ ] Student login -> `/student/dashboard`
    - [ ] Verify menu items match specific role permissions
    - [ ] Verify all links in sidebar layouts are functional

## Phase 2: Multi-tenant Payment Gateway
- [x] Encryption Foundation (Crypto initialized & injected)
- [x] Secure Credential Storage (Encrypt/Decrypt implemented)
- [ ] Feature Gating & Entitlements
    - [ ] Implement plan-based gating for custom gateways
- [ ] API & Schema Extensions
    - [ ] Add endpoints for tenant billing status
- [ ] Frontend: Tenant Billing UI
    - [ ] Billing & Subscription dashboard
    - [ ] Gateway configuration forms (Razorpay/PayU)

## Phase 3: Seed Data & Testing Expansion
- [x] Expand Permission Seeds (Migration 000066 created)
- [x] Update `infra/seed/seed_data.sql` with new permissions and feature flags
- [/] **Comprehensive Testing Suite**
    - [x] **Unit Tests**: `payment_test.go` with encryption/decryption tests
    - [ ] **API Regression**: Automation for all finance endpoints
    - [ ] **UI Testing**: Playwright tests for Login flow & Billing UI
    - [ ] **Integration**: End-to-end payment simulation

## Phase 4: Marketing Website Audit & SEO
- [ ] **Link & Button Audit**
    - [ ] Check all links/buttons across all marketing pages
    - [ ] Verify all footer links are functional
- [ ] **Roadmap Enrichment**
    - [ ] Update Roadmap page with current project milestones
- [ ] **SEO Content Enhancement**
    - [ ] Expand content pages with detailed information (Long-form content)
    - [ ] Optimize meta tags and heading structures

## Phase 5: Documentation & API Specs
- [ ] Update Swagger/OpenAPI for finance/billing
- [ ] Documentation for multi-tenant gateway architecture
- [ ] Finalize Walkthrough with demo media

## Phase 6: Production Readiness
- [ ] Audit logs for billing configuration changes
- [ ] Error boundary handling for payment failures
