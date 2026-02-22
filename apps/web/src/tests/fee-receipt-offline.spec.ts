import { test, expect } from '@playwright/test';

test.describe('Offline Fee Receipt E2E', () => {
  test('Accountant can generate an offline fee receipt', async ({ page }) => {
    await page.goto('/admin/finance');

    // 1. Search for a student in finance module
    await page.getByPlaceholder(/search student/i).fill('Test');
    await expect(page.locator('div.student-finance-row')).toBeVisible();
    await page.locator('div.student-finance-row').first().click();

    // 2. Open Collect Payment Dialog
    await page.getByRole('button', { name: /collect payment/i }).click();

    // 3. Fill Payment Details
    await page.getByPlaceholder(/amount/i).fill('5000');
    await page.getByRole('button', { name: /payment mode/i }).click();
    await page.getByRole('option', { name: 'Cash' }).click();

    // 4. Generate Receipt
    await page.getByRole('button', { name: 'Generate Receipt' }).click();

    // 5. Verify Success and Receipt Number
    await expect(page.getByText(/payment collected successfully/i)).toBeVisible();
    await expect(page.getByText(/receipt #/i)).toBeVisible();

    // 6. Verify print preview opens (optional, might be hard to verify in headless)
  });
});
