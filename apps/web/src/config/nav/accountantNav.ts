import type { NavItemConfig, NavSectionConfig, RoleNavConfig } from "./types";

export const ACCOUNTANT_NAV_SECTIONS: NavSectionConfig[] = [
  { id: "fees_dues", label: "Fee Collection & Accounting", kind: "core" },
];

export const ACCOUNTANT_NAV_ITEMS: NavItemConfig[] = [
  { id: "dashboard", href: "/accountant/dashboard", label: "Dashboard", iconKey: "layout_dashboard", permission: "dashboard:view", sectionId: "fees_dues" },
  { id: "fees_dues_collection", href: "/accountant/fees", label: "Fees & Dues Collection", iconKey: "banknote", permission: "fees:write", sectionId: "fees_dues" },
  { id: "receipts_settlements", href: "/accountant/payments", label: "Receipts & Settlements", iconKey: "credit_card", permission: "fees:write", sectionId: "fees_dues" },
];

export const ACCOUNTANT_NAV_CONFIG: RoleNavConfig = {
  role: "accountant",
  sections: ACCOUNTANT_NAV_SECTIONS,
  items: ACCOUNTANT_NAV_ITEMS,
};
