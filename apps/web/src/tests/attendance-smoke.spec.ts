import { test, expect } from '@playwright/test';

test.describe('Attendance & Leaves Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Standard mock login setup
    await page.goto('/teacher/attendance');
  });

  test('Teacher can load attendance marking page', async ({ page }) => {
    await expect(page.getByText('Mark Attendance')).toBeVisible();
    await expect(page.getByText('Please select a class')).toBeVisible();

    // Select class
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Grade 10 - A' }).click();

    // Check if students are loaded
    await expect(page.getByText('Aarav Sharma')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit Attendance' })).toBeEnabled();
  });

  test('Parent can submit leave request', async ({ page }) => {
    await page.goto('/parent/leaves');

    await expect(page.getByText('Request Leave')).toBeVisible();

    // Fill form
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Aarav Sharma' }).click();

    await page.getByLabel('From Date').fill('2025-06-15');
    await page.getByLabel('To Date').fill('2025-06-16');
    await page.getByPlaceholder('Explain the reason').fill('Going to village for summer break.');

    await page.getByRole('button', { name: 'Submit Request' }).click();

    // Wait for mock success
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('submitted');
      await dialog.accept();
    });
  });
});
