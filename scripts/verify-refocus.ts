import fs from "node:fs";
import path from "node:path";
import {
  MARKETING_ROUTE_SPECS,
  loadAdminNavConfig,
  readFile,
  requireFile,
  type Tracker,
  validateAdminNavStructure,
  validateModuleVisibilityPersistence,
  validateMarketingRouteModule,
  validatePillarScreenshotUsage,
  validatePillarCoverageData,
  validateSitemapSource,
  validateTerminologyCleanup,
  validateTrackerShape,
} from "./verify-refocus-lib.ts";

const ROOT = process.cwd();
const TRACKER_PATH = path.join(ROOT, "docs", "feature-tracking", "refocus.json");

function readTracker(): Tracker {
  const raw = fs.readFileSync(TRACKER_PATH, "utf8");
  return JSON.parse(raw) as Tracker;
}

function percent(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

async function main() {
  const errors: string[] = [];

  // Tracker structure validation
  if (!fs.existsSync(TRACKER_PATH)) {
    console.error(`Missing tracker file: ${path.relative(ROOT, TRACKER_PATH)}`);
    process.exit(1);
  }
  const tracker = readTracker();
  errors.push(...validateTrackerShape(tracker));

  const allTrackerItems = [
    ...tracker.pillars.flatMap((pillar) => [
      ...pillar.web_app_changes,
      ...pillar.marketing_changes,
      ...pillar.test_updates,
    ]),
    ...tracker.global_checks,
  ];
  const totalItems = allTrackerItems.length + 1; // include advanced_modules_policy
  const doneItems =
    allTrackerItems.filter((item) => item.status === "Done").length +
    (tracker.advanced_modules_policy.status === "Done" ? 1 : 0);

  // Web nav structural checks
  const adminNav = await loadAdminNavConfig(ROOT);
  errors.push(...validateAdminNavStructure(adminNav));

  // Ensure role nav config files exist (source-of-truth split by role)
  const requiredNavFiles = [
    "apps/web/src/config/nav/adminNav.ts",
    "apps/web/src/config/nav/parentNav.ts",
    "apps/web/src/config/nav/teacherNav.ts",
    "apps/web/src/config/nav/accountantNav.ts",
    "apps/web/src/config/nav/studentNav.ts",
  ];
  for (const file of requiredNavFiles) {
    requireFile(ROOT, file, errors);
  }

  // Marketing route + metadata + keyword checks
  for (const spec of MARKETING_ROUTE_SPECS) {
    if (!requireFile(ROOT, spec.file, errors)) continue;
    const source = readFile(ROOT, spec.file);
    errors.push(...validateMarketingRouteModule(source, spec));
  }

  // Sitemap checks
  const sitemapPath = "apps/marketing/src/app/sitemap.ts";
  if (requireFile(ROOT, sitemapPath, errors)) {
    const sitemapSource = readFile(ROOT, sitemapPath);
    errors.push(...validateSitemapSource(sitemapSource));
  }

  // Pillar coverage checks from feature/use-case datasets
  const featuresDataPath = "packages/ui/src/data/features.ts";
  const useCasesDataPath = "packages/ui/src/data/use-cases.ts";
  if (requireFile(ROOT, featuresDataPath, errors) && requireFile(ROOT, useCasesDataPath, errors)) {
    const featuresSource = readFile(ROOT, featuresDataPath);
    const useCasesSource = readFile(ROOT, useCasesDataPath);
    errors.push(...validatePillarCoverageData(featuresSource, useCasesSource));
  }

  // Terminology cleanup checks
  const adminReportsPath = "apps/web/src/app/(admin)/admin/reports/page.tsx";
  const templatesPath = "apps/marketing/src/app/templates/page.tsx";
  if (requireFile(ROOT, adminReportsPath, errors) && requireFile(ROOT, templatesPath, errors)) {
    const adminReportsSource = readFile(ROOT, adminReportsPath);
    const templatesSource = readFile(ROOT, templatesPath);
    errors.push(...validateTerminologyCleanup(adminReportsSource, templatesSource));
  }

  // Module visibility persistence checks (server-backed + local fallback)
  const moduleVisibilityPath = "apps/web/src/lib/module-visibility.ts";
  const apiMainPath = "services/api/cmd/api/main.go";
  const tenantHandlerPath = "services/api/internal/handler/tenant/handler.go";
  if (
    requireFile(ROOT, moduleVisibilityPath, errors) &&
    requireFile(ROOT, apiMainPath, errors) &&
    requireFile(ROOT, tenantHandlerPath, errors)
  ) {
    const moduleVisibilitySource = readFile(ROOT, moduleVisibilityPath);
    const apiMainSource = readFile(ROOT, apiMainPath);
    const tenantHandlerSource = readFile(ROOT, tenantHandlerPath);
    errors.push(...validateModuleVisibilityPersistence(moduleVisibilitySource, apiMainSource, tenantHandlerSource));
  }

  // Pillar screenshot usage checks (real product screenshots + frame component)
  const homePath = "apps/marketing/src/app/page.tsx";
  const featuresClientPath = "apps/marketing/src/app/features/FeaturesClient.tsx";
  if (requireFile(ROOT, homePath, errors) && requireFile(ROOT, featuresClientPath, errors)) {
    const homeSource = readFile(ROOT, homePath);
    const featuresClientSource = readFile(ROOT, featuresClientPath);
    errors.push(...validatePillarScreenshotUsage(homeSource, featuresClientSource));
  }

  // Report summary
  console.log(`Refocus tracker: ${doneItems}/${totalItems} items complete (${percent(doneItems, totalItems)}%)`);
  console.log(`Tracker file: ${path.relative(ROOT, TRACKER_PATH)}`);
  for (const pillar of tracker.pillars) {
    const pillarItems = [
      ...pillar.web_app_changes,
      ...pillar.marketing_changes,
      ...pillar.test_updates,
    ];
    const done = pillarItems.filter((item) => item.status === "Done").length;
    console.log(`- ${pillar.name}: ${done}/${pillarItems.length} (${percent(done, pillarItems.length)}%)`);
  }

  if (errors.length > 0) {
    console.error("\nRefocus verification failed:");
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log("\nRefocus verification passed.");
}

main();
