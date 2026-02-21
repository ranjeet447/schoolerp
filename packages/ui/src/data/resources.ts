export type ResourceCategory = 'Guide' | 'Checklist' | 'Template' | 'Policy';

export interface ResourceItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: ResourceCategory;
  icon: string;
  color: string;
  downloadUrl?: string;
  readingTime?: string;
  points: string[];
}

export const RESOURCES_DATA: ResourceItem[] = [
  {
    id: "res-cbse",
    slug: "cbse-compliance-checklist-2026",
    title: "CBSE Compliance Checklist 2026",
    description: "A comprehensive audit checklist for school leaders to ensure all digital and physical records meet the latest board norms.",
    category: "Checklist",
    icon: "ClipboardCheck",
    color: "bg-blue-600",
    points: [
      "Latest SARAS 4.0 documentation requirements",
      "Teacher service record digital audit format",
      "Fee register & counter cash book mapping",
      "Building safety & fire NOC renewal trackers"
    ]
  },
  {
    id: "res-fees",
    slug: "school-fee-policy-template",
    title: "School Fee Policy Template",
    description: "Professional template for defining late fee rules, sibling discounts, and waiver approval workflows for your school board.",
    category: "Template",
    icon: "FileText",
    color: "bg-emerald-600",
    points: [
      "Standard late fee slab configurations",
      "Sibling & Staff discount policy drafts",
      "Withdrawal & Refund timeline rules",
      "Principal waiver approval authority matrix"
    ]
  },
  {
    id: "res-digital",
    slug: "digital-transformation-guide-for-budget-schools",
    title: "Digital Transformation Guide",
    description: "Phase-by-phase roadmap for budget schools to move from registers to the cloud without disrupting daily operations.",
    category: "Guide",
    icon: "Compass",
    color: "bg-purple-600",
    points: [
      "30-day manual to digital transition plan",
      "Office staff re-skilling workshop modules",
      "Data migration safety protocols",
      "Parent adoption incentive strategies"
    ]
  },
  {
    id: "res-admission",
    slug: "admission-enquiry-sheet-template",
    title: "Admission Enquiry Master Sheet",
    description: "Optimized data collection format for front-desk staff to capture high-quality leads during admission season.",
    category: "Template",
    icon: "FileSpreadsheet",
    color: "bg-orange-600",
    points: [
      "High-intent lead qualification questions",
      "Source tracking (Referral vs Digital vs Walk-in)",
      "Daily follow-up priority scoring guide",
      "Lost enquiry reason analysis codes"
    ]
  },
  {
    id: "res-parent",
    slug: "parent-communication-best-practices",
    title: "Parent Communication Best Practices",
    description: "How to reduce inquiry calls and build trust through structured mobile app updates and circulars.",
    category: "Guide",
    icon: "MessageSquare",
    color: "bg-pink-600",
    points: [
      "Circular drafting templates for holidays/fees",
      "Emergency notification protocols",
      "Digital PTM feedback collection formats",
      "Student appreciation app-shoutout guide"
    ]
  },
  {
    id: "res-report",
    slug: "report-card-design-standards",
    title: "Report Card Design Standards",
    description: "A guide to scholastic and co-scholastic grading parameters that make report cards clear and professional for parents.",
    category: "Guide",
    icon: "Trophy",
    color: "bg-teal-600",
    points: [
      "NEP 2020 holistic report card mapping",
      "Co-scholastic skill descriptive indicators",
      "Standard academic remarks bank (English/Hindi)",
      "Visual layout benchmarks for premium feel"
    ]
  },
  {
    id: "res-security",
    slug: "student-data-privacy-policy",
    title: "Student Data Privacy Policy",
    description: "Ready-to-use privacy policy document for schools to share with parents regarding their children's data security.",
    category: "Policy",
    icon: "ShieldCheck",
    color: "bg-indigo-600",
    points: [
      "Digital data storage security clauses",
      "Parental consent for photo/video sharing",
      "Third-party integration safety standards",
      "Data breach response and notification labs"
    ]
  }
];

