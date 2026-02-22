import { test, expect } from '@playwright/test';

test.describe('Communication Delivery Center E2E', () => {
  test('Admin can filter and retry failed communications', async ({ page }) => {
    await page.goto('/admin/communication/logs');
    await expect(page.getByText('Communication Delivery Logs')).toBeVisible();

    // 1. Verify filters
    await page.getByRole('button', { name: /all status/i }).click();
    await page.getByRole('option', { name: 'Failed' }).click();

    // 2. Check for filtered results
    const failedLog = page.locator('tr').filter({ hasText: 'Failed' }).first();
    await expect(failedLog).toBeVisible();

    // 3. View detail and retry
    await failedLog.getByRole('button', { name: /view/i }).click();
    await expect(page.getByText('Communication Detail')).toBeVisible();

    // 4. Retry action
    const retryButton = page.getByRole('button', { name: 'Retry Send' });
    await expect(retryButton).toBeVisible();
    await retryButton.click();

    await expect(page.getByText(/retry request queued/i)).toBeVisible();
  });
});
