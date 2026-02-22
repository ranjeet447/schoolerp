import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const MOCKUPS_DIR = path.resolve(process.cwd(), 'public/mockups');

if (!fs.existsSync(MOCKUPS_DIR)) {
  fs.mkdirSync(MOCKUPS_DIR, { recursive: true });
}

// Target the live deployment
const BASE_URL = 'https://schoolerp-web.vercel.app';
async function hideDevTools(page) {
  // Hide Next.js dev indicator/overlay if present
  try {
    await page.addStyleTag({
      content: `
      #nextjs-portal, .nextjs-static-indicator-root, [data-nextjs-toast], [data-nextjs-dialog-overlay] { 
        display: none !important; 
      }
    `});
  } catch (e) {
    console.log('No dev tools found to hide.');
  }
}

async function captureAuthenticated() {
  console.log(`Starting headless capture on ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  // 1. SUPER ADMIN (Platform)
  console.log('--- CAPTURING SUPER ADMIN DASHBOARD ---');
  const superContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const superPage = await superContext.newPage();
  await superPage.goto(`${BASE_URL}/auth/login/`, { waitUntil: 'load' });
  await superPage.fill('input[type="email"]', 'saas_admin@schoolerp.com');
  await superPage.fill('input[type="password"]', 'password123');
  await superPage.click('button[type="submit"]');

  // Wait to see if we land in platform/dashboard
  try {
    await superPage.waitForURL('**/platform/dashboard/**', { timeout: 15000 });
    await hideDevTools(superPage);
    await superPage.waitForTimeout(5000);
    await superPage.screenshot({ path: path.join(MOCKUPS_DIR, 'superadmin-dashboard.png'), fullPage: true });
    console.log('Captured Superadmin Dashboard.');
  } catch (e) {
    console.log('Superadmin login failed or redirected elsewhere. Skipping.');
  }
  await superContext.close();

  // 2. TENANT ADMIN
  console.log('--- CAPTURING TENANT ADMIN DASHBOARD ---');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`${BASE_URL}/auth/login/`, { waitUntil: 'load' });
  await adminPage.fill('input[type="email"]', 'admin@elite.com');
  await adminPage.fill('input[type="password"]', 'password123');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/admin/dashboard/**', { timeout: 30000 });
  await hideDevTools(adminPage);
  await adminPage.waitForTimeout(6000);
  await adminPage.screenshot({ path: path.join(MOCKUPS_DIR, 'admin-web.png') });
  console.log('Captured Admin Web Dashboard.');

  // Admin Routes for features
  const adminRoutes = [
    { url: '/admin/finance/charts', name: 'finance-charts.png' },
    { url: '/admin/hrms', name: 'hrms-live.png' },
    { url: '/admin/students', name: 'students-live.png' },
    { url: '/admin/admissions/pipeline', name: 'admission-pipeline.png' },
    { url: '/admin/inventory', name: 'inventory-live.png' },
    { url: '/admin/reports', name: 'reports-live.png' },
  ];

  for (const route of adminRoutes) {
    console.log(`Capturing ${route.url}...`);
    await adminPage.goto(`${BASE_URL}${route.url}`, { waitUntil: 'networkidle' });
    await hideDevTools(adminPage);
    await adminPage.waitForTimeout(5000);
    await adminPage.screenshot({ path: path.join(MOCKUPS_DIR, route.name) });
  }
  await adminContext.close();

  // 3. TEACHER MOBILE
  console.log('--- CAPTURING TEACHER MOBILE ---');
  const teacherContext = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true });
  const teacherPage = await teacherContext.newPage();
  await teacherPage.goto(`${BASE_URL}/auth/login/`, { waitUntil: 'load' });
  await teacherPage.fill('input[type="email"]', 'teacher@elite.com');
  await teacherPage.fill('input[type="password"]', 'password123');
  await teacherPage.click('button[type="submit"]');
  await teacherPage.waitForURL('**/teacher/**', { timeout: 30000 });
  await hideDevTools(teacherPage);
  await teacherPage.waitForTimeout(5000);
  await teacherPage.screenshot({ path: path.join(MOCKUPS_DIR, 'teacher-dashboard.png') });

  await teacherPage.goto(`${BASE_URL}/teacher/attendance`, { waitUntil: 'networkidle' });
  await hideDevTools(teacherPage);
  await teacherPage.waitForTimeout(4000);
  await teacherPage.screenshot({ path: path.join(MOCKUPS_DIR, 'attendance-live.png') });
  console.log('Captured Teacher App.');
  await teacherContext.close();

  // 4. PARENT MOBILE
  console.log('--- CAPTURING PARENT MOBILE ---');
  const parentContext = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true });
  const parentPage = await parentContext.newPage();
  await parentPage.goto(`${BASE_URL}/auth/login/`, { waitUntil: 'load' });
  await parentPage.fill('input[type="email"]', 'parent@elite.com');
  await parentPage.fill('input[type="password"]', 'password123');
  await parentPage.click('button[type="submit"]');
  await parentPage.waitForURL('**/parent/**', { timeout: 30000 });
  await hideDevTools(parentPage);
  await parentPage.waitForTimeout(7000);
  await parentPage.screenshot({ path: path.join(MOCKUPS_DIR, 'notice-mobile-live.png') });
  console.log('Captured Parent App.');
  await parentContext.close();

  await browser.close();
  console.log('All authentic captures finished.');
}

captureAuthenticated().catch(console.error);
