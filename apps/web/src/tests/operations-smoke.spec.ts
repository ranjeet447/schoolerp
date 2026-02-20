import { test, expect } from '@playwright/test';

test.describe('Operations & Platform Smoke Tests', () => {
  test('Admin dashboard command center loads', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: /command center/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sync status/i })).toBeVisible();
  });

  test('Parent dashboard overview loads', async ({ page }) => {
    await page.goto('/parent/dashboard');
    await expect(page.getByRole('heading', { name: /parent portal/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /my children/i })).toBeVisible();
  });

  test('Teacher homework workspace loads', async ({ page }) => {
    await page.goto('/teacher/homework');
    await expect(page.getByRole('heading', { name: /homework & assignments/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /recent work/i })).toBeVisible();
  });

  test('Transport vehicles page loads', async ({ page }) => {
    await page.goto('/admin/transport/vehicles');
    await expect(page.getByRole('heading', { name: /fleet management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add vehicle/i })).toBeVisible();
  });

  test('Transport routes page loads', async ({ page }) => {
    await page.goto('/admin/transport/routes');
    await expect(page.getByRole('heading', { name: /route operations/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /route list/i })).toBeVisible();
  });

  test('Library catalog page loads', async ({ page }) => {
    await page.goto('/admin/library/books');
    await expect(page.getByRole('heading', { name: /library catalog/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add book/i })).toBeVisible();
  });

  test('Inventory item master page loads', async ({ page }) => {
    await page.goto('/admin/inventory/items');
    await expect(page.getByRole('heading', { name: /item master/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add item/i })).toBeVisible();
  });

  test('Admissions applications queue loads', async ({ page }) => {
    await page.goto('/admin/admissions/applications');
    await expect(page.getByRole('heading', { name: /admission applications/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
  });
});
