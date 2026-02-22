import { test, expect } from '@playwright/test';

test.describe('Attendance Marking & Correction E2E', () => {
  test('Teacher marks attendance and admin approves correction', async ({ page }) => {
    // 1. Teacher Marks Attendance
    await page.goto('/teacher/attendance');
    await expect(page.getByText('Mark Attendance')).toBeVisible();

    await page.getByRole('button', { name: /select class/i }).click();
    await page.getByRole('option', { name: 'Class 1-A' }).click();

    // Toggle a student to Absent
    const studentRow = page.locator('tr').filter({ hasText: 'John Doe' });
    await studentRow.getByRole('button', { name: 'P' }).click(); // Should toggle to A
    await expect(studentRow.getByRole('button', { name: 'A' })).toBeVisible();

    await page.getByRole('button', { name: 'Submit Attendance' }).click();
    await expect(page.getByText(/attendance submitted/i)).toBeVisible();

    // 2. Admin Reviews Correction (Assuming a correction was requested or needed)
    await page.goto('/admin/attendance/approvals');
    await expect(page.getByText('Attendance Correction Approvals')).toBeVisible();

    const correctionRequest = page.locator('tr').filter({ hasText: 'John Doe' }).first();
    await correctionRequest.getByRole('button', { name: /approve/i }).click();

    await expect(page.getByText(/correction approved/i)).toBeVisible();
  });
});
