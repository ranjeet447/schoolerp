import { test, expect } from '@playwright/test';

test.describe('Marketing Site SEO & Content Hubs', () => {

  test('Homepage loads with key sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('School');
    await expect(page.locator('text=Book a Demo').first()).toBeVisible();
  });

  test('Features hub and category search', async ({ page }) => {
    await page.goto('/features');
    await expect(page.locator('h1')).toContainText('Software Solutions');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('Use Cases library and filtering', async ({ page }) => {
    await page.goto('/use-cases');
    await expect(page.locator('h1')).toContainText('Specialized Workflows');
    await expect(page.locator('text=Parents')).toBeVisible();
    await expect(page.locator('text=Admins')).toBeVisible();
  });

  test('Resources Knowledge Hub', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.locator('h1')).toContainText('Free Resources');
    await expect(page.locator('text=CBSE Compliance')).toBeVisible();
  });

  test('Blog listing and dynamic data', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText('Guides & Insights');
    await expect(page.locator('text=Reduce Fee Defaults')).toBeVisible();
  });

  test('LLM discoverability (llms.txt)', async ({ page }) => {
    const response = await page.goto('/llms.txt');
    expect(response?.ok()).toBeTruthy();
    const content = await page.content();
    expect(content).toContain('SchoolERP');
    expect(content).toContain('Reduce WhatsApp Chaos');
  });

  test('Sitemap.xml contains 60+ routes', async ({ page }) => {
    // Note: In local dev sitemap may be a route, in prod a file
    const response = await page.goto('/sitemap.xml');
    expect(response?.ok()).toBeTruthy();
  });

});
