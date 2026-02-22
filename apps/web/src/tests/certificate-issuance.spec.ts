import { test, expect } from '@playwright/test';

test.describe('Certificate Issuance E2E', () => {
  test('Admin can search student and issue Bonafide certificate', async ({ page }) => {
    await page.goto('/admin/certificates');
    await expect(page.getByText('Certificates & Documents')).toBeVisible();

    // 1. Search for a student
    await page.getByPlaceholder(/search student/i).fill('John');
    // Wait for search results
    await expect(page.locator('div.student-result-item')).toBeVisible();
    await page.locator('div.student-result-item').first().click();

    // 2. Open Direct Issue tab
    await page.getByRole('tab', { name: 'Direct Issue' }).click();

    // 3. Select Certificate Type
    await page.getByRole('button', { name: /select certificate/i }).click();
    await page.getByRole('option', { name: 'Bonafide Certificate' }).click();

    // 4. Preview and Issue
    await page.getByRole('button', { name: 'Preview & Issue' }).click();

    // Check for success toast
    await expect(page.getByText(/certificate issued successfully/i)).toBeVisible();
  });

  test('Admin can approve TC request', async ({ page }) => {
    await page.goto('/admin/certificates');
    await page.getByRole('tab', { name: 'Requests' }).click();

    // Find a pending TC request
    const tcRequest = page.locator('tr', { hasText: 'Transfer Certificate' }).filter({ hasText: 'Pending' }).first();
    await tcRequest.getByRole('button', { name: /view/i }).click();

    // Approve the request in the dialog
    await expect(page.getByText('Certificate Request Details')).toBeVisible();
    await page.getByRole('button', { name: /approve/i }).click();

    await expect(page.getByText(/request approved/i)).toBeVisible();
  });
});
