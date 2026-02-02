import { test, expect } from '@playwright/test';

test.describe('Growth Features Smoke Tests', () => {
  test('case study PDF download flow', async ({ page }) => {
    await page.goto('/case-studies/demo-school');
    const downloadBtn = page.locator('button', { hasText: 'Download One-Pager PDF' });
    await expect(downloadBtn).toBeVisible();

    await downloadBtn.click();
    await expect(page.locator('button', { hasText: 'Generating PDF...' })).toBeVisible();

    // In dev mock, status will change to ready after polling
    // await expect(page.locator('button', { hasText: 'Download Ready' })).toBeVisible({ timeout: 10000 });
  });

  test('public review submission', async ({ page }) => {
    await page.goto('/review/stub-token');
    await page.fill('textarea', 'Excellent platform for managing our multi-branch schools.');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Thank you for your feedback')).toBeVisible();
  });

  test('integrations directory and filtering', async ({ page }) => {
    await page.goto('/integrations');
    await expect(page.locator('text=Razorpay')).toBeVisible();

    await page.click('button:text("Transport")');
    await expect(page.locator('text=Traccar GPS')).toBeVisible();
    await expect(page.locator('text=Razorpay')).not.toBeVisible();
  });

  test('partner application submission', async ({ page }) => {
    await page.goto('/partners/apply');
    await page.fill('input >> nth=0', 'Hardware Tech Inc');
    await page.click('button:text("Submit Application")');
    await expect(page.locator('text=Application Received')).toBeVisible();
  });
});
