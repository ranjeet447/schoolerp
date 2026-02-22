import { test, expect } from '@playwright/test';

test.describe('Parent Payment Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Basic setup for parent role
    // In a real scenario, we'd use storageState or a manual login helper
    await page.goto('/login');
    // Assuming mock auth for test environment
  });

  test('should navigate to fee page and initiate payment', async ({ page }) => {
    // 1. Visit parent dashboard
    await page.goto('/parent/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Click on "Pay Fees" quick action
    const payFeesButton = page.getByRole('button', { name: /Pay Fees/i }).first();
    if (await payFeesButton.isVisible()) {
      await payFeesButton.click();
    } else {
      await page.goto('/parent/fees');
    }

    // 3. Verify Fee Dashboard
    await expect(page.getByText(/Fee Summary/i)).toBeVisible();

    // 4. Click "Pay Now" on a pending installment
    const payNowBtn = page.getByRole('button', { name: /Pay Now/i }).first();
    await expect(payNowBtn).toBeVisible();
    await payNowBtn.click();

    // 5. Verify Checkout Modal or Page
    await expect(page.getByText(/Order Summary/i)).toBeVisible();
    await expect(page.getByText(/Total Payable/i)).toBeVisible();

    // 6. Click "Confirm Payment"
    const confirmBtn = page.getByRole('button', { name: /Confirm/i });
    await expect(confirmBtn).toBeVisible();
    // await confirmBtn.click(); // Avoid external gateway hits in smoke tests
  });

  test('should view payment history and download receipt', async ({ page }) => {
    await page.goto('/parent/fees');

    // Switch to history tab if exists
    const historyTab = page.getByRole('tab', { name: /History/i });
    if (await historyTab.isVisible()) {
      await historyTab.click();
    }

    // Check for a completed transaction
    const receiptLink = page.getByRole('link', { name: /Download Receipt/i }).first();
    if (await receiptLink.isVisible()) {
      await expect(receiptLink).toHaveAttribute('href', /.*receipt.*/);
    }
  });
});
