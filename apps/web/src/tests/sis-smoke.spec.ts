import { test, expect } from '@playwright/test';

test.describe('SIS Smoke Tests', () => {

  test('Admin student list loads', async ({ page }) => {
    // We mock the tenant headers in a real setup, but here we assume the app handles defaults or stubs
    await page.goto('/students');

    await expect(page.locator('h1')).toContainText('Students');
    await expect(page.locator('button:has-text("Add Student")')).toBeVisible();
  });

  test('Create student dialog opens and submits', async ({ page }) => {
    await page.goto('/students');

    await page.click('button:has-text("Add Student")');

    // Check dialog components
    await expect(page.locator('text=Add New Student')).toBeVisible();

    // Fill basic details
    await page.fill('input[placeholder="John Doe"]', 'Test Student');
    await page.fill('input[placeholder="ADM001"]', 'TESTADM001');

    // Select Gender (Radix Select)
    await page.click('button:has-text("Select gender")');
    await page.click('div[role="option"]:has-text("Male")');

    // Submit
    await page.click('button:has-text("Add Student")');

    // Toast should appear (Sonner)
    await expect(page.locator('text=Student created successfully')).toBeVisible();
  });

  test('Import wizard opens correctly', async ({ page }) => {
    await page.goto('/students');

    await page.click('button:has-text("Import")');

    await expect(page.locator('text=Import Students')).toBeVisible();
    await expect(page.locator('text=Step 1: Upload CSV')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('Parent can see children list', async ({ page }) => {
    await page.goto('/parent/children');

    await expect(page.locator('h1')).toContainText('My Children');
    // Note: In local dev, this might show "No children linked" unless seeded
  });

});
