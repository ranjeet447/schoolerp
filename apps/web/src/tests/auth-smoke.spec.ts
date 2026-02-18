import { test, expect } from '@playwright/test';

test.describe('Auth Smoke Tests', () => {

  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h2')).toContainText('Welcome Back');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('Quick access buttons work', async ({ page }) => {
    await page.goto('/auth/login');

    // Click Admin quick access
    await page.getByRole('button', { name: 'Admin' }).click();
    await expect(page.getByPlaceholder('admin@school.edu.in')).toHaveValue('admin@school.edu.in');

    // Click Teacher quick access
    await page.getByRole('button', { name: 'Teacher' }).click();
    await expect(page.getByPlaceholder('admin@school.edu.in')).toHaveValue('teacher@school.edu.in');
  });

  test('Invalid login shows toast error', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByPlaceholder('admin@school.edu.in').fill('wrong@school.edu.in');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for toast (Sonner)
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

});
