import { expect, test, type Page } from "@playwright/test";

const RUN_MOCK_COMMUNICATION_LOGS_UI = process.env.RUN_MOCK_COMMUNICATION_LOGS_UI === "1";

async function seedAdminSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "mock-admin-token");
    localStorage.setItem("user_id", "00000000-0000-0000-0000-000000000222");
    localStorage.setItem("user_email", "admin@example.com");
    localStorage.setItem("user_name", "Admin User");
    localStorage.setItem("user_role", "tenant_admin");
    localStorage.setItem("tenant_id", "019c4d42-49ca-7392-b29e-d74aadcfabbe");
  });
}

test.describe("Communication Delivery Center (mocked UI smoke)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!RUN_MOCK_COMMUNICATION_LOGS_UI, "Set RUN_MOCK_COMMUNICATION_LOGS_UI=1 to run mocked communication logs smoke.");
    await seedAdminSession(page);

    await page.route("**/v1/**", async (route) => {
      const req = route.request();
      const url = new URL(req.url());

      if (req.method() === "GET" && /\/v1\/admin\/notifications\/stats\/?$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            usage: {
              total_count: 48,
              delivered_count: 42,
              failed_count: 6,
              total_cost: "23.50",
            },
            outbox: {
              total_count: 48,
              completed_count: 42,
              failed_count: 6,
              pending_count: 0,
            },
          }),
        });
      }

      if (req.method() === "GET" && /\/v1\/admin\/notifications\/logs\/?$/.test(url.pathname)) {
        const status = url.searchParams.get("status") || "";
        const baseRows = [
          {
            id: "log-1",
            event_type: "ptm.reminder",
            status: "completed",
            payload: { retry_count: 0 },
            created_at: new Date().toISOString(),
          },
          {
            id: "log-2",
            event_type: "incident.alert",
            status: "failed",
            payload: { retry_count: 2 },
            error_message: { String: "Provider timeout", Valid: true },
            created_at: new Date().toISOString(),
          },
        ];
        const rows = status ? baseRows.filter((row) => row.status === status) : baseRows;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(rows),
        });
      }

      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
  });

  test("admin can view metrics, filter by failed status, and inspect row actions", async ({ page }) => {
    await page.goto("/admin/communication/logs");

    await expect(page.getByRole("heading", { name: /delivery center/i })).toBeVisible();
    await expect(page.getByText(/est. cost today/i)).toBeVisible();
    await expect(page.getByText("₹23.50")).toBeVisible();

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /^Failed$/i }).click();

    await expect(page.getByText(/incident alert/i)).toBeVisible();
    await expect(page.getByText(/provider timeout/i)).toBeVisible();

    const detailButtons = page.getByRole("button", { name: /detail/i });
    await expect(detailButtons.first()).toBeVisible();

    await page.getByRole("button", { name: /^refresh$/i }).click();
    await expect(page.getByText(/delivery center/i)).toBeVisible();
  });
});
