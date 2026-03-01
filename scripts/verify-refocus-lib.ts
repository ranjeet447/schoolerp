import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type Status = "Not Started" | "In Progress" | "Done";

export type NavSectionConfig = {
  id: string;
  label: string;
  kind: "core" | "advanced" | "support";
  collapsible?: boolean;
};

export type NavItemConfig = {
  id: string;
  href: string;
  label: string;
  sectionId: string;
  isAdvancedModule?: boolean;
};

export type AdminNavShape = {
  ADMIN_CORE_PILLAR_IDS: readonly string[];
  ADMIN_ADVANCED_SECTION_ID: string;
  ADMIN_NAV_SECTIONS: NavSectionConfig[];
  ADMIN_NAV_ITEMS: NavItemConfig[];
};

export type MarketingRouteSpec = {
  route: string;
  file: string;
  requiredKeywords: string[];
  minKeywordMatches: number;
};

export type Tracker = {
  version: number;
  owner: string;
  last_updated: string;
  advanced_modules_policy: {
    status: Status;
  };
  pillars: Array<{
    pillar_id: string;
    name: string;
    web_app_changes: Array<{ id: string; status: Status }>;
    marketing_changes: Array<{ id: string; status: Status }>;
    test_updates: Array<{ id: string; status: Status }>;
  }>;
  global_checks: Array<{ id: string; status: Status }>;
};

const VALID_STATUSES = new Set<Status>(["Not Started", "In Progress", "Done"]);

export const MARKETING_ROUTE_SPECS: MarketingRouteSpec[] = [
  {
    route: "/",
    file: "apps/marketing/src/app/page.tsx",
    requiredKeywords: [
      "school fee management software",
      "parent communication app for schools",
      "school attendance management system",
      "exam management software for schools",
    ],
    minKeywordMatches: 3,
  },
  {
    route: "/features",
    file: "apps/marketing/src/app/features/page.tsx",
    requiredKeywords: [
      "school fee management software",
      "parent communication app for schools",
      "school attendance management system",
      "report card software for schools",
    ],
    minKeywordMatches: 2,
  },
  {
    route: "/pricing",
    file: "apps/marketing/src/app/pricing/page.tsx",
    requiredKeywords: [
      "school erp pricing",
      "school erp add-on pricing",
      "school sms credits pricing",
    ],
    minKeywordMatches: 2,
  },
  {
    route: "/use-cases",
    file: "apps/marketing/src/app/use-cases/page.tsx",
    requiredKeywords: [
      "school fee collection software",
      "parent communication app for schools",
      "exam management software for schools",
    ],
    minKeywordMatches: 2,
  },
  {
    route: "/integrations",
    file: "apps/marketing/src/app/integrations/page.tsx",
    requiredKeywords: [
      "razorpay school fee collection integration",
      "microsoft 365 education teams integration school",
      "biometric attendance for schools",
    ],
    minKeywordMatches: 2,
  },
  {
    route: "/product",
    file: "apps/marketing/src/app/product/page.tsx",
    requiredKeywords: [
      "Fee Collection",
      "Parent App",
      "Attendance",
      "Exams",
    ],
    minKeywordMatches: 3,
  },
  {
    route: "/book-demo",
    file: "apps/marketing/src/app/book-demo/page.tsx",
    requiredKeywords: [
      "book school erp demo",
      "fee collection",
      "parent app",
    ],
    minKeywordMatches: 1,
  },
];

export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

export function hasMetadataExport(source: string): boolean {
  const code = stripComments(source);
  return (
    /export\s+(const|let|var)\s+metadata\b/.test(code) ||
    /export\s+async\s+function\s+generateMetadata\b/.test(code) ||
    /export\s+function\s+generateMetadata\b/.test(code)
  );
}

