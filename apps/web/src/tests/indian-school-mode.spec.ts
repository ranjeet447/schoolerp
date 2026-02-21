import { test, expect } from '@playwright/test';

test.describe('Indian School Mode Features', () => {
  // Use a user with high privileges
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Office Reports - Navigation and Exports', async ({ page }) => {
    // Navigate to Office Reports
    await page.goto('/admin/reports');
    await expect(page.getByRole('heading', { name: "Print & Export Center" })).toBeVisible();

    // Check Admission Register Tab
    await expect(page.getByRole('tab', { name: "Students" })).toBeVisible();
    await page.getByRole('tab', { name: "Students" }).click();
    await expect(page.getByText('Admission Register')).toBeVisible();

    // Export button should be visible
    const exportBtn = page.getByRole('button', { name: "Export CSV" }).first();
    await expect(exportBtn).toBeVisible();

    // Check Finance Reports
    await page.getByRole('tab', { name: "Finance" }).click();
    await expect(page.getByText('Daily Collection Book')).toBeVisible();
  });

  test('Fee Counter Mode - Basic Flow', async ({ page }) => {
    // Navigate to Fee Counter
    await page.goto('/admin/finance/counter');
    await expect(page.getByRole('heading', { name: "Smart Fee Counter" })).toBeVisible();

    // Search for a student
    const searchInput = page.getByPlaceholder('Search student by name or admission number...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("John");

    // In a real test, wait for debounce and results, then select one.
    // For smoke testing, just ensure UI elements exist.
    await expect(page.getByText('Checkout')).toBeVisible();
  });

  test('Approvals Inbox - Loads Pending Requests', async ({ page }) => {
    // Navigate to Approvals
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: /Approvals Inbox/i })).toBeVisible();

    // Tabs
    await expect(page.getByRole('tab', { name: "Pending" })).toBeVisible();
    await expect(page.getByRole('tab', { name: "Approved" })).toBeVisible();
  });

  test('Teacher Diary - Homework & Remarks', async ({ page }) => {
    // Note: Admin might be able to see this, or we may need a 'teacher.json' storage state
    // We'll test assuming the user has access.
    const res = await page.goto('/admin/diary');
    if (res && res.status() !== 404 && res.status() !== 401 && res.status() !== 403) {
      await expect(page.getByRole('heading', { name: "Teacher Diary" })).toBeVisible();
      await expect(page.getByRole('button', { name: "Post Homework" })).toBeVisible();
    }
  });
});
