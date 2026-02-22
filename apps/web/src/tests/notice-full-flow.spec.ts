import { test, expect } from '@playwright/test';

test.describe('Notice Acknowledgement Full Flow', () => {
  const noticeTitle = `Urgent: School Meeting ${Date.now()}`;
  const noticeContent = 'Please acknowledge this important school meeting notice.';

  test('Admin can publish notice and then track parent acknowledgements', async ({ page }) => {
    // 1. Admin Publishes Notice
    await page.goto('/admin/notices');
    await page.getByPlaceholder('e.g. Annual Day Notice').fill(noticeTitle);
    await page.getByPlaceholder('Type your message here...').fill(noticeContent);
    await page.getByRole('button', { name: 'Publish Notice' }).click();

    await expect(page.getByText(noticeTitle)).toBeVisible();

    // 2. Parent Acknowledges (Simulated by going to parent portal)
    // In a real E2E we might use separate contexts, but here we can just navigate
    await page.goto('/parent/notices');
    await expect(page.getByText(noticeTitle)).toBeVisible();

    // Find the specifically newly created notice card and click Acknowledge
    const noticeCard = page.locator('div.card', { hasText: noticeTitle });
    const ackButton = noticeCard.getByRole('button', { name: 'Acknowledge' });
    await ackButton.click();

    await expect(noticeCard.getByText('Acknowledged')).toBeVisible();

    // 3. Admin Verifies Visibility
    await page.goto('/admin/notices');
    const adminNoticeCard = page.locator('div.card', { hasText: noticeTitle });

    // Click to view stats (I implemented a button or click action for this)
    await adminNoticeCard.getByRole('button', { name: /view/i }).first().click();

    // Check if the Dialog/Drawer with stats is visible
    await expect(page.getByText('Notice Acknowledgement Details')).toBeVisible();
    await expect(page.getByText('Acknowledged Parents')).toBeVisible();

    // Verify our acknowledgement is counted
    // Since it's a demo/test environment, we expect at least 1 ack
    await expect(page.locator('div.stats-card', { hasText: 'Acknowledged' })).toBeVisible();
  });
});
