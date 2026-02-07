import { test, expect } from '@playwright/test';

test.describe('Exams & Report Cards Smoke Tests', () => {
  test('Admin can manage exams', async ({ page }) => {
    await page.goto('/admin/exams');
    await expect(page.getByText('Examination Management')).toBeVisible();

    await page.getByPlaceholder('e.g. Unit Test 1').fill('Playwright Test Exam');
    await page.getByRole('button', { name: 'Create Exam' }).click();

    await expect(page.getByText('Playwright Test Exam')).toBeVisible();
  });

  test('Teacher can enter marks', async ({ page }) => {
    await page.goto('/teacher/exams/marks');
    await expect(page.getByText('Marks Entry')).toBeVisible();

    // Check if marks grid loaded
    await expect(page.getByText('Aarav Sharma')).toBeVisible();

    // Change some marks
    const marksInput = page.locator('input[type="number"]').first();
    await marksInput.fill('88');

    await page.getByRole('button', { name: 'Save All Changes' }).click();
  });

  test('Parent can view child results', async ({ page }) => {
    await page.goto('/parent/results');
    await expect(page.getByText('Academic Results')).toBeVisible();
    await expect(page.getByText('Mid-Term Examination 2025')).toBeVisible();

    // Check for breakdown
    await expect(page.getByText('Mathematics')).toBeVisible();
    await expect(page.getByText('92.0%')).toBeVisible();
  });
});
