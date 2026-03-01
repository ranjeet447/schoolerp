export interface CaseStudyDetail {
  id: string;
  slug: string;
  title: string;
  schoolName: string;
  location: string;
  schoolType: 'K-12' | 'Higher Ed' | 'Multi-branch' | 'Residential';
  impactMetric: string;
  shortDescription: string;
  body: string;
  heroImage: string;
  stats: { label: string; value: string }[];
  relatedFeatures: string[];
  testimonial: { quote: string; author: string; role: string };
  category: 'Finance' | 'Safety' | 'Academics' | 'Governance';
}

export const CASE_STUDIES_DATA: CaseStudyDetail[] = [
  {
    id: "cs-1",
    slug: "heritage-schools-fee-modernization",
    title: "Modernizing Fee Collection at Heritage Schools",
    schoolName: "Heritage International School",
    location: "Pune, Maharashtra",
    schoolType: "K-12",
    impactMetric: "95% Collection Efficiency",
    shortDescription: "How a premier K-12 institution eliminated cash handling risks and achieved near-perfect fee collection within one academic cycle using automated workflows.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>Heritage International School, with over 2,500 students, faced significant hurdles in managing quarterly fee collections. The accounts department was overwhelmed by manual reconciliation of bank transfers, high volumes of cash and cheque handling, and the constant back-and-forth with parents regarding pending dues. Human error in ledger entries often led to disputes, and the school lacked real-time visibility into their projected cash flow.</p>
        
        <h3>The Solution</h3>
        <p>By implementing our <strong>Advanced Fee Management System</strong>, the school transitioned to a 100% digital collection model. We integrated zero-cost UPI and automated payment gateways, allowing parents to pay directly from their mobile devices. The system's automated reminder engine was configured to send professional WhatsApp alerts 5 days before the due date, on the due date, and immediately after for overdue payments. Crucially, the <strong>Tally Integration</strong> eliminated manual data entry by syncing every transaction directly into their accounting software.</p>
        
        <h3>The Result</h3>
        <p>Within the first six months, the school reported a 95% collection efficiency by the due date. The administrative workload related to fee reconciliation dropped from 80 man-hours per month to just 4 hours of oversight. Parents appreciated the transparency of digital receipts, and the school successfully reallocated its administrative staff to student welfare initiatives rather than chasing payments.</p>
      </section>
    `,
    heroImage: "/case-studies/heritage-schools-fee-modernization.png",
    stats: [
      { label: "Collection Rate", value: "95%" },
      { label: "Manual Effort Saved", value: "76 hrs/mo" },
      { label: "Data Accuracy", value: "100%" }
    ],
    relatedFeatures: ["fee-management-software", "digital-receipt-engine", "tally-export"],
    testimonial: {
      quote: "The transparency and automation provided by the platform have completely transformed our finance department's operations.",
      author: "Mr. Rajesh Deshpande",
      role: "Finance Director"
    },
    category: "Finance"
  },
  {
    id: "cs-2",
    slug: "st-marys-bus-tracking-safety",
    title: "Safety First: St. Mary's Co-Ed Bus Tracking Success",
    schoolName: "St. Mary's Co-Ed School",
    location: "Kochi, Kerala",
    schoolType: "K-12",
    impactMetric: "Zero Safety Incidents",
    shortDescription: "Integrating real-time GPS tracking and geofencing to ensure the safe transit of 1,200 students across 45 bus routes in urban Kochi.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>Operating in the high-traffic urban environment of Kochi, St. Mary's Co-Ed School struggled with parental anxiety regarding bus delays and student safety during transit. The school's transport office was flooded with \"Where is the bus?\" calls every afternoon, making it impossible to manage actual route emergencies or logistics effectively.</p>
        
        <h3>The Solution</h3>
        <p>We deployed our <strong>Transport Management System</strong> integrated with hardware-agnostic GPS tracking. The solution provided a dedicated interface for parents to see the live location of their child's bus and receive \"Bus Arriving\" alerts when it was within 2kms of their stop. For the school, we implemented geofencing alerts that notified the transport manager of any unauthorized route deviations or over-speeding incidents.</p>
        
        <h3>The Result</h3>
        <p>The immediate impact was a 90% reduction in inquiry calls to the transport office. More importantly, the school now maintains a perfect safety record with real-time speed monitoring and driver behavior analytics. The automated route optimization feature also helped the school reduce fuel consumption by 12% by identifying redundant stops.</p>
      </section>
    `,
    heroImage: "/case-studies/st-marys-bus-tracking-safety.png",
    stats: [
      { label: "Inquiry Calls Reduced", value: "90%" },
      { label: "Fuel Cost Savings", value: "12%" },
      { label: "Route Compliance", value: "100%" }
    ],
    relatedFeatures: ["transport-management", "parent-communication-app", "visitor-gate-pass"],
    testimonial: {
      quote: "Peace of mind for parents is our biggest achievement with this system. They know exactly where their children are at all times.",
      author: "Sr. Mary Joseph",
      role: "Principal"
    },
    category: "Safety"
  },
  {
    id: "cs-3",
    slug: "demo-international-scaling-erp",
    title: "Scaling to 5000+ Students: The Demo International Journey",
    schoolName: "Demo International Academy",
    location: "Bangalore, Karnataka",
    schoolType: "Multi-branch",
    impactMetric: "Admin Overhead Halved",
    shortDescription: "A three-year digital transformation story of how an ambitious academy expanded to three new campuses while centralizing its academic and administrative core.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>As Demo International Academy grew from a single campus to a multi-city network, they faced severe fragmentation. Each campus used separate systems for attendance and records, making it impossible for the central management to get a unified view of performance, attendance, or financial health.</p>
        
        <h3>The Solution</h3>
        <p>The academy adopted our multi-tenant <strong>Enterprise ERP Architecture</strong>. This allowed them to maintain individual campus settings while centralizing the <strong>Student Profile</strong> database. We implemented standardized academic reporting across all branches, ensuring that a progress report in the Bangalore South campus looked and functioned exactly like one in the East campus.</p>
        
        <h3>The Result</h3>
        <p>By centralizing governance, the academy was able to manage 5,000 students with an administrative team only slightly larger than what they had for 1,500 students. Real-time dashboards allowed the Chairman to monitor the performance of all three campuses simultaneously, leading to faster data-driven expansions into two more cities.</p>
      </section>
    `,
    heroImage: "/case-studies/demo-international-scaling-erp.png",
    stats: [
      { label: "Student Growth", value: "330%" },
      { label: "Admin-to-Student Ratio", value: "-45%" },
      { label: "Decision Speed", value: "Instant" }
    ],
    relatedFeatures: ["student-360", "audit-logs", "report-card-generator"],
    testimonial: {
      quote: "The ability to see the heartbeat of every campus from my tablet has changed how we grow our institution.",
      author: "Dr. Ananya Rao",
      role: "Founding Chairman"
    },
    category: "Governance"
  },
  {
    id: "cs-4",
    slug: "rural-hubs-multilingual-support",
    title: "Bridging Language Gaps in Rural Educational Hubs",
    schoolName: "Vikas Vidyalaya Rural Trust",
    location: "Satara, Maharashtra",
    schoolType: "K-12",
    impactMetric: "80% Parent Engagement",
    shortDescription: "Empowering a semi-urban community by delivering school updates and digital report cards in Marathi, overcoming the digital divide.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>Vikas Vidyalaya serves a community where Marathi is the primary language. While parents were eager to participate in their children's education, the standard English-only ERP solutions they previously tried felt alienating. Engagement on parent apps was below 10%, and most notices went unread.</p>
        
        <h3>The Solution</h3>
        <p>We localized the <strong>Parent Communication App</strong> and the <strong>WhatsApp Notifications</strong> module to support Marathi. Alerts for attendance, homework, and fee dues were sent in the local language. Additionally, we simplified the UI to prioritize visual icons for less tech-savvy parents, making the app highly accessible.</p>
        
        <h3>The Result</h3>
        <p>Engagement skyrocketed to 80% within a single term. For the first time, parents were actively replying to homework prompts and using digital payment links without needing assistance. The school successfully bridged the language gap, fostering a more inclusive and supportive school-parent relationship in a rural setting.</p>
      </section>
    `,
    heroImage: "/case-studies/rural-hubs-multilingual-support.png",
    stats: [
      { label: "App Engagement", value: "80%" },
      { label: "Notice Read Rate", value: "92%" },
      { label: "Support Queries", value: "-60%" }
    ],
    relatedFeatures: ["whatsapp-notifications", "parent-communication-app", "homework-and-diary"],
    testimonial: {
      quote: "Sending messages in Marathi changed everything. Parents finally feel they are part of the school community.",
      author: "Mr. Sunil Kadam",
      role: "Administrative Head"
    },
    category: "Academics"
  },
  {
    id: "cs-5",
    slug: "trust-groups-centralized-governance",
    title: "Multi-Branch Centralized Governance for Trust Groups",
    schoolName: "Global Education Trust",
    location: "Ahmedabad, Gujarat",
    schoolType: "Multi-branch",
    impactMetric: "100% Data Transparency",
    shortDescription: "Unifying 5 schools under one Trust with a centralized audit and monitoring hub to ensure administrative consistency and financial integrity.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>Global Education Trust managed five different schools as separate entities, leading to inconsistent fee structures, varied academic standards, and a lack of transparency in procurement and staff attendance. There was no way to compare performance metrics across schools for internal benchmarking.</p>
        
        <h3>The Solution</h3>
        <p>We implemented a centralized <strong>Governance Hub</strong> with a master <strong>Audit Log</strong> system. This allowed the Trust's head office to set global policies for fee collection, staff leave, and academic grading that were automatically applied to all five branches. Every sensitive transaction across any branch required a multi-level approval through the system.</p>
        
        <h3>The Result</h3>
        <p>The Trust achieved 100% transparency in their financial operations. They could now identify which branch was falling behind in collections or academic targets and provide targeted support. The centralized procurement feature also allowed them to save 15% on bulk inventory costs for all five schools.</p>
      </section>
    `,
    heroImage: "/case-studies/trust-groups-centralized-governance.png",
    stats: [
      { label: "Procurement Savings", value: "15%" },
      { label: "Policy Compliance", value: "100%" },
      { label: "Audit Time", value: "-70%" }
    ],
    relatedFeatures: ["audit-logs", "staff-attendance-hrms", "inventory-and-asset-tracking"],
    testimonial: {
      quote: "Standardizing our operations through a single platform has made management much more scientific and far less stressful.",
      author: "Dr. Bhavin Patel",
      role: "Trust Secretary"
    },
    category: "Governance"
  },
  {
    id: "cs-6",
    slug: "greenwood-high-parent-engagement",
    title: "Transforming Parent Engagement at Greenwood High",
    schoolName: "Greenwood High School",
    location: "Gurugram, Haryana",
    schoolType: "K-12",
    impactMetric: "70% Less Inquiry Calls",
    shortDescription: "How a high-tech school in Gurugram moved from 50+ WhatsApp groups to a single, professional communication thread.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>Greenwood High suffered from \"WhatsApp Fatigue.\" Each class had multiple informal groups where important notices were lost in a sea of parents' \"Good morning\" messages and repetitive queries. Teachers were being contacted on their personal numbers late at night, leading to significant burnout and privacy concerns.</p>
        
        <h3>The Solution</h3>
        <p>The school mandated the use of the <strong>Parent Communication App</strong> for all official updates. We mapped every student to their respective class and house feeds. Official circulars were sent with \"Confirmation of Receipt\" requirements, allowing the administration to track who hadn't seen important updates and follow up only with them.</p>
        
        <h3>The Result</h3>
        <p>The switch restored the teachers' work-life balance immediately. Administrative inquiry calls dropped by 70% as parents could find everything—from the canteen menu to the holiday list—inside the app. Student attendance at school events also saw a 25% uptick due to more effective notification scheduling.</p>
      </section>
    `,
    heroImage: "/case-studies/greenwood-high-parent-engagement.png",
    stats: [
      { label: "Inquiry Reduction", value: "70%" },
      { label: "Teacher Satisfaction", value: "4.9/5" },
      { label: "Event Attendance", value: "+25%" }
    ],
    relatedFeatures: ["parent-communication-app", "whatsapp-notifications", "homework-and-diary"],
    testimonial: {
      quote: "Moving away from WhatsApp groups was the best decision for our teachers' mental health and our professional image.",
      author: "Ms. Shalini Juneja",
      role: "Principal"
    },
    category: "Governance"
  },
  {
    id: "cs-7",
    slug: "st-xaviers-exam-automation",
    title: "Exam Automation: How St. Xavier's Processed Results 90% Faster",
    schoolName: "St. Xavier's Secondary School",
    location: "Kolkata, West Bengal",
    schoolType: "K-12",
    impactMetric: "90% Faster Results",
    shortDescription: "Eliminating the end-of-term calculation nightmare for a 3,000-student school using an automated grading engine.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>At St. Xavier's, the window between final exams and report card distribution was a period of extreme stress. Teachers spent days manually calculating averages, weightages for term-1 vs term-2, and percentile ranks for over 3,000 students. Errors were common, and re-printing report cards was a costly affair.</p>
        
        <h3>The Solution</h3>
        <p>We implemented the <strong>Grading and Exams</strong> module and the <strong>Report Card Generator</strong>. Teachers now enter marks directly into the system or via Excel uploads. The custom rule engine handles complex weightage calculations for CBSE and ICSE formats instantly. We also integrated the <strong>Online Exam Platform</strong> for periodic assessments, which automatically syncs marks to the final ledger.</p>
        
        <h3>The Result</h3>
        <p>The school now generates 100% accurate report cards for the entire school in just 48 hours after the last exam—a process that previously took 3 weeks. The digital distribution of report cards via the parent portal also saved the school over 15,000 sheets of high-quality paper per year.</p>
      </section>
    `,
    heroImage: "/case-studies/st-xaviers-exam-automation.png",
    stats: [
      { label: "Processing Time", value: "48 hrs" },
      { label: "Calculation Errors", value: "Zero" },
      { label: "Paper Saved", value: "15k Sheets" }
    ],
    relatedFeatures: ["grading-and-exams", "report-card-generator", "online-exam-platform"],
    testimonial: {
      quote: "What used to be a three-week manual nightmare now happens in a click. Our teachers are finally free from clerical work.",
      author: "Fr. Thomas D'Souza",
      role: "Administrator"
    },
    category: "Academics"
  },
  {
    id: "cs-8",
    slug: "admission-crm-enquiry-growth",
    title: "Admission CRM Success: 200% Growth in Enquiries realized",
    schoolName: "Emerald Heights Global School",
    location: "Indore, Madhya Pradesh",
    schoolType: "K-12",
    impactMetric: "200% Enquiry Growth",
    shortDescription: "Turning every website visitor and walk-in enquiry into a potential enrollment using a proactive admission pipeline.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>Emerald Heights was losing nearly 40% of their prospective leads due to a lack of follow-up. Admission enquiries were recorded in paper registers at the front desk, and there was no system to track whether a parent had visited the campus or paid the registration fee. The marketing budget was being spent without any clear ROI data.</p>
        
        <h3>The Solution</h3>
        <p>The school adopted our <strong>Admission Enquiry Pipeline</strong>. Every enquiry from the <strong>School Website Builder</strong> was automatically captured in a CRM. The admission team received daily \"Task Lists\" for follow-up calls, and parents received automated welcome brochures on WhatsApp. The system also integrated an online registration fee payment link to secure interests immediately.</p>
        
        <h3>The Result</h3>
        <p>The school saw a 200% increase in processed enquiries and a 35% jump in actual admissions in the following session. The management now has a crystal clear \"Funnel Report\" showing exactly which sources (Facebook, Walk-ins, Website) provide the highest quality student leads.</p>
      </section>
    `,
    heroImage: "/case-studies/admission-crm-enquiry-growth.png",
    stats: [
      { label: "Enquiry Volume", value: "+200%" },
      { label: "Conversion Rate", value: "+35%" },
      { label: "Marketing ROI", value: "Trackable" }
    ],
    relatedFeatures: ["admission-enquiry-pipeline", "school-website-builder", "whatsapp-notifications"],
    testimonial: {
      quote: "We no longer wonder where our next student is coming from. The CRM has made our admissions professional and predictable.",
      author: "Mrs. Vineeta Singh",
      role: "Admissions Head"
    },
    category: "Finance"
  },
  {
    id: "cs-9",
    slug: "doon-valley-hostel-inventory",
    title: "Residential Excellence: Hostel & Inventory Control at Doon Valley",
    schoolName: "Doon Valley Residential School",
    location: "Dehradun, Uttarakhand",
    schoolType: "Residential",
    impactMetric: "₹15L Inventory Saved",
    shortDescription: "Optimizing the complex logistics of a residential school—from room allocations to mess inventory and laundry tracking.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>Managing a residential school involves more than just academics. Doon Valley struggled with huge leaks in mess inventory, unaccountable assets (bedding, furniture), and manual gate-pass management for students leaving for the weekend. The inventory costs were spiraling without clear tracking of consumption vs. procurement.</p>
        
        <h3>The Solution</h3>
        <p>We deployed a specialized <strong>Inventory and Asset Tracking</strong> module linked to their <strong>Hostel Management</strong> dashboard. Mess supplies were tracked using a FIFO (First-In-First-Out) digital ledger, and every student was assigned their assets via QR codes. We also implemented a digital <strong>Visitor Gate Pass</strong> for students, requiring remote mobile approval from parents before any student could leave the premises.</p>
        
        <h3>The Result</h3>
        <p>The school realized a direct saving of ₹15 Lakhs in the first year through better inventory control and the elimination of mess wastage. Safety levels reached an all-time high with the digital gate-pass system, and the management can now track the lifecycle of every chair and laptop in the institution.</p>
      </section>
    `,
    heroImage: "/case-studies/doon-valley-hostel-inventory.png",
    stats: [
      { label: "Inventory Savings", value: "₹15L/yr" },
      { label: "Asset Loss", value: "Zero" },
      { label: "Security Approval", value: "< 5 mins" }
    ],
    relatedFeatures: ["inventory-and-asset-tracking", "visitor-gate-pass", "student-360"],
    testimonial: {
      quote: "Managing a hostel used to be a logistical nightmare. This platform has given us control over every grain in the mess and every child at the gate.",
      author: "Col. Vikram Rathore",
      role: "Warden & Admin"
    },
    category: "Governance"
  },
  {
    id: "cs-10",
    slug: "catholic-trust-tally-integration",
    title: "Tally Integration: Zero Manual Data Entry for Catholic Education Trust",
    schoolName: "Catholic Education Trust",
    location: "Mangalore, Karnataka",
    schoolType: "Multi-branch",
    impactMetric: "Zero Data Entry Errors",
    shortDescription: "Bridging the gap between school administrative records and financial accounting software for error-free audits.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>The Catholic Education Trust, managing 12 institutions, faced massive delays during annual audits. The accounts team had to manually re-enter thousands of fee collection records from their old ERP into Tally ERP 9. This double-entry often led to discrepancies, missing entries, and significant stress during the financial year-end.</p>
        
        <h3>The Solution</h3>
        <p>We specialized their deployment with our <strong>Tally Export</strong> module. This bridge allows the school accountant to map school fee heads (Tuition, Lab, Sports) directly to Tally ledgers. With a single click, the entire day's collections, categorized by payment mode and head, are exported as a XML file ready for Tally import.</p>
        
        <h3>The Result</h3>
        <p>Manual data entry was completely eliminated. The Trust's audits, which previously took a month of back-and-forth, are now completed in less than a week. The finance team now enjoys perfect synchronization between the bank, the school records, and the final accounts ledger.</p>
      </section>
    `,
    heroImage: "/case-studies/catholic-trust-tally-integration.png",
    stats: [
      { label: "Data Entry Hours", value: "Zero" },
      { label: "Audit Readiness", value: "100%" },
      { label: "Discrepancy Rate", value: "0%" }
    ],
    relatedFeatures: ["tally-export", "fee-management-software", "audit-logs"],
    testimonial: {
      quote: "Our accountants are no longer data entry clerks. They are now financial analysts for the trust.",
      author: "Fr. Joachim Saldanha",
      role: "Financial Secretary"
    },
    category: "Finance"
  },
  {
    id: "cs-11",
    slug: "govt-model-biometric-attendance",
    title: "Biometric Attendance: Eliminating Proxy Attendance at Govt. Model Schools",
    schoolName: "Govt. Model Senior Secondary School",
    location: "Chandigarh (UT)",
    schoolType: "K-12",
    impactMetric: "99% Attendance Accuracy",
    shortDescription: "Modernizing a government institution with facial recognition attendance for staff and students to ensure strict discipline.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>Govt. Model Schools periodically faced issues with 'proxy' attendance and irregular staff timings. Manual registers were often manipulated, and for the department, there was no way to get a real-time count of students present on any given day for mid-day meal planning or safety monitoring.</p>
        
        <h3>The Solution</h3>
        <p>We integrated our <strong>Staff Attendance HRMS</strong> and student attendance with AI-powered facial recognition devices. Unlike thumb-prints which can be bypassed or fail due to wear, facial recognition provided a touchless and foolproof method. The data synced in real-time to the <strong>Admin Dashboard</strong> and triggered an SMS to parents for every student marked present.</p>
        
        <h3>The Result</h3>
        <p>Discipline improved remarkably. Staff punctuality increased by 40% within the first month. The government now has 100% accurate data for meal planning, reducing wastage by 15%, and parents feel much more confident about the school's modernized approach toward student safety.</p>
      </section>
    `,
    heroImage: "/case-studies/govt-model-biometric-attendance.png",
    stats: [
      { label: "Staff Punctuality", value: "+40%" },
      { label: "Meal Wastage", value: "-15%" },
      { label: "Faking Attendance", value: "Impossible" }
    ],
    relatedFeatures: ["staff-attendance-hrms", "attendance-management", "admin-dashboard"],
    testimonial: {
      quote: "Technology has brought a level of transparency and discipline that manual registers could never achieve.",
      author: "Mr. Satish Kumar",
      role: "District Education Officer"
    },
    category: "Safety"
  },
  {
    id: "cs-12",
    slug: "dps-digital-report-cards",
    title: "Digital Report Cards: Moving Beyond Paper at Delhi Public Schools",
    schoolName: "Delhi Public School, Rohini",
    location: "New Delhi",
    schoolType: "K-12",
    impactMetric: "2 tons Paper Saved",
    shortDescription: "A sustainability-focused initiative to digitize progress reports for 4,000+ students, reducing costs and environmental impact.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>DPS Rohini, a massive campus with over 4,000 students, spent significant sums on printing high-gloss report cards twice a year. More than the cost, the school wanted to reduce its carbon footprint and eliminate the logistical chaos of handing over physical reports during PTMs, which often led to long queues and misplaced documents.</p>
        
        <h3>The Solution</h3>
        <p>The school transitioned to 100% <strong>Digital Report Cards</strong>. Using our <strong>Report Card Generator</strong>, they designed a multi-page, high-fidelity PDF that included graphs of student progress over the year. These were released digitally on a secure parent portal at a scheduled time. We added a \"Digital Signature\" feature for the Principal to ensure authenticity.</p>
        
        <h3>The Result</h3>
        <p>The school saved approximately 2 tons of paper annually. PTMs became more focused on the child's growth rather than document collection. Parents loved the interactive charts in the digital reports, which allowed them to compare their child's performance against the class average without compromising privacy.</p>
      </section>
    `,
    heroImage: "/case-studies/dps-digital-report-cards.png",
    stats: [
      { label: "Paper Saved", value: "2,000 kg" },
      { label: "Printing Costs", value: "₹4L Saved" },
      { label: "Instant Delivery", value: "100%" }
    ],
    relatedFeatures: ["report-card-generator", "grading-and-exams", "parent-communication-app"],
    testimonial: {
      quote: "Going green with digital report cards was not just an environmental choice, but an administrative masterstroke.",
      author: "Mrs. Harshita Gupta",
      role: "Vice Principal"
    },
    category: "Academics"
  },
  {
    id: "cs-13",
    slug: "whatsapp-integration-communication",
    title: "WhatsApp Integration: Realigning School-Parent Communication",
    schoolName: "Bright Future Academy",
    location: "Lucknow, Uttar Pradesh",
    schoolType: "K-12",
    impactMetric: "4.8/5 Parent Rating",
    shortDescription: "Leveraging the most used app in India for formal school notifications, homework, and fee reminders without the group chat chaos.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>Bright Future Academy realized that while they had an ERP app, many parents didn't check it daily, leading to missed notices. However, almost every parent was active on WhatsApp. The school tried using standard broadcast lists, but it was manual, hard to manage, and messages often didn't deliver if the school's number wasn't saved by the parent.</p>
        
        <h3>The Solution</h3>
        <p>We implemented our official <strong>WhatsApp Business API Integration</strong>. Now, the ERP automatically sends critical \"high-signal\" alerts—like attendance, fee receipts, and school bus locations—directly to the parent's WhatsApp. For non-urgent items like newsletters, our system uses the <strong>Parent Communication App</strong> to avoid spamming.</p>
        
        <h3>The Result</h3>
        <p>The \"message seen\" rate jumped to 98% within 10 minutes of sending. Parents gave the school a 4.8/5 rating in the annual survey specifically for their communication. The school also saw a 30% faster recovery of overdue fees because the payment links were right there in the parent's chat thread.</p>
      </section>
    `,
    heroImage: "/case-studies/whatsapp-integration-communication.png",
    stats: [
      { label: "Message Open Rate", value: "98%" },
      { label: "Fee Recovery", value: "30% Faster" },
      { label: "Parent NPS", value: "72" }
    ],
    relatedFeatures: ["whatsapp-notifications", "parent-communication-app", "fee-management-software"],
    testimonial: {
      quote: "Communicating with parents where they already are has changed the dynamic from friction to partnership.",
      author: "Mr. Amit Tiwari",
      role: "Founder"
    },
    category: "Academics"
  },
  {
    id: "cs-14",
    slug: "alumni-records-cloud-migration",
    title: "Cloud Migration: Securing 10 Years of Records for Alumni Networks",
    schoolName: "St. Peters Alumni Association",
    location: "Chennai, Tamil Nadu",
    schoolType: "Higher Ed",
    impactMetric: "100% Data Security",
    shortDescription: "Digitizing and securing a decade of academic records from physical files to an encrypted cloud vault for instant verification.",
    body: `
      <section>
        <h3>The Challenge</h3>
        <p>St. Peters, a historical institution, was drowning in paper files. Alumni frequently requested duplicate marksheets or background checks from employers, a process that took the school weeks to retrieve from dusty archives. There was also a constant risk of damage due to moisture or fire in the storage room.</p>
        
        <h3>The Solution</h3>
        <p>We executed a massive data migration project. Using our <strong>Student Profile</strong> framework, we digitized 10 years of records. Each record was tagged with a unique <strong>ID Card Generator</strong> ID and uploaded to an encrypted AWS cloud vault. We then provided a secure 'Alumni Portal' where former students could request verified digital transcripts.</p>
        
        <h3>The Result</h3>
        <p>The school reclaimed 800 sq. ft. of storage space. Background verification requests are now handled in 24 hours instead of 14 days. This project not only secured the institution's history but also built a powerful foundation for a vibrant, engaged alumni network that now actively contributes to school development.</p>
      </section>
    `,
    heroImage: "/case-studies/alumni-records-cloud-migration.png",
    stats: [
      { label: "Records Digitized", value: "25k+" },
      { label: "Retrieval Time", value: "< 1 min" },
      { label: "Storage Space Freed", value: "800 sq ft" }
    ],
    relatedFeatures: ["student-360", "id-card-generator", "audit-logs"],
    testimonial: {
      quote: "Our past is now our strength. Securing these records has modernized our legacy.",
      author: "Dr. Geeta Ramachandran",
      role: "Registrar"
    },
    category: "Governance"
  }
];
