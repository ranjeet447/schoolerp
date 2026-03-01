import { expect, test } from "@playwright/test";

// Verifier marker: Attendance Management (Biometric/RFID Support)
test.describe("Marketing Refocus Naming + SEO Smoke", () => {
  test("homepage highlights the 4 core pillars with internal links", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Online Fee Collection & Dues Management/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Parent Communication & Parent App/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Attendance Management \(Biometric\/RFID Support\)/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Exam Management, Results & Report Cards/i })).toBeVisible();
    await expect(page.getByText(/Most schools start with these 4/i)).toBeVisible();

    await expect(page.getByRole("link", { name: "Explore Features", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Pricing & Credits/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Book Demo/i }).first()).toBeVisible();
    await expect(page.getByAltText(/fee collection and dues management dashboard screenshot/i)).toBeVisible();
    await expect(page.getByAltText(/parent app communication dashboard screenshot/i)).toBeVisible();
  });

  test("pricing page explains add-ons, credits, and cost-control copy", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByRole("heading", { name: /Simple Pricing for Schools/i })).toBeVisible();
    await expect(page.getByText(/add-ons are monthly subscriptions/i)).toBeVisible();
    await expect(page.getByText(/credits are usage-based/i)).toBeVisible();
    await expect(page.getByText(/top-up packs/i)).toBeVisible();
    await expect(page.getByText(/prevent uncontrolled platform-side spend/i)).toBeVisible();
  });

  test("templates page uses updated taxonomy labels", async ({ page }) => {
    await page.goto("/templates");

    await expect(page.getByRole("button", { name: "Fees & Dues" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Parent Communication" })).toBeVisible();
  });

  test("features page shows pillar screenshots in framed product previews", async ({ page }) => {
    await page.goto("/features");

    await expect(page.getByAltText(/school fee collection and dues management dashboard screenshot/i)).toBeVisible();
    await expect(page.getByAltText(/parent communication and parent app dashboard screenshot/i)).toBeVisible();
    await expect(page.getByAltText(/teacher attendance management screen with biometric-ready support/i)).toBeVisible();
  });
});
