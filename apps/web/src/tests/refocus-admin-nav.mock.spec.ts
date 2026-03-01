import { expect, test, type Page } from "@playwright/test";

const RUN_MOCK_REFOCUS_UI = process.env.RUN_MOCK_REFOCUS_UI === "1";

async function seedAdminSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "mock-admin-token");
    localStorage.setItem("user_id", "00000000-0000-0000-0000-000000000999");
    localStorage.setItem("user_email", "admin@example.com");
    localStorage.setItem("user_name", "Refocus Admin");
    localStorage.setItem("user_role", "tenant_admin");
    localStorage.setItem("tenant_id", "019c4d42-49ca-7392-b29e-d74aadcfabbe");
    if (localStorage.getItem("schoolerp:ui:advanced_modules_hidden") === null) {
      localStorage.setItem("schoolerp:ui:advanced_modules_hidden", "0");
    }
  });
}

test.describe("Refocus Admin Navigation (mocked)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!RUN_MOCK_REFOCUS_UI, "Set RUN_MOCK_REFOCUS_UI=1 to run mocked refocus nav smoke.");
    await seedAdminSession(page);
    let hideAdvancedModulesPreference = false;

    await page.route("**/v1/**", async (route) => {
      const req = route.request();
      const url = new URL(req.url());

      if (req.method() === "GET" && /\/v1\/admin\/settings\/preferences$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            preferences: {
              ui: {
                hide_advanced_modules: hideAdvancedModulesPreference,
              },
            },
          }),
        });
      }

      if (req.method() === "PUT" && /\/v1\/admin\/settings\/preferences$/.test(url.pathname)) {
        const payload = req.postDataJSON() as { ui?: { hide_advanced_modules?: boolean } } | null;
        hideAdvancedModulesPreference = payload?.ui?.hide_advanced_modules === true;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            preferences: {
              ui: {
                hide_advanced_modules: hideAdvancedModulesPreference,
              },
            },
          }),
        });
      }

      if (req.method() === "GET" && /\/v1\/admin\/dashboard\/command-status$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            finance: { collected_today: 12450 },
            attendance: { students: { absent: 8 }, staff: { absent: 2 } },
            admissions: { walkins_today: 3 },
          }),
        });
      }

      if (req.method() === "GET" && /\/v1\/admin\/approvals/.test(url.pathname)) {
        return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }

      if (req.method() === "GET" && /\/v1\/admin\/certificates\/list/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ certificates: [] }),
        });
      }

      if (req.method() === "GET" && /\/v1\/admin\/payments\/reports\/defaulters\/data$/.test(url.pathname)) {
        return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }

      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
  });

  test("shows pillar-first groups and Advanced Modules collapses", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin/dashboard");

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByRole("heading", { name: "Online Fee Collection & Dues Management" })).toBeVisible();
    await expect(sidebar.getByRole("heading", { name: "Parent Communication & Parent App" })).toBeVisible();
    await expect(sidebar.getByRole("heading", { name: "Attendance Management" })).toBeVisible();
    await expect(sidebar.getByRole("heading", { name: "Exam Management, Results & Report Cards" })).toBeVisible();

    const advancedToggle = sidebar.getByRole("button", { name: /Advanced Modules/i });
    const hostelLink = sidebar.getByRole("link", { name: /Hostel Module/i });

    await expect(advancedToggle).toBeVisible();
    await expect(hostelLink).toBeVisible();

    await advancedToggle.click();
    await expect(hostelLink).toBeHidden();

    await advancedToggle.click();
    await expect(hostelLink).toBeVisible();
  });

  test("hides advanced modules from sidebar when toggle is disabled in settings", async ({ page }) => {
    await page.goto("/admin/settings/profile");

    const showAdvancedSwitch = page.getByRole("switch", { name: /Show advanced modules/i });
    await expect(showAdvancedSwitch).toBeVisible();
    await expect(showAdvancedSwitch).toHaveAttribute("aria-checked", "true");
    await showAdvancedSwitch.click();
    await expect(showAdvancedSwitch).toHaveAttribute("aria-checked", "false");
    await page.waitForFunction(() => localStorage.getItem("schoolerp:ui:advanced_modules_hidden") === "1");
    await page.reload();
    await expect(showAdvancedSwitch).toHaveAttribute("aria-checked", "false");

    await page.goto("/admin/dashboard");

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByRole("button", { name: /Advanced Modules/i })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: /Hostel Module/i })).toHaveCount(0);
  });
});
