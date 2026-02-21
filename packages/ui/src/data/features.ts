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
    id: "fee-mgmt",
    slug: "school-fee-management-software",
    title: "School Fee Management",
    description: "Automate fee collection, send reminders, and reconcile payments seamlessly.",
    longDescription: "The most comprehensive fee management software for Indian schools. Stop revenue leakage with audit-grade financial tools and automated SMS/Email reminders ensuring over 98% on-time fee collection. Give parents multiple payment options including zero-cost UPI.",
    icon: "Wallet",
    color: "bg-emerald-500",
    category: "finance",
    stage: "live",
    tier: "core",
    benefits: [
      "Zero-Transaction-Cost UPI Integration",
      "Auto-Reconciliation via Gateway",
      "Daily Defaulter Target Setting",
      "Bulk SMS/WhatsApp Reminders"
    ],
    mockUI: { title: "Fee Collection Dashboard", type: "chart" }
  },
  {
    id: "fee-receipt",
    slug: "fee-receipt-software",
    title: "Fee Receipt Engine",
    description: "Generate compliant, sequential fee receipts in 1-click.",
    longDescription: "Speed up your fee counter. Our fee receipt software allows clerks to collect cash, cheque, or online payments and print sequential, audit-proof receipts instantly. Includes day-book closures and cancellation audits.",
    icon: "Receipt",
    color: "bg-teal-500",
    category: "finance",
    stage: "live",
    tier: "core",
    benefits: [
      "Thermal & A4 Print Formats",
      "Partial Payment Tracking",
      "End-of-Day Cashier Book",
      "Tally-ready format Exports"
    ],
    mockUI: { title: "Point of Sale View", type: "list" }
  },
  {
    id: "defaulter",
    slug: "defaulter-list-management",
    title: "Defaulter List Management",
    description: "1-click generation of defaulter lists segmented by class, section, or amount.",
    longDescription: "Stop tracking pending fees in Excel. Our dynamic defaulter list management auto-updates the moment a parent pays online. Set thresholds to block report cards or parent app access until dues are cleared.",
    icon: "AlertTriangle",
    color: "bg-red-500",
    category: "finance",
    stage: "live",
    tier: "core",
    benefits: [
      "Real-time Pending Dues",
      "Targeted Reminder Triggers",
      "Concession & Scholarship Adjustments",
      "Report Card Blocking (Optional)"
    ],
    mockUI: { title: "Defaulter Action Tracking", type: "table" }
  },
  {
    id: "late-fee",
    slug: "late-fee-and-concession-management",
    title: "Late Fee & Concessions",
    description: "Auto-calculate late fees and manage sibling concessions systematically.",
    longDescription: "Enforce your fee policies without arguments at the counter. Configure daily or flat late fees that auto-apply after due dates. Give principals a secure override dashboard for approving discounts or waivers.",
    icon: "Calculator",
    color: "bg-orange-500",
    category: "finance",
    stage: "live",
    tier: "core",
    benefits: [
      "Automated Late Fines",
      "Sibling & Staff Ward Concessions",
      "Approval Workflow for Waivers",
      "Audit logs on all discounts"
    ],
    mockUI: { title: "Concession Policy Builder", type: "nodes" }
  },
  {
    id: "attendance",
    slug: "school-attendance-management",
    title: "Attendance Management",
    description: "Fast exception-based attendance marking for teachers. Takes less than 15 seconds.",
    longDescription: "A school attendance management system that teachers actually want to use. Mark only the absentees. The system auto-compiles daily, weekly, and monthly registers ready for printing or inspection.",
    icon: "UserCheck",
    color: "bg-blue-500",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Exception-based Marking",
      "Auto-calculated Monthly Percentages",
      "Holiday & Weekend Aware",
      "Subject-wise or Daily marking"
    ],
    mockUI: { title: "Daily Attendance Grid", type: "table" }
  },
  {
    id: "absentee",
    slug: "absentee-follow-up-system",
    title: "Absentee Follow-up",
    description: "Automate SMS/Push alerts to parents the moment a child is marked absent.",
    longDescription: "Ensure student safety and keep parents informed. Our absentee follow-up system triggers an alert to parents as soon as the first-period attendance is submitted, reducing manual phone calls from the front desk by 90%.",
    icon: "PhoneCall",
    color: "bg-indigo-500",
    category: "communication",
    stage: "live",
    tier: "core",
    benefits: [
      "Instant SMS/Push Alerts",
      "Parent Response Tracking",
      "Consecutive Leave Warnings",
      "Truancy Analytics"
    ],
    mockUI: { title: "Follow-up Logs", type: "list" }
  },
  {
    id: "parent-app",
    slug: "parent-communication-app",
    title: "Parent Communication App",
    description: "A centralized digital diary for parents to track fees, attendance, and homework.",
    longDescription: "Replace WhatsApp chaos with a structured parent communication app. Protect teacher privacy while keeping parents fully informed about fee dues, homework, and exam schedules through a beautiful, vernacular-ready interface.",
    icon: "Smartphone",
    color: "bg-violet-500",
    category: "communication",
    stage: "live",
    tier: "core",
    benefits: [
      "No Personal Number Sharing",
      "Role-based Announcements",
      "Secure Digital Notice Board",
      "Multilingual UI Support"
    ],
    mockUI: { title: "Parent App Engagement", type: "chart" }
  },
  {
    id: "circulars",
    slug: "school-circular-acknowledgement",
    title: "Circular Acknowledgement",
    description: "Send important notices and track exactly which parents have read them.",
    longDescription: "Never hear 'I didn't get the message' again. Send digital circulars with attachments and enable a one-click acknowledgement button. Track read receipts and compliance in real-time.",
    icon: "Megaphone",
    color: "bg-pink-500",
    category: "communication",
    stage: "live",
    tier: "core",
    benefits: [
      "Digital Signatures / Acknowledgement",
      "Targeted Broadcasting (Class/Section)",
      "PDF/Image Attachments",
      "Read Receipt Analytics"
    ],
    mockUI: { title: "Broadcaster Stats", type: "selection" }
  },
  {
    id: "homework",
    slug: "homework-diary-module",
    title: "Homework Diary Module",
    description: "Digital assignment posting and submission tracking with teacher feedback.",
    longDescription: "Extend learning beyond the classroom. Teachers post homework or study materials, set due dates, and track submissions. Parents get automated push notifications so no assignment is ever missed.",
    icon: "ClipboardList",
    color: "bg-cyan-500",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Multimedia Attachments",
      "Automated Due Reminders",
      "Digital Submission Engine",
      "Teacher Grading & Remarks"
    ],
    mockUI: { title: "Homework Tracking", type: "list" }
  },
  {
    id: "admission",
    slug: "school-admission-management",
    title: "Admission Management",
    description: "End-to-end digital admissions, from enquiry forms to enrolled student.",
    longDescription: "Digitize your admission season. Track walk-ins, process online applications, collect registration fees, and seamlessly convert leads into enrolled students without re-typing their data.",
    icon: "UserPlus",
    color: "bg-emerald-600",
    category: "platform",
    stage: "live",
    tier: "core",
    benefits: [
      "Customizable Enquiry Forms",
      "Document Checklist Vault (Aadhar, TC)",
      "Interview Scheduling",
      "1-Click Lead to Student Conversion"
    ],
    mockUI: { title: "Admission Funnel", type: "chart" }
  },
  {
    id: "enquiry",
    slug: "enquiry-follow-up-pipeline",
    title: "Enquiry Follow-up Pipeline",
    description: "Track leads, schedule callbacks, and never lose a prospective admission.",
    longDescription: "Increase your admission conversions. A Kan-ban style pipeline to track parent enquiries. Set follow-up dates, log call notes, and send promotional SMS templates directly from the CRM.",
    icon: "Kanban",
    color: "bg-orange-600",
    category: "communication",
    stage: "live",
    tier: "core",
    benefits: [
      "Visual Lead Pipeline",
      "Daily Callback Reminders",
      "Conversion Rate Analytics",
      "Bulk Promotional Messaging"
    ],
    mockUI: { title: "Enquiry Pipeline", type: "nodes" }
  },
  {
    id: "sis",
    slug: "student-information-system",
    title: "Student Information System",
    description: "A centralized, searchable master database for every student in the school.",
    longDescription: "Say goodbye to dusty filing cabinets. Access complete student histories—academic records, fee payments, disciplinary logs, and medical information—in seconds from any device.",
    icon: "Database",
    color: "bg-slate-700",
    category: "platform",
    stage: "live",
    tier: "core",
    benefits: [
      "Unified Student Profiling",
      "Sibling Auto-mapping",
      "Digital Document Vault",
      "Historical Data Retention"
    ],
    mockUI: { title: "Student 360 View", type: "selection" }
  },
  {
    id: "report-card",
    slug: "report-card-software",
    title: "Report Card Software",
    description: "Board-aligned, customizable report card generation with 1-click bulk printing.",
    longDescription: "Reduce exam season stress. Our report card software supports CBSE, ICSE, and State Board formats. Automatically calculate aggregates, grades, and percentiles, then print hundreds of beautiful report cards instantly.",
    icon: "GraduationCap",
    color: "bg-purple-600",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Pre-configured Board Templates",
      "Customizable Branding & Logos",
      "Co-scholastic Grading Native",
      "Digital Publishing to Parent App"
    ],
    mockUI: { title: "Report Card Builder", type: "table" }
  },
  {
    id: "marks-entry",
    slug: "exam-marks-entry-system",
    title: "Exam Marks Entry System",
    description: "Fast, spreadsheet-like marks entry for teachers to speed up result processing.",
    longDescription: "Built for speed. Teachers can input marks in a dynamic grid layout that calculates totals on the fly. Prevent errors with built-in validation rules for max marks and passing thresholds.",
    icon: "PenTool",
    color: "bg-sky-500",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Spreadsheet-style Data Entry",
      "Max Marks Validation",
      "Coordinator Lock Controls",
      "Absent/Medical Exception Handling"
    ],
    mockUI: { title: "Marks Entry Grid", type: "table" }
  },
  {
    id: "bonafide",
    slug: "bonafide-certificate-generator",
    title: "Bonafide Certificate Generator",
    description: "Generate official Bonafide and Character certificates in 5 seconds.",
    longDescription: "Automate office requests. Select a student, pick a template, and generate a pre-filled Bonafide or Fee Certificate instantly, complete with digital signatures and school letterhead.",
    icon: "FileSignature",
    color: "bg-rose-500",
    category: "platform",
    stage: "live",
    tier: "core",
    benefits: [
      "Pre-mapped Student Data",
      "Customizable Letterheads",
      "Issuance History Tracking",
      "Multiple Template Support"
    ],
    mockUI: { title: "Certificate Preview", type: "list" }
  },
  {
    id: "tc",
    slug: "transfer-certificate-management",
    title: "Transfer Certificate (TC)",
    description: "Complete TC workflow ensuring all dues are cleared before issuance.",
    longDescription: "Streamline the most critical exit process. Generate Transfer Certificates that comply with state formats. The system enforces 'No-Dues' checks across Library, Transport, and Fees before allowing TC generation.",
    icon: "FileOutput",
    color: "bg-red-600",
    category: "platform",
    stage: "live",
    tier: "core",
    benefits: [
      "Automated No-Dues Verification",
      "Draft vs Final Issuance Modes",
      "State Board Compliant Templates",
      "TC Register Export"
    ],
    mockUI: { title: "TC Generation Flow", type: "nodes" }
  },
  {
    id: "reports",
    slug: "school-reports-and-print-center",
    title: "School Reports & Print Center",
    description: "Your entire school's data, formatted for inspection and audits.",
    longDescription: "Stop formatting Excel files. Our Print Center contains dozens of pre-built, inspection-ready reports. Generate Daily Fee Registers, Monthly Attendance summaries, and Category-wise Admission counts instantly.",
    icon: "Printer",
    color: "bg-slate-800",
    category: "platform",
    stage: "live",
    tier: "core",
    benefits: [
      "One-click PDF/Excel Exports",
      "Inspection-Ready Register Formats",
      "Custom Date Range Filtering",
      "Cross-Module Analytics"
    ],
    mockUI: { title: "Report Center Library", type: "list" }
  },
  {
    id: "roles",
    slug: "role-based-access-school-erp",
    title: "Role-Based Access (RBAC)",
    description: "Enterprise-grade security ensuring staff only see what they need.",
    longDescription: "Protect sensitive school data. Accountants see fees, teachers see academics. Our RBAC engine allows you to customize permissions down to the button level, with complete audit logs of all actions.",
    icon: "Key",
    color: "bg-neutral-600",
    category: "safety",
    stage: "live",
    tier: "core",
    benefits: [
      "Granular Permission Controls",
      "Activity Audit Logs",
      "Restricted IP Login (Optional)",
      "Temporary Access Grants"
    ],
    mockUI: { title: "Role Manager", type: "selection" }
  },
  {
    id: "transport",
    slug: "transport-management-software",
    title: "Transport Management",
    description: "Map routes, track buses via GPS, and automate transport fee billing.",
    longDescription: "End-to-end management of your school fleet. Assign students to specific stops, automatically calculate distance-based fees, and provide parents with live GPS tracking via the parent app.",
    icon: "Truck",
    color: "bg-yellow-600",
    category: "safety",
    stage: "live",
    tier: "addon",
    benefits: [
      "Distance/Slab-based Fee Integration",
      "Live GPS Tracking for Parents",
      "Driver and Helper Directory",
      "Vehicle Maintenance Reminders"
    ],
    mockUI: { title: "Live Route Map", type: "map" }
  },
  {
    id: "library",
    slug: "library-management-for-schools",
    title: "Library Management",
    description: "Manage books, track issuances, and automate fine calculations.",
    longDescription: "A complete digital catalog for your library. Track textbook inventory, manage student lending periods, and automatically post late-return fines directly into the student's fee ledger.",
    icon: "BookOpen",
    color: "bg-amber-600",
    category: "academics",
    stage: "live",
    tier: "addon",
    benefits: [
      "ISBN / Barcode Integration",
      "Automated Due Reminders",
      "Fine Ledger Sync",
      "Digital Resource Cataloging"
    ],
    mockUI: { title: "Library Circulation", type: "table" }
  },
  {
    id: "whatsapp",
    slug: "whatsapp-integration-for-schools",
    title: "WhatsApp API Integration",
    description: "Send official fee reminders and notices via automated WhatsApp messages.",
    longDescription: "Reach parents where they already are. Our official WhatsApp API integration allows you to send automated fee reminders, attendance alerts, and circulars directly to parent WhatsApp numbers with a verified business profile.",
    icon: "MessageCircle",
    color: "bg-emerald-400",
    category: "communication",
    stage: "live",
    tier: "addon",
    benefits: [
      "High Open Rates (98%+)",
      "Automated Trigger Messages",
      "Official Green Tick Verification",
      "Replaces Unofficial Spam Groups"
    ],
    mockUI: { title: "WhatsApp Broadcast Log", type: "list" }
  },
  {
    id: "sms",
    slug: "sms-integration-for-schools",
    title: "SMS Integration",
    description: "DLT-compliant SMS broadcasting for urgent updates and notifications.",
    longDescription: "The reliable fallback for critical alerts. Send DLT-approved SMS messages for unexpected holidays, transport delays, or OTP verifications at a fraction of the cost of manual calling.",
    icon: "MessageSquare",
    color: "bg-blue-400",
    category: "communication",
    stage: "live",
    tier: "addon",
    benefits: [
      "100% Delivery on Active Numbers",
      "DLT Template Pre-approvals",
      "Cost-effective broadcasting",
      "Delivery Status Tracking"
    ],
    mockUI: { title: "SMS Gateway Metrics", type: "chart" }
  },
  {
    id: "ai",
    slug: "ai-assistant-for-schools",
    title: "AI Assistant (Coming Soon)",
    description: "A 24/7 AI-powered helpdesk grounded directly in your school's data.",
    longDescription: "Reduce front-desk workload by 80%. Our cutting-edge AI answers routine parent queries about holidays, fee amounts, and syllabus changes in multiple languages, directly via WhatsApp or the Parent App.",
    icon: "BrainCircuit",
    color: "bg-fuchsia-600",
    category: "ai",
    stage: "beta",
    tier: "addon",
    benefits: [
      "24/7 Query Resolution",
      "Multilingual Support (Hindi/English)",
      "Grounded only in permitted ERP records",
      "Teacher Copilot for Lesson Drafting"
    ],
    mockUI: { title: "AI Chat Interface", type: "selection" }
  }
];
