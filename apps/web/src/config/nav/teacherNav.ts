import type { NavItemConfig, NavSectionConfig, RoleNavConfig } from "./types";

export const TEACHER_NAV_SECTIONS: NavSectionConfig[] = [
  { id: "teacher_core", label: "Teacher App", kind: "core" },
];

export const TEACHER_NAV_ITEMS: NavItemConfig[] = [
  { id: "dashboard", href: "/teacher/dashboard", label: "Dashboard", iconKey: "layout_dashboard", permission: "dashboard:view", sectionId: "teacher_core" },
  { id: "attendance_management", href: "/teacher/attendance", label: "Attendance Management", iconKey: "calendar_check", permission: "attendance:write", sectionId: "teacher_core" },
  { id: "my_timetable", href: "/teacher/timetable", label: "My Timetable", iconKey: "calendar_days", permission: "academics:read", sectionId: "teacher_core" },
  { id: "homework", href: "/teacher/homework", label: "Homework", iconKey: "book_open", permission: "sis:read", sectionId: "teacher_core" },
  { id: "parent_remarks", href: "/teacher/remarks", label: "Parent Remarks", iconKey: "message_square", permission: "sis:write", sectionId: "teacher_core" },
  { id: "my_leaves", href: "/teacher/leaves", label: "My Leaves", iconKey: "file_text", permission: "hrms:read", sectionId: "teacher_core" },
  { id: "knowledgebase", href: "/teacher/kb", label: "Knowledgebase", iconKey: "book_open", permission: "sis:read", sectionId: "teacher_core" },
  { id: "exams_report_cards", href: "/teacher/exams/marks", label: "Exams & Report Cards", iconKey: "graduation_cap", permission: "exams:write", sectionId: "teacher_core" },
  { id: "parent_communication", href: "/teacher/notices", label: "Parent Communication", iconKey: "file_text", permission: "notices:read", sectionId: "teacher_core" },
  { id: "my_profile", href: "/teacher/profile", label: "My Profile", iconKey: "user", sectionId: "teacher_core" },
];

export const TEACHER_NAV_CONFIG: RoleNavConfig = {
  role: "teacher",
  sections: TEACHER_NAV_SECTIONS,
  items: TEACHER_NAV_ITEMS,
};
