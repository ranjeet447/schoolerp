import { test, expect } from '@playwright/test';

test.describe('Finance & Receipts Smoke Tests', () => {
  test('Accountant can load fee management and create a plan', async ({ page }) => {
    await page.goto('/accountant/fees');
    await expect(page.getByText('Finance Management')).toBeVisible();

    // Create a plan
    await page.getByPlaceholder('e.g. Grade 10 - Annual Plan').fill('New Annual Plan');
    await page.getByPlaceholder('e.g. Tuition Fee').fill('Tuition');
    await page.getByPlaceholder('0').fill('15000');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Tuition')).toBeVisible();
    await expect(page.getByText('₹15,000')).toBeVisible();

    await page.getByRole('button', { name: 'Save Fee Plan' }).click();

    // Check if added to list
    await expect(page.getByText('New Annual Plan')).toBeVisible();
  });

  test('Accountant can collect payment and issue receipt', async ({ page }) => {
    await page.goto('/accountant/payments');
    await expect(page.getByText('Collect Payment')).toBeVisible();

    await page.getByPlaceholder('Admission No or Name').fill('Aarav');
    await page.getByPlaceholder('0').fill('5000');

    await page.getByRole('combobox').click();
    await page.getByLabel('Cash').click();

    await page.getByRole('button', { name: 'Issue Receipt' }).click();

    // Check if receipt card appeared
    await expect(page.locator('.border.rounded-xl').first()).toContainText('Aarav Sharma');
    await expect(page.locator('.border.rounded-xl').first()).toContainText('₹5,000');
  });

  test('Parent can see fee summary and history', async ({ page }) => {
    await page.goto('/parent/fees');
    await expect(page.getByText('Payment Status')).toBeVisible();
    await expect(page.getByText('Payment History')).toBeVisible();
    await expect(page.locator('.border.rounded-xl').first()).toContainText('REC/2025/0001');
  });
});
