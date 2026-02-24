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
  relatedFeatures: string[];
  seoContent?: string[];
  screenshot?: string;
}

export const USE_CASES_DATA: UseCaseDetail[] = [
  {
    id: "uc-1",
    slug: "principal-ops",
    title: "Unified Principal Dashboard & Operational Oversight",
    shortDescription: "Empower school leadership with real-time data for informed decision-making.",
    longDescription: "In the fast-paced environment of educational management, principals often find themselves buried under mountains of manual reports, fragmented data, and urgent administrative requests from various departments. This traditional approach to school leadership is not only exhausting but also dangerously prone to oversight, as critical trends can easily be missed in a pile of paper registers. Our Unified Principal Dashboard transforms this experience by centralizing every critical metric into a single, intuitive interface that is accessible from anywhere. From real-time attendance trends across all classes and daily fee collection updates to teacher performance metrics and upcoming academic milestones, the dashboard provides a comprehensive 360-degree view of the entire institution. This high-level visibility allows principals to shift from being reactive to proactive, identifying issues like a sudden dip in attendance in a specific grade or a lag in fee reconciliation before they become organizational crises. Beyond just simple data visualization, the system offers deep-dive capabilities, enabling leaders to drill down into specific class sections or individual student records with a single click. By automating the aggregation of data from various departments like finance, academics, and transport, we eliminate the need for time-consuming 'report-request' cycles that usually take days to fulfill. This gives principals back hours of their day to focus on what truly matters: improving pedagogical standards, mentoring faculty, and fostering a positive school culture. Whether managing a single local school or overseeing a complex network of multi-campus institutions, this centralized cockpit ensures that every strategic decision made is backed by accurate, up-to-the-minute information, resulting in a more disciplined and high-performing school environment.",
    icon: "LayoutDashboard",
    color: "bg-indigo-600",
    targetRole: "principal",
    problem: "Principals spend over 60% of their time chasing various department heads for reports on attendance, fee collections, and academic progress, leading to delayed decisions and a lack of real-time control.",
    solution: "A centralized command center that pulls live data from every module, providing instant insights through visual charts, automated alerts for anomalies, and one-click report generation for any school metric.",
    stats: "Save 12 hours/week",
    relatedFeatures: ["admin-dashboard", "school-reports-and-print-center", "audit-logs"],
    seoContent: [
      "Modern school leadership requires more than just pedagogical expertise; it demands data-driven management. Our ERP's principal dashboard is designed to bridge the gap between administrative data and strategic action, ensuring that school heads are always in the loop without being bogged down by clerical tasks.",
      "By implementing a centralized oversight system, schools can ensure higher accountability across departments. When data is transparent and accessible, it naturally improves the performance of staff and ensures that the school's growth goals are met with precision and clarity."
    ],
    screenshot: "/product-screens/admin/admin-dashboard.png"
  },
  {
    id: "uc-2",
    slug: "parent-engagement",
    title: "Building a Connected School Community",
    shortDescription: "Bridge the gap between home and school with a modern Parent App.",
    longDescription: "The relationship between parents and schools has historically been limited to quarterly Parent-Teacher Meetings (PTMs) and occasional printed notices that often end up lost in the bottom of a student's backpack. This communication gap often leads to parental anxiety, unnecessary visits to the school office, and a general lack of engagement with the child's daily academic journey. Our Parent Engagement use case centers on the deployment of a robust, user-centric mobile application that serves as a 24/7 digital window into the school. Parents no longer have to wonder if their child reached school safely or when the next fee installment is due. Real-time push notifications for attendance, instant delivery of digital circulars, and a dedicated academic calendar keep families informed and involved in every step. More importantly, this platform facilitates a structured and professional dialogue; parents can submit leave applications, view detailed exam performance, and even book appointments with teachers directly through the app without needing private phone numbers. By providing this level of transparency and accessibility, the school builds immense trust with its community. When a parent feels that the school is an open book, their satisfaction levels soar, leading to much better student retention and positive word-of-mouth in the neighborhood. Our system also includes a vernacular support feature, ensuring that language is never a barrier to participation for parents who prefer their local medium. This inclusive approach ensures that every family, regardless of their tech-savviness or background, can be an active participant in their child's education, resulting in a stronger, more supportive school ecosystem.",
    icon: "Heart",
    color: "bg-pink-600",
    targetRole: "parent",
    problem: "Disconnected parents often feel 'out of the loop' regarding their child's daily school life, leading to missed notices, late fee payments, and a general lack of trust in the school's administrative efficiency.",
    solution: "A feature-rich Parent App that delivers real-time updates on attendance, fees, homework, and notices, while allowing parents to interact with the school for leaves, feedback, and digital payments.",
    stats: "95% Parent Satisfaction",
    relatedFeatures: ["school-parent-communication-app", "school-circular-acknowledgement", "leave-management"],
    seoContent: [
      "Parent engagement is a critical factor in a student's success and a school's reputation. A digital-first communication strategy moves beyond simple SMS alerts to provide a comprehensive experience that involves parents in every milestone of their child's education.",
      "Transitioning to a structured app-based communication model also protects teacher privacy by eliminating the need for private WhatsApp groups. This creates a professional boundary while ensuring that every piece of information is delivered securely and can be traced for future reference."
    ],
    screenshot: "/product-screens/parent/parent-dashboard.png"
  },
  {
    id: "uc-3",
    slug: "fees-collection-and-defaulters",
    title: "Strategic Fee Collection & Revenue Assurance",
    shortDescription: "Eliminate revenue leakage and automate the chase for pending dues.",
    longDescription: "Revenue leakage and delayed fee collections are the silent killers of private school growth and sustainability. For many institutions, the manual process of identifying who hasn't paid and then following up with them through phone calls and letters is a logistical nightmare that takes up weeks of staff time every quarter. Our Strategic Fee Collection system is engineered to solve this by introducing automated intelligence into the school's finance department. The moment a fee becomes overdue, the system triggers a pre-set sequence of professional WhatsApp and SMS reminders to parents, complete with a direct payment link. This eliminates the 'forgetfulness' factor and makes it incredibly easy for parents to pay from the comfort of their homes or offices. For the administrative office, the system provides a real-time 'Defaulter Dashboard' where students are segmented based on their due amounts, class, and payment history. This allows the school to take targeted and fair actions, such as sending a specific notice to long-term defaulters or offering a flexible payment plan to those in genuine need. The integration with zero-transaction-cost UPI gateways further incentivizes on-time payments, as parents aren't penalized for choosing modern digital options. By closing the loop between identifying dues and realizing payments, schools often see a dramatic improvement in their cash flow within the first three months of implementation. This reclaimed revenue can then be reinvested into better academic infrastructure and educational resources, fueling a cycle of continuous improvement. The system also ensures that every transaction is audit-proof, removing the possibility of manual entry errors or unauthorized concessions, ensuring 100% financial integrity.",
    icon: "Wallet",
    color: "bg-emerald-600",
    targetRole: "admin",
    problem: "Schools lose up to 15% of their annual revenue due to untracked fee defaults and the high cost of manual follow-ups, leading to cash flow constraints during peak academic seasons.",
    solution: "Automated fee tracking with smart reminder sequences, a visual defaulter management dashboard, and integrated digital payment lanes that make fee realization effortless for both parents and staff.",
    stats: "Reduce Defaults by 42%",
    relatedFeatures: ["school-fee-management-software", "defaulter-list-management", "school-reports-and-print-center"],
    screenshot: "/product-screens/accountant/accountant-collections.png"
  },
  {
    id: "uc-4",
    slug: "reduce-whatsapp-chaos",
    title: "Professionalizing Parent-Teacher Communication",
    shortDescription: "Secure teacher privacy and organize school notices in a single thread.",
    longDescription: "In recent years, WhatsApp groups have become the default, yet most chaotic, method of school communication. While convenient for quick messages, these groups often spiral into a mess of 'Thank you' replies, unrelated discussions, and late-night queries that invade teachers' personal lives and cause significant burnout. More importantly, critical school circulars and homework assignments often get buried in the noise, leading to parents claiming they 'never saw the notice.' Our solution addresses this 'WhatsApp Chaos' by moving all formal communication to a structured, secure platform designed specifically for education. Teachers can broadcast notices, share photos of classroom activities, and post homework to a dedicated class feed where parents can see it clearly and refer back to it at any time. Crucially, the 'one-way' broadcast mode ensures that teachers aren't bombarded with repetitive replies, while still allowing for private, moderated one-on-one chats if necessary. This shift not only restores professional boundaries for the teaching staff but also ensures a permanent, searchable record of all school-parent interactions. For the principal, it provides a bird's-eye view of all communication going out from their school, ensuring that the tone and content remain consistent with the institution's values and professional standards. By replacing the 'wild west' of instant messaging with a professional hub, schools significantly reduce misunderstandings and foster a more disciplined and respectful community environment. Parents appreciate the organization, and teachers appreciate the regained peace of mind and the ability to disconnect after school hours.",
    icon: "MessageSquare",
    color: "bg-purple-600",
    targetRole: "teacher",
    problem: "Teachers are overwhelmed by 24/7 WhatsApp messages from parents, while important school notices are frequently missed by families amidst group chat clutter.",
    solution: "A structured communication feed within the school app that separates 'Official Notices' from 'Class Activities' and 'Homework', featuring read-receipts and scheduled broadcasting.",
    stats: "100% Notice Delivery",
    relatedFeatures: ["school-parent-communication-app", "school-circular-acknowledgement", "homework-tracker"],
    screenshot: "/product-screens/teacher/teacher-dashboard.png"
  },
  {
    id: "uc-5",
    slug: "attendance-and-absentee-followup",
    title: "Smart Attendance & Real-time Safety Alerts",
    shortDescription: "Upgrade from paper registers to instant, safety-first digital attendance.",
    longDescription: "The morning roll-call is a time-tested tradition, but in a world where student safety is paramount, the traditional paper register is dangerously slow and inefficient. If a student is absent, it might take hours before the front office manually collates registers and calls the parents—valuable time lost in an emergency. Our Smart Attendance system transforms this 10-minute clerical task into a 30-second digital breeze. Using the Teacher App, educators mark only the exceptions (the absentees) with a few taps on their smartphone. The second they hit 'Submit,' the system automatically cross-references the list and triggers an instant SMS or push notification to the parents of every absent student. This provides immediate peace of mind to parents, knowing their child is safe within the school walls, and alerts them instantly if a child has missed school without their knowledge. Beyond immediate safety, the system compiles this data into powerful long-term reports. Teachers can identify patterns of irregular attendance that might indicate a student is struggling academically or personally, allowing for early and effective intervention. For the school administration, it eliminates the need for manual data entry at the end of the month to calculate cumulative attendance for report cards or government records. The entire lifecycle—from the classroom tap to the final report card percentage—is automated, accurate, and audit-proof. This isn't just about saving time for teachers; it's about building a robust safety net around every student in your care.",
    icon: "UserCheck",
    color: "bg-blue-600",
    targetRole: "teacher",
    problem: "Manual attendance is slow and error-prone, but more importantly, parents of absent students are often notified too late in the day, creating a safety gap.",
    solution: "A mobile-first attendance module that allows teachers to mark absentees in seconds, triggering immediate automated alerts to parents and updating school records in real-time.",
    stats: "Safety Alerts in < 60s",
    relatedFeatures: ["school-attendance-management", "absentee-follow-up-system", "admin-dashboard"],
    screenshot: "/product-screens/teacher/teacher-attendance.png"
  },
  {
    id: "uc-6",
    slug: "admission-enquiry-to-admission",
    title: "Optimizing the Admission Conversion Funnel",
    shortDescription: "Turn more enquiries into enrollments with a professional CRM pipeline.",
    longDescription: "Admission season is the most critical time for any private school, yet many institutions still rely on handwritten registers or basic spreadsheets to track prospective students. This lack of structure leads to 'leaky' pipelines, where enquiries are made but never systematically followed up on. A parent who visits three different schools will likely choose the one that feels the most professional, responsive, and organized from the first point of contact. Our Admission CRM use case provides schools with a high-performance sales funnel designed specifically for educational institutions. Every walk-in, phone call, or website enquiry is logged into a central, visual pipeline. Administrative staff can categorize leads by their 'temperature' (Hot/Warm/Cold), assign follow-up tasks to specific clerks, and set automated reminders for school tours or demo classes. Instead of generic follow-ups, the system allows for personalized WhatsApp messaging, sending the school prospectus or a 'Thank you for visiting' video directly to the parent's phone. For the school management, a 'Conversion Dashboard' shows exactly where parents are dropping off—is it after the first call or after the interaction with the principal? This data-driven insight allows schools to refine their admission strategy and marketing spend in real-time. By providing a structured, responsive experience from the very first interaction, schools not only increase their enrollment numbers but also set a high standard of professionalism that positively influences the parent's perception of the school's overall academic quality and value.",
    icon: "TrendingUp",
    color: "bg-orange-600",
    targetRole: "admin",
    problem: "Schools lose up to 30% of potential admissions due to poor follow-up processes, lost enquiry forms, and a general lack of professionalism during the parent's first contact.",
    solution: "A dedicated Admission Pipeline CRM that tracks every lead from enquiry to enrollment, with automated follow-up reminders, digital form submissions, and conversion analytics.",
    stats: "+25% Enrollment Growth",
    relatedFeatures: ["school-admission-management", "enquiry-follow-up-pipeline", "school-reports-and-print-center"],
    screenshot: "/product-screens/admin/admin-students.png"
  },
  {
    id: "uc-7",
    slug: "report-cards-and-exam-results",
    title: "Automated Examination & Scholastic Reporting",
    shortDescription: "Generate professional report cards with zero data duplication.",
    longDescription: "The end of an exam cycle is traditionally the most stressful time for any teaching faculty. Calculating totals, determining percentages, applying complex grading scales, and manually writing out descriptive remarks for dozens of students is a Herculean task that often leads to errors and inconsistent reporting. Our Examination Management module takes the 'math' out of the teacher's hands and replaces it with an automated, board-compliant calculation engine. Teachers simply enter the marks once—either via their mobile app or a convenient web interface—and the system handles the rest. It automatically calculates grade points, identifies class toppers, and even generates class-wide performance graphs for internal analysis. The final output is a professional, high-quality PDF report card that can be customized to include the school's logo, branding, and even multi-lingual comments for vernacular medium schools. Beyond just printing cards, the system allows for a 'Results Reveal' on the Parent App, where parents can view their child's performance in a structured, visual format before the formal PTM. This transparency encourages more meaningful and data-backed discussions during parent-teacher meetings. For the school leadership, the system provides a bird's-eye view of academic progress across different subjects and classes, helping identify if a particular grade is struggling with a specific subject. By automating the scholastic reporting lifecycle, we allow teachers to spend less time on calculators and more time on classroom instruction and student mentorship.",
    icon: "FileCheck",
    color: "bg-cyan-600",
    targetRole: "teacher",
    problem: "Teachers spend weeks every term manually calculating exam results and filling out paper report cards, which is both exhausting and prone to calculation errors.",
    solution: "A centralized mark-entry system with automated calculation of CGPA/Percentages and 1-click generation of professional PDF report cards reachable via the Parent App.",
    stats: "Zero Calculation Errors",
    relatedFeatures: ["school-exam-management", "report-card-generator", "automated-grade-books"],
    screenshot: "/product-screens/teacher/teacher-dashboard.png"
  },
  {
    id: "uc-8",
    slug: "certificates-in-one-click",
    title: "Instant Document & Certificate Generation",
    shortDescription: "Generate TCs, Bonafides, and ID cards without digging through dusty files.",
    longDescription: "The school office is often treated as a document repository where parents come for Transfer Certificates (TCs), Bonafide certificates, or replacement ID cards. In many schools, this still involves a clerk digging through dusty horizontal files, manually typing out student details from registers, and then waiting for the Principal's signature. This 'manual-first' approach is not just slow; it's a major cause of parent frustration and office backlog. Our Certificate Engine use case digitizes this entire lifecycle to provide instant service. Since all student data is already securely stored in the ERP, generating a certificate is as simple as selecting a student and clicking a button. The system pulls the latest attendance, fee status, and academic records to populate the template automatically, ensuring 100% accuracy. To ensure authenticity, certificates can be generated with unique tracking numbers and even QR codes for quick verification by third parties or other schools. This is particularly useful for TCs, where the school needs to maintain a strict, sequential log for government inspections. For the parent, this means a process that once took three days now takes three minutes at the counter. The school office transforms from a source of delays into a model of modern efficiency. By automating these standard documents, the school ensures a consistent professional look for all its outgoing correspondence, reinforcing its brand as a tech-savvy and parent-friendly institution.",
    icon: "FileBadge",
    color: "bg-amber-600",
    targetRole: "admin",
    problem: "Parents face long wait times for basic documents like Bonafide certificates or TCs, while office staff waste hours cross-referencing files to find student details.",
    solution: "A robust template engine that pulls real-time student data to generate multi-format certificates instantly, with automated logging and sequential numbering for audit compliance.",
    stats: "3-Min Generation",
    relatedFeatures: ["school-reports-and-print-center", "transfer-certificate-manager", "id-card-generator"],
    screenshot: "/product-screens/admin/admin-students.png"
  },
  {
    id: "uc-9",
    slug: "office-reports-for-inspection",
    title: "Compliance-Ready Reporting for School Inspections",
    shortDescription: "Be ready for surprise inspections with automated, audit-proof registers.",
    longDescription: "Every school administrator knows the dread of a surprise government inspection or a periodic board audit. Typically, this leads to a week of 'all-hands-on-deck' chaos where staff stay back late to update attendance registers, fee books, and academic records to match the expected compliance standards. Our Office Reporting use case is specifically designed to keep you 'Inspection-Ready' every single day of the year. Because our ERP captures every transaction and daily attendance digitally at the source, generating an audit-compliant report is a matter of seconds, not days. Need a sequential Fee Collection Register for the last six months? A few clicks and it's ready. Need an authenticated Student Admission Register sorted by category, age, and gender? It's right there. The system maintains a complete 'Audit Trail'—meaning every change made to a student's file or a fee record is logged with a timestamp and the user ID of the staff member. This level of transparency is a huge asset during inspections, as it demonstrates the school's commitment to integrity, organization, and digital excellence. Beyond government compliance, these reports provide internal clarity for the management. Principals can run 'Health Checks' on their own data to ensure that administrative tasks are being performed correctly by the staff. By moving from 'Crisis Reporting' to 'Continuous Compliance,' school leaders can sleep easier and focus their energy on academic excellence rather than administrative firefighting.",
    icon: "ShieldCheck",
    color: "bg-slate-700",
    targetRole: "principal",
    problem: "Preparing for school inspections or audits usually requires days of manual labor to gather, verify, and print dusty registers and financial spreadsheets.",
    solution: "A dedicated compliance report center that generates government-standard registers and financial audit trails instantly, ensuring the school is always prepared for external reviews.",
    stats: "Audit Readiness: 100%",
    relatedFeatures: ["audit-logs", "school-reports-and-print-center", "admin-dashboard"],
    screenshot: "/product-screens/admin/admin-dashboard.png"
  },
  {
    id: "uc-10",
    slug: "fee-counter-for-school-office",
    title: "High-Speed Digital Fee Counter Operations",
    shortDescription: "Slash counter queues and provide instant, professional thermal receipts.",
    longDescription: "The fee counter is the most important 'face' of the school's finance department. During peak months like April or July, it often becomes a site of intense frustration with long queues, arguments over exact change, and the slow process of writing manual paper receipts. Our High-Speed Digital Fee Counter use case re-imagines this experience to be as smooth as a modern retail store. Using a high-performance, optimized interface, clerks can pull up a student's entire financial history by simply typing their name or admission number in less than two seconds. The system automatically calculates late fees, applies active discounts or scholarships, and shows exactly what is pending for the current month. Whether the parent pays by cash, cheque, or a dynamic QR code displayed directly on the clerk's screen, the transaction is recorded instantly. The final piece of the puzzle is the 'Thermal Receipt' integration. Instead of slow A4 printers or messy manual books, the system spits out a professional, sequential receipt in seconds. This not only speeds up the queue significantly but also provides an audit-proof trail that cannot be easily tampered with. At the end of the shift, the clerk doesn't have to spend an hour manually counting and reconciling; they simply run a 'Day Close' report which shows exactly how much cash, cheque, and UPI payments should be in the drawer. This level of institutional control eliminates 'lost' receipts and ensures that every rupee collected at the counter is accounted for in the school's records.",
    icon: "Banknote",
    color: "bg-teal-600",
    targetRole: "admin",
    problem: "Slow manual fee collection leads to long queues at the office counter, receipt errors, and the difficult daily task of manual cash reconciliation.",
    solution: "A retail-speed fee collection interface with barcode/ID lookup, automated late fee calculation, and instant thermal receipt printing with automated day-book closure.",
    stats: "80% Faster Queues",
    relatedFeatures: ["fee-receipt-software", "school-fee-management-software", "defaulter-list-management"],
    screenshot: "/product-screens/accountant/accountant-dashboard.png"
  },
  {
    id: "uc-11",
    slug: "multi-campus-management",
    title: "Centralized Control for Multi-Campus Institutions",
    shortDescription: "Standardize operations and finances across multiple school branches.",
    longDescription: "Managing a single school is hard enough; managing a growing chain of schools across different locations is exponentially harder. Different branches often develop their own 'way of doing things,' leading to inconsistent fee structures, fragmented academic standards, and a dangerous lack of centralized financial control. Our Multi-Campus Management use case provides the ultimate 'Control Tower' for school owners, directors, and trust members. From a single unified login, you can switch between different branches to see how Admission growth in Campus A compares to Campus B in real-time. You can standardize the fee structure and academic policies across all locations with a single master setting, while still allowing for necessary local variations such as specific bus routes or regional holidays. The system provides a 'Consolidated Finance Report' that aggregates collections from every campus, giving the management a true picture of the entire organization's financial health without having to wait for individual campus accountants to send their manual spreadsheets. Beyond finance, it ensures academic parity; lesson plans, resources, and exam papers created at the 'Head Office' can be pushed to all branches instantly. This standardization is key to building a strong and reliable school brand identity. Whether you have two schools in the same city or twenty across the state, this centralized approach ensures that the high standards you've set for your flagship institution are maintained everywhere, every day, without the need for constant physical travel.",
    icon: "Network",
    color: "bg-red-700",
    targetRole: "principal",
    problem: "Owners of multiple schools struggle with inconsistent data, decentralized financial records, and the inability to monitor branch performance in real-time.",
    solution: "A multi-tenant architecture that allows for centralized management of all school branches, featuring consolidated financial reports, branch-wise performance analytics, and global academic settings.",
    stats: "Single Source of Truth",
    relatedFeatures: ["admin-dashboard", "school-reports-and-print-center", "audit-logs"],
    screenshot: "/product-screens/admin/admin-dashboard.png"
  },
  {
    id: "uc-12",
    slug: "transport-safety-and-compliance",
    title: "Ensuring Student Safety in School Transport",
    shortDescription: "Track bus routes, manage driver compliance, and automate transport fees.",
    longDescription: "School transport is a high-responsibility department that is often managed with outdated paper registers and frantic phone calls to drivers during peak hours. Parents are naturally anxious about their child's daily commute, and school administrators struggle to keep track of which student is on which bus and whether their transport fees are paid. Our Transport Safety use case brings complete transparency and discipline to the school's fleet of vehicles. The system maintains a complete database of all routes, stops, and vehicles, including critical 'Compliance Tracking' for bus fitness certificates, insurance renewals, and driver license expiry. Parents can see their specific bus route and assigned stop within their app, significantly reducing 'where is the bus?' calls to the front desk. From a financial perspective, transport fees are integrated directly into the main fee module—meaning the system knows exactly who is using the bus and cross-references it with their fee payments automatically. No more 'free riders' or manual checking of bus lists by teachers. In the event of a delay or a route change due to traffic or weather, the school can send a targeted notification to only the parents of students on that specific bus, ensuring timely information without panicking the entire school. By digitizing transport management, you not only improve student safety and government compliance but also recover significant revenue that is often 'leaked' in manual transport management systems.",
    icon: "Bus",
    color: "bg-amber-700",
    targetRole: "admin",
    problem: "School transport is often a black box for management: manual stop tracking, unrecorded bus fee leakage, and constant anxiety from parents about their child's safety during transit.",
    solution: "An integrated transport management module that links student stops to fee records, tracks vehicle compliance (fitness/insurance), and provides route-specific communication for parents.",
    stats: "Zero Safety Lapses",
    relatedFeatures: ["school-bus-management-system", "admin-dashboard", "school-parent-communication-app"],
    screenshot: "/product-screens/admin/admin-dashboard.png"
  },
  {
    id: "uc-13",
    slug: "parent-trust-and-transparency",
    title: "Cultivating Trust through Financial Transparency",
    shortDescription: "Provide parents with a clear, honest view of their financial relationship.",
    longDescription: "Financial friction is often the root cause of long-standing parent-school disputes. When a parent doesn't understand why they are being charged a certain amount or can't see their previous payment history, trust in the institution begins to erode. Our Financial Transparency use case is designed to turn the school's finance department from a 'black box' into an open, honest bridge between the school and home. Through the Parent App, every single transaction—from the initial admission deposit to the smallest uniform or book purchase—is documented and immediately accessible. Parents can download their own official receipts at any time, see a clear breakdown of upcoming installments, and understand exactly how much 'Concession' or 'Scholarship' has been applied to their child's account. This 'Self-Service' approach eliminates thousands of repetitive and often defensive phone calls to the school office and makes parents feel respected and informed about their investment. More importantly, when a school provides this level of digital clarity, it projects an image of unwavering integrity. Parents are much more likely to pay on time and enthusiastically support other school initiatives when they feel the financial relationship is managed professionally, fairly, and transparently. We even include a 'Payment Request' feature where parents can see exactly why a particular one-time charge was added, complete with a descriptive note from the office. This is not just a billing system; it's a powerful trust-building engine that differentiates your school in a competitive market.",
    icon: "ShieldCheck",
    color: "bg-emerald-700",
    targetRole: "parent",
    problem: "Lack of clarity in fee structures and payment history often leads to heated disputes at the office and a general feeling of mistrust among the parent community.",
    solution: "A complete financial ledger for parents accessible via the app, featuring itemized billing, historical receipt downloads, and transparent breakdown of concessions and scholarships.",
    stats: "Zero Fee Disputes",
    relatedFeatures: ["school-fee-management-software", "fee-receipt-software", "school-parent-communication-app"],
    screenshot: "/product-screens/parent/parent-fees.png"
  },
  {
    id: "uc-14",
    slug: "teacher-time-saver-workflows",
    title: "Reclaiming Teacher Time for Academic Excellence",
    shortDescription: "Automate administrative chores so teachers can focus on teaching.",
    longDescription: "The average Indian school teacher currently spends nearly 30% of their working day on non-teaching tasks: marking attendance, writing homework in individual student diaries, manually calculating exam marks, and answering repetitive parent queries. This 'Administrative Burden' is the primary cause of teacher burnout and a gradual decline in educational quality across institutions. Our Teacher Time-Saver use case is a direct intervention to give that precious time back to the educators. By providing teachers with a powerful, mobile-first toolkit, we streamline these 'daily chores' into a few quick taps. Homework can be created once and pushed to the entire class app instantly. Attendance takes less than 30 seconds every morning. Marks entry happens on the fly during a free period without any complex spreadsheets. Even behavioral notes or 'Student of the Month' nominations can be logged instantly for future reference during PTMs. The result is a teacher who is less stressed, better organized, and much more present in the classroom. For the school management, this leads to higher teacher satisfaction, better parent-teacher relations, and significantly improved academic results, as educators can finally focus on their primary mission: teaching, mentoring, and inspiring students. Our workflows are designed to be 'Zero-Training' ready—accessible even to teachers who aren't naturally tech-savvy, ensuring that the benefit of automation is felt across the entire faculty within the first week of deployment.",
    icon: "Clock",
    color: "bg-sky-600",
    targetRole: "teacher",
    problem: "Teachers are burnt out by the double-burden of high teaching loads and excessive manual paperwork for attendance, homework logs, and reporting.",
    solution: "A streamlined Teacher App that automates administrative tasks, offering one-tap attendance, bulk digital homework distribution, and mobile-first marks entry that syncs with report cards.",
    stats: "2 Hours Saved Daily",
    relatedFeatures: ["school-attendance-management", "homework-tracker", "school-exam-management"],
    screenshot: "/product-screens/teacher/teacher-dashboard.png"
  }
];

