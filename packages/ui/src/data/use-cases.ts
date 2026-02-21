export type UseCaseRole = 'admin' | 'principal' | 'teacher' | 'parent';

export interface UseCaseDetail {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  color: string;
  targetRole: UseCaseRole;
  problem: string;
  solution: string;
  stats: string;
  relatedFeatures: string[]; // Slugs of related features
}

export const USE_CASES_DATA: UseCaseDetail[] = [
  {
    id: "uc-fees",
    slug: "fees-collection-and-defaulters",
    title: "Fees Collection & Defaulters",
    shortDescription: "Automate fee reminders and stop revenue leakage.",
    longDescription: "End the month-end rush at the fee counter. Automate digital reminders to parents and provide zero-transaction-cost UPI options for faster fee realization. Give your accountant a stress-free reconciliation process.",
    icon: "Wallet",
    color: "bg-emerald-600",
    targetRole: "admin",
    problem: "Schools struggle with parents delaying fee payments, often requiring manual phone calls to remind them. At the counter, handling exact change and writing manual receipts causes massive queues.",
    solution: "SchoolERP automatically identifies pending dues and triggers WhatsApp/SMS reminders. The digital fee counter enables instant, audit-proof thermal receipts.",
    stats: "Reduce defaults 40%",
    relatedFeatures: ["school-fee-management-software", "defaulter-list-management", "school-reports-and-print-center"]
  },
  {
    id: "uc-whatsapp",
    slug: "reduce-whatsapp-chaos",
    title: "Reduce WhatsApp Chaos",
    shortDescription: "Move parent communication to a structured, secure app.",
    longDescription: "WhatsApp groups compromise teacher privacy and lead to chaotic reply threads where important notices get buried. Use SchoolERP's structured Parent App for targeted, secure communication.",
    icon: "MessageSquare",
    color: "bg-pink-600",
    targetRole: "principal",
    problem: "Parents message teachers at all hours, compromising privacy. Important circulars get lost among generic replies, leading to miscommunication.",
    solution: "Replace WhatsApp groups with the Parent App. Teachers broadcast notices securely, and parents acknowledge receipt without creating group spam.",
    stats: "100% Delivery",
    relatedFeatures: ["school-parent-communication-app", "school-circular-acknowledgement"]
  },
  {
    id: "uc-attendance",
    slug: "attendance-and-absentee-followup",
    title: "Attendance & Absentee Follow-up",
    shortDescription: "Exception-based attendance that alerts parents instantly.",
    longDescription: "Transform the manual register into a 15-second digital process. Provide instant assurance to parents that their child reached school safely through automated absence alerts.",
    icon: "UserCheck",
    color: "bg-blue-600",
    targetRole: "teacher",
    problem: "Teachers waste 10 minutes every morning calling roll. Later in the day, the front desk spends hours calling parents of absent students.",
    solution: "Teachers mark only exceptions on their phone. The system instantly fires SMS or App notifications to parents of absent students.",
    stats: "Save 15mins/day",
    relatedFeatures: ["school-attendance-management", "absentee-follow-up-system"]
  },
  {
    id: "uc-admission",
    slug: "admission-enquiry-to-admission",
    title: "Admission Enquiry to Enrollment",
    shortDescription: "Never lose track of a prospective student lead.",
    longDescription: "Digitize your admission season. Track every call and school tour in a unified pipeline dashboard to ensure zero dropped leads and a higher conversion rate.",
    icon: "TrendingUp",
    color: "bg-orange-600",
    targetRole: "admin",
    problem: "Front desk staff use notebooks to track admission walk-ins. There is no systemic follow-up, and many interested parents simply forget to return the form.",
    solution: "Use the built-in CRM Pipeline. Log every enquiry, set automated follow-up reminder alerts, and send personalized WhatsApp updates to prospective parents.",
    stats: "+20% Conversions",
    relatedFeatures: ["school-admission-management", "enquiry-follow-up-pipeline"]
  },
  {
    id: "uc-exam",
    slug: "report-cards-and-exam-results",
    title: "Report Cards & Exam Results",
    shortDescription: "Stop manual exam calculations and bulk-print report cards.",
    longDescription: "Eliminate the anxiety of result preparation. Teachers directly enter marks, and the system aggregates scholastic and co-scholastic grades into board-compliant report cards.",
    icon: "Trophy",
    color: "bg-purple-600",
    targetRole: "teacher",
    problem: "Compiling marks from different subject teachers into a master Excel file leads to formula errors, delays, and immense stress for the exam coordinator.",
    solution: "Teachers enter marks in a spreadsheet-like grid that locks automatically. The system computes the aggregates and generates 1-click printable report cards.",
    stats: "0 manual typing",
    relatedFeatures: ["report-card-software", "exam-marks-entry-system"]
  },
  {
    id: "uc-cert",
    slug: "certificates-in-one-click",
    title: "Certificates in One Click",
    shortDescription: "Issue TCs, Bonafides, and ID Cards instantly.",
    longDescription: "Provide faster service to parents at the school office. Generate legally compliant Transfer Certificates and Bonafide letters complete with dynamic student data.",
    icon: "FileSignature",
    color: "bg-rose-600",
    targetRole: "admin",
    problem: "Clerks manually type certificates in MS Word, leading to spelling mistakes in student names and dates of birth, which causes major issues for board registrations.",
    solution: "Choose a template and select the student. The system fills in all data directly from the verified Student Information System (SIS) instantly.",
    stats: "Audit-ready",
    relatedFeatures: ["transfer-certificate-management", "bonafide-certificate-generator"]
  },
  {
    id: "uc-reports",
    slug: "office-reports-for-inspection",
    title: "Office Reports for Inspection",
    shortDescription: "Generate government or trust inspection reports instantly.",
    longDescription: "When an inspector or the school trust asks for data, you shouldn't have to scramble. Pull exact numbers on admissions, fee collections, and attendance instantly.",
    icon: "BarChart3",
    color: "bg-slate-800",
    targetRole: "principal",
    problem: "When trust members ask for a multi-year admission comparison or fee collection summary, the office takes 3 days to collate the data.",
    solution: "The Print Center offers dozens of pre-configured statistical reports. Generate a category-wise admission count or daily fee register with one click.",
    stats: "Inspection Ready",
    relatedFeatures: ["school-reports-and-print-center"]
  },
  {
    id: "uc-counter",
    slug: "fee-counter-for-school-office",
    title: "Optimized Fee Counter",
    shortDescription: "Process walk-in fee payments 3x faster.",
    longDescription: "Handle the first week of the month smoothly. Designed specifically for the fast-paced environment of a school fee counter dealing with thousands of transactions.",
    icon: "Banknote",
    color: "bg-teal-600",
    targetRole: "admin",
    problem: "Slow software at the counter causes long lines. Parents get frustrated waiting 10 minutes just to pay cash and get a printed receipt.",
    solution: "A streamlined POS (Point of Sale) style interface. Enter the admission number, collect the cash, and hit print. Includes day-book closures.",
    stats: "3x Faster",
    relatedFeatures: ["fee-receipt-software", "late-fee-and-concession-management"]
  },
  {
    id: "uc-multi",
    slug: "multi-campus-management",
    title: "Multi-Campus Management",
    shortDescription: "Aggregate data securely across all branch schools.",
    longDescription: "Govern your entire portfolio of schools from a single master login. Apply global fee policies while comparing academic success rates across locations.",
    icon: "Globe",
    color: "bg-indigo-700",
    targetRole: "principal",
    problem: "School Trusts run multiple branches but have no unified dashboard. Each principal maintains separate data, making financial consolidation a nightmare.",
    solution: "A centralized cloud architecture. Trust admins can switch contexts between schools instantly, viewing aggregated admission and revenue charts.",
    stats: "Unified Dashboard",
    relatedFeatures: ["role-based-access-school-erp", "student-information-system"]
  },
  {
    id: "uc-transport",
    slug: "transport-safety-and-compliance",
    title: "Transport Safety & Compliance",
    shortDescription: "Live tracking and automated route fee billing.",
    longDescription: "Ensure student safety from home to school. Manage bus routes, track maintenance schedules, and provide parents with live GPS bus tracking.",
    icon: "Bus",
    color: "bg-yellow-600",
    targetRole: "admin",
    problem: "Parents constantly call the school when a bus is delayed. Manually tracking which student is on which route for fee billing is highly error-prone.",
    solution: "Parents use the app to track exactly where the bus is. Transport fees are automatically linked to the student's assigned route/stop.",
    stats: "Live Tracking",
    relatedFeatures: ["transport-management-software"]
  },
  {
    id: "uc-trust",
    slug: "parent-trust-and-transparency",
    title: "Parent Trust & Transparency",
    shortDescription: "Build the reputation of a modern, forward-thinking school.",
    longDescription: "Technology isn't just for efficiency; it's a marketing tool. Providing parents with a modern app builds trust and justifies fee structures.",
    icon: "HeartHandshake",
    color: "bg-fuchsia-600",
    targetRole: "principal",
    problem: "In competitive cities, budget schools struggle to differentiate themselves and prove value to parents, leading to stagnant admissions.",
    solution: "Deploying a branded Parent App instantly elevates the school's perceived value. Offering digital report cards and homework shows academic rigor.",
    stats: "Earning Trust",
    relatedFeatures: ["school-parent-communication-app", "homework-diary-module"]
  },
  {
    id: "uc-time",
    slug: "teacher-time-saver-workflows",
    title: "Teacher Time-Saver Workflows",
    shortDescription: "Reduce administrative burden on teachers.",
    longDescription: "Teachers are hired to teach, not to fill out paperwork. Our workflows remove the clerical burden of manual registers, diaries, and exam compilations.",
    icon: "Clock",
    color: "bg-sky-600",
    targetRole: "teacher",
    problem: "Teachers spend up to 25% of their day copying homework into diaries, calculating marks, or taking attendance, leading to burnout.",
    solution: "One-click attendance, bulk digital homework posting, and automated marks aggregation give teachers back hours of free time every week.",
    stats: "Save 25% Time",
    relatedFeatures: ["school-attendance-management", "exam-marks-entry-system"]
  }
];
