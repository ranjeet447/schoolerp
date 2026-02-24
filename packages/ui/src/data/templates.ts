export interface SchoolTemplate {
  slug: string;
  title: string;
  category: 'Admin' | 'Finance' | 'Academics' | 'HR' | 'Communication';
  shortDescription: string;
  longDescription: string;
  features: string[];
  image: string;
  downloadFormat: 'PDF' | 'Excel' | 'Word' | 'Ready-to-Use (ERP)';
  relatedSlugs: string[];
}

export const TEMPLATES_DATA: SchoolTemplate[] = [
  {
    slug: 'school-admission-form',
    title: 'School Admission Form Template',
    category: 'Admin',
    shortDescription: 'Comprehensive student enrollment form compliant with Indian school board requirements.',
    longDescription: `
      <p>The <strong>School Admission Form</strong> is the critical first touchpoint between an educational institution and prospective families. In the Indian context, where compliance with boards like CBSE, ICSE, and various State Boards is mandatory, having a structured and exhaustive admission format is essential. This template is designed to capture every vital detail required for a student's academic journey while ensuring data integrity from day one.</p>
      <p>Our admission form includes dedicated sections for student personal details, previous academic history, medical records, and parental information. It goes beyond basic data by incorporating fields for <strong>Aadhar number verification</strong>, category-specific documentation (SC/ST/OBC), and transport requirements. Manual admission processes often lead to data entry errors that haunt the administration for years; however, by using a standardized template that integrates with an ERP system, schools can ensure that the data entered by parents flows directly into the student information system (SIS).</p>
      <p>SchoolERP automates this entire workflow by providing an <strong>Online Admission Portal</strong>. Instead of physical paper trails, parents can upload scanned documents like Birth Certificates and Transfer Certificates directly. The system performs real-time validation, ensuring no field is left blank. Once the school admin approves the application, a unique Admission Number is generated automatically, and the student profile is created instantly across all modules including Finance for fee tracking and Academics for section allocation. This efficiency reduces the admission cycle time by over 70% and provides a professional experience for parents.</p>
    `,
    features: [
      'CBSE/ICSE Compliance Ready',
      'Integrated Aadhar & Document Uploads',
      'Parental & Guardian Detailed Sections',
      'Auto-generation of Admission ID',
      'Emergency Medical Information Capture'
    ],
    image: '/template-images/school-admission-form.png',
    downloadFormat: 'Ready-to-Use (ERP)',
    relatedSlugs: ['student-transfer-certificate', 'school-id-card-design', 'hostel-admission-form']
  },
  {
    slug: 'fee-receipt-thermal',
    title: 'Thermal Fee Receipt Format',
    category: 'Finance',
    shortDescription: 'Compact and professional thermal printer receipt for quick fee collection at counters.',
    longDescription: `
      <p>In the bustling environment of a school's accounts office, speed and accuracy are paramount. The <strong>Thermal Fee Receipt</strong> template is optimized for 2-inch and 3-inch thermal printers, providing a cost-effective and lightning-fast solution for acknowledging fee payments. Unlike traditional A4 receipts, thermal receipts are ideal for high-volume transactions during peak fee-payment months in Indian schools.</p>
      <p>This template is designed to be concise yet legally compliant, featuring the school logo, student name, class, section, folio number, and a detailed breakdown of fee heads such as Tuition Fee, Transport Fee, and Lab Charges. It also includes <strong>Dynamic QR Codes</strong> for UPI payments, allowing parents to verify the transaction status on their mobile instantly. The compact design ensures that no paper is wasted while maintaining a professional look that builds trust with parents.</p>
      <p>With SchoolERP, the generation of these receipts is completely hands-free. As soon as an accountant marks a fee as paid, the thermal printer triggers a print command. The system automatically fetches any outstanding balance and prints it at the bottom, serving as a gentle reminder to the parent. Furthermore, every receipt is synced with the <strong>Cloud Accounting Ledger</strong>, meaning the school management can view real-time collection reports from any device. This eliminates the need for manual day-end reconciliation and ensures 100% transparency in financial transactions.</p>
    `,
    features: [
      'Optimized for 80mm & 58mm Printers',
      'Detailed Fee Head Breakdown',
      'Outstanding Balance Auto-summary',
      'UPI QR Code Integration',
      'Digital Signature Support'
    ],
    image: '/template-images/fee-receipt-thermal.png',
    downloadFormat: 'Ready-to-Use (ERP)',
    relatedSlugs: ['monthly-fee-defaulter-list', 'annual-school-budget-planner', 'no-dues-certificate-staff']
  },
  {
    slug: 'student-transfer-certificate',
    title: 'Student Transfer Certificate (TC)',
    category: 'Admin',
    shortDescription: 'Official school leaving and transfer certificate compliant with board regulations.',
    longDescription: `
      <p>The <strong>Transfer Certificate (TC)</strong>, often referred to as a School Leaving Certificate in various parts of India, is a statutory document required by a student when moving from one institution to another. Any error in this document can lead to significant delays in the student's admission process elsewhere. This template ensures that every field required by the Education Department—such as Date of Birth in words, Date of Admission, and Reason for Leaving—is meticulously represented.</p>
      <p>Standardized TC formats are mandatory for affiliation with boards like <strong>CBSE and ICSE</strong>. Our template includes pre-filled sections for academic conduct, participation in sports, and whether the student has cleared all dues. A unique feature of this format is the inclusion of the <strong>PEN (Permanent Education Number)</strong> and U-DISE code, which are increasingly required for digital tracking of students across the Indian education system.</p>
      <p>In SchoolERP, issuing a TC is a streamlined 3-step process. First, the 'No Dues' status is automatically verified across the Library, Finance, and Hostel modules. Second, the academic history is pulled directly from the marksheet module. Third, the principal digitally signs the document. The system maintains a <strong>Digital Register of TCs</strong> issued, preventing duplicate issues and allowing for easy verification by other schools through a secure URL or QR code. This automation saves the admin office hours of manual data cross-referencing and ensures 100% accuracy.</p>
    `,
    features: [
      'Board-Approved Standard Format',
      'Auto-validation of No-Dues',
      'Permanent Education Number (PEN) Field',
      'QR-Code based Online Verification',
      'Multi-lingual Date Format Support'
    ],
    image: '/template-images/student-transfer-certificate.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['school-leaving-certificate', 'character-certificate', 'bonafide-certificate-format']
  },
  {
    slug: 'bonafide-certificate-format',
    title: 'Bonafide Certificate Template',
    category: 'Admin',
    shortDescription: 'Official student status verification letter for passports, visas, and bank accounts.',
    longDescription: `
      <p>The <strong>Bonafide Certificate</strong> is one of the most frequently requested documents in an Indian school office. Students require it for a variety of external purposes, including applying for a passport, opening a bank account, seeking government scholarships, or obtaining bus passes. This template provides a formal and authoritative layout that meets the stringent requirements of government and financial institutions.</p>
      <p>The design features the institutional header, student identification details, and a clear statement of enrollment for the current academic year. It also includes placeholders for the student's photograph and the official school seal. Using a consistent <strong>Bonafide Format</strong> is essential for maintaining the school's professional image and ensuring that the certificates are not rejected by external authorities due to missing information or informal language.</p>
      <p>SchoolERP transforms the way Bonafide Certificates are issued by making them available through the <strong>Student/Parent App</strong>. Families can request a certificate with a single click, specifying the purpose. The ERP system automatically verifies the student's active status and generates a pre-filled PDF. This eliminates the need for parents to visit the school office and wait for hours. For the administration, it means no more manual typing of names and roll numbers. The system keeps a log of all certificates issued, ensuring that the school has a record of every official document sent out.</p>
    `,
    features: [
      'Professional Institutional Layout',
      'Dynamic Student Data Population',
      'Purpose-specific Variations',
      'Digital Signature Branding',
      'Request Tracking History'
    ],
    image: '/template-images/bonafide-certificate-format.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['student-transfer-certificate', 'character-certificate', 'student-health-record-card']
  },
  {
    slug: 'staff-appointment-letter',
    title: 'Staff Appointment Letter Template',
    category: 'HR',
    shortDescription: 'Legally vetted employment contract for teachers and administrative staff.',
    longDescription: `
      <p>Recruiting high-quality educators is the backbone of a successful school. The <strong>Staff Appointment Letter</strong> is a legally binding document that sets the foundation for a professional relationship between the school management and the employee. This template is designed specifically for the Indian private education sector, covering essential clauses such as job responsibilities, probation periods, salary structure (including PF and ESI components), and notice periods.</p>
      <p>A well-structured appointment letter prevents future disputes and ensures that both parties are clear on the terms of employment. Our format includes sections for <strong>Statutory Compliance</strong>, Code of Conduct, and Confidentiality Agreements. It is modular, allowing schools to easily adjust terms for full-time teachers, part-time instructors, or administrative staff. In an era where labor laws are becoming more strictly enforced, having a professional HR template is a non-negotiable requirement for school administrators.</p>
      <p>SchoolERP's HR module automates the generation of offer letters and appointment letters during the hiring process. Once a candidate is selected in the <strong>Recruitment Pipeline</strong>, their data is automatically pulled into the template. The system calculates the salary breakdown based on the defined pay scale and generates the letter for digital signature. Upon acceptance, the employee profile is automatically created in the Payroll and Attendance modules. This seamless transition from 'candidate' to 'staff' ensures that new joiners are integrated into the school ecosystem without any administrative friction or data entry delays.</p>
    `,
    features: [
      'Vetted Legal Clauses',
      'Detailed Salary Breakup (CTC)',
      'Probation & Termination Terms',
      'Confidentiality & Non-compete Clause',
      'Electronic Acceptance Support'
    ],
    image: '/template-images/staff-appointment-letter.png',
    downloadFormat: 'Word',
    relatedSlugs: ['experience-certificate-teacher', 'no-dues-certificate-staff', 'annual-school-budget-planner']
  },
  {
    slug: 'school-leaving-certificate',
    title: 'School Leaving Certificate (SLC)',
    category: 'Admin',
    shortDescription: 'Formal certificate issued at the end of a student\'s education or school term.',
    longDescription: `
      <p>The <strong>School Leaving Certificate (SLC)</strong> is a vital document for students who have completed their final grade in a school or are withdrawing after a specific term. In India, this document is often used interchangeably with the Transfer Certificate but carries specific weight during the college admission process or when moving to a different state. It serves as a comprehensive record of the student's tenure, academic performance, and overall behavior.</p>
      <p>This template is designed to include all the nuances required by state education departments. Key fields include the <strong>Date of Admission</strong>, the class from which the student is leaving, the subjects studied, and the result of the last examination. It also documents if the student was penalized for any disciplinary issues, which is a common requirement for higher education vetting. The layout is clean and dignified, featuring high-quality security borders and the school's official crest to prevent forgery.</p>
      <p>Through SchoolERP, the issuance of the SLC is tied to the <strong>Exit Management Workflow</strong>. When a student applies for withdrawal, the system initiates a multi-department clearance process. Once 'No Dues' are received from the library, labs, sports department, and accounts, the SLC is unlocked for printing. This prevents the school from losing revenue or assets due to unreturned books or unpaid fees. Furthermore, the system generates a <strong>Unique Verification Code</strong> for each SLC, allowing external institutions to verify its authenticity online, thereby enhancing the school's reputation for process-oriented management.</p>
    `,
    features: [
      'Comprehensive Academic History',
      'Security-enhanced Design',
      'Disciplinary Conduct Summary',
      'Auto-verification via QR Code',
      'Official Board Logo Support'
    ],
    image: '/template-images/school-leaving-certificate.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['student-transfer-certificate', 'character-certificate', 'report-card-cbse-format']
  },
  {
    slug: 'character-certificate',
    title: 'Student Character Certificate',
    category: 'Admin',
    shortDescription: 'Formal statement of student conduct and participation in extracurricular activities.',
    longDescription: `
      <p>A <strong>Character Certificate</strong> is an essential document that provides a subjective yet professional assessment of a student's behavior and personality during their time at the school. It is frequently required for higher education applications, competitive exams, and government job verifications in India. This template goes beyond just stating "good conduct" by providing categorized sections for describing leadership roles, sportsmanship, and social responsibility.</p>
      <p>The format is designed to highlight the student's positive attributes, such as their involvement in the <strong>National Cadet Corps (NCC)</strong>, Scouts and Guides, or school house leadership. By providing a structured template, schools can ensure that these certificates are not just generic letters but meaningful endorsements of the student's development. It reflects the school’s dedication to holistic education and helps the student stand out in future endeavors.</p>
      <p>SchoolERP enables teachers and house masters to contribute to the character certificate throughout the year. The system allows faculty to log <strong>Positive Behavior Points</strong> or achievements in the student's profile. When it is time to generate the certificate, the ERP pulls these highlights automatically, creating a personalized and evidence-based document. This data-driven approach ensures that the certificate is truly representative of the student’s journey. For the principal, it means they can sign off on certificates with confidence, knowing that the details are backed by a year-long record of the student’s activities.</p>
    `,
    features: [
      'Holistic Achievement Summary',
      'Evidence-based Conduct Statements',
      'Professional Endorsement Layout',
      'Integration with Merit Stores',
      'Principal\'s Remarks Placeholder'
    ],
    image: '/template-images/character-certificate.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['school-leaving-certificate', 'student-transfer-certificate', 'bonafide-certificate-format']
  },
  {
    slug: 'monthly-fee-defaulter-list',
    title: 'Monthly Fee Defaulter List Format',
    category: 'Finance',
    shortDescription: 'Automated report to track pending dues and send reminders to parents.',
    longDescription: `
      <p>Managing cash flow is one of the most significant challenges for school administrators. The <strong>Monthly Fee Defaulter List</strong> is a tactical report that identifies students with unpaid balances, allowing the finance team to take timely action. In the Indian school system, where fees are often collected monthly or quarterly, keeping track of hundreds of transactions manually is prone to error and delays. This template provides a clear, actionable view of aging dues.</p>
      <p>The report is organized by class and section, showing the student's name, parent's contact number, the total amount due, and the number of months the fee has been pending. It also includes a section for <strong>Late Fee Calculations</strong> based on school policy. By having a standardized format, the accounts team can quickly present the school management with a summary of the total outstanding revenue, which is critical for budgeting and salary disbursements.</p>
      <p>With SchoolERP, the Defaulter List is not just a static report but a trigger for <strong>Multi-channel Communication</strong>. The system automatically generates this list on a specified date every month. With one click, the admin can send SMS, Email, and Push notifications to all parents on the list. The ERP supports 'Grace Periods' and automated late fee additions, ensuring that the ledger is always accurate. Moreover, it allows for 'White-listing' certain students who might have been granted extra time for payment. This automated follow-up loop typically increases fee recovery rates by 40% within the first few months of implementation.</p>
    `,
    features: [
      'Aging Analysis of Dues',
      'Class-wise Categorization',
      'Late Fee Auto-calculation',
      'Direct SMS/Email Triggering',
      'Export to Excel for Manual Audit'
    ],
    image: '/template-images/monthly-fee-defaulter-list.png',
    downloadFormat: 'Excel',
    relatedSlugs: ['fee-receipt-thermal', 'annual-school-budget-planner', 'no-dues-certificate-staff']
  },
  {
    slug: 'parent-teacher-meeting-notice',
    title: 'Parent-Teacher Meeting (PTM) Notice',
    category: 'Communication',
    shortDescription: 'Formal invitation and schedule template for school-wide PTM events.',
    longDescription: `
      <p>Effective communication between the school and parents is vital for student success. The <strong>Parent-Teacher Meeting (PTM) Notice</strong> template provides a professional way to invite parents to discuss their child's progress. In many Indian schools, PTMs are high-stakes events that require meticulous planning to avoid overcrowding and ensure that every parent gets quality time with the teachers. A well-formatted notice sets the tone for a productive meeting.</p>
      <p>This template includes the date, time slots, venue (including classroom numbers), and a brief agenda for the meeting. It also features a <strong>Response Slip</strong> section where parents can confirm their attendance or request a different time slot. By using a standardized look, the school reinforces its brand and shows that it values the parents' time and involvement. The notice also provides space for specific instructions, such as bringing the student's diary or wearing the school identity card.</p>
      <p>SchoolERP takes PTM management to the next level through its <strong>Appointment Booking System</strong>. Instead of sending paper notices that might get lost in a student's bag, the ERP sends a digital invitation via the mobile app. Parents can see available time slots for each subject teacher and book their appointment instantly. This prevents the traditional long queues seen in Indian school corridors. On the day of the PTM, teachers have a digital schedule on their dashboard, and parents receive push notification reminders. Post-meeting, teachers can log the discussion points directly into the student's profile, creating a digital trail of parent-teacher engagement.</p>
    `,
    features: [
      'Schedule-based Layout',
      'Digital Confirmation Links',
      'Agenda & Instruction Sections',
      'Multi-language Support',
      'Automatic Reminder Integration'
    ],
    image: '/template-images/parent-teacher-meeting-notice.png',
    downloadFormat: 'Word',
    relatedSlugs: ['school-calendar-event-planner', 'student-attendance-register-template', 'report-card-cbse-format']
  },
  {
    slug: 'school-id-card-design',
    title: 'School ID Card Design & Data Sheet',
    category: 'Admin',
    shortDescription: 'Standardized layout for student and staff identification cards with QR codes.',
    longDescription: `
      <p>The <strong>School ID Card</strong> is more than just a piece of plastic; it is a primary security tool and a brand ambassador for the institution. A professional ID card design needs to strike a balance between aesthetics and functionality. For Indian schools, where student safety is a top priority, ID cards must contain essential information like blood group, emergency contact numbers, and transport route details. This template provides a modern, clean layout that is easy to read and difficult to forge.</p>
      <p>Our design includes space for a high-resolution photograph, the school's barcode/QR code, and a clear distinction between students and staff members. The back of the card is utilized for the school address, principal's signature, and a <strong>'Lost and Found' instruction</strong>. Standardizing the ID card format ensures that every member of the school community can be instantly identified by security personnel, creating a safer campus environment.</p>
      <p>In the SchoolERP ecosystem, ID card generation is a completely automated byproduct of the admission process. Once a student's photo is uploaded during admission, the system can generate a bulk PDF of ID cards for an entire class with one click. The <strong>QR Codes</strong> printed on the cards are dynamic; when scanned by a security guard using the SchoolERP Guard App, they can verify the student's validity, check their bus route, or even log their entry/exit time. This integration transforms a simple ID card into a smart access card, eliminating the need for expensive third-party ID card printing services and ensuring the data is always up-to-date.</p>
    `,
    features: [
      'Modern High-Visibility Design',
      'Dynamic QR/Barcode Integration',
      'Emergency Contact & Blood Group Fields',
      'Bulk Data Export for Printing',
      'Student & Staff Variants'
    ],
    image: '/template-images/school-id-card-design.png',
    downloadFormat: 'Ready-to-Use (ERP)',
    relatedSlugs: ['school-admission-form', 'transport-bus-route-plan', 'hostel-admission-form']
  },
  {
    slug: 'teacher-lesson-plan-format',
    title: 'Teacher Lesson Plan Template',
    category: 'Academics',
    shortDescription: 'Structured daily and weekly lesson planner for curriculum alignment.',
    longDescription: `
      <p>A well-prepared teacher is the key to an effective classroom. The <strong>Teacher Lesson Plan Template</strong> is designed to help educators organize their thoughts, resources, and objectives before stepping into the class. Following modern pedagogical standards such as Bloom’s Taxonomy, this template encourages teachers to define learning outcomes, instructional methods, and assessment strategies for every period. In the Indian academic context, staying aligned with the <strong>NCERT or State Board syllabus</strong> is crucial, and this planner ensures that every topic is covered systematically.</p>
      <p>The layout includes sections for "Previous Knowledge Testing," "Teaching Aids/Resources," "Blackboard Usage Plan," and "Homework/Assignment." It also provides a space for <strong>Reflective Teaching</strong>, where the teacher can note down what went well and what needs improvement after the class. For the school principal and academic coordinators, these standardized lesson plans serve as an essential tool for monitoring the quality of instruction and ensuring curriculum consistency across different sections of the same grade.</p>
      <p>SchoolERP digitizes the lesson planning process, making it a collaborative effort. Teachers can create their plans within the ERP and link them directly to the <strong>E-Learning Resources</strong> and digital assignments. The academic coordinator can review and approve plans online, providing feedback in real-time. Parents and students can see the "Topic of the Day" on their apps, keeping them informed about what is being taught in class. Furthermore, the system tracks "Syllabus Completion" automatically based on these plans, providing management with a high-level view of academic progress without the need for manual progress reports.</p>
    `,
    features: [
      'Bloom\'s Taxonomy Aligned',
      'Weekly & Daily Views',
      'Resource & Aid Checklist',
      'Learning Outcome Tracking',
      'Syllabus Mapping Integration'
    ],
    image: '/template-images/teacher-lesson-plan-format.png',
    downloadFormat: 'Word',
    relatedSlugs: ['report-card-cbse-format', 'school-calendar-event-planner', 'student-attendance-register-template']
  },
  {
    slug: 'report-card-cbse-format',
    title: 'CBSE Compliant Report Card Format',
    category: 'Academics',
    shortDescription: 'Latest CCE and New Education Policy (NEP) aligned marksheets.',
    longDescription: `
      <p>Grading and assessment are the ultimate measures of a student's academic journey. The <strong>CBSE Compliant Report Card</strong> template is meticulously designed to meet the latest guidelines set by the Central Board of Secondary Education and the New Education Policy (NEP). It moves away from just marks to a more holistic 360-degree assessment, including Scholastic and Co-Scholastic areas. In Indian schools, the transition to <strong>Competency-Based Education</strong> requires a report card that reflects skills, values, and life-skills alongside academic grades.</p>
      <p>The template features structured tables for Term-wise marks, Grade points, and Attendance. It also include a dedicated section for "Student's Profile" which captures height, weight, and vision, as well as a "Self-Assessment" and "Peer Assessment" section as recommended by recent reforms. The aesthetic is professional yet encouraging, using a mix of data visualization and qualitative feedback to provide a complete picture of the child's development.</p>
      <p>Generating these complex report cards with SchoolERP takes minutes instead of days. The system automatically pulls marks from the <strong>Examination Module</strong>, applies the desired grading scale (Relative or Absolute), and calculates the final results. It handles complex weighted averages for periodic tests, mid-terms, and finals seamlessly. School management can generate bulk PDFs with digital signatures, which can then be published to the <strong>Parent App</strong> instantly. This eliminates the massive effort of manual data entry and printing, while ensuring that the data is 100% accurate and tamper-proof.</p>
    `,
    features: [
      'NEP 2020 Holistic Approach',
      'Auto-calculation of CGPA/Grades',
      'Scholastic & Co-scholastic Sections',
      'Automated Attendance Sync',
      'Digital Signature Branding'
    ],
    image: '/template-images/report-card-cbse-format.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['teacher-lesson-plan-format', 'student-attendance-register-template', 'school-leaving-certificate']
  },
  {
    slug: 'school-calendar-event-planner',
    title: 'Annual School Calendar & Event Planner',
    category: 'Academics',
    shortDescription: 'Comprehensive schedule of holidays, exams, and extracurricular activities.',
    longDescription: `
      <p>An organized school year starts with a well-defined <strong>Annual School Calendar</strong>. This template serves as the master blueprint for the entire academic community, including teachers, parents, and students. In India, managing a school calendar is particularly complex due to the variety of regional holidays, seasonal breaks, and scheduled board examinations. This event planner ensures that every stakeholder knows what to expect and when, preventing scheduling conflicts and last-minute surprises.</p>
      <p>The planner is divided into months, with color-coded categories for <strong>Holidays, Examination Dates, Sports Events, and Cultural Activities</strong>. It also includes a section for "Important Deadlines" such as fee payment dates and parent-teacher meetings. By sharing this calendar at the beginning of the session, schools can help parents plan their vacations and study schedules, leading to higher attendance and better engagement in school events.</p>
      <p>With SchoolERP, the calendar is a living, breathing digital entity. Any change made by the administrator—like an unexpected holiday due to weather—is instantly updated across the <strong>Mobile App and Website</strong>. The system sends push notifications to parents about upcoming events, ensuring high participation rates. Furthermore, the ERP links individual events to specific tasks; for example, an "Annual Day" event can have its own budget, volunteer list, and practice schedule managed within the platform. This transformation from a paper calendar to an integrated event management system ensures that the school operates like a well-oiled machine.</p>
    `,
    features: [
      'Monthly & Yearly Views',
      'Color-coded Event Types',
      'Holiday & Exam Schedule',
      'Direct Sync with Mobile Apps',
      'Printable & Digital Versions'
    ],
    image: '/template-images/school-calendar-event-planner.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['parent-teacher-meeting-notice', 'teacher-lesson-plan-format', 'annual-school-budget-planner']
  },
  {
    slug: 'student-attendance-register-template',
    title: 'Student Attendance Register Format',
    category: 'Academics',
    shortDescription: 'Daily attendance tracking sheet with monthly summary columns.',
    longDescription: `
      <p>Attendance is the most basic yet most crucial academic record. The <strong>Student Attendance Register</strong> template provides a structured way to log daily presence, absence, and leave. While many schools are moving towards digital methods, having a standardized physical register format is still necessary for certain board inspections and as a backup. This template is designed for high-density data, allowing for 31 days of tracking for up to 50 students on a single page.</p>
      <p>The layout includes columns for Roll Number, Student Name, and the daily marking area. At the end of the row, it features a <strong>Monthly Summary Section</strong> for totaling the number of days present and calculating the attendance percentage. This is vital for schools in India where a minimum 75% attendance is often mandatory for appearing in final examinations. The template also includes specific codes for Sick Leave (SL), On-Duty (OD), and Late Entry (LE).</p>
      <p>SchoolERP eliminates the need for manual tallying and the risk of physical register damage. Teachers can mark attendance through the <strong>Classroom Tablet or Mobile App</strong> in seconds. As soon as a student is marked absent, a notification is sent to the parent's phone, significantly reducing truancy. The system automatically handles the monthly calculations and generates the "Attendance Shortage Report" for the principal. This real-time data integration with the report card and exam module ensures that attendance policies are enforced without any administrative overhead.</p>
    `,
    features: [
      'Daily & Monthly Tracking',
      'Automatic Percentage Calculation',
      'Leave Type Categorization',
      'Attendance Shortage Alerts',
      'Historical Data Archiving'
    ],
    image: '/template-images/student-attendance-register-template.png',
    downloadFormat: 'Excel',
    relatedSlugs: ['teacher-lesson-plan-format', 'report-card-cbse-format', 'parent-teacher-meeting-notice']
  },
  {
    slug: 'library-book-issue-slip',
    title: 'Library Book Issue & Return Slip',
    category: 'Academics',
    shortDescription: 'Simple tracking slip for library transactions and overdue records.',
    longDescription: `
      <p>A well-utilized library is a sign of a thriving academic environment. The <strong>Library Book Issue Slip</strong> template helps in maintaining order and accountability for the school's literary assets. Managing thousands of books and hundreds of students can become a logistical nightmare without a clear tracking system. This template provides a small, easy-to-print slip that records the borrower's details, the book ID, and the <strong>Due Date for Return</strong>.</p>
      <p>The slip is designed to be divided into two parts: one for the student to keep as a reminder and one for the librarian to file. It includes a section for "Book Condition Notes" to ensure that any damage is identified early. By using these slips, schools can instill a sense of responsibility in students regarding public property. The format also allows for recording <strong>Overdue Fines</strong>, which helps in recovery and maintaining the library budget.</p>
      <p>Through SchoolERP's Library Management module, these slips become entirely optional or can be generated as <strong>Barcode-enabled E-Receipts</strong>. The system uses the student's ID card to issue books with a single scan. It sends automated SMS and App reminders three days before the due date, leading to a much higher return rate. Librarians can see a real-time list of "Books with Students" and "Popular Books." The ERP handles fine collection, inventory management, and even allows students to reserve books online through their portal. This digitization turns the library into a modern, user-friendly hub of information.</p>
    `,
    features: [
      'Dual-copy Receipt Design',
      'Barcode/Accession Number Field',
      'Due Date Reminder Text',
      'Damage Reporting Section',
      'Fine Tracking Support'
    ],
    image: '/template-images/library-book-issue-slip.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['school-calendar-event-planner', 'school-id-card-design', 'school-infrastructure-audit-checklist']
  },
  {
    slug: 'transport-bus-route-plan',
    title: 'School Transport Bus Route Plan',
    category: 'Communication',
    shortDescription: 'Detailed route mapping and stop-wise timing for school buses.',
    longDescription: `
      <p>Safety and punctuality are the cornerstones of an efficient school transport system. The <strong>Transport Bus Route Plan</strong> template is an essential document for school transport managers, drivers, and parents. It outlines the sequence of stops, the expected arrival times, and the list of students at each stop. In the dense urban and semi-urban areas of India, managing bus routes requires precise planning to navigate traffic and ensure students are picked up and dropped off safely.</p>
      <p>This layout includes columns for "Stop Name," "Estimated Time," "Distance from School," and "Contact Person (Bus Marshal)." It also features a <strong>Driver & Attendant Profile</strong> section with their verified phone numbers. Providing this plan to parents at the start of the year reduces anxiety and phone calls to the school office. It also serves as a mandatory safety document during periodic RTO (Regional Transport Office) inspections.</p>
      <p>SchoolERP elevates transport management with <strong>Live GPS Tracking and Route Optimization</strong>. Instead of static paper plans, the ERP provides a dynamic map-based view. The system can automatically recalculate the most efficient route based on student addresses, saving on fuel costs. Parents can track their child's bus in real-time on the app and get a "Bus is 2 KM away" alert. For the administration, the system provides "Over-speeding" and "Unauthorized Stop" alerts, ensuring full control over the fleet and student safety without needing to be physically present on every bus.</p>
    `,
    features: [
      'Stop-wise Timing & Sequence',
      'Emergency Contact Directory',
      'Student List per Route',
      'Fuel & Mileage Tracker',
      'RTO Compliance Details'
    ],
    image: '/template-images/transport-bus-route-plan.png',
    downloadFormat: 'Excel',
    relatedSlugs: ['school-id-card-design', 'parent-teacher-meeting-notice', 'hostel-admission-form']
  },
  {
    slug: 'hostel-admission-form',
    title: 'Hostel Admission & Rules Agreement',
    category: 'Admin',
    shortDescription: 'Residential facility enrollment form with medical and local guardian sections.',
    longDescription: `
      <p>Moving a child into a residential facility is a significant decision for any parent. The <strong>Hostel Admission Form</strong> is designed to capture the specialized information needed to care for a student 24/7. This template includes standard personal data plus critical residential fields such as <strong>Local Guardian Details</strong>, dietary preferences, and a detailed medical questionnaire. It also incorporates a comprehensive "Rules and Regulations Agreement" to ensure that the student and parents are aware of the hostel's code of conduct from the outset.</p>
      <p>A key aspect of this form is the "Visitor Authorization" section, where parents specify who is allowed to meet the child and take them out for weekend leaves. This is crucial for student safety in boarding schools. The layout is professional and exhaustive, providing peace of mind to the parents that the institution is organized and prepared to handle their child's daily needs, including health and safety.</p>
      <p>SchoolERP integrates hostel management with the core SIS, ensuring that the <strong>Warden/Hostel In-charge</strong> has access to the student's academic and medical records. Admission to the hostel via the ERP automatically triggers room allocation and billing for hostel and mess fees. The system tracks "In-Out Movements" via the security app, sends "Entry-Return" SMS to parents, and manages <strong>Leave Applications</strong> digitally. This holistic approach ensures that the school, the hostel, and the parents are always on the same page regarding the student’s whereabouts and well-being.</p>
    `,
    features: [
      'Local Guardian Authorization',
      'Detailed Medical History',
      'Mess & Diet Preference Section',
      'Hostel Rules Sign-off',
      'Inventory/Furniture Checklist'
    ],
    image: '/template-images/hostel-admission-form.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['school-admission-form', 'transport-bus-route-plan', 'student-health-record-card']
  },
  {
    slug: 'school-infrastructure-audit-checklist',
    title: 'School Infrastructure Audit Checklist',
    category: 'Admin',
    shortDescription: 'Monthly maintenance and safety inspection guide for campus facilities.',
    longDescription: `
      <p>A safe and well-maintained campus is non-negotiable for any educational institution. The <strong>School Infrastructure Audit Checklist</strong> is a proactive management tool used to monitor the condition of buildings, labs, playgrounds, and sanitation facilities. Regular audits help in identifying maintenance needs before they become safety hazards or expensive repairs. In the Indian context, maintaining infrastructure against the wear and tear of both climate and high student density requires a disciplined approach.</p>
      <p>The checklist covers categories like "Electrical Safety," "Fire Extinguisher Validity," "Cleanliness of Toilets," "Lab Equipment Integrity," and "Structural Soundness." It includes a <strong>Rating System</strong> (Satisfactory/Unsatisfactory) and a column for "Urgent Action Required." This standardized format allow for consistent reporting across different campus wings and provides a historical record for the board of directors and government auditors.</p>
      <p>In SchoolERP, this audit process is managed through the <strong>Asset & Maintenance Module</strong>. Auditors can fill out the checklist on their mobile while walking through the campus. If an item is marked "Unsatisfactory," the system automatically creates a maintenance ticket and assigns it to the relevant staff (e.g., electrician or plumber). The admin can track the "Mean Time to Repair" (MTTR) and view the total cost of maintenance for specific blocks. This data-driven approach ensures that the school remains a premium facility and that safety compliance is never compromised due to human oversight.</p>
    `,
    features: [
      'Comprehensive Facility Checklist',
      'Safety Compliance Focus',
      'Prioritized Action Items',
      'Photo Evidence Attachment Support',
      'Historical Audit Logs'
    ],
    image: '/template-images/school-infrastructure-audit-checklist.png',
    downloadFormat: 'Excel',
    relatedSlugs: ['annual-school-budget-planner', 'library-book-issue-slip', 'transport-bus-route-plan']
  },
  {
    slug: 'annual-school-budget-planner',
    title: 'Annual School Budget Planner',
    category: 'Finance',
    shortDescription: 'Strategic financial planning template for revenue and expenditure management.',
    longDescription: `
      <p>Financial sustainability is what allows a school to invest in better teachers and modern technology. The <strong>Annual School Budget Planner</strong> is a high-level strategic template designed for school principals and chairpersons. It provides a structured way to forecast income—primarily from fees, grants, and events—and allocate spending across categories like salaries, infrastructure development, marketing, and utilities. In India's competitive education landscape, careful budgeting is the difference between a school that thrives and one that struggles to pay its bills.</p>
      <p>The template includes a "Variance Analysis" feature, comparing projected budgets with actual spending month-over-month. It also features a <strong>Capital Expenditure (CAPEX) vs. Operational Expenditure (OPEX)</strong> breakdown, helping management plan for long-term investments like new laboratories or transport fleets. Having this data in a professional, audit-ready format is essential for bank loans and financial compliance.</p>
      <p>With SchoolERP, budgeting is no longer an end-of-year headache but a real-time management dashboard. The system pulls <strong>Actual Income from the Fee Module</strong> and <strong>Actual Expenses from the Accounts/Payroll Module</strong>. Management can set "Budget Locks" to prevent overspending in specific categories. The ERP provides visual reports (graphs and charts) that show the school's financial health at a glance. By integrating financial planning with daily operations, SchoolERP empowers administrators to make informed decisions that ensure the institution's long-term growth and stability.</p>
    `,
    features: [
      'Revenue Forecasting Tools',
      'Department-wise Allocation',
      'Real-time Variance Analysis',
      'Cash Flow Projections',
      'Management Reporting Dashboards'
    ],
    image: '/template-images/annual-school-budget-planner.png',
    downloadFormat: 'Excel',
    relatedSlugs: ['monthly-fee-defaulter-list', 'staff-appointment-letter', 'school-infrastructure-audit-checklist']
  },
  {
    slug: 'no-dues-certificate-staff',
    title: 'No Dues Certificate for Staff',
    category: 'Finance',
    shortDescription: 'Final clearance form for employees leaving the institution.',
    longDescription: `
      <p>When an employee resigns or retires, ensuring a clean exit is as important as a smooth entry. The <strong>No Dues Certificate for Staff</strong> is the final clearance document that confirms the individual has returned all school property and has no outstanding financial liabilities. This template is a safeguard for the school management, preventing the loss of assets such as library books, laptops, lab equipment, or advanced salary payments. It is an essential part of the HR lifecycle in any professional educational institution.</p>
      <p>The form features a <strong>Multi-department Sign-off Grid</strong>, requiring initials from the Librarian, Lab Assistant, IT Manager, Sports Department, and the Accounts Head. Only once all columns are cleared is the final settlement processed. This systematic approach ensures that the handover process is thorough and that the relationship between the staff member and the school ends on a transparent and professional note.</p>
      <p>SchoolERP automates this tedious 'No Dues' process through its <strong>Exit Management Workflow</strong>. When an HR admin initiates a staff member's exit, the ERP automatically checks their linked assets in the inventory and library modules. If a staff member has an unreturned book or an assigned laptop, the system flags it. Digital clearance requests are sent to the respective department heads, who can click "Approve" after verifying. The final salary and gratuity are calculated automatically only after the 'Full & Final Clearance' is digitally received. This reduces the time taken for settlements from days to minutes and ensures 100% asset recovery.</p>
    `,
    features: [
      'Multi-department Clearance Grid',
      'Asset Recovery Tracking',
      'Final Settlement Integration',
      'Digital Approval Routing',
      'Audit-ready Exit Records'
    ],
    image: '/template-images/no-dues-certificate-staff.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['staff-appointment-letter', 'experience-certificate-teacher', 'monthly-fee-defaulter-list']
  },
  {
    slug: 'experience-certificate-teacher',
    title: 'Teacher Experience Certificate',
    category: 'HR',
    shortDescription: 'Professional testimonial of service, tenure, and teaching expertise.',
    longDescription: `
      <p>The <strong>Experience Certificate</strong> is a vital document for teachers as they progress in their careers. It serves as a formal endorsement of their service period, subjects taught, and their contribution to the school's growth. A well-written certificate reflects the professionalism of the issuing school and provides a clear picture of the teacher's expertise to future employers. In India, where teaching standards are increasingly scrutinized by boards and accreditation bodies, having a detailed experience record is essential.</p>
      <p>This template includes the teacher's designation, the duration of employment, and specific praise for their <strong>Pedagogical Skills and Professional Conduct</strong>. It also mentions their involvement in co-curricular activities and any leadership roles they held (e.g., Head of Department). The layout is elegant and uses formal language, printed on the school's letterhead to ensure authenticity and respect for the outgoing staff member's contributions.</p>
      <p>SchoolERP makes the generation of these certificates effortless. The system maintains a complete <strong>Career Profile</strong> for every teacher, including their performance reviews, attendance history, and professional development milestones. When the HR admin needs to issue an experience certificate, the ERP pulls these details automatically. It can even customize the tone based on the teacher's final performance rating. Certificates produced through the system are digitally signed and can be verified by future employers through a secure portal, adding an extra layer of credibility to the teacher's resume and the school's processes.</p>
    `,
    features: [
      'Formal Professional Testimonial',
      'Subject & Tenure Verification',
      'Soft Skills & Leadership Mention',
      'Institutional Letterhead Design',
      'Instant Digital Issuance'
    ],
    image: '/template-images/experience-certificate-teacher.png',
    downloadFormat: 'Word',
    relatedSlugs: ['staff-appointment-letter', 'no-dues-certificate-staff', 'character-certificate']
  },
  {
    slug: 'student-health-record-card',
    title: 'Student Health Record Card',
    category: 'Admin',
    shortDescription: 'Basic medical history and emergency health tracking for school students.',
    longDescription: `
      <p>Ensuring the physical well-being of students is a primary responsibility of any school. The <strong>Student Health Record Card</strong> is a comprehensive template used to document a student's medical history, allergies, vaccination status, and periodic physical measurements (Height/Weight/BMI). In the Indian school context, where seasonal illnesses and nutritional monitoring are critical, having a centralized health record allows the school to respond effectively to medical emergencies and support the child's growth.</p>
      <p>The card features sections for <strong>Blood Group Tracking</strong>, Emergency Contacts, and Chronic Conditions (like asthma or diabetes). It also includes a "Periodic Medical Examination" table where the school nurse or visiting doctor can log vision and dental health during annual checkups. By maintaining these records, schools can provide parents with valuable insights into their child's health and ensure that the physical education department plans activities suited to each student's capabilities.</p>
      <p>With SchoolERP, the Health Record card is a live digital profile available to authorized personnel, such as <strong>School Infirmary Staff and Class Teachers</strong>. Parents can update their child's medical information and upload vaccination certificates via the mobile app. In case of an emergency, the infirmary can instantly access the student's allergy information and parent's phone number with a single search. The ERP also generates "Class-wise Health Reports," helping the management identify trends like an outbreak of flu or a need for better nutrition programs. This digital-first health tracking system ensures that a student’s safety is always prioritized and backed by data.</p>
    `,
    features: [
      'Weight, Height & BMI Tracking',
      'Allergy & Medication Alerts',
      'Vaccination History Section',
      'Vision & Dental Checkup Log',
      'Emergency Contact Integration'
    ],
    image: '/template-images/student-health-record-card.png',
    downloadFormat: 'PDF',
    relatedSlugs: ['school-admission-form', 'hostel-admission-form', 'bonafide-certificate-format']
  }
];