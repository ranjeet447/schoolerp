import { expect, test, type Page } from "@playwright/test";

const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || "";
const RUN_BUTTON_ACTIONABILITY_SMOKE = process.env.RUN_BUTTON_ACTIONABILITY_SMOKE === "1";

const ROLE_BUTTON_ROUTES = [
  {
    label: "platform",
    emailEnv: "LOGIN_EMAIL_SUPER_ADMIN",
    routes: ["/platform/dashboard", "/platform/tenants/list", "/platform/analytics", "/platform/integrations", "/platform/payments"],
  },
  {
    label: "tenant_admin",
    emailEnv: "LOGIN_EMAIL_TENANT_ADMIN",
    routes: ["/admin/dashboard", "/admin/custom-fields", "/admin/kb/documents"],
  },
  { label: "teacher", emailEnv: "LOGIN_EMAIL_TEACHER", routes: ["/teacher/dashboard"] },
  { label: "parent", emailEnv: "LOGIN_EMAIL_PARENT", routes: ["/parent/dashboard"] },
  { label: "student", emailEnv: "LOGIN_EMAIL_STUDENT", routes: ["/student/dashboard"] },
  { label: "accountant", emailEnv: "LOGIN_EMAIL_ACCOUNTANT", routes: ["/accountant/dashboard"] },
] as const;

const SAFE_REAL_CLICK_LABEL = /refresh|sync|retry|growth overview|financial performance|regional adoption|filter metrics|view logs/i;
const DANGEROUS_LABEL = /delete|remove|reject|approve|execute|force|logout|reset|deactivate|activate|request deletion|lock|unlock|freeze|pay|submit|save/i;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("admin@school.edu.in").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 30000 });
}

async function assertButtonsActionable(page: Page, route: string) {
  const buttons = page.locator("button");
  const total = await buttons.count();
  const actionabilityFailures: string[] = [];
  const safeCandidates: Array<{ index: number; label: string }> = [];

  for (let i = 0; i < total; i += 1) {
    const button = buttons.nth(i);
    if (!(await button.isVisible().catch(() => false))) continue;
    if (!(await button.isEnabled().catch(() => false))) continue;

    const label = ((await button.innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
    const normalized = label.toLowerCase();
    if (!normalized) continue;

    try {
      await button.scrollIntoViewIfNeeded();
      await button.click({ trial: true, timeout: 2000 });
    } catch (error) {
      actionabilityFailures.push(`index=${i} label="${label}" error=${String(error)}`);
      continue;
    }

    if (SAFE_REAL_CLICK_LABEL.test(label) && !DANGEROUS_LABEL.test(label)) {
      safeCandidates.push({ index: i, label });
    }
  }

  expect(actionabilityFailures, `Non-actionable buttons on ${route}`).toEqual([]);

  let realClicks = 0;
  for (const candidate of safeCandidates) {
    if (realClicks >= 4) break;
    const button = buttons.nth(candidate.index);
    if (!(await button.isVisible().catch(() => false))) continue;
    if (!(await button.isEnabled().catch(() => false))) continue;
    await button.click({ timeout: 3000 });
    realClicks += 1;
  }
}

test.describe("Button Actionability Smoke Matrix", () => {
  for (const role of ROLE_BUTTON_ROUTES) {
    test(`${role.label} key routes render actionable buttons`, async ({ page }) => {
      const email = process.env[role.emailEnv] || "";
      test.skip(
        !RUN_BUTTON_ACTIONABILITY_SMOKE || !email || !LOGIN_PASSWORD,
        "Set RUN_BUTTON_ACTIONABILITY_SMOKE=1 and role login env vars to run real button smoke checks."
      );

      const pageErrors: string[] = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));

      await loginAs(page, email, LOGIN_PASSWORD);

      for (const route of role.routes) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page).not.toHaveURL(/\/auth\/login/);
        await assertButtonsActionable(page, route);
      }

      expect(pageErrors).toEqual([]);
    });
  }
});

