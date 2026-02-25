import { expect, test, type Page } from "@playwright/test";

const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || "";
const RUN_ROLE_MATRIX_SMOKE = process.env.RUN_ROLE_MATRIX_SMOKE === "1";

const ROLE_MATRIX = [
  { label: "platform", emailEnv: "LOGIN_EMAIL_SUPER_ADMIN", route: "/platform/dashboard" },
  { label: "tenant_admin", emailEnv: "LOGIN_EMAIL_TENANT_ADMIN", route: "/admin/dashboard" },
  { label: "teacher", emailEnv: "LOGIN_EMAIL_TEACHER", route: "/teacher/dashboard" },
  { label: "parent", emailEnv: "LOGIN_EMAIL_PARENT", route: "/parent/dashboard" },
  { label: "student", emailEnv: "LOGIN_EMAIL_STUDENT", route: "/student/dashboard" },
  { label: "accountant", emailEnv: "LOGIN_EMAIL_ACCOUNTANT", route: "/accountant/dashboard" },
] as const;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("admin@school.edu.in").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 30000 });
}

test.describe("Role Route Smoke Matrix", () => {
  for (const entry of ROLE_MATRIX) {
    test(`${entry.label} can open ${entry.route}`, async ({ page }) => {
      const email = process.env[entry.emailEnv] || "";
      test.skip(
        !RUN_ROLE_MATRIX_SMOKE || !email || !LOGIN_PASSWORD,
        "Set RUN_ROLE_MATRIX_SMOKE=1 and role login env vars to run real route smoke checks."
      );

      await loginAs(page, email, LOGIN_PASSWORD);
      await page.goto(entry.route, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`${entry.route.replace(/\//g, "\\/")}`));
      await expect(page).not.toHaveURL(/\/auth\/login/);
    });
  }
});

test("Platform tenant-list impersonation sends audited reason and accepts target_* backend payload", async ({ page }) => {
  const targetTenantId = "019c4d42-49ca-7392-b29e-d74aadcfabbe";
  const promptReason = "Playwright smoke verification for tenant impersonation";
  let sawImpersonateRequest = false;

  await page.addInitScript(
    ({ tenantId, reason }) => {
      localStorage.setItem("auth_token", "seed-platform-token");
      localStorage.setItem("user_id", "seed-super-admin");
      localStorage.setItem("user_email", "superadmin@example.com");
      localStorage.setItem("user_name", "Super Admin");
      localStorage.setItem("user_role", "super_admin");
      localStorage.setItem("tenant_id", tenantId);
      window.prompt = () => reason;
    },
    { tenantId: targetTenantId, reason: promptReason }
  );

  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (method === "GET" && url.includes("/admin/platform/tenants?limit=100")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: targetTenantId,
            name: "Acme Public School",
            subdomain: "acme",
            plan_code: "pro",
            lifecycle_status: "active",
            created_at: new Date().toISOString(),
          },
        ]),
      });
    }

    if (method === "POST" && /\/admin\/platform\/tenants\/[^/]+\/impersonate$/.test(new URL(url).pathname)) {
      sawImpersonateRequest = true;
      const payload = request.postDataJSON() as { reason?: string };
      expect(payload.reason).toBe(promptReason);

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "impersonated-token",
          target_user_id: "tenant-admin-user-id",
          target_user_email: "tenant-admin@example.com",
          target_user_role: "tenant_admin",
          target_tenant_id: targetTenantId,
          target_tenant_name: "Acme Public School",
          expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
        }),
      });
    }

    if (method === "POST" && /\/impersonation-exit$/.test(new URL(url).pathname)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: method === "GET" ? JSON.stringify([]) : JSON.stringify({ status: "ok" }),
    });
  });

  await page.goto("/platform/tenants/list");
  await page.getByRole("button", { name: /impersonate/i }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard/);
  expect(sawImpersonateRequest).toBeTruthy();

  const sessionState = await page.evaluate(() => ({
    authToken: localStorage.getItem("auth_token"),
    role: localStorage.getItem("user_role"),
    tenantId: localStorage.getItem("tenant_id"),
    email: localStorage.getItem("user_email"),
    backupToken: localStorage.getItem("impersonator_auth_token"),
    reason: localStorage.getItem("impersonation_reason"),
    targetTenantId: localStorage.getItem("impersonation_target_tenant_id"),
  }));

  expect(sessionState.authToken).toBe("impersonated-token");
  expect(sessionState.role).toBe("tenant_admin");
  expect(sessionState.tenantId).toBe(targetTenantId);
  expect(sessionState.email).toBe("tenant-admin@example.com");
  expect(sessionState.backupToken).toBe("seed-platform-token");
  expect(sessionState.reason).toBe(promptReason);
  expect(sessionState.targetTenantId).toBe(targetTenantId);
});

