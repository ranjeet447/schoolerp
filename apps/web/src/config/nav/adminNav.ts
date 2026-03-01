import type { NavItemConfig, NavSectionConfig, RoleNavConfig } from "./types";

export const ADMIN_CORE_PILLAR_IDS = ["fees_dues", "parent_comm", "attendance", "exams"] as const;
export const ADMIN_ADVANCED_SECTION_ID = "advanced_modules" as const;

export const ADMIN_NAV_SECTIONS: NavSectionConfig[] = [
  { id: "overview", label: "Overview", kind: "support" },
  { id: "student_profile_admissions", label: "Student Profile & Admissions", kind: "support" },
  { id: "fees_dues", label: "Online Fee Collection & Dues Management", kind: "core" },
  { id: "parent_comm", label: "Parent Communication & Parent App", kind: "core" },
  { id: "attendance", label: "Attendance Management", kind: "core" },
  { id: "exams", label: "Exam Management, Results & Report Cards", kind: "core" },
  { id: ADMIN_ADVANCED_SECTION_ID, label: "Advanced Modules", kind: "advanced", collapsible: true, defaultOpen: true },
  { id: "administration", label: "Administration", kind: "support" },
];

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  { id: "dashboard", href: "/admin/dashboard", label: "Dashboard", iconKey: "layout_dashboard", permission: "dashboard:view", sectionId: "overview" },
  { id: "student_remarks", href: "/admin/diary", label: "Student Remarks", iconKey: "book_open", permission: "sis:read", sectionId: "parent_comm" },
  { id: "reception_hub", href: "/admin/reception", label: "Reception Hub", iconKey: "school", permission: "sis:read", sectionId: "student_profile_admissions" },
  { id: "admissions", href: "/admin/admissions/enquiries", label: "Admissions", iconKey: "clipboard_list", permission: "sis:read", sectionId: "student_profile_admissions" },
  { id: "visitor_logs", href: "/admin/safety/visitors", label: "Visitor Logs", iconKey: "clock", permission: "safety:read", sectionId: ADMIN_ADVANCED_SECTION_ID, isAdvancedModule: true },
  { id: "attendance_management", href: "/admin/attendance", label: "Attendance Management", iconKey: "calendar_check", permission: "attendance:read", sectionId: "attendance" },
  { id: "staff_attendance", href: "/admin/staff-attendance", label: "Staff Attendance", iconKey: "clock", permission: "attendance:read", sectionId: "attendance" },
  { id: "timetable", href: "/admin/timetable", label: "Timetable", iconKey: "calendar_days", permission: "attendance:read", sectionId: "attendance" },
  { id: "fee_collection_accounting", href: "/admin/finance", label: "Fee Collection & Accounting", iconKey: "banknote", permission: "fees:read", sectionId: "fees_dues" },
  { id: "fee_counter", href: "/admin/finance/counter", label: "Fee Collection Counter", iconKey: "banknote", permission: "fees:read", sectionId: "fees_dues" },
  { id: "approvals", href: "/admin/approvals", label: "Approvals Inbox", iconKey: "check_circle", permission: "fees:read", sectionId: "fees_dues" },
  { id: "office_reports", href: "/admin/reports", label: "Office Reports", iconKey: "printer", permission: "fees:read", sectionId: "fees_dues" },
  { id: "exams", href: "/admin/exams", label: "Exams & Report Cards", iconKey: "graduation_cap", permission: "exams:read", sectionId: "exams" },
  { id: "parent_communication", href: "/admin/communication", label: "Parent Communication", iconKey: "message_square", permission: "notices:read", sectionId: "parent_comm" },
  { id: "knowledgebase", href: "/admin/kb", label: "Knowledgebase", iconKey: "book_open", permission: "notices:read", sectionId: "parent_comm" },
  { id: "certificates", href: "/admin/certificates", label: "TC & Certificates", iconKey: "file_check", permission: "sis:read", sectionId: "exams" },
  { id: "notices_circulars", href: "/admin/notices", label: "Notices & Circulars", iconKey: "file_text", permission: "notices:read", sectionId: "parent_comm" },
  { id: "promotions", href: "/admin/students/promotion", label: "Year-end Promotion", iconKey: "graduation_cap", permission: "sis:write", sectionId: "student_profile_admissions" },
  { id: "houses", href: "/admin/houses", label: "Houses", iconKey: "shield", permission: "sis:read", sectionId: "student_profile_admissions" },
  { id: "custom_fields", href: "/admin/custom-fields", label: "Custom Fields", iconKey: "sliders", permission: "tenant:settings:view", sectionId: ADMIN_ADVANCED_SECTION_ID, isAdvancedModule: true },
  { id: "bulk_import", href: "/admin/bulk-import", label: "Bulk Import", iconKey: "upload", permission: "sis:write", sectionId: ADMIN_ADVANCED_SECTION_ID, isAdvancedModule: true },
  { id: "school_calendar", href: "/admin/calendar", label: "School Calendar", iconKey: "calendar_days", permission: "attendance:read", sectionId: "attendance" },
  { id: "hostel_module", href: "/admin/hostel", label: "Hostel Module", iconKey: "home", permission: "sis:read", sectionId: ADMIN_ADVANCED_SECTION_ID, isAdvancedModule: true },
  { id: "id_cards", href: "/admin/id-cards", label: "Digital ID Cards", iconKey: "credit_card", permission: "sis:read", sectionId: ADMIN_ADVANCED_SECTION_ID, isAdvancedModule: true },
  { id: "learning_resources", href: "/admin/learning-resources", label: "Learning Resources", iconKey: "book_open", permission: "notices:read", sectionId: ADMIN_ADVANCED_SECTION_ID, isAdvancedModule: true },
  { id: "school_profile", href: "/admin/school-profile", label: "School Profile", iconKey: "building", permission: "tenant:settings:view", sectionId: "administration" },
  { id: "platform_plan", href: "/admin/plan", label: "Platform Plan", iconKey: "layers", permission: "tenant:settings:view", sectionId: "administration" },
  { id: "platform_billing", href: "/admin/billing", label: "Platform Billing", iconKey: "credit_card", permission: "tenant:settings:view", sectionId: "administration" },
  {
    id: "user_access",
    href: "/admin/settings/users",
    label: "User & Access",
    iconKey: "shield",
    permission: "tenant:users:manage",
    activePrefixes: ["/admin/settings/users", "/admin/settings/roles", "/admin/settings/permissions", "/admin/settings/access"],
    sectionId: "administration",
  },
  { id: "school_onboarding", href: "/admin/settings/onboarding", label: "School Onboarding", iconKey: "school", permission: "platform:manage", sectionId: "administration" },
  { id: "smart_alerts", href: "/admin/settings/templates", label: "Smart Alerts", iconKey: "message_square", permission: "tenant:settings:view", sectionId: "administration" },
  { id: "my_profile", href: "/admin/settings/profile", label: "My Profile", iconKey: "user", sectionId: "administration" },
  { id: "master_data", href: "/admin/settings/master-data", label: "Classes, Sections & Subjects", iconKey: "settings", permission: "tenant:settings:view", sectionId: "administration" },
];

export const ADMIN_NAV_CONFIG: RoleNavConfig = {
  role: "tenant_admin",
  sections: ADMIN_NAV_SECTIONS,
  items: ADMIN_NAV_ITEMS,
};
