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
  seoContent?: string[];
  mockUI: {
    title: string;
    type: 'table' | 'chart' | 'list' | 'nodes' | 'selection' | 'map';
    screenshot?: string;
  };
}

export const FEATURES_DATA: FeatureItem[] = [
  {
    id: "fee-mgmt",
    slug: "fee-management-software",
    title: "Advanced Fee Management System",
    description: "Automate complex fee structures, collect online payments, and track dues with audit-grade precision.",
    longDescription: "Our fee management software is engineered to resolve the most persistent financial challenges faced by Indian schools today. From handling multiple fee heads like tuition, transport, and laboratory charges to managing intricate scholarship and discount rules, the platform provides a unified interface for all financial operations. It eliminates manual reconciliation by syncing directly with bank statements and payment gateways, ensuring that every rupee is accounted for. Parents benefit from a frictionless payment experience with zero-cost UPI, credit cards, and EMI options, which directly leads to improved liquidity for the institution. The system's automated reminder engine uses intelligent scheduling to notify parents via WhatsApp and SMS, reducing the administrative burden of follow-ups by up to 85%. For the management, it offers deep financial insights through real-time reports on collection trends, aging of dues, and projected cash flows. This module is built with audit-compliance at its core, featuring immutable transaction logs and multi-level approval workflows for fee waivers or manual adjustments. By centralizing all fee-related data, schools can easily manage multi-branch operations and maintain consistency across different campuses while providing a transparent and efficient service to their parent community. This comprehensive approach to financial management not only reduces leakage but also ensures that the school has the necessary resources to invest in quality education.",
    icon: "Wallet",
    color: "bg-emerald-500",
    category: "finance",
    stage: "live",
    tier: "core",
    benefits: [
      "Zero-cost UPI & Automated Reconciliation",
      "Dynamic Fee Head & Structure Builder",
      "Automated Multi-channel Dues Reminders",
      "Audit-proof Digital Receipts & Ledgers",
      "Real-time Financial Analytics Dashboard"
    ],
    seoContent: [
      "Optimizing school revenue requires a robust fee management system that minimizes leakage and maximizes collection efficiency. Our platform is designed specifically for the Indian K-12 market, supporting local tax requirements and diverse payment preferences.",
      "Security and transparency are prioritized in our architecture. Every transaction is tracked with a unique ID, providing a clear audit trail that simplifies tax compliance and internal financial controls during annual audits."
    ],
    mockUI: {
      title: "Fee Collection Overview",
      type: "chart",
      screenshot: "/product-screens/admin/admin-finance.png"
    }
  },
  {
    id: "attendance-mgmt",
    slug: "attendance-management",
    title: "Smart Student Attendance System",
    description: "Capture daily or subject-wise attendance in seconds with automated absentee alerts for parents.",
    longDescription: "Tracking student attendance is transformed from a tedious chore into a swift, data-driven process with our Smart Student Attendance System. Teachers can mark attendance using our mobile-optimized interface in less than 15 seconds per class, either through exception-based marking or bulk selection. The system is fully integrated with our communication engine, meaning as soon as the first period's attendance is finalized, parents of absent students receive an instant WhatsApp or Push notification. This immediate communication significantly enhances student safety and reduces truancy. Beyond daily logs, the system automatically compiles monthly attendance registers, calculates percentage-based eligibility for exams, and identifies patterns of chronic absenteeism. It supports various marking schemes, including full-day, half-day, and specific subject-level attendance for higher classes. For administrative reporting, the system generates inspection-ready attendance registers that comply with board requirements. The historical data allows schools to perform longitudinal analysis, identifying correlation between attendance patterns and academic performance. This module effectively bridges the communication gap between school and home, ensuring that every student's presence is accounted for and every parent is kept in the loop without the need for manual phone calls or manual register maintenance. It is a vital tool for maintaining institutional discipline.",
    icon: "UserCheck",
    color: "bg-blue-500",
    category: "safety",
    stage: "live",
    tier: "core",
    benefits: [
      "One-tap Exception-based Marking",
      "Instant Parent Absentee Notifications",
      "Auto-calculated Monthly Attendance Reports",
      "Subject-wise Attendance for Senior Classes",
      "Integration with Academic Eligibility Rules"
    ],
    seoContent: [
      "Effective attendance management is the cornerstone of student safety and academic consistency. Our digital attendance solution replaces error-prone paper registers with real-time data accessible to administrators and parents alike.",
      "By automating notifications and report generation, we empower teachers to reclaim valuable instruction time while providing the school management with actionable insights into student engagement levels."
    ],
    mockUI: {
      title: "Class Attendance Tracker",
      type: "selection",
      screenshot: "/product-screens/teacher/teacher-attendance.png"
    }
  },
  {
    id: "report-card",
    slug: "report-card-generator",
    title: "Board-Compliant Report Card Generator",
    description: "Design and print beautiful, professional report cards for CBSE, ICSE, and State Boards in one click.",
    longDescription: "Exam season no longer needs to be a period of intense administrative pressure thanks to our Report Card Generator. This powerful tool allows schools to create professional, customized, and board-compliant progress reports that accurately reflect student achievement. Whether your institution follows CBSE, ICSE, or specific State Board guidelines, our template engine accommodates diverse grading scales, descriptive indicators, and co-scholastic assessment criteria. Teachers simply enter marks into a spreadsheet-like grid, and the system handles all complex calculations, including weightage averages, grand totals, and percentile rankings. The generator supports multiple configurations for mid-term, final, and periodic assessments, ensuring a consistent format throughout the academic year. Beyond academics, schools can include attendance data, disciplinary remarks, and health records in the final printout. Our high-resolution PDF generation ensures that reports look stunning whether printed on school letterhead or shared digitally through the parent portal. This module eliminates the risk of calculation errors and drastically reduces the time administrative staff spends on manual data entry and formatting. It also provides a digital archive of every student's academic journey, allowing for easy retrieval of historical records during college admissions or transfers. It ensures that every student's achievements are celebrated professionally.",
    icon: "GraduationCap",
    color: "bg-purple-600",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Automated Grade & Rank Calculations",
      "Customizable CBSE/ICSE/State Board Layouts",
      "Bulk Digital & Physical Printing Support",
      "Historical Academic Record Archiving",
      "Integrated Co-scholastic & Remarks Entry"
    ],
    seoContent: [
      "Modernize your school evaluation process with our comprehensive report card software. We provide the flexibility to adapt to changing educational policies while maintaining the highest standards of professional presentation.",
      "Our system ensures data integrity across all academic reports, providing parents with a clear and detailed understanding of their child's progress through visually engaging and easy-to-read progress certificates."
    ],
    mockUI: {
      title: "Report Card Designer",
      type: "table",
      screenshot: "/product-screens/admin/admin-dashboard.png"
    }
  },
  {
    id: "admission-enquiry",
    slug: "admission-enquiry-pipeline",
    title: "Admissions & Enquiry CRM Pipeline",
    description: "Convert prospect inquiries into student enrollments with a visual lead management system.",
    longDescription: "Inquiry management is the starting point of student success. Our pipeline-based CRM allows you to monitor every interest from the first phone call till enrollment. Traditional methods of using registers often lead to lost opportunities, but our digital approach ensures that every lead is nurtured. Set follow-up reminders so your counselors never miss a call. Track the source of each enquiry to understand which marketing efforts are yielding results. With customized enquiry forms, you can collect the exact data points your school needs. The conversion to a student profile is instantaneous, saving your office staff hours of re-typing data. By providing a professional follow-up experience, you communicate the high standards of your institution to prospective parents. The analytics dashboard provides a bird's-eye view of your recruitment health, helping you adjust strategies mid-season to hit your enrollment targets. It is the definitive tool for schools looking to expand their footprint and manage their reputation effectively from the very first touchpoint with parents.",
    icon: "Users",
    color: "bg-orange-500",
    category: "platform",
    stage: "live",
    tier: "core",
    benefits: [
      "Visual Kanban Management for Inquiries",
      "Automated Follow-up Appointment Reminders",
      "Custom Admission Forms and Checklists",
      "1-Click Data Sync with Student Records",
      "Enquiry Source and ROI Tracking"
    ],
    seoContent: [
      "Elevate your school's recruitment with our focused Admission Enquiry CRM. We provide a structured pipeline that ensures every potential lead is followed up with professional efficiency and persistence.",
      "Turn enquiries into enrollments. Our platform provides the data-driven insights needed to optimize your marketing spend and improve the parent's first experience with your educational institution."
    ],
    mockUI: {
      title: "Admissions Pipeline",
      type: "nodes",
      screenshot: "/product-screens/admin/admin-dashboard.png"
    }
  },
  {
    id: "transport-mgmt",
    slug: "transport-management",
    title: "School Transport & Route Management",
    description: "Schedule bus routes, assign student stops, and automate transport fee billing seamlessly.",
    longDescription: "Managing school transport logistics is a significant task that directly affects student safety and parent peace of mind. Our Transport Management module provides a comprehensive suite of tools to organize your fleet. Map out efficient routes that minimize travel time and fuel costs. Assign students to specific bus stops and automatically calculate distance-based fees that sync with the main billing engine. Detailed driver and helper profiles ensure that you have complete records of everyone who interacts with your students. The system generates real-time passenger manifests for daily trips, ensuring that every child is accounted for during transit. Maintenance logs and fuel tracking features help you keep your vehicles in top condition and control operational costs. In cases of route changes or delays, the communication engine can instantly notify the relevant parents, reducing front-desk queries. It is a robust solution for schools that prioritize logistical excellence and child safety above all else, providing a transparent and efficient transport service that parents can trust every day.",
    icon: "Truck",
    color: "bg-yellow-600",
    category: "safety",
    stage: "live",
    tier: "addon",
    benefits: [
      "Intelligent Route & Stop Mapping",
      "Automatic Distance-based Fee Calculation",
      "Driver & Vehicle Compliance Directory",
      "Real-time Trip Passenger Manifests",
      "Integrated Fuel and Upkeep Tracking"
    ],
    seoContent: [
      "Optimize your school bus operations with our all-in-one transport management system. We provide the tools to manage complex logistics while maintaining the highest safety standards for your student community.",
      "Improve transport efficiency and transparency. Our platform helps schools reduce fuel costs and improve service quality through better route planning and automated fee management."
    ],
    mockUI: {
      title: "Transport Route Overview",
      type: "map",
      screenshot: "/product-screens/admin/admin-dashboard.png"
    }
  },
  {
    id: "visitor-pass",
    slug: "visitor-gate-pass",
    title: "Digital Visitor & Gate Management",
    description: "Enhance campus security with digital visitor check-ins, photo logs, and host notifications.",
    longDescription: "Security shouldn't be an afterthought. Our Digital Visitor Gate Pass system replaces outdated paper logs with a high-security digital interface. At every entry point, security staff can capture visitor photos, scan ID proofs, and specify the purpose of the visit. The system immediately sends a notification to the host staff member, ensuring that all guests are authorized and expected. This module also handles student early-exits, requiring verified parental check-in before a student can leave. Searchable logs allow you to historical review all entries and exits in seconds, which is crucial for incident investigations or safety audits. For pre-planned meetings, guests can be sent a QR code to expedite their entry. This professional and secure gateway management ensures a safe environment for students while making a strong impression on guests and parents. It is a cornerstone of any school's safety protocol, providing the accountability and transparency needed in a modern educational campus environment.",
    icon: "ShieldCheck",
    color: "bg-red-600",
    category: "safety",
    stage: "live",
    tier: "addon",
    benefits: [
      "Digital Photo and ID capture for Guests",
      "Instant Staff Notifications on Visitor Entry",
      "QR-Code Based Pre-appointment Entry",
      "Searchable Multi-gate Entry/Exit Records",
      "Verified Parent Early-exit Auth System"
    ],
    seoContent: [
      "Ensure your school's safety with our modern visitor management solution. Replace manual logbooks with a secure digital system that tracks every person entering and exiting your institution for maximum peace of mind.",
      "Professionalize your front gate with digital check-ins. Our platform provides a seamless experience for visitors while significantly strengthening your school's security and emergency response protocols."
    ],
    mockUI: {
      title: "Gate Entry Console",
      type: "list"
    }
  },
  {
    id: "whatsapp-notify",
    slug: "whatsapp-notifications",
    title: "Official WhatsApp API Notifications",
    description: "Send official school updates, fee reminders, and urgent alerts via verified WhatsApp messages.",
    longDescription: "Engagement is key to school success, and our WhatsApp notification engine takes communication to the next level. Unlike standard SMS, WhatsApp allows for rich media—sending circulars as PDFs, school photos as images, and even digital report cards directly to the parent's pocket. Our direct API integration means messages are delivered from your official school account, increasing trust and recognition. Automate fee payment links, attendance alerts, and emergency updates to ensure they are seen immediately. With an open rate far exceeding traditional email or SMS, you can be sure your message is getting through. The system respects parent privacy while providing an interactive and modern way to stay connected. It reduces administrative overhead by automating routine broadcasts that would otherwise take hours of manual calling. It's a premium feature that demonstrates your school's commitment to using the best technology to bridge the home-school gap.",
    icon: "MessageSquare",
    color: "bg-emerald-400",
    category: "communication",
    stage: "live",
    tier: "addon",
    benefits: [
      "Verified WhatsApp Business API Sender",
      "High-engagement Multi-media Messages",
      "Automated Attendance and Fee Alerts",
      "Rich PDF Circular and Receipt Sharing",
      "Interactive Quick-Reply Buttons for Parents"
    ],
    seoContent: [
      "Enhance parent engagement with our official school WhatsApp integration. Provide real-time updates through a platform your community already trusts, ensuring your messages are always seen and acted upon promptly.",
      "Build a stronger institutional brand with verified communications. Our platform helps you eliminate the noise of unofficial chat groups and provide a professional, secure channel for all school announcements."
    ],
    mockUI: {
      title: "WhatsApp Hub",
      type: "chart"
    }
  },
  {
    id: "tally-export",
    slug: "tally-export",
    title: "Seamless Tally ERP Integration",
    description: "Export your school's financial transactions directly into Tally for professional accounting.",
    longDescription: "Financial accuracy is non-negotiable for educational institutions. Our Tally Integration module acts as a bridge between your daily fee collection and your professional accounting software. Mapping your ERP fee heads directly to your Tally ledgers allows for a 1-click export of data, eliminating the need for tedious manual entries. This ensures that your books are always current and reduces the risk of human error in reconciliation. Your school's accountant will save days of work every month, allowing them to focus on high-level financial planning rather than data entry. The system supports various export formats compatible with Tally Prime and older versions, ensuring that it fits into your existing accounting workflow. Each transaction is exported with its original ID and student metadata, making cross-referencing during audits a breeze. It's a vital tool for schools that want to maintain high standards of financial transparency and professional accounting compliance without the administrative burden.",
    icon: "ArrowRightLeft",
    color: "bg-blue-700",
    category: "finance",
    stage: "live",
    tier: "addon",
    benefits: [
      "Direct Tally Prime (.xml) Data Export",
      "Custom Ledger and Fee-head Mapping",
      "Error-free Financial Reconciliation Engine",
      "Multi-session Backup and History Tracking",
      "Significant Reduction in Accounting Labor"
    ],
    seoContent: [
      "Streamline your school's financial reporting with our dedicated Tally integration module. We provide a professional bridge that ensures your daily fee collections are accurately reflected in your institutional ledgers.",
      "Improve financial integrity and audit-readiness. Our platform helps schools automate the transfer of complex transaction data into Tally, ensuring consistency between operational and financial records at all times."
    ],
    mockUI: {
      title: "Accounting Sync Dashboard",
      type: "table",
      screenshot: "/product-screens/accountant/accountant-dashboard.png"
    }
  },
  {
    id: "audit-logs",
    slug: "audit-logs",
    title: "Enterprise-grade Audit Trail",
    description: "Track every system change, deletion, and edit with a permanent, immutable security log.",
    longDescription: "In an enterprise environment, knowing 'who did what and when' is essential for maintaining data integrity. Our Audit Log module provides a comprehensive security layer that records every interaction within the ERP. From changes in exam marks to fee wizards and student profile updates, every action is logged with a timestamp, user ID, and the exact data that was modified. This immutable record cannot be tampered with, providing a reliable baseline for internal audits and incident investigations. It encourages accountability among staff and provides administrators with the peace of most by knowing that any unusual activity can be traced. The logs are searchable and filterable, allowing you to investigate specific events or user histories in seconds. This module is particularly critical for schools handling sensitive financial data or multi-campus operations where oversight is distributed. By implementing an enterprise-level audit trail, you ensure your school's data remains accurate, secure, and fully traceable, building a culture of transparency across your entire administration.",
    icon: "History",
    color: "bg-slate-800",
    category: "platform",
    stage: "live",
    tier: "enterprise",
    benefits: [
      "Immutable Timestamped Activity Logs",
      "Detailed Old vs New Data Comparison",
      "Advanced Administrative Search Filters",
      "User-level Action History Review",
      "Regulatory Compliance Verification Logs"
    ],
    seoContent: [
      "Secure your school's sensitive data with our comprehensive audit trail system. We provide the forensic level tracking needed to protect your institutional records from unauthorized edits and maintain total accountability.",
      "Foster a transparent and secure administrative environment. Our platform ensures that every modification within your ERP is documented and traceable, simplifying internal audits and enhancing overall data governance."
    ],
    mockUI: {
      title: "System Security Logs",
      type: "list",
      screenshot: "/product-screens/admin/admin-dashboard.png"
    }
  },
  {
    id: "student-360",
    slug: "student-360",
    title: "Student Profile Holistic Portal",
    description: "Access a complete timeline of student growth, from academics and attendance to behavior.",
    longDescription: "A learner's journey is more than just grades. Our Student Profile portal provides teachers and principals with a unified view of every student's biography, growth trends, and engagement levels. See their academic history across multiple years, track attendance patterns, review disciplinary remarks, and access all stored digital documents in one click. This holistic approach allows for more personalized interventions, as educators can see the context behind student performance. During parent-teacher meetings, have the data you need to provide a truly detailed and caring evaluation. The interface is clean, fast, and accessible on any device, ensuring that critical information is never more than a few taps away. You can log health records, track sibling progress, and even monitor library usage for a complete picture of student development. It transforms raw data into a life story, helping you nurture every child's unique potential with professional insight and empathy.",
    icon: "Users",
    color: "bg-indigo-600",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Unified Multi-year Student Growth Map",
      "Centralized Academic & Behavioral Logs",
      "Instant Digital Documentation Access",
      "Sibling Performance and Sibling Mapping",
      "Personalized Student Insight Dashboard"
    ],
    seoContent: [
      "Understand every student's journey with our 360-degree management portal. We consolidate academic, financial, and behavioral data into a single, intuitive view that helps educators provide better pastoral care and instruction.",
      "Improve educational outcomes through data-driven empathy. Our holistic profile system ensures that your staff has a complete understanding of each student's history, enabling more effective and personalized support."
    ],
    mockUI: {
      title: "Student Master View",
      type: "selection",
      screenshot: "/product-screens/admin/admin-students.png"
    }
  },
  {
    id: "grading-exams",
    slug: "grading-and-exams",
    title: "Professional Exam & Grading Engine",
    description: "Create complex exam structures, automate grade calculations, and manage assessments ease.",
    longDescription: " Evaluation is the heart of school life, and our Grading Engine is designed to handle the complexity of modern educational standards. Whether you follow CBSE, ICSE, or a specific local board, you can define your grading scales, weightages, and promotion criteria with precision. The engine automates the calculation of aggregates, percentages, and grand totals, ensuring that your reports are accurate and arrive on time. It handles various exam types—from unit tests and periodic assessments to mid-terms and finals—and integrates them into a final result based on your school's specific policy. Teachers benefit from a streamlined marks-entry interface that prevents errors like entering scores above the maximum limit. The system also generates in-depth analytics that identify class-wide and subject-wise performance trends. This allows coordinators to see where students are excelling and where they need more support. By automating the backend of your evaluations, you free your staff to focus on teaching and providing meaningful feedback, ensuring that every student's progress is tracked fairly and professionally throughout the academic session.",
    icon: "Trophy",
    color: "bg-amber-500",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Customizable Multi-board Grading Scales",
      "Automated Weightage-based Grand Totals",
      "Class and Subject Performance Analytics",
      "Bulk Marks Entry with Validation Rules",
      "Integrated Result Correction Audit Trail"
    ],
    seoContent: [
      "Modernize your school assessments with our robust grading and exam engine. We provide the flexibility to adapt to changing evaluation policies while maintaining the highest standards of professional presentation.",
      "Transform your evaluation process into a insights hub. Our platform provides the analytical depth needed to track academic standards and identify instructional opportunities across your entire institution with ease."
    ],
    mockUI: {
      title: "Exam Performance Stats",
      type: "chart"
    }
  },
  {
    id: "staff-hrms",
    slug: "staff-attendance-hrms",
    title: "Complete Staff HRMS & Payroll",
    description: "Manage teacher profiles, track staff attendance, and automate payroll with leave sync.",
    longDescription: "Your educators are the pillars of your institution, and our HRMS module provides the professional tools needed to manage them well. Beyond simple attendance logs, it offers a complete staff management ecosystem where you can store qualification records, service histories, and performance reviews. Define leave policies like casual leave, sick leave, and earned leave, and let the system handle the approval workflow and balance tracking. As employees check in—via biometric device or mobile GPS—the data flows directly into the payroll engine, automatically calculating late-coming deductions or overtime benefits. Generate professional digital salary slips that employees can access via their own portal, reducing queries to the accounts department. This module also handles mandatory compliance documentation, ensuring your school is always ready for institutional inspections. By professionalizing your HR operations, you not only improve administrative efficiency but also build a culture of reliability and trust with your teaching and non-teaching staff, which is essential for long-term institutional stability.",
    icon: "Users",
    color: "bg-teal-600",
    category: "platform",
    stage: "live",
    tier: "core",
    benefits: [
      "Biometric and GPS-based Staff Attendance",
      "Automated Leave Balance & Approval flow",
      "Digital Employee Service Book & Records",
      "Attendance-synced Automated Payroll Slip",
      "Teacher Performance and Observation Logs"
    ],
    seoContent: [
      "Optimize your school's staff management with our integrated HRMS solution. We provide the tools to manage your most valuable assets—your educators—with transparency, fairness, and professional precision.",
      "Improve staff satisfaction through professional administration. Our HR portal ensures that attendance, leaves, and salary details are accurately maintained and easily accessible to your teaching community at all times."
    ],
    mockUI: {
      title: "Staff Management Hub",
      type: "table"
    }
  },
  {
    id: "library-mgmt",
    slug: "library-management-system",
    title: "Smart Digital Library Catalog",
    description: "Track book inventory, manage issuances, and automate late-return fine collection effortlessly.",
    longDescription: "A school library is a gateway to the world, and our management system ensures it stays organized and accessible. catalog your entire collection with barcode or ISBN integration, making the initial setup incredibly fast. Students and teachers can search for available titles through their own portals, promoting a culture of reading and research. The system handles all issuance and return logistics, tracking the location of every book in your collection. Automated reminders prevent overdue returns, and if a fine is incurred, it's automatically calculated and posted to the student's main ledger. This ensures that library dues are never lost and are easily reconciled during final 'no-dues' checks. Circulation reports provide insight into popular genres and library engagement levels, helping you make informed decisions for future book purchases. By digitizing your library operations, you reduce the workload on your librarian and provide a modern, efficient service that students appreciate. It is a vital module for any institution committed to academic excellence and comprehensive resource management across the campus.",
    icon: "BookOpen",
    color: "bg-amber-700",
    category: "academics",
    stage: "live",
    tier: "addon",
    benefits: [
      "Barcode and ISBN Enabled Cataloging",
      "Automated Late Return Fine Tracking",
      "Integrated Book Search for Students",
      "Book Condition and Stock Monitoring",
      "Detailed Resource Circulation Analytics"
    ],
    seoContent: [
      "Enhance your school library with our modern management software. We simplify the complexities of book tracking and resource allocation, allowing your staff to focus on building a vibrant reading community for students.",
      "Track library performance with data-driven insights. Our platform provides the tools to monitor resource usage and fine collections, ensuring your library remains a well-funded and well-organized academic hub."
    ],
    mockUI: {
      title: "Library Circulation Board",
      type: "list"
    }
  },
  {
    id: "inventory-tracking",
    slug: "inventory-and-asset-tracking",
    title: "Asset & Inventory Control System",
    description: "Monitor school fixed assets and daily consumables to prevent loss and optimize spending.",
    longDescription: "From laboratory chemicals to classroom furniture, schools manage a vast array of physical assets that need careful tracking. Our Inventory module provides a robust framework to monitor every item in your school. Assign fixed assets to specific rooms or staff members and track their lifecycle from purchase to disposal. For consumables like stationery or sports gear, the system tracks stock levels and sends alerts when it's time to reorder, helping you maintain a lean and efficient inventory. procurement workflows ensure that every purchase is authorized and documented, reducing unapproved expenses. Detailed reporting allows you to see common wastage patterns and identify where resources are being overused. This level of control is essential for managing the school budget and ensuring that teachers always have the supplies they need for their classes. By centralizing asset management, you protect your school's investments and provide a transparent system for resource distribution that ensures accountability across all departments and campus locations.",
    icon: "Package",
    color: "bg-orange-800",
    category: "platform",
    stage: "live",
    tier: "addon",
    benefits: [
      "Serialized Fixed Asset Registry",
      "Low Stock Alerts for Consumables",
      "Integrated Purchase Order Workflow",
      "Room-wise and Department-wise Logs",
      "Asset Depreciation and Lifecycle reports"
    ],
    seoContent: [
      "Protect your school's physical resources with our comprehensive inventory management platform. We provide the visibility and control needed to manage assets efficiently across multi-campus educational institutions.",
      "Optimize your school's spending and reduce wastage. Our platform helps administrators track consumables and fixed assets with precision, ensuring that resources are always available and accountability is maintained."
    ],
    mockUI: {
      title: "Inventory Control Matrix",
      type: "table"
    }
  },
  {
    id: "id-card-gen",
    slug: "id-card-generator",
    title: "Instant ID Card Production Studio",
    description: "Generate professional, high-resolution student and staff ID cards in seconds with bulk export.",
    longDescription: "Identity is the foundation of safety in any school. Our ID Card Studio allows you to create professional cards for your entire community without the need for external design agencies. Using the data already stored in the ERP—including photos, house colors, and blood groups—you can generate hundreds of high-res ID cards in a single click. Choose from multiple professional templates or customize one to reflect your school's unique branding and logo. Each card can include a barcode or QR code that integrates with our attendance and library modules for a truly unified tech experience. This system saves your office staff countless hours of manual data entry and reduces the logistical headache of managing external vendors. It also allows for 'as-needed' printing of replacement cards for students who lose them, ensuring your security protocols are always maintained. It's a high-efficiency tool that professionalizes your school's first impression while saving significant operational costs every single academic year.",
    icon: "IdCard",
    color: "bg-blue-600",
    category: "platform",
    stage: "live",
    tier: "core",
    benefits: [
      "Automated Bulk ID Card Generation",
      "Custom Branding and Template Design",
      "Barcode/QR Code Integrated IDs",
      "High-resolution Print-ready PDF Export",
      "Zero-data Entry Staff & Student Lists"
    ],
    seoContent: [
      "Produce professional school ID cards in seconds with our integrated generator. We provide a cost-effective, high-quality solution that streamlines student identification and enhances your overall campus security measures.",
      "Strengthen your school's brand identity with unified IDs. Our platform ensures that every card is accurate, professionally designed, and ready for use with your school's existing attendance and access control systems."
    ],
    mockUI: {
      title: "ID Card Designer View",
      type: "selection"
    }
  },
  {
    id: "website-builder",
    slug: "school-website-builder",
    title: "Integrated School Website Builder",
    description: "A professional online presence that syncs with your admissions and results automatically.",
    longDescription: "In today's digital age, your website is your school's global front door. Our Website Builder is designed specifically for education, offering more than just static pages. It is a functional hub that syncs with your ERP data to publish real-time announcements, upcoming events, and photo galleries. Prospective parents can find your admission enquiry forms, and current parents can view fee notifications or download circulars or check exam results through a professional and secure interface. The sites we build are highly optimized for search engines (SEO) and mobile devices, ensuring that you rank well locally and provide a great experience for parents on the go. We handle all the technical details—from secure SSL hosting to domain management—allowing you to focus on your school's core mission. The content management system is intuitive, meaning your own staff can keep the news fresh without needing technical skills. By providing a professional and functional online presence, you build immediate credibility in your community and create a centralized information platform that saves your front office hundreds of phone queries every month.",
    icon: "Globe",
    color: "bg-cyan-600",
    category: "communication",
    stage: "live",
    tier: "addon",
    benefits: [
      "ERP-Synced Admission Leads Forms",
      "Mobile-First and SEO-friendly Designs",
      "Managed Hosting, SSL, and Security",
      "Automated News and Event Publishing",
      "Built-in Social Media Integration Widgets"
    ],
    seoContent: [
      "Increase your school's enrollment and online visibility with our specialized website platform. We provide the tools to build a professional, functional, and secure digital home for your educational institution.",
      "Build trust with current and prospective parents through a modern website. Our platform ensures your school's most important news and results are always accessible, professional, and easy to find on all devices."
    ],
    mockUI: {
      title: "Web Content Dashboard",
      type: "nodes"
    }
  },
  {
    id: "online-exam",
    slug: "online-exam-platform",
    title: "Secure Hybrid Assessment Suite",
    description: "Conduct online tests with auto-grading, time-limits, and advanced anti-cheating controls.",
    longDescription: "Assessments shouldn't be limited by physical space. Our Online Examination Platform provides a secure environment for students to demonstrate their knowledge. Teachers can build rich item banks with MCQs, true/false, match-the-following, and even subjective questions that support mathematical expressions and diagrams. To ensure academic integrity, the platform includes window-lock technology that prevents students from switching tabs and randomized question sets for every learner. Exams are automatically graded for objective sections, providing instant feedback and saving teachers hours of work. For subjective answers, teachers can grade and leave detailed remarks directly within the student's submission. The results are instantly synced with the main grading module for inclusion in report cards. This platform is perfect for periodic homework quizzes, mock tests, and even full-scale digital assessments in the classroom. By leveraging technology, you provide a modern testing experience that prepares students for higher education while giving teachers unprecedented insight into particular learning gaps within the class.",
    icon: "Computer",
    color: "bg-indigo-700",
    category: "academics",
    stage: "live",
    tier: "addon",
    benefits: [
      "Rich Item Bank with Multi-media support",
      "Automated MCQ Grading and Analytics",
      "Anti-cheating Window-lock Protection",
      "Subjective Answer Grading Workflow",
      "Time-constrained Exam Schedule Control"
    ],
    seoContent: [
      "Revolutionize your school's assessments with our secure online examination platform. We provide a professional, scalable solution for conducting hybrid and digital-only tests that maintain high academic integrity.",
      "Improve student performance with rapid digital feedback. Our platform helps teachers identify areas for revision immediately, turning assessments into a more effective and engaging part of the learning cycle for everyone."
    ],
    mockUI: {
      title: "Assessment Console Hub",
      type: "list"
    }
  },
  {
    id: "homework",
    slug: "homework-and-diary",
    title: "Digital Homework & Daily Diary",
    description: "Post assignments, attach study materials, and track student submissions in real-time.",
    longDescription: "Keep learning active every day with our Digital Homework module. Teachers can post assignments, reading lists, and project guidelines directly to the parent app, ensuring they're never missed or forgotten. Attach PDFs, lecture notes, or even helpful educational videos to provide students with the resources they need to succeed outside the classroom. Parents receive instant push notifications, allowing them to support their children effectively. The system also replaces the traditional school diary for parent-teacher notes, providing a secure and organized channel for daily communications. Track who has viewed the homework and monitor digital submissions for a more efficient grading cycle. This connectivity ensures that students stay on top of their tasks and parents are always in the loop regarding the daily academic agenda. By digitizing this routine communication, you build a stronger supportive environment for your learners and eliminate the friction of unorganized paper-based diaries and last-minute phone calls regarding assignments.",
    icon: "BookOpenText",
    color: "bg-sky-600",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Multi-media Homework and Notes sharing",
      "Instant App Notifications for Assignments",
      "Parent-Teacher Secure Digital Notes",
      "Assignment Submission Tracking Sheet",
      "Subject-wise Daily Diary Organization"
    ],
    seoContent: [
      "Streamline your school's daily communication with our integrated digital diary and homework module. We provide the structure needed to ensure that learning continues seamlessly from the classroom to the home environment.",
      "Better engage parents in their child's education. Our platform ensures that assignments and school notices are always visible and organized, leading to higher homework completion rates and better academic performance overall."
    ],
    mockUI: {
      title: "Daily Assignment Feed",
      type: "list"
    }
  },
  {
    id: "parent-app",
    slug: "parent-communication-app",
    title: "Unified Mobile Parent Portal",
    description: "A secure, all-in-one portal for parents to pay fees, track attendance, and view results.",
    longDescription: "The Parent Mobile App is the digital face of your school, designed to provide a premium, transparent experience for every family. Available for both Android and iOS, it consolidates every school interaction into a single, intuitive interface. Parents can view real-time attendance, track their child's school bus position on a map, pay fees securely through integrated gateways, and download digital report cards. The in-app noticeboard replaces messy WhatsApp groups with organized, official school circulars and event photos. Multi-child support allows parents to switch between different siblings with a single tap, providing a holistic view of the family's academic life. This connectivity builds deep trust and significantly reduces the front office's workload as routine queries are answered within the app itself. By providing this modern tool, your school demonstrates a forward-thinking brand and a commitment to parental engagement that is essential in today's competitive educational market. It's more than just an app; it's a window into the classroom that parents truly value and rely on.",
    icon: "Smartphone",
    color: "bg-violet-600",
    category: "communication",
    stage: "live",
    tier: "core",
    benefits: [
      "Native Android and iOS App Support",
      "Secure Integrated Fee Payments",
      "Live GPS School Bus Tracking View",
      "One-tap Multi-child Profile Switching",
      "Digital Report Card and Result Downloads"
    ],
    seoContent: [
      "Enhance your school's reputation with our top-rated parent communication app. We provide a professional, all-in-one portal that simplifies the complex interactions between your institution and your parent community.",
      "Differentiate your school with our mobile-first engagement strategy. Our platform ensures that critical school information is always available, secure, and easy to access for every family, leading to higher long-term satisfaction."
    ],
    mockUI: {
      title: "The Parent Workspace",
      type: "nodes",
      screenshot: "/product-screens/parent/parent-dashboard.png"
    }
  },
  {
    id: "teacher-app",
    slug: "teacher-grading-app",
    title: "Teacher Efficiency & Grading App",
    description: "Allow teachers to take attendance, enter marks, and post notes from their mobile devices.",
    longDescription: "Empower your staff with tools that save time and reduce stress. Our Teacher Mobile App is optimized for the busy classroom environment, allowing educators to handle administrative tasks on the go. Mark period-wise attendance with a few taps, enter exam marks directly from the classroom, and post homework to the entire section in seconds. The app includes a personal dashboard where teachers can see their own attendance, schedules, and leave balances. By moving critical data entry to the source, you improve accuracy and ensure the management has real-time visibility into school operations. The secure communication features allow teachers to reach parents without sharing their personal mobile numbers, maintaining professional boundaries. This focus on efficiency and staff well-being leads to higher morale and better classroom focus. By putting the ERP in their pocket, you transform the way your staff manages their day, ensuring that every minute is spent focusing on student success rather than tedious paperwork.",
    icon: "PenTool",
    color: "bg-indigo-500",
    category: "academics",
    stage: "live",
    tier: "core",
    benefits: [
      "Mobile-First Attendance & Marks Entry",
      "Teacher-specific Schedule & Leave Portal",
      "Professional Parent-Teacher Messaging",
      "Real-time Home-work and Diary Posting",
      "Class-wise Student Performance Stats"
    ],
    seoContent: [
      "Maximize teacher potential with our dedicated mobile classroom management app. We provide the tools to eliminate administrative burdens, allowing your educators to focus on what they do best: teaching and inspiring students.",
      "Improve school-wide data accuracy and staff satisfaction. Our teacher-centric mobile solution ensures that essential school records are updated in real-time at the source, providing a more reliable foundation for school management."
    ],
    mockUI: {
      title: "Teacher Mobile Terminal",
      type: "selection",
      screenshot: "/product-screens/teacher/teacher-dashboard.png"
    }
  },
  {
    id: "receipt-engine",
    slug: "digital-receipt-engine",
    title: "Professional Fee Receipt Engine",
    description: "Generate secure, sequential, and audit-proof digital receipts for all school collections.",
    longDescription: "Reliable financial documentation is essential for maintaining institutional trust and compliance. Our Digital Receipt Engine automates the production of high-quality, sequential fee receipts for every payment transaction. Whether it's a cash payment at the counter or an online UPI transfer, a unique receipt is generated instantly, complete with your school's official branding and legal footnotes. This system ensures that all collections represent an accurate and unshakeable record for your auditors. For the accountant, it simplifies end-of-day cash book closure by providing automated collection summaries. Receipts can be printed in multiple formats, including detailed A4 pages or fast thermal slips, or sent directly to parents via WhatsApp and email as PDFs. This module eliminates manual receipt books and the errors associated with them, ensuring that your school's financial interface is as professional and efficient as a modern bank. By centralizing receipt management, you protect your school's revenue and provide parents with instant, permanent proof of payment for their records.",
    icon: "ReceiptText",
    color: "bg-emerald-600",
    category: "finance",
    stage: "live",
    tier: "core",
    benefits: [
      "Automated Sequential Audit-proof numbering",
      "A4 and Thermal Printer Support layouts",
      "Instant Digital Receipt Delivery via WhatsApp",
      "Professional School Branding on Receipts",
      "Automatic Ledger Update and Reconciliation"
    ],
    seoContent: [
      "Modernize your school's billing system with our secure fee receipting solution. We provide the financial infrastructure needed to professionalize your collection process and simplify your internal accounting audits.",
      "Ensure every penny is accounted for with our automated receipt engine. Our platform provides parents with professional proof of payment while maintaining an accurate and searchable financial ledger for your school management."
    ],
    mockUI: {
      title: "Fee Receipt Console",
      type: "table",
      screenshot: "/product-screens/accountant/accountant-collections.png"
    }
  },
  {
    id: "bulk-import",
    slug: "bulk-import-service",
    title: "Concierge Data Migration Service",
    description: "Transition from legacy systems or spreadsheets into our modern ERP with total accuracy.",
    longDescription: "Starting with a new school system shouldn't be a struggle. Our Bulk Import Service handles the heavy lifting of data migration so you can go live across your entire campus in record time. We provide an intelligent mapping tool that takes your existing student masters, library catalogs, and staff directories from Excel or your old ERP and ports them directly into our platform. The system includes an advanced validation engine that detects duplicates, missing data, and formatting errors before they ever hit your live database. This ensures high data integrity and a clean start for your digital transformation. Our technical team provides hands-on support to ensure every record—including complex details like blood groups and Aadhaar numbers—is accurately migrated. This module is designed for schools that want the benefits of a modern ERP without the typical time and labor costs associated with data entry. It's the smooth, professional gateway to a more efficient future for your school's administrative and academic management teams.",
    icon: "UploadCloud",
    color: "bg-blue-400",
    category: "platform",
    stage: "live",
    tier: "core",
    benefits: [
      "Intelligent Excel/CSV Data Mapping Tool",
      "Error Detection and Deduplication engine",
      "Bulk Academic Year Data Porting",
      "Historical Performance and Record Migration",
      "Concierge Technical Support for Onboarding"
    ],
    seoContent: [
      "Accelerate your school's digital transition with our specialized data migration service. We eliminate the barriers to entry by ensuring your existing records are moved onto our modern platform with speed and surgical precision.",
      "Maintain continuity in your institutional records. Our import platform ensures that your student and staff data is professionally managed and accurately preserved as you move from manual systems to a unified ERP solution."
    ],
    mockUI: {
      title: "Migration Control Center",
      type: "selection"
    }
  },
  {
    id: "custom-fields",
    slug: "custom-fields-platform",
    title: "No-code Custom Fields Platform",
    description: "Extend our ERP with your own unique data points and forms without any coding required.",
    longDescription: "Every educational institution has unique operational requirements that standard software often fails to capture. Our Custom Fields Platform provides you with the power to adapt the ERP to your school's specific needs. whether you need to track 'Bus Route Prefixes', 'Religious Affiliation', or 'Special Medical Needs', you can create a custom data field in seconds. these fields become a native part of your student and staff profiles, allowing you to capture information that is relevant only to your community. these fields support diverse formats—like dropdown menus, checkboxes, and date pickers—and are fully searchable in our reporting engine. You can also build dynamic forms for special events or new admissions, ensuring that you collect exactly the data you need from day one. This flexibility ensures that the software evolves with your school's growth and changing regulatory environment. It's an enterprise-grade customization tool that gives your administrators total control over their data structure, ensuring that your ERP is as unique as your school's heritage and future goals.",
    icon: "Maximize",
    color: "bg-slate-600",
    category: "platform",
    stage: "live",
    tier: "enterprise",
    benefits: [
      "User-defined Dynamic Data Fields",
      "Support for Multi-type Input formats",
      "Custom Field Search and Report Filter",
      "Flexible Profile and Form Extension",
      "Zero-coding Required Administration"
    ],
    seoContent: [
      "Tailor our ERP to your school's unique requirements with our flexible custom field management. We provide the infrastructure for you to capture any data point relevant to your institutional mission and daily operations.",
      "Future-proof your school's digital records with no-code customization. Our platform allows administrators to add and manage unique descriptive fields that ensure your database perfectly reflects your school's culture and curriculum."
    ],
    mockUI: {
      title: "Feature Configuration Hub",
      type: "nodes"
    }
  },
  {
    id: "biometric-sync",
    slug: "biometric-attendance-sync",
    title: "Real-time Biometric Attendance Sync",
    description: "Automate student and staff entries with direct hardware integration for gate security.",
    longDescription: "Bring physical security and digital management together with our Biometric Sync module. We integrate directly with a wide variety of fingerprint, RFID, and facial recognition devices to automate your school's attendance logs. As students and staff walk through the gate, their check-ins are recorded and pushed instantly to the cloud ERP. This eliminates manual errors and provides a high-discipline environment where attendance is documented with biological precision. For parents, this means a notification as soon as their child scans their card or face at the gate, providing unprecedented peace of mind regarding their safe arrival. For management, it offers a real-time view of campus occupancy and eliminates the need for manual attendance registers for both students and staff. The data flows directly into the HRMS and Academic modules, ensuring consistency across all records. By professionalizing your campus entry points, you create a safer, more efficient learning environment that parents trust and respect as a hallmark of your school's premium services.",
    icon: "Fingerprint",
    color: "bg-indigo-800",
    category: "safety",
    stage: "live",
    tier: "enterprise",
    benefits: [
      "Native Direct-from-hardware Data Sync",
      "RFID and Face-Recognition Device Support",
      "Instant Cloud-based Log Processing",
      "Automated Gate-to-Parent Safety Alerts",
      "Immutable High-integrity Attendance Logs"
    ],
    seoContent: [
      "Modernize your school gates with our integrated biometric and RFID attendance system. We provide the hardware-to-cloud bridge needed to automate tracking and enhance the safety of your student and staff community.",
      "Ensure absolute accuracy in your attendance records. Our platform eliminates manual verification tasks and provide a secure, automated gateway that reflects your school's commitment to campus safety and modern discipline."
    ],
    mockUI: {
      title: "IoT Integration Panel",
      type: "chart"
    }
  },
  {
    id: "school-bus-tracking",
    slug: "school-bus-tracking-live",
    title: "Live GPS School Bus Tracking",
    description: "Real-time visibility of your school fleet for parents and administrators via Google Maps.",
    longDescription: "Transform your school transport into a secure and visible service with our Live GPS Tracking module. This system provides parents with a real-time map view of their child's school bus position directly on their smartphones. They can see the bus moving, track its speed, and receive automated alerts when it is approaching their stop, significantly reducing wait times and parent anxiety. For the school's transport manager, the dashboard provides a bird's-eye view of the entire fleet, highlighting any unauthorized stops, delays, or over-speeding incidents. This visibility ensures driver accountability and allows for rapid response in case of emergencies or breakdowns. The system also calculates precise trip ETAs based on real-time traffic data, improving the efficiency of your logistics. By providing this premium service, you differentiate your school as one that prioritizes child safety and provides parents with professional, high-tech tools to manage their busy daily schedules. It’s an essential module for any school that wants to ensure student journeys are as safe and efficient as possible every single day.",
    icon: "MapPin",
    color: "bg-red-500",
    category: "safety",
    stage: "live",
    tier: "addon",
    benefits: [
      "Live Google Maps Tracking for Parents",
      "Geofence-based Arrival Proximity Alerts",
      "Driver Behavior and Speeding Reports",
      "Real-time Fleet Status Admin Dashboard",
      "Integrated Route Deviation Notifications"
    ],
    seoContent: [
      "Enhance student transit safety with our real-time GPS school bus tracking. Provide parents with the transparency they demand while giving your transport fleet the administrative oversight needed for peak efficiency.",
      "Improve parent satisfaction and reduce logistical stress. Our live tracking platform provides accurate ETAs and safety monitoring for every school bus, ensuring a predictable and well-managed transport service for the entire community."
    ],
    mockUI: {
      title: "Live Trip Monitor",
      type: "map",
      screenshot: "/product-screens/admin/admin-dashboard.png"
    }
  }
];