export function validateTrackerShape(tracker: Tracker): string[] {
  const errors: string[] = [];
  if (typeof tracker.version !== "number") errors.push("tracker.version must be a number");
  if (!tracker.owner) errors.push("tracker.owner is required");
  if (!tracker.last_updated) errors.push("tracker.last_updated is required");

  if (!VALID_STATUSES.has(tracker.advanced_modules_policy?.status)) {
    errors.push(`advanced_modules_policy: invalid status "${tracker.advanced_modules_policy?.status}"`);
  }

  const allItems = [
    ...tracker.pillars.flatMap((pillar) => [
      ...pillar.web_app_changes,
      ...pillar.marketing_changes,
      ...pillar.test_updates,
    ]),
    ...tracker.global_checks,
  ];

  for (const item of allItems) {
    if (!VALID_STATUSES.has(item.status)) {
      errors.push(`tracker item "${item.id}" has invalid status "${item.status}"`);
    }
  }

  return errors;
}

export function validateAdminNavStructure(config: AdminNavShape): string[] {
  const errors: string[] = [];
  const expectedCore: Array<{ id: string; label: string }> = [
    { id: "fees_dues", label: "Online Fee Collection & Dues Management" },
    { id: "parent_comm", label: "Parent Communication & Parent App" },
    { id: "attendance", label: "Attendance Management" },
    { id: "exams", label: "Exam Management, Results & Report Cards" },
  ];

  const sectionMap = new Map(config.ADMIN_NAV_SECTIONS.map((section) => [section.id, section]));
  const itemMap = new Map(config.ADMIN_NAV_ITEMS.map((item) => [item.id, item]));

  for (const section of expectedCore) {
    const match = sectionMap.get(section.id);
    if (!match) {
      errors.push(`admin nav missing core section "${section.id}"`);
      continue;
    }
    if (match.label !== section.label) {
      errors.push(`admin nav section "${section.id}" label mismatch: expected "${section.label}", got "${match.label}"`);
    }
    if (match.kind !== "core") {
      errors.push(`admin nav section "${section.id}" must be kind=core`);
    }
  }

  const advancedSection = sectionMap.get(config.ADMIN_ADVANCED_SECTION_ID);
  if (!advancedSection) {
    errors.push(`admin nav missing advanced section "${config.ADMIN_ADVANCED_SECTION_ID}"`);
  } else {
    if (advancedSection.kind !== "advanced") {
      errors.push(`advanced section "${config.ADMIN_ADVANCED_SECTION_ID}" must be kind=advanced`);
    }
    if (!advancedSection.collapsible) {
      errors.push(`advanced section "${config.ADMIN_ADVANCED_SECTION_ID}" must be collapsible`);
    }
  }

  const duplicateItemIds = findDuplicates(config.ADMIN_NAV_ITEMS.map((item) => item.id));
  if (duplicateItemIds.length > 0) {
    errors.push(`admin nav has duplicate item ids: ${duplicateItemIds.join(", ")}`);
  }

  const duplicateHrefs = findDuplicates(config.ADMIN_NAV_ITEMS.map((item) => item.href));
  if (duplicateHrefs.length > 0) {
    errors.push(`admin nav has duplicate hrefs: ${duplicateHrefs.join(", ")}`);
  }

  const coreSectionIds = new Set(expectedCore.map((section) => section.id));
  for (const item of config.ADMIN_NAV_ITEMS) {
    if (!sectionMap.has(item.sectionId)) {
      errors.push(`nav item "${item.id}" references unknown section "${item.sectionId}"`);
    }

    if (item.isAdvancedModule && coreSectionIds.has(item.sectionId)) {
      errors.push(`advanced item "${item.id}" is incorrectly placed in core section "${item.sectionId}"`);
    }
  }

  // Require at least one item under each core section and advanced section
  for (const sectionId of [...coreSectionIds, config.ADMIN_ADVANCED_SECTION_ID]) {
    const count = config.ADMIN_NAV_ITEMS.filter((item) => item.sectionId === sectionId).length;
    if (count === 0) {
      errors.push(`section "${sectionId}" has no nav items`);
    }
  }

  // Ensure the IDs list itself was not altered to fake labels elsewhere
  for (const id of expectedCore.map((section) => section.id)) {
    if (!config.ADMIN_CORE_PILLAR_IDS.includes(id)) {
      errors.push(`ADMIN_CORE_PILLAR_IDS missing "${id}"`);
    }
  }

  // Ensure IDs in list are real section IDs
  for (const id of config.ADMIN_CORE_PILLAR_IDS) {
    if (!sectionMap.has(id)) {
      errors.push(`ADMIN_CORE_PILLAR_IDS references unknown section "${id}"`);
    }
  }

  // Ensure key labels actually come from nav config items, not comments elsewhere.
  const requiredLabels = [
    "Fee Collection & Accounting",
    "Parent Communication",
    "Attendance Management",
    "Exams & Report Cards",
  ];
  const labels = new Set(config.ADMIN_NAV_ITEMS.map((item) => item.label));
  for (const label of requiredLabels) {
    if (!labels.has(label)) {
      errors.push(`required admin nav item label missing: "${label}"`);
    }
  }

  // Ensure advanced section contains true advanced modules.
  const advancedItems = config.ADMIN_NAV_ITEMS.filter((item) => item.sectionId === config.ADMIN_ADVANCED_SECTION_ID);
  if (!advancedItems.some((item) => item.isAdvancedModule)) {
    errors.push(`advanced section "${config.ADMIN_ADVANCED_SECTION_ID}" has no items marked isAdvancedModule=true`);
  }

  // Ensure expected key module IDs exist.
  for (const requiredId of ["hostel_module", "id_cards", "learning_resources"]) {
    if (!itemMap.has(requiredId)) {
      errors.push(`required advanced nav item missing: "${requiredId}"`);
    }
  }

  return errors;
}

