import { expect, test, type Page } from "@playwright/test";

const RUN_MOCK_INTEGRATIONS_UI = process.env.RUN_MOCK_INTEGRATIONS_UI === "1";

async function seedSession(page: Page, role: string) {
  await page.addInitScript(({ role }) => {
    localStorage.setItem("auth_token", "mock-token");
    localStorage.setItem("user_id", "00000000-0000-0000-0000-000000000001");
    localStorage.setItem("user_email", `${role}@example.com`);
    localStorage.setItem("user_name", role);
    localStorage.setItem("user_role", role);
    localStorage.setItem("tenant_id", "019c4d42-49ca-7392-b29e-d74aadcfabbe");
  }, { role });
}

test.describe("Integrations/Add-ons/Credits/Live Classes (mocked UI smoke)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!RUN_MOCK_INTEGRATIONS_UI, "Set RUN_MOCK_INTEGRATIONS_UI=1 to run mocked UI smoke for integrations/add-ons/credits/live-classes.");
    await page.route("**/v1/**", async (route) => {
      const req = route.request();
      const url = new URL(req.url());

      if (req.method() === "GET" && url.pathname.endsWith("/v1/admin/settings/integrations/")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            integrations: [
              {
                provider: "google_workspace",
                status: "not_connected",
                addon_code: "live_classes_google",
                addon_active: false,
                features: ["calendar", "meet", "live_classes"],
              },
              {
                provider: "microsoft_365",
                status: "connected",
                account_email: "admin@school.edu",
                addon_code: "live_classes_microsoft",
                addon_active: true,
                features: ["graph_calendar", "teams_meetings", "live_classes"],
              },
            ],
          }),
        });
      }

      if (req.method() === "POST" && /\/v1\/admin\/settings\/integrations\/google_workspace\/connect$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            provider: "google_workspace",
            auth_url: "http://localhost:3000/mock-oauth/google",
            callback_url: "http://localhost:3000/v1/admin/settings/integrations/google_workspace/callback",
          }),
        });
      }

      if (req.method() === "POST" && /\/v1\/admin\/settings\/integrations\/microsoft_365\/disconnect$/.test(url.pathname)) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "disconnected" }) });
      }

      if (req.method() === "GET" && /\/v1\/admin\/billing\/credits\/balance$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            balances: [
              { wallet_type: "sms_credits", balance: 1800, included_granted_month: 2000, topups_month: 0, used_month: 200 },
              { wallet_type: "whatsapp_credits", balance: 450, included_granted_month: 500, topups_month: 0, used_month: 50 },
            ],
          }),
        });
      }

      if (req.method() === "GET" && /\/v1\/admin\/billing\/credits\/ledger/.test(url.pathname + url.search)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ledger: [
              {
                id: "1",
                wallet_type: "sms_credits",
                entry_type: "debit",
                amount: -2,
                source: "message_send",
                reference_id: "sms:evt-1",
                created_at: new Date().toISOString(),
              },
            ],
          }),
        });
      }

      if (req.method() === "POST" && /\/v1\/admin\/billing\/credits\/topup$/.test(url.pathname)) {
        return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ request_id: "req-1", status: "pending" }) });
      }

      if (req.method() === "GET" && /\/v1\/admin\/fees\/gateways/.test(url.pathname + url.search)) {
        const provider = url.searchParams.get("provider") || "razorpay";
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            provider,
            is_active: true,
            api_key: "********abcd",
            api_secret: "********efgh",
            webhook_secret: "********ijkl",
          }),
        });
      }

      if (req.method() === "GET" && /\/v1\/admin\/settings\/payments\/gateways\/webhook-status/.test(url.pathname + url.search)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            provider: "razorpay",
            last_status: "completed",
            received_count_24h: 3,
            completed_count_24h: 3,
            failed_count_24h: 0,
            last_received_at: new Date().toISOString(),
            webhook_url: "https://example.com/v1/payments/webhook/razorpay",
          }),
        });
      }

      if (req.method() === "POST" && /\/v1\/admin\/settings\/payments\/gateways\/test$/.test(url.pathname)) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, message: "Gateway credentials verified" }) });
      }

      if (req.method() === "PUT" && /\/v1\/admin\/settings\/payments\/gateways$/.test(url.pathname)) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
      }

      if (req.method() === "GET" && /\/v1\/teacher\/live-classes\/list$/.test(url.pathname)) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events: [] }) });
      }

      if (req.method() === "POST" && /\/v1\/teacher\/live-classes\/schedule$/.test(url.pathname)) {
        const payload = req.postDataJSON() as Record<string, unknown>;
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "evt-1",
            provider: String(payload.provider || "google_workspace"),
            title: String(payload.title || "Mock Live Class"),
            starts_at: String(payload.starts_at || new Date().toISOString()),
            ends_at: String(payload.ends_at || new Date(Date.now() + 3600000).toISOString()),
            meeting_url: "https://meet.google.com/mock-link",
            status: "scheduled",
          }),
        });
      }

      if (req.method() === "GET" && /\/v1\/(parent|student)\/live-classes\/list$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            events: [
              {
                id: "evt-1",
                provider: "google_workspace",
                title: "Math Revision",
                starts_at: new Date().toISOString(),
                ends_at: new Date(Date.now() + 3600000).toISOString(),
                meeting_url: "https://meet.google.com/mock-link",
                status: "scheduled",
              },
            ],
          }),
        });
      }

      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
  });

  test("admin integrations page shows add-on state and connect/disconnect actions", async ({ page }) => {
    await seedSession(page, "tenant_admin");
    await page.goto("/admin/settings/integrations");

    await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();
    await expect(page.getByText("Google Workspace for Education")).toBeVisible();
    await expect(page.getByText(/live_classes_google/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /upgrade add-on/i })).toBeVisible();
    await expect(page.getByText("Microsoft 365 Education")).toBeVisible();
    await expect(page.getByText(/admin@school\.edu/i)).toBeVisible();
  });

  test("admin credits page renders balances and can submit top-up request", async ({ page }) => {
    await seedSession(page, "tenant_admin");
    await page.goto("/admin/billing/credits");

    await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible();
    await expect(page.getByText("sms_credits")).toBeVisible();
    await expect(page.getByRole("button", { name: /request top-up/i })).toBeVisible();
    await page.getByRole("button", { name: /request top-up/i }).click();
    await expect(page.getByText(/credit ledger/i)).toBeVisible();
  });

  test("admin payment settings page shows masked secrets and webhook status", async ({ page }) => {
    await seedSession(page, "tenant_admin");
    await page.goto("/admin/settings/payments");

    await expect(page.getByRole("heading", { name: "Payment Gateways" })).toBeVisible();
    await expect(page.getByText(/webhook status/i)).toBeVisible();
    await expect(page.getByText(/v1\/payments\/webhook\/razorpay/i)).toBeVisible();
    await page.getByRole("button", { name: /test connection/i }).click();
    await page.getByRole("button", { name: /save configuration/i }).click();
  });

  test("teacher can schedule live class and see meeting link in list", async ({ page }) => {
    await seedSession(page, "teacher");
    await page.goto("/teacher/live-classes");

    await page.getByLabel("Title").fill("Science Live Class");
    await page.getByLabel(/provider/i).fill("google_workspace");
    const start = new Date(Date.now() + 24 * 3600 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    await page.getByLabel("Starts At").fill(start.toISOString().slice(0, 16));
    await page.getByLabel("Ends At").fill(end.toISOString().slice(0, 16));
    await page.getByRole("button", { name: /^schedule$/i }).click();

    await expect(page.getByText("Science Live Class")).toBeVisible();
    await expect(page.getByRole("link", { name: /open/i })).toBeVisible();
  });
});

