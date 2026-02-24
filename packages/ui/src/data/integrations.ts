export interface Integration {
  id: string;
  slug: string;
  name: string;
  category: 'Payments' | 'Communication' | 'Hardware' | 'LMS' | 'Cloud' | 'Accounting';
  iconName: string;
  shortDescription: string;
  longDescription: string;
  logoUrl: string;
  features: string[];
  benefit: string;
  setupTime: string;
  compliance: string[];
  relatedSlugs: string[];
}

export const INTEGRATIONS_DATA: Integration[] = [
  {
    id: "int-razorpay",
    slug: "razorpay",
    name: "Razorpay",
    category: "Payments",
    iconName: "CreditCard",
    shortDescription: "Enable seamless fee collection with India's leading payment gateway. Support UPI, cards, and netbanking with automated reconciliation.",
    longDescription: `
      <section>
        <p>Integrating <strong>Razorpay</strong> with your School ERP transforms the challenging task of fee collection into a streamlined, automated process. As India's leading payments solution, Razorpay provides a robust infrastructure that supports over 100+ payment methods, including UPI, NEFT, RTGS, Credit/Debit Cards, and popular Wallets. This integration ensures that parents can pay school fees from the comfort of their homes using their preferred methods, significantly improving the school's liquidity and collection cycles.</p>
        
        <h3>Key Benefits for Educational Institutions</h3>
        <p>The primary advantage of this integration is <strong>automated reconciliation</strong>. Gone are the days of manually matching bank statements with student records. Every transaction performed through the Razorpay gateway is instantly updated in the School ERP's financial ledger, generating digital receipts for parents and real-time reports for the administration. Furthermore, the integration supports 'Smart Collect' for virtual account creation, allowing schools to track bank transfers (IMPS/NEFT) with the same precision as online gateway payments.</p>
        
        <h3>Seamless Setup and Experience</h3>
        <p>Setting up Razorpay within the ERP takes less than 24 hours once the KYC is verified. The system supports <em>split payments</em>, which is particularly useful for schools that need to route different fee heads (like transport or mess fees) into separate bank accounts. With industry-leading success rates and a mobile-first checkout experience, the Razorpay integration reduces the administrative overhead of fee management by up to 70%, allowing your staff to focus on academic excellence rather than payment follow-ups.</p>
        
        <h3>Advanced Security Standards</h3>
        <p>Security is paramount in financial transactions. This integration utilizes Razorpay's PCI-DSS compliant infrastructure, ensuring that sensitive payment data never touches your school's local servers. With built-in fraud detection and secure 128-bit encryption, both the institution and the parents can transact with complete peace of mind.</p>
      </section>
    `,
    logoUrl: "/integration-logos/razorpay.png",
    features: [
      "100+ Payment Modes (UPI, Cards, Netbanking)",
      "Instant Digital Receipt Generation",
      "Automated Fee Reconciliation & Ledgers",
      "Smart Collect for Virtual Bank Accounts",
      "Subscription/EMI Options for Parents"
    ],
    benefit: "Improves cash flow by reducing manual follow-ups and automating reconciliation.",
    setupTime: "24 Hours",
    compliance: ["PCI-DSS", "ISO 27001", "SOC2"],
    relatedSlugs: ["stripe", "tally-prime", "zoho-books"]
  },
  {
    id: "int-stripe",
    slug: "stripe",
    name: "Stripe",
    category: "Payments",
    iconName: "CreditCard",
    shortDescription: "Global payment infrastructure for international schools. Accept payments in 135+ currencies with advanced fraud protection.",
    longDescription: `
      <section>
        <p>For international schools and educational institutions with a global footprint, the <strong>Stripe integration</strong> offers an unparalleled financial infrastructure. Stripe is designed for scale and security, enabling schools to accept fee payments from parents worldwide in over 135 currencies. Whether it is tuition fees, application charges, or alumni donations, Stripe provides a sophisticated checkout experience that adapts to the user's location and device, ensuring maximum conversion and convenience.</p>
        
        <h3>Global Reach with Local Precision</h3>
        <p>The integration leverages Stripe's 'Checkout' and 'Elements' technology to provide a localized experience for parents, regardless of where they are in the world. It automatically supports local payment methods like iDEAL, SEPA, and Alipay, alongside traditional card networks. For the school's finance team, Stripe provides a unified dashboard within the ERP to manage refunds, disputes, and financial reporting across multiple regions, making it the ideal choice for multi-country school chains.</p>
        
        <h3>Automated Revenue Recognition</h3>
        <p>One of the standout features of this integration is its ability to handle complex billing cycles. Schools can set up recurring billing for monthly tuition or one-time charges for extracurricular activities. Stripe's advanced reporting engine feeds directly into the ERP's accounting module, facilitating accurate <strong>revenue recognition</strong> and financial planning. The integration also supports Stripe Radar, an AI-powered fraud detection system that identifies and blocks high-risk transactions before they happen.</p>
        
        <h3>Compliance and Global Standards</h3>
        <p>Operating a school requires adherence to strict financial regulations. Stripe simplifies this by handling the heavy lifting of PCI compliance and global tax regulations (like VAT or GST calculations). By integrating Stripe, your institution inherits a world-class security posture that protects both student data and financial integrity.</p>
      </section>
    `,
    logoUrl: "/integration-logos/stripe.png",
    features: [
      "Multi-currency Support (135+ Currencies)",
      "AI-Powered Fraud Detection (Stripe Radar)",
      "Recurring Billing for Tuition Fees",
      "Global Compliance (PCI-DSS Level 1)",
      "Comprehensive Financial Reporting API"
    ],
    benefit: "Perfect for international schools requiring global payment acceptance and security.",
    setupTime: "48 Hours",
    compliance: ["PCI-DSS", "GDPR", "SOC1", "SOC2"],
    relatedSlugs: ["razorpay", "aws-s3", "microsoft-365"]
  },
  {
    id: "int-twilio",
    slug: "twilio",
    name: "Twilio",
    category: "Communication",
    iconName: "MessageSquare",
    shortDescription: "Power your school's communication with Twilio's reliable SMS and WhatsApp API. Automate alerts for attendance and emergencies.",
    longDescription: `
      <section>
        <p>The <strong>Twilio integration</strong> brings enterprise-grade communication capabilities to your School ERP. In an era where timely information can make a significant difference, Twilio provides a reliable backbone for sending SMS, WhatsApp messages, and voice alerts to parents, students, and staff. Whether it's a daily attendance notification, an urgent weather-related school closure, or a personalized fee reminder, Twilio ensures that your messages reach the intended recipient instantly, anywhere in the world.</p>
        
        <h3>Intelligent Multi-Channel Alerts</h3>
        <p>By connecting Twilio's programmable messaging API with our ERP, schools can create <strong>automated workflows</strong>. For instance, when a teacher marks a student as 'absent' in the morning, the system can automatically trigger a SMS or WhatsApp message to the parent's registered mobile number. This real-time visibility enhances student safety and keeps parents engaged without requiring any manual intervention from the administration office.</p>
        
        <h3>High Deliverability and Global Scale</h3>
        <p>Standard SMS gateways often struggle with deliverability issues and carrier blocks. Twilio overcomes this with its global 'Super Network', ensuring high delivery rates even across borders. The integration also supports <em>two-way communication</em>, allowing schools to receive replies from parents—such as leave requests or acknowledgement of notices—directly into the ERP's unified inbox. This creates a documented thread of communication that is invaluable for record-keeping and audits.</p>
        
        <h3>Developer-Friendly and Scalable</h3>
        <p>Twilio's infrastructure is built for scale. As your school grows from a single campus to multiple branches, the integration scales with you. It supports advanced features like message templates for WhatsApp, ensuring compliance with platform policies while providing a rich media experience (including images and PDFs) for school newsletters and report cards.</p>
      </section>
    `,
    logoUrl: "/integration-logos/twilio.png",
    features: [
      "Automated SMS & WhatsApp Notifications",
      "Two-way Messaging for Leave Requests",
      "Emergency Voice Broadcast System",
      "Delivery Status Tracking & Analytics",
      "Rich Media Support (Images/PDFs)"
    ],
    benefit: "Ensures 100% reach for critical school alerts and attendance notifications.",
    setupTime: "1 Hour",
    compliance: ["HIPAA (for health alerts)", "GDPR", "ISO 27001"],
    relatedSlugs: ["whatsapp-business", "firebase", "zoom"]
  },
  {
    id: "int-zoom",
    slug: "zoom",
    name: "Zoom",
    category: "LMS",
    iconName: "Video",
    shortDescription: "Integrate video conferencing directly into your academic calendar. Host online classes, webinars, and parent-teacher meetings.",
    longDescription: `
      <section>
        <p>The <strong>Zoom integration</strong> for School ERP seamlessly bridges the gap between physical and digital classrooms. In the modern educational landscape, the ability to conduct high-quality video sessions is essential. This integration allows teachers to schedule, launch, and manage Zoom meetings directly from within the school's Learning Management System (LMS) or academic module. Students and parents can join sessions with a single click, eliminating the need to share links via insecure chat apps or emails.</p>
        
        <h3>Automated Academic Workflows</h3>
        <p>When a teacher creates a timetable entry for an online class, the ERP automatically generates a secure Zoom meeting ID and passcode. These details are instantly reflected in the student's personal calendar and dashboard. One of the most powerful features is <strong>automated attendance tracking</strong>. The system automatically records which students joined the session and for how long, syncing this data back to the central attendance register for administrative oversight.</p>
        
        <h3>Enhanced Virtual Learning Experiences</h3>
        <p>Beyond standard classes, the Zoom integration supports large-scale webinars for school events and private virtual rooms for Parent-Teacher Meetings (PTM). Teachers can use advanced features like breakout rooms, screen sharing, and interactive whiteboards, all while the ERP manages the recording storage. Sessions can be automatically recorded and uploaded to the student portal for later review, creating a valuable repository of learning materials accessible at any time.</p>
        
        <h3>Security and Room Management</h3>
        <p>To prevent 'Zoom-bombing' and ensure a safe learning environment, the integration leverages Zoom’s security features like 'Waiting Rooms' and 'End-to-End Encryption'. Only authorized students logged into the ERP can access the meeting links, providing a controlled and secure digital environment for minors.</p>
      </section>
    `,
    logoUrl: "/integration-logos/zoom.png",
    features: [
      "Direct Timetable-to-Meeting Link Sync",
      "Automated Participant Attendance Reports",
      "Secure Waiting Rooms & Single Sign-On",
      "Cloud Recording Sync to Student Portal",
      "Breakout Rooms for Collaborative Learning"
    ],
    benefit: "Simplifies hybrid learning with automated scheduling and attendance tracking.",
    setupTime: "30 Minutes",
    compliance: ["FERPA", "COPPA", "GDPR"],
    relatedSlugs: ["google-workspace", "moodle", "canvas-lms"]
  },
  {
    id: "int-google-workspace",
    slug: "google-workspace",
    name: "Google Workspace",
    category: "Cloud",
    iconName: "Cloud",
    shortDescription: "Sync school emails, drive documents, and classroom data. Enable Single Sign-On (SSO) for students and teachers using Google accounts.",
    longDescription: `
      <section>
        <p>Connect your school's productivity suite with the <strong>Google Workspace integration</strong>. This powerful sync allows schools to leverage the full power of Google Classroom, Drive, and Gmail within the School ERP environment. By centralizing identity management, schools can provide students and staff with a single set of credentials to access all educational resources, enhancing both security and user experience through <strong>Single Sign-On (SSO)</strong>.</p>
        
        <h3>Unified Identity and Access Management</h3>
        <p>When a new student is enrolled in the ERP, the integration can automatically create their institutional Google account, assign them to specific Google Groups, and enroll them in the relevant Google Classrooms based on their grade and section. This eliminates the manual administrative hurdle of managing thousands of accounts and ensures that students have Day 1 access to their digital textbooks and collaboration tools.</p>
        
        <h3>Collaboration and Document Control</h3>
        <p>The integration enables teachers to attach documents from Google Drive directly to ERP assignments. Students can submit their work as Google Docs or Slides, allowing for real-time feedback and collaborative grading. For the administration, it provides a secure way to manage school records and staff collaboration on Sheets, all while maintaining strict access controls defined in the central ERP system.</p>
        
        <h3>Streamlined Google Classroom Sync</h3>
        <p>Synchronization goes both ways: rosters created in the ERP are pushed to Google Classroom, and grades or assignment statuses from Classroom can be pulled back into the ERP's master gradebook. This creates a single source of truth for academic performance, reducing data entry errors and providing parents with a more comprehensive view of their child's progress.</p>
      </section>
    `,
    logoUrl: "/integration-logos/google-workspace.png",
    features: [
      "SAML-based Single Sign-On (SSO)",
      "Automated User Provisioning & Deprovisioning",
      "Google Classroom Roster & Grade Sync",
      "Integrated Google Drive for Assignments",
      "Shared Calendars for School Events"
    ],
    benefit: "Eliminates multiple logins and automates classroom management for teachers.",
    setupTime: "2 Hours",
    compliance: ["FERPA", "COPPA", "GDPR", "ISO 27017"],
    relatedSlugs: ["microsoft-365", "zoom", "canvas-lms"]
  },
  {
    id: "int-microsoft-365",
    slug: "microsoft-365",
    name: "Microsoft 365",
    category: "Cloud",
    iconName: "Cloud",
    shortDescription: "Empower collaboration with Microsoft Teams, Outlook, and OneDrive. Professional tools for students and administrative staff.",
    longDescription: `
      <section>
        <p>The <strong>Microsoft 365 integration</strong> transforms your School ERP into a powerhouse of professional collaboration. By integrating Azure Active Directory (Azure AD) with the ERP, institutions can provide a seamless Single Sign-On experience for Microsoft Teams, Outlook, and the entire Office suite. This is particularly valuable for schools preparing students with industry-standard tools while streamlining administrative operations on a secure, enterprise-grade cloud.</p>
        
        <h3>Teams for Online Education</h3>
        <p>With this integration, Microsoft Teams becomes the virtual hub for your school. Class teams are automatically created and populated based on ERP subject enrollments. Video lectures, chat-based collaboration, and shared OneNote notebooks are all accessible through the ERP interface. This ensures that the digital classroom is as structured and manageable as the physical one, with full oversight from the academic coordinators.</p>
        
        <h3>Professional Communication and Storage</h3>
        <p>Administrative staff benefit from deep integration with Outlook and OneDrive. School circulars are synced with Outlook calendars, and official documents can be stored and shared through OneDrive directly from the ERP's document management module. This facilitates <strong>version control</strong> and secure document sharing, reducing the reliance on local servers and paper-based records.</p>
        
        <h3>Enterprise Security and Compliance</h3>
        <p>Leveraging Microsoft's multi-layered security, the integration ensures that student data is protected by advanced threat protection and data loss prevention (DLP) policies. The integration also supports automated archiving of school communications, helping institutions meet legal and regulatory requirements for data retention in the education sector.</p>
      </section>
    `,
    logoUrl: "/integration-logos/microsoft-365.png",
    features: [
      "Azure AD Single Sign-On (SSO)",
      "Automated Teams Class Creation",
      "Outlook Calendar Synchronization",
      "OneDrive Integration for Student Records",
      "Advanced Data Loss Prevention (DLP)"
    ],
    benefit: "Standardizes school communication and provides professional tools for staff.",
    setupTime: "2 Hours",
    compliance: ["GDPR", "FERPA", "HIPAA", "SOC3"],
    relatedSlugs: ["google-workspace", "zoom", "aws-s3"]
  },
  {
    id: "int-tally-prime",
    slug: "tally-prime",
    name: "Tally Prime",
    category: "Accounting",
    iconName: "Calculator",
    shortDescription: "Sync your school's financial transactions with Tally Prime. Reduce data entry errors and simplify annual audits and taxation.",
    longDescription: `
      <section>
        <p>The <strong>Tally Prime integration</strong> is a must-have for the finance department of any Indian school. It automates the flow of financial data from the ERP's fee and expense modules directly into Tally's accounting software. By eliminating manual data entry, this integration ensures 100% accuracy in your financial records, making the annual audit process significantly faster and less stressful.</p>
        
        <h3>Automated Ledger Mapping</h3>
        <p>Every transaction in the School ERP—whether it's fee collection, vendor payment, or payroll—is mapped to its corresponding ledger in Tally. The integration supports <strong>real-time or batch syncing</strong>, allowing the school's accountant to review entries before they are finalized. This precise mapping ensures that your Balance Sheet, Profit & Loss statements, and Trial Balances are always up-to-date and reflect the true financial health of the school.</p>
        
        <h3>Simplified Taxation and Compliance</h3>
        <p>Tally is renowned for its handling of Indian taxation, including GST and TDS. By syncing ERP data with Tally, schools can effortlessly generate tax-compliant invoices and reports. The integration also handles complex accounting scenarios like advanced fee collection, cautionary deposits, and scholar-specific discounts, ensuring that every edge case is accounted for in the primary financial ledger.</p>
        
        <h3>Improved Resource Allocation</h3>
        <p>With financial data flowing seamlessly, the management can focus on analysis rather than data entry. Tally's powerful reporting engine combined with ERP's granular student data allows for deep insights into cost-per-student, transport profitability, and budget utilization, empowering schools to make data-driven decisions regarding their infrastructure and academic programs.</p>
      </section>
    `,
    logoUrl: "/integration-logos/tally-prime.png",
    features: [
      "One-click Ledger & Voucher Sync",
      "Automated Fee Collection Journaling",
      "GST-ready Invoice Generation",
      "Bank Reconciliation Sync",
      "Multi-branch Financial Consolidation"
    ],
    benefit: "Eliminates double data entry and ensures audit-ready financial records.",
    setupTime: "4 Hours",
    compliance: ["ICAI Standards", "GST Ready", "TDS Compliant"],
    relatedSlugs: ["zoho-books", "razorpay", "stripe"]
  },
  {
    id: "int-essl-biometric",
    slug: "essl-biometric",
    name: "Essl Biometric",
    category: "Hardware",
    iconName: "Fingerprint",
    shortDescription: "Automate student and staff attendance with eSSL biometric devices. Real-time sync for finger, face, and RFID data.",
    longDescription: `
      <section>
        <p>The <strong>eSSL Biometric integration</strong> brings hardware-level precision to your school's attendance management. By connecting eSSL devices directly to the ERP, schools can eliminate 'proxy attendance' and ensure that every entry and exit is recorded with 100% accuracy. This integration is essential for maintaining discipline and enhancing the safety of students and staff within the campus.</p>
        
        <h3>Real-time Attendance Sync</h3>
        <p>Our integration uses the eSSL 'Push Data' technology, meaning as soon as a student or staff member scans their fingerprint or face, the record is instantly reflected in the ERP. This triggers <strong>automated SMS alerts</strong> to parents, notifying them of their child's safe arrival or departure. For the HR department, this data is used to automatically calculate late arrivals, early leavings, and overtime for payroll processing.</p>
        
        <h3>Advanced Security Features</h3>
        <p>The integration supports multiple identification methods, including Fingerprint, Facial Recognition, and RFID cards. During exam times or high-security events, the system can be configured to allow access only to specific individuals. The ERP also manages the 'enrolment' process, where master data for students and staff is pushed to the devices, ensuring that the hardware is always in sync with the current active roster.</p>
        
        <h3>Offline Resilience</h3>
        <p>Understanding school infrastructure, the integration is designed to be resilient. If the school's internet goes down, eSSL devices continue to store attendance logs locally. As soon as the connection is restored, the ERP automatically fetches all pending logs, ensuring no attendance data is ever lost due to connectivity issues.</p>
      </section>
    `,
    logoUrl: "/integration-logos/essl-biometric.png",
    features: [
      "Real-time Push Data Synchronization",
      "Face, Fingerprint & RFID Support",
      "Automated Parent Notification on Scan",
      "Payroll-integrated Staff Attendance",
      "Device Health Monitoring & Status"
    ],
    benefit: "Prevents proxy attendance and automates child safety notifications.",
    setupTime: "3 Hours",
    compliance: ["GDPR (Data Privacy)", "ISO 9001"],
    relatedSlugs: ["matrix-cosec", "mapmyindia", "whatsapp-business"]
  },
  {
    id: "int-matrix-cosec",
    slug: "matrix-cosec",
    name: "Matrix COSEC",
    category: "Hardware",
    iconName: "Lock",
    shortDescription: "Enterprise-grade access control and attendance. Secure your school premises with Matrix hardware integrated into your ERP.",
    longDescription: `
      <section>
        <p>The <strong>Matrix COSEC integration</strong> provides an enterprise-class security and access control solution for modern schools. Matrix hardware is known for its durability and advanced features, and when integrated with the School ERP, it creates a formidable safety shield for your institution. This integration goes beyond simple attendance, allowing schools to manage physical access to sensitive areas like laboratories, server rooms, and libraries.</p>
        
        <h3>Smart Access Control</h3>
        <p>Through the ERP interface, administrators can define who has access to which part of the campus and during what times. For example, library access can be restricted to school hours, or staff-only rooms can be secured via biometric verification. The integration provides a <strong>centralized command center</strong> where all access logs are monitored in real-time, alerting security personnel to any unauthorized entry attempts.</p>
        
        <h3>Unified Identity Management</h3>
        <p>Managing biometrics for thousands of students is a complex task. This integration simplifies it by allowing 'centralized enrollment'. A student’s biometric profile is captured once and pushed to all relevant devices across the campus. When a student leaves the school, their access is automatically revoked across the entire network via the ERP, ensuring zero security loopholes.</p>
        
        <h3>Custom Workflows for Events</h3>
        <p>The Matrix integration allows for specialized workflows during school events, such as parent-teacher meetings or annual days. Hardware can be temporarily switched to 'allow-all' or 'card-only' modes, with all visitor data being logged against their digital entry passes generated by the ERP. This level of control ensures that even during busy events, the school's security protocols remain intact.</p>
      </section>
    `,
    logoUrl: "/integration-logos/matrix-cosec.png",
    features: [
      "Time-based Access Control Policies",
      "Centralized Biometric Data Management",
      "Anti-passback & Interlock Support",
      "Real-time Security Violation Alerts",
      "Visitor Management Integration"
    ],
    benefit: "Enhances campus security by controlling access to restricted school zones.",
    setupTime: "5 Hours",
    compliance: ["CE", "FCC", "RoHS", "ISO 27001"],
    relatedSlugs: ["essl-biometric", "mapmyindia", "firebase"]
  },
  {
    id: "int-aws-s3",
    slug: "aws-s3",
    name: "AWS S3",
    category: "Cloud",
    iconName: "HardDrive",
    shortDescription: "Securely store and manage unlimited school documents, student report cards, and video lessons with Amazon S3 cloud storage.",
    longDescription: `
      <section>
        <p>Leverage the world's most reliable cloud storage with the <strong>AWS S3 integration</strong>. Schools generate a massive amount of data every year—from high-resolution student photographs and scanned KYC documents to video lessons and digital answer sheets. AWS S3 provides an 'infinitely' scalable and strictly secure repository for all your institution's digital assets, ensuring they are preserved for years without any risk of hardware failure.</p>
        
        <h3>Highly Available & Secure Content Delivery</h3>
        <p>By using S3 as the backend for the ERP's Document Management System (DMS), schools can serve content to students and parents with incredibly low latency. Report cards, certificates, and learning materials are delivered via secure, time-limited URLs, ensuring that only authorized users can access sensitive student information. The integration also supports <strong>versioning</strong>, allowing you to track changes to documents over time and recover previous versions if needed.</p>
        
        <h3>Automated Archiving and Cost Optimization</h3>
        <p>Academic records must often be kept for decades. The AWS S3 integration supports life-cycle policies that automatically move older files to cheaper storage classes (like S3 Glacier) after a student graduates. This allows schools to maintain a complete historical archive of all academic and financial records while keeping operational costs at a minimum.</p>
        
        <h3>Disaster Recovery and Compliance</h3>
        <p>Data loss is not an option for an educational institution. S3 automatically replicates your data across multiple physical facilities. Our integration ensures that your school's data is encrypted both at rest and in transit, meeting the highest global standards for data privacy and protection, as required by modern educational regulators.</p>
      </section>
    `,
    logoUrl: "/integration-logos/aws-s3.png",
    features: [
      "Secure, Scalable Cloud Asset Storage",
      "Automated Lifecycle Data Archiving",
      "End-to-End Encryption for Records",
      "High-speed CDN for PDF and Videos",
      "99.999999999% Durability Guarantee"
    ],
    benefit: "Provides unlimited, secure storage for all school digital records and media.",
    setupTime: "1 Hour",
    compliance: ["SOC1/2/3", "PCI-DSS", "ISO 27018", "GDPR"],
    relatedSlugs: ["google-workspace", "microsoft-365", "firebase"]
  },
  {
    id: "int-whatsapp-business",
    slug: "whatsapp-business",
    name: "WhatsApp Business API",
    category: "Communication",
    iconName: "Phone",
    shortDescription: "Communicate with parents on the world's most popular messaging app. Send automated fees, results, and circulars to WhatsApp.",
    longDescription: `
      <section>
        <p>The <strong>WhatsApp Business API integration</strong> is the ultimate tool for parent engagement. With open rates exceeding 95%, WhatsApp is the most effective way to ensure that school communications are actually read. This integration allows your school to send automated, personalized messages directly from the ERP, ranging from simple attendance alerts to rich-media report cards and fee receipts.</p>
        
        <h3>Automated Parent-School Dialogue</h3>
        <p>The integration enables interactive workflows. For example, parents can type 'Fee Balance' to a dedicated school WhatsApp number and receive their current outstanding amount instantly, powered by a <strong>chatbot integrated with the ERP</strong>. This self-service capability reduces the number of routine queries handled by the school's front office, significantly enhancing administrative efficiency.</p>
        
        <h3>Rich Media and Document Sharing</h3>
        <p>Unlike standard SMS, WhatsApp allows schools to send high-quality images of posters for school events, PDF copies of quarterly results, and even video messages from the Principal. All communications are sent through an 'Official Business Account' (the green badge), which builds trust and ensures that the school's messages are not marked as spam.</p>
        
        <h3>Compliance and Quality</h3>
        <p>WhatsApp Business API requires templates to be approved to maintain a high-quality user experience. The integrated ERP platform manages this process for you, ensuring that all school notifications comply with WhatsApp’s policies while providing the flexibility to reach parents at the right time with the right information.</p>
      </section>
    `,
    logoUrl: "/integration-logos/whatsapp-business.png",
    features: [
      "Verified Business Profile (Green Tick)",
      "Automated Interactive Chatbots",
      "PDF Report Card & Receipt Delivery",
      "Broadcast Lists for School Circulars",
      "Encrypted Two-way Communication"
    ],
    benefit: "Achieves significantly higher parent engagement compared to Email or SMS.",
    setupTime: "72 Hours",
    compliance: ["GDPR", "WhatsApp Business Policy"],
    relatedSlugs: ["twilio", "firebase", "essl-biometric"]
  },
  {
    id: "int-firebase",
    slug: "firebase",
    name: "Firebase",
    category: "Cloud",
    iconName: "Bell",
    shortDescription: "Power your school's mobile app with Google's Firebase. Enable real-time push notifications, crash reporting, and analytics.",
    longDescription: `
      <section>
        <p>The <strong>Firebase integration</strong> serves as the technical engine for your school's branded mobile application. Developed by Google, Firebase provides the infrastructure for real-time data synchronization and high-performance push notifications. This integration ensures that whenever a teacher posts an update or a fee is paid, the user's mobile app responds instantly, keeping everyone in the school ecosystem connected.</p>
        
        <h3>High-Performance Push Notifications</h3>
        <p>Firebase Cloud Messaging (FCM) is integrated into our ERP to deliver <strong>lightning-fast notifications</strong> to both Android and iOS devices. Whether it's a notification about a bus arriving at a stop or an instant message from a teacher, Firebase handles the delivery across millions of devices with minimal latency. These notifications can be targeted to specific groups, such as a particular grade, or even a single individual.</p>
        
        <h3>Real-time App Experience</h3>
        <p>Using the Firebase Realtime Database and Firestore, your school app can offer features like live bus tracking and instant chat without the lag of traditional web requests. This creates an 'app-like' experience where data updates happen on the screen without needing to refresh the page, providing a modern and premium feel for your institution's digital presence.</p>
        
        <h3>App Quality and User Insights</h3>
        <p>Beyond features, Firebase helps maintain the quality of your school's app through Crashlytics and performance monitoring. Administrators can see deep analytics on how parents use the app—identifying which features are most popular and where users are spending their time. This data is invaluable for continuously improving the digital experience for your parents and students.</p>
      </section>
    `,
    logoUrl: "/integration-logos/firebase.png",
    features: [
      "FCM High-Speed Push Notifications",
      "Real-time Data Synchronization",
      "In-app Messaging & Engagement",
      "Advanced Mobile App Analytics",
      "Remote Configuration for App Updates"
    ],
    benefit: "Powers a rich, real-time experience for the parent and student mobile app.",
    setupTime: "2 Hours",
    compliance: ["ISO 27001", "SOC1/2/3", "GDPR"],
    relatedSlugs: ["google-workspace", "twilio", "mapmyindia"]
  },
  {
    id: "int-mapmyindia",
    slug: "mapmyindia",
    name: "MapmyIndia",
    category: "Hardware",
    iconName: "MapPin",
    shortDescription: "Advanced GPS and transport management for school buses. Real-time tracking with accurate Indian mapping data.",
    longDescription: `
      <section>
        <p>The <strong>MapmyIndia integration</strong> provides the most accurate and reliable transport management system for schools in India. While standard mapping services often lack detail in local wards and residential complexes, MapmyIndia provides hyper-local mapping data that is essential for planning efficient bus routes and ensuring accurate ETA notifications for parents.</p>
        
        <h3>Live Bus Tracking and Safety</h3>
        <p>By integrating MapmyIndia's GPS hardware and GIS APIs with the School ERP, institutions can monitor their entire fleet on a single dashboard. Parents receive <strong>proximity alerts</strong> when the bus is 5 minutes away from their stop, significantly reducing wait times and ensuring student safety during pick-up and drop-off. The system also monitors driver behavior, tracking over-speeding, harsh braking, and unauthorized route deviations.</p>
        
        <h3>Optimized Route Planning</h3>
        <p>School transport is one of the largest operational costs. This integration uses advanced algorithms to plan the most fuel-efficient routes based on student locations. It accounts for road restrictions and historical traffic data, allowing schools to optimize their fleet size and reduce operational expenses while maintaining a high standard of service for students.</p>
        
        <h3>Geofencing and Security</h3>
        <p>Administrators can set up 'Geofences' around the school campus and student stops. If a bus enters or leaves these zones at an unscheduled time, the ERP triggers immediate alerts to the transport manager. This level of oversight is critical for managing emergencies and ensuring that the school's transport policy is strictly adhered to at all times.</p>
      </section>
    `,
    logoUrl: "/integration-logos/mapmyindia.png",
    features: [
      "Hyper-local GPS Tracking & ETAs",
      "Route Optimization & Fuel Tracking",
      "Driver Behavior & Speed Monitoring",
      "Proximity Alerts for Parents via App",
      "Automated Monthly Transport Billing"
    ],
    benefit: "Reduces school transport costs and provides peace of mind to parents.",
    setupTime: "4 Hours (per device)",
    compliance: ["AIS 140", "ISO 9001"],
    relatedSlugs: ["essl-biometric", "firebase", "whatsapp-business"]
  },
  {
    id: "int-zoho-books",
    slug: "zoho-books",
    name: "Zoho Books",
    category: "Accounting",
    iconName: "Calculator",
    shortDescription: "Cloud-based accounting for modern schools. Sync fees, expenses, and payroll for real-time financial transparency.",
    longDescription: `
      <section>
        <p>The <strong>Zoho Books integration</strong> brings the power of modern, cloud-based accounting to your educational institution. Designed for transparency and ease of use, Zoho Books integrates with the ERP to provide a 360-degree view of your school's finances. This is ideal for schools looking to move away from legacy desktop-based software towards a collaborative, accessible-from-anywhere financial system.</p>
        
        <h3>Real-time Financial Sync</h3>
        <p>All financial activities in the ERP—including online fee payments, cafeteria sales, and uniform shop transactions—are automatically recorded as sales entries in Zoho Books. On the other side, staff payroll and vendor payments flow into the expense module. This <strong>continuous synchronization</strong> ensures that the school's financial controllers always have an accurate picture of the cash flow, accessible via the cloud on any device.</p>
        
        <h3>Powerful Reporting and Analytics</h3>
        <p>Zoho Books offers a suite of professional financial reports, including Cash Flow Statements, Balance Sheets, and Aged Receivables. When combined with the student-level data from the ERP, schools can perform deep analysis: identifying which demographic groups have higher dues or analyzing the profitability of specific school programs. This helps in creating more accurate budgets and making informed infrastructure investment decisions.</p>
        
        <h3>Collaborative Accounting</h3>
        <p>Unlike traditional software, Zoho Books allows multiple users to work simultaneously. Your school's internal accountant, the management, and external auditors can all have specific access levels to the financial data. This collaborative environment promotes transparency and reduces the risk of financial mismanagement, while ensuring that the school is always audit-ready.</p>
      </section>
    `,
    logoUrl: "/integration-logos/zoho-books.png",
    features: [
      "Automated Sales & Expense Syncing",
      "Cloud-based Multi-user Access",
      "Integrated Vendor & Payroll Tracking",
      "Real-time Financial Dashboards",
      "Automated Bank Feeds & Matching"
    ],
    benefit: "Enables cloud-based financial management with real-time reporting.",
    setupTime: "3 Hours",
    compliance: ["GST Ready", "IFRS", "GAAP"],
    relatedSlugs: ["tally-prime", "razorpay", "stripe"]
  },
  {
    id: "int-moodle",
    slug: "moodle",
    name: "Moodle",
    category: "LMS",
    iconName: "BookOpen",
    shortDescription: "Incorporate the world's most popular open-source LMS into your ERP. Sync courses, enrollments, and grades seamlessly.",
    longDescription: `
      <section>
        <p>The <strong>Moodle integration</strong> combines the academic depth of the world's leading open-source LMS with the administrative power of our School ERP. Moodle is renowned for its flexible course management, interactive quizzes, and collaborative tools. By connecting it with the ERP, schools can automate the tedious task of student enrolment and ensure that academic and administrative data are always in perfect harmony.</p>
        
        <h3>Automated Course & Roster Sync</h3>
        <p>When a new academic year begins, the ERP automatically creates the necessary courses in Moodle and enrolls students based on their grade and section. As students join or leave the school, their Moodle access is updated in real-time. This ensures that teachers can start their digital lessons from day one, without worrying about manual student account setup or technical hurdles.</p>
        
        <h3>Unified Academic Record</h3>
        <p>Grades from Moodle quizzes and assignments are automatically pulled into the ERP's master gradebook. This data is then used to generate <strong>comprehensive report cards</strong>, combining online performance with classroom participation and physical exams. This unified view provides a more accurate and holistic assessment of student progress than either system could provide in isolation.</p>
        
        <h3>Enriched Learning Content</h3>
        <p>With Moodle integrated, your ERP portal becomes a gateway to a massive repository of SCORM-compliant content, H5P interactive videos, and peer-review forums. The integration also supports Single Sign-On, so students can transition from checking their fee status to taking an online science quiz without ever needing to log in twice, creating a cohesive digital campus experience.</p>
      </section>
    `,
    logoUrl: "/integration-logos/moodle.png",
    features: [
      "Auto-enrollment from ERP to Moodle",
      "Bidirectional Gradebook Synchronization",
      "SSO for Students and Teachers",
      "Interactive Content (H5P/SCORM) Support",
      "Advanced Quiz & Assessment Engine"
    ],
    benefit: "Leverage world-class pedagogy tools with automated administrative overhead.",
    setupTime: "6 Hours",
    compliance: ["WCAG 2.1", "Open Source Standards", "GDPR"],
    relatedSlugs: ["canvas-lms", "zoom", "google-workspace"]
  },
  {
    id: "int-canvas-lms",
    slug: "canvas-lms",
    name: "Canvas",
    category: "LMS",
    iconName: "BookOpen",
    shortDescription: "Modern, native cloud LMS integration for premium schools. Streamline grading, communication, and student outcomes.",
    longDescription: `
      <section>
        <p>The <strong>Canvas LMS integration</strong> is designed for premium educational institutions that demand a modern, highly intuitive learning environment. Canvas is known for its beautiful interface and mobile-first approach. By integrating it with your School ERP, you provide your students and teachers with an industry-leading academic platform while maintaining strictly synchronized administrative and financial records.</p>
        
        <h3>Streamlined Grading and Outcomes</h3>
        <p>Canvas's sophisticated SpeedGrader tool is integrated into the ERP workflow, allowing teachers to provide rich feedback (including voice and video) on student work. All grades and learning outcomes are synced back to the ERP, where the administration can track <strong>student success metrics</strong> at a granular level. This helps in early identification of students who may need extra support, improving overall academic outcomes.</p>
        
        <h3>Professional Communication Hub</h3>
        <p>The integration leverages Canvas's messaging and announcement features, syncing them with the ERP's notification engine. This ensures that a post about an upcoming project on Canvas also appears on the parent's ERP mobile app feed. This multi-channel approach guarantees that students and parents never miss an important academic update, fostering a culture of accountability and engagement.</p>
        
        <h3>Scalable and Reliable Cloud Infrastructure</h3>
        <p>As a cloud-native platform, the Canvas integration ensures that your LMS is always available, even during peak exam periods. The system handles massive concurrent users with ease, providing a fast and responsive experience on both web and mobile. By connecting Canvas with the ERP, you are future-proofing your school's digital infrastructure with a scalable solution used by the world's top universities.</p>
      </section>
    `,
    logoUrl: "/integration-logos/canvas.png",
    features: [
      "Real-time Roster & Enrollment Sync",
      "SpeedGrader Feedback Synchronization",
      "Outcome & Competency Tracking",
      "Native Mobile App Integration",
      "Robust LTI Integration Capabilities"
    ],
    benefit: "Provides a premium, modern learning experience for students and staff.",
    setupTime: "8 Hours",
    compliance: ["FERPA", "COPPA", "GDPR", "ASAT"],
    relatedSlugs: ["moodle", "zoom", "microsoft-365"]
  }
];