export function validateMarketingRouteModule(source: string, spec: MarketingRouteSpec): string[] {
  const errors: string[] = [];
  const stripped = stripComments(source);

  if (!hasMetadataExport(stripped)) {
    errors.push(`${spec.route}: missing metadata export/generateMetadata`);
    return errors;
  }

  let matched = 0;
  for (const keyword of spec.requiredKeywords) {
    if (stripped.includes(keyword)) {
      matched += 1;
    }
  }

  if (matched < spec.minKeywordMatches) {
    errors.push(`${spec.route}: keyword cluster too weak (${matched}/${spec.minKeywordMatches} matched)`);
  }

  return errors;
}

export function validateSitemapSource(source: string): string[] {
  const errors: string[] = [];
  const stripped = stripComments(source);

  if (!stripped.includes("'/features'") && !stripped.includes("\"/features\"")) {
    errors.push("sitemap: missing /features route");
  }

  if (!/FEATURES_DATA\.map\(/.test(stripped)) {
    errors.push("sitemap: missing FEATURES_DATA map inclusion");
  }

  if (!/USE_CASES_DATA\.map\(/.test(stripped)) {
    errors.push("sitemap: missing USE_CASES_DATA map inclusion");
  }

  if (!/INTEGRATIONS_DATA\.map\(/.test(stripped)) {
    errors.push("sitemap: missing INTEGRATIONS_DATA map inclusion");
  }

  return errors;
}

export function validatePillarCoverageData(featuresSource: string, useCasesSource: string): string[] {
  const errors: string[] = [];
  const features = stripComments(featuresSource);
  const useCases = stripComments(useCasesSource);
  const requiredFeatureSlugs = [
    "fee-management-software",
    "attendance-management",
    "report-card-generator",
  ];
  const requiredUseCaseSlugs = ["fees-collection-and-defaulters"];

  for (const slug of requiredFeatureSlugs) {
    if (!features.includes(`slug: "${slug}"`) && !features.includes(`slug: '${slug}'`)) {
      errors.push(`pillar coverage: missing feature slug "${slug}"`);
    }
  }

  for (const slug of requiredUseCaseSlugs) {
    if (!useCases.includes(`slug: "${slug}"`) && !useCases.includes(`slug: '${slug}'`)) {
      errors.push(`pillar coverage: missing use-case slug "${slug}"`);
    }
  }

  return errors;
}

export function validateTerminologyCleanup(adminReportsSource: string, templatesSource: string): string[] {
  const errors: string[] = [];
  const adminReports = stripComments(adminReportsSource);
  const templates = stripComments(templatesSource);

  if (!adminReports.includes("Fee Collection & Accounting")) {
    errors.push("terminology cleanup: admin reports tab is missing \"Fee Collection & Accounting\"");
  }

  if (!templates.includes("Fees & Dues")) {
    errors.push("terminology cleanup: templates page is missing \"Fees & Dues\" label");
  }

  if (!templates.includes("Parent Communication")) {
    errors.push("terminology cleanup: templates page is missing \"Parent Communication\" label");
  }

  return errors;
}

export function validateModuleVisibilityPersistence(
  moduleVisibilitySource: string,
  apiMainSource: string,
  tenantHandlerSource: string,
): string[] {
  const errors: string[] = [];
  const moduleVisibility = stripComments(moduleVisibilitySource);
  const apiMain = stripComments(apiMainSource);
  const tenantHandler = stripComments(tenantHandlerSource);

  if (!moduleVisibility.includes('"/admin/settings/preferences"')) {
    errors.push("module visibility: missing /admin/settings/preferences endpoint usage");
  }

  if (!moduleVisibility.includes("apiClient(")) {
    errors.push("module visibility: missing apiClient usage for tenant preference persistence");
  }

  if (!moduleVisibility.includes("ADVANCED_MODULES_HIDDEN_KEY")) {
    errors.push("module visibility: localStorage fallback key is missing");
  }

  if (!apiMain.includes(`r.Get("/settings/preferences", tenantHandler.GetPreferences)`)) {
    errors.push("module visibility: GET /admin/settings/preferences route is not registered");
  }

  if (!apiMain.includes(`r.Put("/settings/preferences", tenantHandler.UpdatePreferences)`)) {
    errors.push("module visibility: PUT /admin/settings/preferences route is not registered");
  }

  if (!tenantHandler.includes("func (h *Handler) GetPreferences(")) {
    errors.push("module visibility: tenant handler GetPreferences is missing");
  }

  if (!tenantHandler.includes("func (h *Handler) UpdatePreferences(")) {
    errors.push("module visibility: tenant handler UpdatePreferences is missing");
  }

  return errors;
}

export function validatePillarScreenshotUsage(homeSource: string, featuresClientSource: string): string[] {
  const errors: string[] = [];
  const home = stripComments(homeSource);
  const features = stripComments(featuresClientSource);

  if (!home.includes("MockupFrame")) {
    errors.push("marketing homepage: MockupFrame is missing for pillar screenshots");
  }
  if (!features.includes("MockupFrame")) {
    errors.push("marketing features page: MockupFrame is missing for pillar screenshots");
  }

  if (!home.includes("/product-screens/")) {
    errors.push("marketing homepage: product screenshots path is missing");
  }
  if (!features.includes("/product-screens/")) {
    errors.push("marketing features page: product screenshots path is missing");
  }

  return errors;
}

export async function loadAdminNavConfig(root: string): Promise<AdminNavShape> {
  const modulePath = pathToFileURL(path.join(root, "apps/web/src/config/nav/adminNav.ts")).href;
  const module = await import(modulePath);
  return {
    ADMIN_CORE_PILLAR_IDS: module.ADMIN_CORE_PILLAR_IDS,
    ADMIN_ADVANCED_SECTION_ID: module.ADMIN_ADVANCED_SECTION_ID,
    ADMIN_NAV_SECTIONS: module.ADMIN_NAV_SECTIONS,
    ADMIN_NAV_ITEMS: module.ADMIN_NAV_ITEMS,
  } as AdminNavShape;
}

export function readFile(root: string, relativePath: string): string {
  const filePath = path.join(root, relativePath);
  return fs.readFileSync(filePath, "utf8");
}

export function requireFile(root: string, relativePath: string, errors: string[]) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${relativePath}`);
    return false;
  }
  return true;
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dups.add(value);
    seen.add(value);
  }
  return Array.from(dups.values());
}
