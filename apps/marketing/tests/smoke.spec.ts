import { test, expect } from '@playwright/test';

test.describe('Marketing Site Regression', () => {

  test('Homepage loads with key sections', async ({ page }) => {
    await page.goto('/');

    // Check Hero
    await expect(page.locator('h1')).toContainText('School');
    await expect(page.locator('text=Book a Demo').first()).toBeVisible();

    // Check Features Grid presence
    await expect(page.locator('text=Fees & Audit-grade Receipts')).toBeVisible();

    // Check Trust Strip
    await expect(page.locator('text=Trusted by schools')).toBeVisible();
  });

  test('Features page loads', async ({ page }) => {
    await page.goto('/features');
    await expect(page.locator('h1')).toContainText('Platform Capabilities');
    await expect(page.locator('text=Financial Control Center')).toBeVisible();
  });

  test('Pricing page toggles', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText('Invest in Efficiency');

    // Check default annual
    await expect(page.locator('text=Yearly')).toBeVisible();
    await expect(page.locator('text=4,000')).toBeVisible(); // 5000 * 0.8

    // Toggle to monthly
    await page.click('text=Monthly');
    await expect(page.locator('text=5,000')).toBeVisible();
  });

  test('Blog listing loads', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText('Insights & Updates');
    await expect(page.locator('text=Multilingual Support')).toBeVisible();
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText('Get in touch');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

});
