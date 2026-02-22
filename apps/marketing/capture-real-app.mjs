import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const MOCKUPS_DIR = path.resolve(process.cwd(), 'public/mockups');

if (!fs.existsSync(MOCKUPS_DIR)) {
  fs.mkdirSync(MOCKUPS_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:3000';

async function captureAuthenticated() {
  console.log('Starting Playwright for authenticated capture on local app...');
  const browser = await chromium.launch({ headless: true });

  // High-res desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();

  // 1. ADMIN DESKTOP
  console.log('Navigating to Local Web App (Admin Login)...');
  await page.goto(`${BASE_URL}/auth/login/`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', 'admin@elite.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  console.log('Waiting for Admin dashboard to load...');
  await page.waitForURL('**/admin/dashboard', { timeout: 15000 }).catch(() => console.error('Timeout waiting for URL'));
  await page.waitForTimeout(5000); // Give charts time to render

  console.log('Capturing authenticated Admin Dashboard...');
  await page.screenshot({ path: path.join(MOCKUPS_DIR, 'admin-web.png') });

  const adminRoutes = [
    { url: '/admin/finance/setup/', name: 'fee-builder-live.png' },
    { url: '/admin/finance/charts', name: 'finance-charts.png' },
    { url: '/admin/hrms', name: 'hrms-live.png' },
    { url: '/admin/students', name: 'students-live.png' },
    { url: '/admin/admissions/pipeline', name: 'admission-pipeline.png' },
    { url: '/admin/inventory', name: 'inventory-live.png' },
    { url: '/admin/library/books', name: 'library-live.png' },
    { url: '/admin/transport', name: 'transport-live.png' },
    { url: '/admin/certificates', name: 'certificates-live.png' },
    { url: '/admin/reports', name: 'reports-live.png' },
  ];

  for (const route of adminRoutes) {
    console.log(`Navigating to ${route.url}...`);
    await page.goto(`${BASE_URL}${route.url}`, { waitUntil: 'networkidle' }).catch(e => console.error(`Error on ${route.url}:`, e));
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(MOCKUPS_DIR, route.name) });
  }

  // 1.5 ACCOUNTANT (Optional check if login works)
  console.log('Attempting Accountant login...');
  await page.goto(`${BASE_URL}/auth/login/`, { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'accountant@elite.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  if (page.url().includes('accountant')) {
    await page.screenshot({ path: path.join(MOCKUPS_DIR, 'accountant-dashboard.png') });
  }

  // 2. TEACHER MOBILE
  console.log('Starting Teacher Mobile Capture...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto(`${BASE_URL}/auth/login/`, { waitUntil: 'load', timeout: 30000 });
  await mobilePage.waitForSelector('input[type="email"]', { timeout: 10000 });
  await mobilePage.fill('input[type="email"]', 'teacher@elite.com');
  await mobilePage.fill('input[type="password"]', 'password123');
  await mobilePage.click('button[type="submit"]');

  await mobilePage.waitForURL('**/teacher/**', { timeout: 15000 }).catch(() => console.error('Timeout waiting for teacher URL'));
  await mobilePage.waitForTimeout(5000);

  console.log('Navigating to Teacher Dashboard...');
  await mobilePage.screenshot({ path: path.join(MOCKUPS_DIR, 'teacher-dashboard.png') });

  console.log('Navigating to Teacher Attendance...');
  await mobilePage.goto(`${BASE_URL}/teacher/attendance`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(4000);
  await mobilePage.screenshot({ path: path.join(MOCKUPS_DIR, 'attendance-live.png') });

  await mobileContext.close();

  // 3. PARENT MOBILE
  console.log('Starting Parent Mobile Capture...');
  const parentContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
  });
  const parentPage = await parentContext.newPage();

  await parentPage.goto(`${BASE_URL}/auth/login/`, { waitUntil: 'load', timeout: 30000 });
  await parentPage.waitForSelector('input[type="email"]', { timeout: 10000 });
  await parentPage.fill('input[type="email"]', 'parent@elite.com');
  await parentPage.fill('input[type="password"]', 'password123');
  await parentPage.click('button[type="submit"]');

  // Let's just wait for the dashboard
  await parentPage.waitForURL('**/parent/**', { timeout: 30000 }).catch(() => console.error('Timeout waiting for parent URL'));
  await parentPage.waitForSelector('text=Day Feed', { timeout: 30000 }).catch(() => console.error('Timeout waiting for Day Feed text'));
  await parentPage.waitForTimeout(10000); // Give it a bit more time for charts/data

  // Parent Dashboard 
  await parentPage.screenshot({ path: path.join(MOCKUPS_DIR, 'notice-mobile-live.png') });

  await parentContext.close();

  await browser.close();
  console.log('Done capturing authenticated mockups locally.');
}

captureAuthenticated().catch(console.error);
