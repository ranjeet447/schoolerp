import type { NavItemConfig, NavSectionConfig, RoleNavConfig } from "./types";

export const PARENT_NAV_SECTIONS: NavSectionConfig[] = [
  { id: "parent_core", label: "Parent App / Parent Portal", kind: "core" },
];

export const PARENT_NAV_ITEMS: NavItemConfig[] = [
  { id: "dashboard", href: "/parent/dashboard", label: "Dashboard", iconKey: "layout_dashboard", permission: "dashboard:view", sectionId: "parent_core" },
  { id: "student_profile", href: "/parent/children", label: "Student Profile & Attendance", iconKey: "users", permission: "sis:read", sectionId: "parent_core" },
  { id: "homework", href: "/parent/homework", label: "Homework", iconKey: "book_open", permission: "sis:read", sectionId: "parent_core" },
  { id: "knowledgebase", href: "/parent/kb", label: "Knowledgebase", iconKey: "book_open", permission: "sis:read", sectionId: "parent_core" },
  { id: "fees_dues", href: "/parent/fees", label: "Fees & Dues", iconKey: "banknote", permission: "fees:read", sectionId: "parent_core" },
  { id: "exams_results", href: "/parent/results", label: "Exams & Results", iconKey: "graduation_cap", permission: "exams:read", sectionId: "parent_core" },
  { id: "parent_communication", href: "/parent/notices", label: "Parent Communication", iconKey: "file_text", permission: "notices:read", sectionId: "parent_core" },
  { id: "attendance_leave", href: "/parent/leaves", label: "Attendance & Leave", iconKey: "message_square", permission: "attendance:write", sectionId: "parent_core" },
  { id: "my_profile", href: "/parent/profile", label: "My Profile", iconKey: "user", sectionId: "parent_core" },
];

export const PARENT_NAV_CONFIG: RoleNavConfig = {
  role: "parent",
  sections: PARENT_NAV_SECTIONS,
  items: PARENT_NAV_ITEMS,
};
