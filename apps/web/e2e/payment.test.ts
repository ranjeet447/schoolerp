import { test, expect } from '@playwright/test';

test.describe('Parent Payment Flow', () => {
  test('should allow a parent to view fees and initiate payment', async ({ page }) => {
    // 1. Login as Parent
    await page.goto('/login');
    await page.fill('input[name="email"]', 'parent@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Navigate to Student Profile / Fees
    await page.waitForURL('**/parent/dashboard');
    await page.click('text=My Children');
    await page.click('text=View Fees');

    // 3. Verify Fee Summary is visible
    await expect(page.locator('text=Fee Summary')).toBeVisible();
    await expect(page.locator('text=Total Pending')).toBeVisible();

    // 4. Click "Pay Now"
    const payNowButton = page.locator('button:has-text("Pay Now")');
    await expect(payNowButton).toBeEnabled();
    await payNowButton.click();

    // 5. Verify Checkout Dialog / Redirect
    // Since we use external gateways, we check for the presence of the payment modal
    await expect(page.locator('text=Choose Payment Method')).toBeVisible();
  });
});
