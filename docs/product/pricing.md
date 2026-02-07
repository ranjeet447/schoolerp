# Pricing & Commercial Model

This document serves as the **Single Source of Truth** for SchoolERP SaaS pricing, plans, add-ons, and onboarding fees.

> **Note:** All pricing is exclusive of applicable taxes (GST). Prices are subject to change for new contracts. Existing contracts are honored at signed rates.

## 1. Base Plans

Base plans include core software usage. **No hidden vendor costs** (SMS, WhatsApp, Payment Gateway fees are billed separately via plugins/top-ups).

| Feature | Starter | Standard | Premium | Enterprise |
| :--- | :--- | :--- | :--- | :--- |
| **Student Limit** | Up to 1,000 | Up to 3,000 | Up to 6,000 | 6,000+ / Multi-branch |
| **Monthly Price** | ₹6,999 / month | ₹11,999 / month | ₹17,999 / month | Custom Quote |
| **Yearly Price** | ₹69,999 / year | ₹1,19,999 / year | ₹1,79,999 / year | Custom Quote |
| **SIS & Student Profiles** | ✅ | ✅ | ✅ | ✅ |
| **Attendance** | Manual / App-based | Manual / App-based | Manual / App-based | Manual / App-based |
| **Fees Module** | Dues, Receipts, Reports | Dues, Receipts, Reports | Dues, Receipts, Reports | Advanced + Multi-branch |
| **Communication** | Announcements, Alerts | Announcements, Alerts | Announcements, Alerts | Announcements, Alerts |
| **RBAC** | Standard Roles | Standard Roles | Custom Roles + Approvals | Enterprise RBAC |
| **Audit Logs** | 90 Days | 180 Days | 1 Year | Comparable to 3 Years |
| **Support** | Email (Business Hours) | Email (Business Hours) | Priority Support | Dedicated Manager + SLA |

### What is included in Base Plans?
- **SIS:** complete student profile management, class/section mapping, promotions.
- **Attendance:** manual marking by teachers via web/app. *Note: Biometric integration is a paid plugin.*
- **Fees:** detailed fee structure definition, receipt generation, diverse reporting. *Note: Online payment gateway integration is a paid plugin.*
- **Communication:** in-app alerts and announcements. *Note: SMS/WhatsApp usage is billed separately.*
- **Staff Management:** basic profiles and role assignment.

---

## 2. Plugins & Add-ons

Optional modules that incur vendor costs or require specialized infrastructure. Billed in addition to the base plan.

### Communication
| Plugin | Pricing | Notes |
| :--- | :--- | :--- |
| **SMS Notifications** | ₹4,999 / year (Platform) | + Top-up wallet usage (DLT rates) |
| **WhatsApp Messaging** | ₹9,999 / year (Platform) | + Top-up wallet usage (Meta rates) |
| **Voice / IVR** | ₹14,999 / year (Platform) | + Top-up usage |

### Payments
| Plugin | Pricing | Notes |
| :--- | :--- | :--- |
| **Payment Gateway** | ₹4,999 one-time + ₹9,999 / year | Transaction fees (MDR) billed by provider directly |

### Accounting
| Plugin | Pricing | Notes |
| :--- | :--- | :--- |
| **Tally Export (Basic)** | ₹9,999 / year | Standard voucher mapping |
| **Tally Export (Advanced)** | ₹19,999 / year | Advanced mapping + scheduled auto-exports |

### Hardware Integrations
| Plugin | Pricing | Notes |
| :--- | :--- | :--- |
| **Biometric Integration** | ₹14,999 one-time + ₹9,999 / year | Hardware cost separate. Maintenance included. |

### Mobile Apps
| Plugin | Pricing | Notes |
| :--- | :--- | :--- |
| **Shared Mobile App** | ₹19,999 / year | Parent/Teacher app with school login (Tenant ID) |
| **White-label App** | ₹49,999 one-time + ₹49,999 / year | Custom branding on Play Store / App Store |

### Storage & Transport
| Plugin | Pricing | Notes |
| :--- | :--- | :--- |
| **Storage Pack** | 100GB: ₹9,999/yr <br> 500GB: ₹29,999/yr <br> 1TB: ₹49,999/yr | For documents, photos, backups |
| **GPS Transport Tracking** | ₹19,999 one-time + ₹99–₹199 / vehicle / mo | Vendor dependent hardware/SIM costs |

### Enterprise Options
| Plugin | Pricing | Notes |
| :--- | :--- | :--- |
| **SSO (SAML/OIDC)** | ₹49,999 / year | Enterprise plan only |
| **Log Retention (3 Years)**| ₹24,999 / year | Compliance requirement |
| **Dedicated Tenant/DB** | Custom Quote | Infra pass-through + management fee |

---

## 3. Onboarding & Migration

We charge a transparent, one-time fee to cover the dedicated engineering time required for data migration, tenant setup, and staff training. **No hidden implementation fees.**

| Plan | One-time Fee | Includes |
| :--- | :--- | :--- |
| **Starter** | **₹14,999** | Standard data import (Excel/CSV), Admin training (2 sessions) |
| **Standard** | **₹24,999** | Data import, historical data migration (1 year), Staff training (4 sessions) |
| **Premium** | **₹39,999** | Complex data migration, custom report setup, dedicated implementation manager |
| **Enterprise** | **Custom** | Multi-branch setup, legacy system integration, on-site training |

---

## 4. Exclusions & Pass-through Costs

To keep base plan prices sustainable, the following are **strictly pass-through** or billed primarily on usage:

1.  **Usage-based Communication:** All SMS, WhatsApp, and Voice calls are charged against a pre-paid "Communication Wallet".
2.  **Payment Gateway Fees:** TDR/MDR charges are deducted by the gateway provider (Razorpay/PayU etc.) before settlement.
3.  **Maps & Geocoding:** Google Maps / MapmyIndia API charges for transport tracking are passed through or capped.
4.  **Infrastructure Overage:** Storage or bandwidth usage significantly beyond plan fair-use limits will require a Storage Pack upgrade.

> **Change Log:**
> - **v2.0 (Feb 2026):** Updated to "Base Plans + Plugins" model. Separated vendor-cost features (SMS, Gateway, GPS) into plugins.
