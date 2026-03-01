export type NavSectionKind = "core" | "advanced" | "support";

export type NavSectionConfig = {
  id: string;
  label: string;
  kind: NavSectionKind;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export type NavItemConfig = {
  id: string;
  href: string;
  label: string;
  iconKey: string;
  permission?: string;
  activePrefixes?: string[];
  sectionId: string;
  isAdvancedModule?: boolean;
};

export type RoleNavConfig = {
  role: string;
  sections: NavSectionConfig[];
  items: NavItemConfig[];
};
