
export const PRICING_PLANS = [
  {
    name: "Starter",
    limit: "Up to 1,000 students",
    description: "Core features for smaller schools.",
    priceMonthly: 6999,
    priceYearly: 69999,
    features: [
      "Student profiles (SIS) + class/section management",
      "Attendance (manual/app-based)",
      "Fees: dues, receipts, basic reports",
      "Announcements & in-app alerts",
      "Standard RBAC + audit logs (90 days)",
      "Email support (business hours)"
    ],
    highlight: false,
    cta: "Request Demo"
  },
  {
    name: "Standard",
    limit: "Up to 3,000 students",
    description: "For growing schools scaling operations.",
    priceMonthly: 11999,
    priceYearly: 119999,
    features: [
      "Everything in Starter",
      "Transport & Library (core modules, without GPS vendor integrations)",
      "Advanced reports & exports (CSV/PDF)",
      "Automations rules (more limits)",
      "Audit logs (180 days)"
    ],
    highlight: true,
    tag: "Best Value",
    cta: "Request Demo"
  },
  {
    name: "Premium",
    limit: "Up to 6,000 students",
    description: "Advanced controls for elite institutions.",
    priceMonthly: 17999,
    priceYearly: 179999,
    features: [
      "Everything in Standard",
      "Advanced RBAC (custom roles & approvals)",
      "Smart alerts (in-app)",
      "Priority support",
      "Audit logs (1 year)"
    ],
    highlight: false,
    cta: "Request Demo"
  },
  {
    name: "Enterprise",
    limit: "6,000+ / Multi-branch",
    description: "Custom solutions for school groups.",
    priceMonthly: null,
    priceYearly: null,
    features: [
      "Multi-branch support & dashboards",
      "SLA + dedicated account manager (optional)",
      "Enterprise security options (SSO, 2FA policies) as add-ons",
      "Compliance & retention add-ons"
    ],
    highlight: false,
    cta: "Talk to Sales"
  }
];

export const PLUGINS = [
  {
    name: "SMS Notifications",
    description: "Platform fee for SMS gateway integration.",
    pricing: "₹4,999/year + Top-up usage"
  },
  {
    name: "WhatsApp Messaging",
    description: "Official WhatsApp Business API integration.",
    pricing: "₹9,999/year + Top-up usage"
  },
  {
    name: "Voice/IVR",
    description: "Automated voice calls for alerts.",
    pricing: "₹14,999/year + Top-up usage"
  },
  {
    name: "Payment Gateway",
    description: "Collect fees online via Razorpay/etc.",
    pricing: "Setup ₹4,999 + ₹9,999/year"
  },
  {
    name: "Accounting Exports",
    description: "CSV/PDF or direct Tally integration.",
    pricing: "₹9,999/year (Basic) / ₹19,999/year (Adv)"
  },
  {
    name: "Biometric Integration",
    description: "Automated staff/student attendance.",
    pricing: "Setup ₹14,999 + ₹9,999/year"
  },
  {
    name: "Shared Mobile App",
    description: "Parent/Teacher app with school login.",
    pricing: "₹19,999/year per school"
  },
  {
    name: "White-label Mobile App",
    description: "Custom branded Play Store/App Store app.",
    pricing: "₹49,999 Setup + ₹49,999/year"
  },
  {
    name: "Storage Pack",
    description: "Extra storage for documents/media.",
    pricing: "100GB ₹9,999/yr | 1TB ₹49,999/yr"
  },
  {
    name: "GPS Transport Tracking",
    description: "Real-time bus tracking integration.",
    pricing: "Setup ₹19,999 + ₹99-199/vehicle/mo"
  },
  {
    name: "SSO (SAML/OIDC)",
    description: "Enterprise identity management.",
    pricing: "₹49,999/year (Enterprise)"
  },
  {
    name: "Compliance Log Retention",
    description: "Extended 3-year audit logs.",
    pricing: "₹24,999/year (Enterprise)"
  },
  {
    name: "Dedicated Tenant/DB",
    description: "Isolated infrastructure.",
    pricing: "Custom quote"
  }
];

export const AI_SUITE_PLANS = [
  {
    name: "AI Suite v1",
    description: "Parent Helpdesk, Lesson Drafter, Fee Intelligence.",
    pricing: "₹9,999/year"
  },
  {
    name: "AI Premium",
    description: "Timetable Optimizer, Insights & Anomalies, Remedial Recs.",
    pricing: "₹19,999/year"
  },
  {
    name: "Enterprise AI",
    description: "Face Auth, Grading Assistant, Admissions Scoring.",
    pricing: "Custom Quote"
  }
];

export const ONBOARDING_FEES = [
  { plan: "Starter", fee: "₹14,999 one-time" },
  { plan: "Standard", fee: "₹24,999 one-time" },
  { plan: "Premium", fee: "₹39,999 one-time" }
];

export const FAQS = [
  {
    question: "Are SMS/WhatsApp included?",
    answer: "No. You pay a platform fee for the integration, and then purchase top-up credits for actual usage (messages sent)."
  },
  {
    question: "Do you charge onboarding?",
    answer: "Yes. We charge a transparent one-time fee based on your plan to cover data migration, setup, and training. No hidden implementation fees."
  },
  {
    question: "What is a plugin?",
    answer: "Plugins are optional modules that trigger vendor costs (like GPS, Payment Gateways) or require external integrations. You only pay for what you need."
  },
  {
    question: "Can we start with Starter and upgrade later?",
    answer: "Absolutely. You can upgrade your plan or add plugins at any time. Data migration is seamless between plans."
  },
  {
    question: "Do you support data migration?",
    answer: "Yes. Our onboarding fee covers standard data migration from Excel/CSV. Complex migrations from legacy systems may have custom scoping."
  }
];
