import { test, expect } from '@playwright/test';

test.describe('Marketing Visual Sanity', () => {
  test('homepage has product screenshots', async ({ page }) => {
    await page.goto('/');
    
    // Check main hero image
    const heroImage = page.locator('img[alt="SchoolERP Platform Dashboard"]');
    await expect(heroImage).toBeVisible();
    
    // Check if image is loaded (not 404)
    const isLoaded = await heroImage.evaluate((img: HTMLImageElement) => img.complete && img.naturalHeight > 0);
    expect(isLoaded).toBeTruthy();
  });

  test('product gallery page renders correctly', async ({ page }) => {
    await page.goto('/product');
    
    // Should have tabs
    await expect(page.locator('button[role="tab"]')).toHaveCount(4);
    
    // Should show Admin screenshots by default
    await expect(page.locator('h2', { hasText: 'Administrator Dashboard' })).toBeVisible();
    
    // Check if screenshot image exists in the DOM
    const adminImg = page.locator('img[alt="Administrator Dashboard"]');
    await expect(adminImg).toBeVisible();
  });

  test('feature detail pages show screenshots', async ({ page }) => {
    // Navigate to a known live feature
    await page.goto('/features/school-fee-management-software');
    
    // Should show the screenshot mockup
    const featureImg = page.locator('img[alt="Fee Plan Builder"]');
    await expect(featureImg).toBeVisible();
  });
});
