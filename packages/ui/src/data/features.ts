


export type FeatureCategory = 'academics' | 'finance' | 'safety' | 'communication' | 'platform' | 'ai';
export type FeatureStage = 'live' | 'beta' | 'planned';
export type FeatureTier = 'core' | 'addon' | 'enterprise';

export interface FeatureItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  color: string;
  category: FeatureCategory;
  stage?: FeatureStage;
  tier: FeatureTier;
  benefits: string[];
  mockUI: {
    title: string;
    type: 'table' | 'chart' | 'list' | 'nodes' | 'selection' | 'map';
  };
}

export const FEATURES_DATA: FeatureItem[] = [
  {
    id: "academics",
    slug: "academic-lifecycle",
    title: "Academic Lifecycle",
    description: "End-to-end management from student admission to automated report card generation.",
    longDescription: "Manage every aspect of the student journey. Our board-agnostic gradebook supports CBSE, ICSE, and regional standards with automated weighted calculations.",
    icon: "GraduationCap",
    color: "bg-purple-500",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Customizable Gradebook Schemas",
      "Automated Hall Ticket Generation",
      "Teacher Lesson Planning & Tracking",
      "Digital Student Portfolios"
    ],
    mockUI: {
      title: "Gradebook Dashboard",
      type: "table"
    }
  },
  {
    id: "finance",
    slug: "financial-controls",
    title: "Financial Controls",
    description: "Compliance-grade receipt series, automated fee collection, and Tally export.",
    longDescription: "Stop revenue leakage with audit-grade financial tools. Automated SMS/Email reminders ensuring over 98% on-time fee collection.",
    icon: "Wallet",
    color: "bg-emerald-500",
    category: "finance",
    stage: "beta",
    tier: "core",
    benefits: [
      "Sequential Receipt Compliance",
      "Auto-Reconciliation via Gateway",
      "Direct Tally Export Integration",
      "Scholarship & Concession Management"
    ],
    mockUI: {
      title: "Fee Collection Snippet",
      type: "chart"
    }
  },
  {
    id: "safety",
    slug: "campus-safety",
    title: "Campus Safety",
    description: "Built-in visitor management and pickup authorizations with secure QR verification.",
    longDescription: "A secure perimeter for your students. Manage visitor logs, teacher gate passes, and pickup authorizations from a single dashboard.",
    icon: "ShieldCheck",
    color: "bg-orange-500",
    category: "safety",
    stage: "beta",
    tier: "core",
    benefits: [
      "QR-Based Secure Gate Pass",
      "Visitor Photo & ID Verification",
      "Emergency Broadcast System",
      "Verified Guardian Pickup Logs"
    ],
    mockUI: {
      title: "Visitor Log Mockup",
      type: "list"
    }
  },
  {
    id: "automation",
    slug: "automation-studio",
    title: "Automation Studio",
    description: "A no-code engine to build custom workflows and school-specific triggers.",
    longDescription: "Your school, your rules. Build custom automation for everything from birthday alerts to low-balance fee triggers without writing code.",
    icon: "Zap",
    color: "bg-yellow-500",
    category: "platform",
    stage: "planned",
    tier: "core",
    benefits: [
      "Drag-and-Drop Logic Builder",
      "Custom SMS & Email Templates",
      "Time-Based Scheduled Tasks",
      "External API Webhooks"
    ],
    mockUI: {
      title: "Workflow Builder Interface",
      type: "nodes"
    }
  },
  {
    id: "alerts",
    slug: "alert-management",
    title: "Smart Alerts",
    description: "Automated, event-driven notifications for absences, fees, and safety events.",
    longDescription: "React instantly to critical events. Our Smart Alert system enqueues notifications across Push, WhatsApp, and SMS based on tenant policies.",
    icon: "Bell",
    color: "bg-indigo-500",
    category: "communication",
    tier: "core",
    benefits: [
      "Absence Auto-Alerts",
      "Payment Success Receipts",
      "Safety Emergency Broadcasts",
      "Multilingual Template Engine"
    ],
    mockUI: {
      title: "Alert Trigger Config",
      type: "nodes"
    }
  },
  {
    id: "notices",
    slug: "notices-circulars",
    title: "Notices & Circulars",
    description: "Targeted broadcasting of circulars and tracking of parent acknowledgments.",
    longDescription: "Ensure your message is heard. Send targeted notices to specific classes, sections, or user groups and track who has read them in real-time.",
    icon: "Megaphone",
    color: "bg-teal-500",
    category: "communication",
    tier: "core",
    benefits: [
      "Role-Based Targeting",
      "Read Receipt Tracking",
      "Attachment Support (PDF/Images)",
      "Scheduled Publishing"
    ],
    mockUI: {
      title: "Notice Board View",
      type: "list"
    }
  },
  {
    id: "discipline",
    slug: "student-discipline",
    title: "Discipline & Behavior",
    description: "Structured incident logging, behavioral tracking, and parent transparency.",
    longDescription: "Foster a positive school environment. Track incidents with severity levels, manage resolutions, and maintain parent transparency.",
    icon: "FileWarning",
    color: "bg-red-500",
    category: "platform",
    tier: "core",
    benefits: [
      "Behavioral Incident Logs",
      "Severity-Based Notifications",
      "Merit & Demerit Tracking",
      "Confidential Management Notes"
    ],
    mockUI: {
      title: "Incident Report View",
      type: "list"
    }
  },
  {
    id: "homework",
    slug: "homework-tracking",
    title: "Homework & Assignments",
    description: "Digital assignment posting, submission tracking, and teacher feedback.",
    longDescription: "Extend learning beyond the classroom. Teachers post topics with attachments, and students submit work directly via the mobile app.",
    icon: "ClipboardList",
    color: "bg-blue-600",
    category: "academics",
    stage: "planned",
    tier: "core",
    benefits: [
      "Photo-Based Submissions",
      "Automated Due Reminders",
      "Resource Library Integration",
      "Digital Teacher Remarks"
    ],
    mockUI: {
      title: "Assignment Dashboard",
      type: "list"
    }
  },
  {
    id: "lesson-plan",
    slug: "curriculum-tracking",
    title: "Lesson Planning",
    description: "Weekly syllabus coverage tracking and coordinator-level progress monitoring.",
    longDescription: "Ensure academic consistency. Track syllabus completion against planned timelines and manage teacher workload efficiently.",
    icon: "CalendarDays",
    color: "bg-cyan-500",
    category: "academics",
    stage: "planned",
    tier: "core",
    benefits: [
      "Weekly Topic Planning",
      "Syllabus Lag Alerts",
      "Coordinator Review Flow",
      "Holiday-Aware Scheduling"
    ],
    mockUI: {
      title: "Curriculum Progress",
      type: "chart"
    }
  },
  {
    id: "ptm",
    slug: "parent-teacher-chat",
    title: "Parent-Teacher Connect",
    description: "Managed PTM slot booking and moderated teacher-parent interaction.",
    longDescription: "Bridge the communication gap. Book PTM slots instantly and engage in moderated, student-specific chats without sharing personal numbers.",
    icon: "MessagesSquare",
    color: "bg-pink-500",
    category: "communication",
    stage: "planned",
    tier: "core",
    benefits: [
      "Instant PTM Slot Booking",
      "Moderated Two-Way Chat",
      "Interaction History Logs",
      "Automated PTM Reminders"
    ],
    mockUI: {
      title: "Chat & Booking Interface",
      type: "selection"
    }
  },
  {
    id: "access",
    slug: "secure-access",
    title: "Identity & MFA",
    description: "Enterprise-grade identity management with MFA and IP allowlisting.",
    longDescription: "Security you can trust. Protect sensitive financial and academic data with 2FA, session tracking, and role-level permission customization.",
    icon: "Fingerprint",
    color: "bg-slate-700",
    category: "safety",
    stage: "planned",
    tier: "enterprise",
    benefits: [
      "TOTP/SMS Authenticator",
      "Role-Level Customization",
      "IP Range Restrictions",
      "Active Session Revocation"
    ],
    mockUI: {
      title: "Security Controller",
      type: "nodes"
    }
  },
  {
    id: "logistics",
    slug: "fleet-tracking",
    title: "Transport & Logistics",
    description: "Full-stack transport management with live GPS tracking and optimized route mapping.",
    longDescription: "Real-time visibility for parents and administrators. Track location, fuel consumption, and maintenance schedules for your entire fleet.",
    icon: "Truck",
    color: "bg-rose-500",
    category: "safety",
    stage: "beta",
    tier: "core",
    benefits: [
      "Live GPS Bus Tracking",
      "Route Optimization Engine",
      "Automated Fee Integration",
      "Maintenance & Fuel Logs"
    ],
    mockUI: {
      title: "Live Transport Map",
      type: "map"
    }
  },
  {
    id: "library",
    slug: "digital-library",
    title: "Digital Media Center",
    description: "Next-gen library management with digital media support and ISBN integration.",
    longDescription: "Bridge physical books with digital resources. Manage stocks, circulation, and library memberships while providing access to e-books and video content.",
    icon: "BookOpen",
    color: "bg-amber-500",
    category: "academics",
    stage: "beta",
    tier: "core",
    benefits: [
      "Digital Asset Support (PDF/Video)",
      "Automated Issue & Return Logs",
      "ISBN & QR Cataloging",
      "Student Reading Progress"
    ],
    mockUI: {
      title: "Library Catalog View",
      type: "table"
    }
  },
  {
    id: "inventory",
    slug: "inventory-procurement",
    title: "Inventory & Procurement",
    description: "Audit-grade inventory controls with purchase order workflows and vendor management.",
    longDescription: "Stop leakage in your supply chain. Manage recurring stock, purchase orders, and asset allocations across all departments.",
    icon: "ShoppingCart",
    color: "bg-sky-500",
    category: "finance",
    stage: "beta",
    tier: "core",
    benefits: [
      "Purchase Order Workflow",
      "Multi-Godown Stock Tracking",
      "Supplier Performance Metrics",
      "Low Stock Auto-Alerts"
    ],
    mockUI: {
      title: "Inventory Dashboard",
      type: "chart"
    }
  },
  {
    id: "hrms",
    slug: "automated-payroll",
    title: "HRMS & Payroll",
    description: "Complete employee lifecycle management with automated biometric payroll processing.",
    longDescription: "Manage your workforce with precision. From recruitment to payslip generation, our HRMS ensures compliance and teacher satisfaction.",
    icon: "Users",
    color: "bg-violet-500",
    category: "finance",
    stage: "planned",
    tier: "enterprise",
    benefits: [
      "Biometric Attendance Link",
      "Automated Payslip Engine",
      "Salary Structure Configurator",
      "Performance and KRA Logs"
    ],
    mockUI: {
      title: "Payroll Summary",
      type: "table"
    }
  },
  {
    id: "portfolio",
    slug: "portfolio-dashboards",
    title: "Portfolio Dashboards",
    description: "High-level analytics for school groups to monitor performance across all campuses.",
    longDescription: "Manage multiple schools from a single cockpit. Compare academic results, financial health, and safety metrics across your entire portfolio.",
    icon: "Sparkles",
    color: "bg-fuchsia-500",
    category: "platform",
    stage: "planned",
    tier: "enterprise",
    benefits: [
      "Cross-Campus Data Views",
      "Financial Health Aggregators",
      "Member School Comparisons",
      "Group-Level Policy Control"
    ],
    mockUI: {
      title: "Group Analytics View",
      type: "chart"
    }
  },
  {
    id: "alumni",
    slug: "alumni-placement",
    title: "Alumni & Placements",
    description: "Build a thriving community with alumni directories and coordinate career placement drives.",
    longDescription: "Nurture your school's legacy. Stay connected with alumni, celebrate their success, and coordinate placement drives for current batches.",
    icon: "Globe",
    color: "bg-blue-500",
    category: "academics",
    stage: "planned",
    tier: "core",
    benefits: [
      "Alumni Directory Portal",
      "Placement Drive Coordination",
      "Application Tracking System",
      "Verified Professional Profiles"
    ],
    mockUI: {
      title: "Alumni Connector",
      type: "list"
    }
  },
  {
    id: "ai-copilot",
    slug: "teacher-copilot",
    title: "Teacher Copilot (AI Assist)",
    description: "AI-driven drafting of lesson plans, worksheets, and quizzes with teacher-in-the-loop controls.",
    longDescription: "Automate administrative paperwork. Teachers can generate draft syllabi and assignments grounded in their own curriculum records. Note: Subjective answers require teacher final say.",
    icon: "BrainCircuit",
    color: "bg-violet-600",
    category: "ai",
    stage: "beta",
    tier: "addon",
    benefits: [
      "Draft Lesson Plans in Seconds",
      "Teacher-in-the-loop Verification",
      "Grounded in ERP Academic Data",
      "Assisted Subjective Rubrics"
    ],
    mockUI: {
      title: "AI Draft Interface",
      type: "nodes"
    }
  },
  {
    id: "ai-helpdesk",
    slug: "parent-helpdesk",
    title: "AI Parent Helpdesk",
    description: "24/7 multilingual automated assistant grounded in your school's official records.",
    longDescription: "Reduce front-desk load by 80%. Our AI bot answers parent queries about fees, holidays, and homework instantly via WhatsApp and Web Chat.",
    icon: "MessageCircle",
    color: "bg-blue-500",
    category: "ai",
    stage: "beta",
    tier: "addon",
    benefits: [
      "24/7 WhatsApp & Web Chat",
      "Hindi/English Multilingual",
      "Grounded in ERP Records",
      "Billed via Communication Wallet"
    ],
    mockUI: {
      title: "AI Support Chat",
      type: "list"
    }
  },
  {
    id: "ai-finance",
    slug: "fee-intelligence",
    title: "Fee Intelligence",
    description: "Predictive delay-risk flags and optimized reminder cadence for your finance team.",
    longDescription: "Stay ahead of cashflow gaps. Our AI analyzes payment velocity to flag students likely to delay, suggesting the optimal time to send reminders.",
    icon: "TrendingUp",
    color: "bg-emerald-600",
    category: "ai",
    stage: "beta",
    tier: "addon",
    benefits: [
      "Explainable Risk Flags",
      "Predictive Cashflow Trends",
      "Automated Reminder Cadence",
      "Explainable Decision Logic"
    ],
    mockUI: {
      title: "Risk Analysis Dashboard",
      type: "chart"
    }
  },
  {
    id: "ai-insights",
    slug: "smart-insights",
    title: "Advanced AI Insights",
    description: "Constraint-based timetable optimization and systemic anomaly alerts.",
    longDescription: "Enterprise-grade intelligence for management. Solve complex timetabling constraints and detect anomalies in attendance or transport instantly.",
    icon: "Activity",
    color: "bg-fuchsia-600",
    category: "ai",
    stage: "planned",
    tier: "enterprise",
    benefits: [
      "Constraint Timetable Solver",
      "Attendance Anomaly Alerts",
      "Transport Deviation Logs",
      "Remedial Study Suggestions"
    ],
    mockUI: {
      title: "Anomaly Alert Feed",
      type: "list"
    }
  }
];
