import { test, expect } from '@playwright/test';

test.describe('Auth Smoke Tests', () => {

  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h2')).toContainText('Welcome Back');
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('Quick access buttons work', async ({ page }) => {
    await page.goto('/auth/login');

    // Click Admin quick access
    await page.click('button:has-text("Admin")');
    await expect(page.locator('input[type="email"]')).toHaveValue('admin@school.edu.in');

    // Click Teacher quick access
    await page.click('button:has-text("Teacher")');
    await expect(page.locator('input[type="email"]')).toHaveValue('teacher@school.edu.in');
  });

  test('Invalid login shows toast error', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[id="email"]', 'wrong@school.edu.in');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');

    // Wait for toast (Sonner)
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

});
