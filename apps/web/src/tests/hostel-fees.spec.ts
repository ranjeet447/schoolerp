import { test, expect } from '@playwright/test';

test.describe('Hostel Financial Integration E2E', () => {
  test('Admin can configure and trigger hostel fee posting', async ({ page }) => {
    await page.goto('/admin/hostel/finance');
    await expect(page.getByText('Hostel Financial Integration')).toBeVisible();

    // 1. Update Mapping
    const mappingRow = page.locator('tr').filter({ hasText: 'Room Rent' });
    await mappingRow.getByRole('textbox').first().fill('3500'); // Amount
    await mappingRow.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/mapping updated/i)).toBeVisible();

    // 2. Trigger Posting
    await page.getByRole('button', { name: 'Post Pending Fees Now' }).click();

    // 3. Confirm in dialog
    await expect(page.getByText('Post Hostel Fees')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm & Post' }).click();

    // 4. Verify Success
    await expect(page.getByText(/processing fee posting/i)).toBeVisible();

    // 5. Check logs
    const latestLog = page.locator('div.logs-table tr').first();
    await expect(latestLog).toContainText('Completed');
  });
});
