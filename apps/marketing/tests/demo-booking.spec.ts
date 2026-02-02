import { test, expect } from '@playwright/test';

test.describe('Demo Booking Funnel', () => {
  test('should complete a booking flow', async ({ page }) => {
    // 1. Visit booking page
    await page.goto('/book-demo');
    await expect(page.locator('h1')).toContainText('Book a Live Demo');

    // 2. Select demo type
    await page.click('text=Select Draft'); // On components it says "Select Draft" for now

    // 3. Select a slot
    await expect(page.locator('h1')).toContainText('Choose a time slot');
    await page.click('button:visible:not([disabled])'); // Click first available slot if simple
    await page.click('text=Next Step');

    // 4. Fill form
    await expect(page.locator('h1')).toContainText('Enter your details');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input:near(label:text("Full Name"))', 'Test User');
    await page.fill('input:near(label:text("Phone Number"))', '9876543210');
    await page.fill('input:near(label:text("School Name"))', 'Test Academy');

    // 5. Submit
    await page.click('button:text("Schedule Demo")');

    // 6. Success
    await expect(page).toHaveURL(/\/book-demo\/success/);
    await expect(page.locator('h1')).toContainText('Demo Scheduled!');
  });
});
