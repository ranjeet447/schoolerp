import { expect, test, type Page } from "@playwright/test"

const RUN_MOCK_COMM_GATEWAYS_UI = process.env.RUN_MOCK_COMM_GATEWAYS_UI === "1"

async function seedAdminSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "mock-admin-token")
    localStorage.setItem("user_id", "00000000-0000-0000-0000-000000000222")
    localStorage.setItem("user_email", "admin@example.com")
    localStorage.setItem("user_name", "Admin User")
    localStorage.setItem("user_role", "tenant_admin")
    localStorage.setItem("tenant_id", "019c4d42-49ca-7392-b29e-d74aadcfabbe")
  })
}

test.describe("Notification Gateways (mocked UI smoke)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!RUN_MOCK_COMM_GATEWAYS_UI, "Set RUN_MOCK_COMM_GATEWAYS_UI=1 to run mocked communication gateways smoke.")
    await seedAdminSession(page)

    let gateways = [
      {
        id: "gw-1",
        provider: "msg91",
        api_key: "********KEY1",
        api_secret: "********SEC1",
        sender_id: "SCHERP",
        is_active: true,
        settings: { route: "4" },
      },
    ]

    await page.route("**/v1/**", async (route) => {
      const req = route.request()
      const url = new URL(req.url())

      if (req.method() === "GET" && /\/v1\/admin\/notifications\/gateways\/?$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(gateways),
        })
      }

      if (req.method() === "POST" && /\/v1\/admin\/notifications\/gateways\/?$/.test(url.pathname)) {
        const body = req.postDataJSON() as any
        gateways = [
          ...gateways.filter((g) => g.provider !== body.provider),
          {
            id: `gw-${gateways.length + 1}`,
            provider: body.provider,
            api_key: "********" + String(body.api_key || "NEW1").slice(-4),
            api_secret: "********" + String(body.api_secret || "NEW2").slice(-4),
            sender_id: body.sender_id || "",
            is_active: Boolean(body.is_active),
            settings: body.settings || {},
          },
        ]
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        })
      }

      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
    })
  })

  test("admin can save a gateway and see masked values in list", async ({ page }) => {
    await page.goto("/admin/communication/gateways")

    await expect(page.getByRole("heading", { name: /notification gateways/i })).toBeVisible()
    await expect(page.getByText(/secrets are masked on read/i)).toBeVisible()

    await page.locator("#provider").selectOption("webhook")
    await page.getByLabel(/sender id/i).fill("HOOK01")
    await page.getByLabel(/^API Key$/i).fill("webhook_key_1234")
    await page.getByLabel(/api secret/i).fill("webhook_secret_5678")
    await page.getByLabel(/provider settings/i).fill('{\"url\":\"https://example.com/hooks/notify\"}')
    await page.getByRole("switch").click()

    await page.getByRole("button", { name: /save gateway/i }).click()

    await expect(page.getByText(/gateway configuration saved/i)).toBeVisible()
    await expect(page.getByText(/webhook/i).first()).toBeVisible()
    await expect(page.getByText(/API Key: \*{8}1234/i)).toBeVisible()
    await expect(page.getByText(/Secret: \*{8}5678/i)).toBeVisible()
  })
})
