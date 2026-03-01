import type { NavItemConfig, NavSectionConfig, RoleNavConfig } from "./types";

export const STUDENT_NAV_SECTIONS: NavSectionConfig[] = [
  { id: "student_core", label: "Student App", kind: "core" },
];

export const STUDENT_NAV_ITEMS: NavItemConfig[] = [
  { id: "dashboard", href: "/student/dashboard", label: "Dashboard", iconKey: "layout_dashboard", sectionId: "student_core" },
  { id: "my_profile", href: "/student/profile", label: "My Profile", iconKey: "user", sectionId: "student_core" },
];

export const STUDENT_NAV_CONFIG: RoleNavConfig = {
  role: "student",
  sections: STUDENT_NAV_SECTIONS,
  items: STUDENT_NAV_ITEMS,
};
