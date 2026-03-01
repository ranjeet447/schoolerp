import test from "node:test";
import assert from "node:assert/strict";
import {
  type AdminNavShape,
  validateAdminNavStructure,
  validateMarketingRouteModule,
  validateModuleVisibilityPersistence,
  validatePillarScreenshotUsage,
  validateTerminologyCleanup,
} from "../verify-refocus-lib.ts";

function makeValidAdminNav(): AdminNavShape {
  return {
    ADMIN_CORE_PILLAR_IDS: ["fees_dues", "parent_comm", "attendance", "exams"],
    ADMIN_ADVANCED_SECTION_ID: "advanced_modules",
    ADMIN_NAV_SECTIONS: [
      { id: "fees_dues", label: "Online Fee Collection & Dues Management", kind: "core" },
      { id: "parent_comm", label: "Parent Communication & Parent App", kind: "core" },
      { id: "attendance", label: "Attendance Management", kind: "core" },
      { id: "exams", label: "Exam Management, Results & Report Cards", kind: "core" },
      { id: "advanced_modules", label: "Advanced Modules", kind: "advanced", collapsible: true },
    ],
    ADMIN_NAV_ITEMS: [
      { id: "fees", href: "/admin/finance", label: "Fee Collection & Accounting", sectionId: "fees_dues" },
      { id: "comm", href: "/admin/communication", label: "Parent Communication", sectionId: "parent_comm" },
      { id: "att", href: "/admin/attendance", label: "Attendance Management", sectionId: "attendance" },
      { id: "exam", href: "/admin/exams", label: "Exams & Report Cards", sectionId: "exams" },
      { id: "hostel_module", href: "/admin/hostel", label: "Hostel Module", sectionId: "advanced_modules", isAdvancedModule: true },
      { id: "id_cards", href: "/admin/id-cards", label: "Digital ID Cards", sectionId: "advanced_modules", isAdvancedModule: true },
      { id: "learning_resources", href: "/admin/learning-resources", label: "Learning Resources", sectionId: "advanced_modules", isAdvancedModule: true },
    ],
  };
}

test("validateAdminNavStructure fails when required section IDs are missing", () => {
  const nav = makeValidAdminNav();
  nav.ADMIN_NAV_SECTIONS = nav.ADMIN_NAV_SECTIONS.filter((s) => s.id !== "parent_comm");
  const errors = validateAdminNavStructure(nav);
  assert.ok(errors.some((err) => err.includes('missing core section "parent_comm"')));
});

test("validateMarketingRouteModule ignores comments (fails if keywords only in comments)", () => {
  const source = `
    // export const metadata = { keywords: ["school fee management software"] }
    export const metadata = { title: "Demo page", description: "No keyword cluster here" };
  `;
  const errors = validateMarketingRouteModule(source, {
    route: "/features",
    file: "apps/marketing/src/app/features/page.tsx",
    requiredKeywords: ["school fee management software"],
    minKeywordMatches: 1,
  });
  assert.ok(errors.some((err) => err.includes("keyword cluster too weak")));
});

test("validateMarketingRouteModule passes with metadata export and keyword cluster", () => {
  const source = `
    export const metadata = {
      title: "School ERP Features",
      keywords: ["school fee management software", "school attendance management system"]
    };
  `;
  const errors = validateMarketingRouteModule(source, {
    route: "/features",
    file: "apps/marketing/src/app/features/page.tsx",
    requiredKeywords: ["school fee management software", "school attendance management system"],
    minKeywordMatches: 2,
  });
  assert.equal(errors.length, 0);
});

test("validateModuleVisibilityPersistence fails when endpoint wiring is missing", () => {
  const errors = validateModuleVisibilityPersistence(
    `const ADVANCED_MODULES_HIDDEN_KEY = "schoolerp:ui:advanced_modules_hidden";`,
    `r.Route("/admin", func(r chi.Router) {})`,
    `func (h *Handler) UpdateConfig(w http.ResponseWriter, r *http.Request) {}`,
  );
  assert.ok(errors.some((err) => err.includes("/admin/settings/preferences")));
});

test("validateModuleVisibilityPersistence passes when frontend and backend wiring exists", () => {
  const errors = validateModuleVisibilityPersistence(
    `
      export const ADVANCED_MODULES_HIDDEN_KEY = "schoolerp:ui:advanced_modules_hidden";
      const PREFERENCES_ENDPOINT = "/admin/settings/preferences";
      async function load() { return apiClient(PREFERENCES_ENDPOINT); }
    `,
    `
      r.Get("/settings/preferences", tenantHandler.GetPreferences)
      r.Put("/settings/preferences", tenantHandler.UpdatePreferences)
    `,
    `
      func (h *Handler) GetPreferences(w http.ResponseWriter, r *http.Request) {}
      func (h *Handler) UpdatePreferences(w http.ResponseWriter, r *http.Request) {}
    `,
  );
  assert.equal(errors.length, 0);
});

test("validateTerminologyCleanup fails when legacy labels remain", () => {
  const errors = validateTerminologyCleanup(
    `<TabsTrigger value="finance">Finance</TabsTrigger>`,
    `const categories = ["All", "Finance", "Communication"]`,
  );
  assert.ok(errors.some((err) => err.includes("Fee Collection & Accounting")));
  assert.ok(errors.some((err) => err.includes("Fees & Dues")));
  assert.ok(errors.some((err) => err.includes("Parent Communication")));
});

test("validatePillarScreenshotUsage requires MockupFrame and product screenshots", () => {
  const errors = validatePillarScreenshotUsage(
    `export default function Home(){ return <div>No frames</div> }`,
    `export default function Features(){ return <div>No screenshots</div> }`,
  );
  assert.ok(errors.some((err) => err.includes("MockupFrame")));
  assert.ok(errors.some((err) => err.includes("product screenshots")));
});
