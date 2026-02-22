import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const MOCKUPS_DIR = path.resolve(process.cwd(), 'public/mockups');

// Ensure the directory exists
if (!fs.existsSync(MOCKUPS_DIR)) {
  fs.mkdirSync(MOCKUPS_DIR, { recursive: true });
}

async function captureMockups() {
  console.log('Starting Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High-res screenshots
  });

  const page = await context.newPage();

  console.log('Navigating to Live Mockup Stage...');
  await page.goto('http://localhost:3001/mockup-stage', { waitUntil: 'networkidle' });

  // Wait a bit for components to render
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(MOCKUPS_DIR, 'debug-full-page.png'), fullPage: true });

  const elementsToCapture = [
    { selector: 'div#attendance-mockup > div.bg-white', filename: 'attendance-live.png' },
    { selector: 'div#fee-mockup > div.bg-white', filename: 'fee-builder-live.png' },
    { selector: 'div#notice-mockup > div.grid', filename: 'notice-live.png' },
    { selector: 'div#student-mockup > div.flex', filename: 'student-dashboard-live.png' },
    { selector: 'div#receipt-mockup > div.max-w-md', filename: 'receipt-live.png' }
  ];

  for (const item of elementsToCapture) {
    console.log(`Capturing ${item.filename}...`);
    const element = await page.locator(item.selector);
    // Wait for the element to be visible
    await element.waitFor({ state: 'visible', timeout: 5000 }).catch(() => console.log(`Element ${item.selector} not found.`));

    if (await element.isVisible()) {
      await element.screenshot({ path: path.join(MOCKUPS_DIR, item.filename) });
      console.log(`Saved ${item.filename}`);
    }
  }

  // Capture Mobile Notice
  console.log('Capturing mobile view for Notice...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3001/mockup-stage', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);

  const mobileNoticeElement = await mobilePage.locator('div#notice-mockup > div.grid');
  if (await mobileNoticeElement.isVisible()) {
    await mobileNoticeElement.screenshot({ path: path.join(MOCKUPS_DIR, 'notice-mobile-live.png') });
    console.log('Saved notice-mobile-live.png');
  }

  // Also capture Web App Login Page
  console.log('Navigating to Live Web App (Login)...');
  await page.goto('https://schoolerp-web.vercel.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(MOCKUPS_DIR, 'login-desktop.png') });
  console.log('Saved login-desktop.png');

  await mobilePage.goto('https://schoolerp-web.vercel.app/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: path.join(MOCKUPS_DIR, 'login-mobile.png') });
  console.log('Saved login-mobile.png');

  await browser.close();
  console.log('Done capturing mockups.');
}

captureMockups().catch(console.error);
