import { expect, test, type Page } from "@playwright/test";

const RUN_MOCK_PARENT_PAYMENT_UI = process.env.RUN_MOCK_PARENT_PAYMENT_UI === "1";

async function seedParentSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "mock-parent-token");
    localStorage.setItem("user_id", "00000000-0000-0000-0000-000000000111");
    localStorage.setItem("user_email", "parent@example.com");
    localStorage.setItem("user_name", "Parent User");
    localStorage.setItem("user_role", "parent");
    localStorage.setItem("tenant_id", "019c4d42-49ca-7392-b29e-d74aadcfabbe");
  });
}

test.describe("Parent Payment Journey (mocked UI smoke)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!RUN_MOCK_PARENT_PAYMENT_UI, "Set RUN_MOCK_PARENT_PAYMENT_UI=1 to run mocked parent payment smoke.");
    await seedParentSession(page);

    await page.route("https://checkout.razorpay.com/v1/checkout.js", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `
          window.Razorpay = function(options) {
            this.open = function() {
              if (options && typeof options.handler === "function") {
                options.handler({ razorpay_payment_id: "pay_mock_1" });
              }
            };
          };
        `,
      });
    });

    await page.route("**/v1/**", async (route) => {
      const req = route.request();
      const url = new URL(req.url());

      if (req.method() === "GET" && /\/v1\/parent\/me\/children\/?$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "stu-1", full_name: "Aarav Sharma", admission_number: "A001" },
          ]),
        });
      }

      if (req.method() === "GET" && /\/v1\/parent\/children\/stu-1\/fees\/summary\/?$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            student_id: "stu-1",
            total_due: 50000,
            total_paid: 35000,
            balance: 15000,
            next_due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            heads: [
              { head_name: "Tuition", amount: 30000, paid: 25000, due: 5000 },
              { head_name: "Transport", amount: 20000, paid: 10000, due: 10000 },
            ],
          }),
        });
      }

      if (req.method() === "GET" && /\/v1\/parent\/children\/stu-1\/fees\/receipts\/?$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "rcpt-1",
              receipt_number: "REC-0001",
              amount: 10000,
              mode: "online",
              created_at: new Date().toISOString(),
            },
          ]),
        });
      }

      if (req.method() === "POST" && /\/v1\/parent\/payments\/online\/?$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            amount: 15000,
            currency: "INR",
            external_ref: "order_mock_123",
          }),
        });
      }

      if (req.method() === "GET" && /\/v1\/parent\/fees\/gateways/.test(url.pathname + url.search)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            provider: "razorpay",
            api_key: "rzp_test_mock_key",
          }),
        });
      }

      if (req.method() === "GET" && /\/v1\/parent\/children\/stu-1\/fees\/receipts\/rcpt-1\/pdf\/?$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/pdf",
          body: "%PDF-1.4 mock receipt pdf",
        });
      }

      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
  });

  test("renders fee center and initiates mocked payment", async ({ page }) => {
    await page.goto("/parent/fees");

    await expect(page.getByRole("heading", { name: /fee center/i })).toBeVisible();
    await expect(page.getByText(/total outstanding/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^pay now$/i })).toBeVisible();

    await page.getByRole("button", { name: /^pay now$/i }).click();

    await expect(page.getByText(/payment received!/i)).toBeVisible();
  });

  test("shows history tab and receipt download action", async ({ page }) => {
    await page.goto("/parent/fees");

    await page.getByRole("tab", { name: /^history$/i }).click();
    await expect(page.getByText(/receipt #REC-0001/i)).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /download/i }).click(),
    ]);
    expect(await download.suggestedFilename()).toContain("receipt_rcpt-1");
  });
});
