import { test, type Page, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Screenshot generator for SchoolERP
 * Captures clean, high-res screenshots for the marketing site.
 */

const WEB_BASE_URL = process.env.WEB_BASE_URL || 'https://schoolerp-web.vercel.app';
const PASSWORD = process.env.LOGIN_PASSWORD || 'password123';

const ARTIFACTS_BASE = path.resolve(process.cwd(), 'src/tests/artifacts/screenshots');
const MARKETING_DIR = path.resolve(process.cwd(), '../marketing/public/product-screens');

const ROLES = [
  {
    name: 'admin',
    email: process.env.LOGIN_EMAIL_TENANT_ADMIN || 'admin@elite.com',
    displayTitle: 'Elite International School | Admin',
    screenshots: [
      { name: 'admin-dashboard', url: '/admin/dashboard', title: 'Administrative Overview' },
      { name: 'admin-students', url: '/admin/students', title: 'Student Management' },
      { name: 'admin-finance', url: '/admin/finance', title: 'Financial Analytics' },
    ]
  },
  {
    name: 'teacher',
    email: process.env.LOGIN_EMAIL_TEACHER || 'teacher@elite.com',
    displayTitle: 'Elite International School | Teacher Portal',
    screenshots: [
      { name: 'teacher-dashboard', url: '/teacher/dashboard', title: 'Academic Dashboard' },
      { name: 'teacher-attendance', url: '/teacher/attendance', title: 'Class Attendance' },
    ]
  },
  {
    name: 'accountant',
    email: process.env.LOGIN_EMAIL_ACCOUNTANT || 'accountant@elite.com',
    displayTitle: 'Elite International School | Billing',
    screenshots: [
      { name: 'accountant-dashboard', url: '/accountant/dashboard', title: 'Collection Summary' },
      { name: 'accountant-collections', url: '/accountant/fees', title: 'Fee Management' },
    ]
  },
  {
    name: 'parent',
    email: process.env.LOGIN_EMAIL_PARENT || 'parent@elite.com',
    displayTitle: 'Elite International School | Parent App',
    screenshots: [
      { name: 'parent-dashboard', url: '/parent/dashboard', title: 'Student Progress' },
      { name: 'parent-fees', url: '/parent/fees', title: 'Fee Payments' },
    ]
  },
  {
    name: 'student',
    email: process.env.LOGIN_EMAIL_STUDENT || 'student@elite.com',
    displayTitle: 'Elite International School | Student Portal',
    screenshots: [
      { name: 'student-dashboard', url: '/student/dashboard', title: 'My Education' },
    ]
  }
];

async function login(page: Page, email: string) {
  // Clear any existing headers for a clean start
  await page.setExtraHTTPHeaders({});
  
  await page.goto(`${WEB_BASE_URL}/auth/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  
  const loginBtn = page.locator('button[type="submit"]');
  await loginBtn.click();
  
  // Wait for redirect but check for errors
  try {
    await page.waitForURL(url => !url.href.includes('/auth/login'), { timeout: 20000 });
  } catch (e) {
    const errorText = await page.innerText('.sonner-toast').catch(() => 'No error toast found');
    console.error(`Login failed for ${email}:`, errorText);
    
    // Fallback: try to navigate directly if we think we might be logged in
    await page.goto(`${WEB_BASE_URL}/admin/dashboard`);
    if (page.url().includes('/auth/login')) {
       throw new Error(`Login failed definitively for ${email}. Current URL: ${page.url()}`);
    }
  }

  // After successful login, set the tenant context for data pages
  // We'll use 'elite' as it's the primary seeded tenant
  await page.setExtraHTTPHeaders({
    'x-tenant-id': 'elite',
    'x-forwarded-host': 'elite'
  });
}

async function preparePageForScreenshot(page: Page, title?: string) {
  // 1. Disable animations and transitions
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      /* Hide Next.js dev tools if any */
      #nextjs-portal, .nextjs-static-indicator-root { display: none !important; }
      /* Hide Toast notifications */
      [data-sonner-toaster] { display: none !important; }
      
      /* Ensure clean typography for screenshots */
      body { -webkit-font-smoothing: antialiased; }

      /* Visual layout consistency fixes */
       main { min-height: 100vh; background: #f8fafc; }
    `
  });

  // 2. Clear PII/Dynamic elements while keeping it looking real
  await page.addStyleTag({
    content: `
      /* Blur specific columns that contain student names but keep layout */
      td:nth-child(2), td:nth-child(3) {
         filter: blur(8px) !important;
      }
      /* Individual student/parent profile texts - be careful not to hide everything */
      .pii-mask { filter: blur(8px) !important; }
    `
  });

  // 3. Inject a cleaner header if needed to make it look "premium"
  if (title) {
    await page.evaluate((t) => {
      const h1 = document.querySelector('h1');
      if (h1) h1.innerText = t;
    }, title);
  }

  // 4. Wait for content to settle
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // 3s buffer for real charts/data
}

test.describe('Dashboard Screenshot Generator', () => {
  // Ensure directories exist
  test.beforeAll(() => {
    [ARTIFACTS_BASE, MARKETING_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
    ROLES.forEach(role => {
      const rawDir = path.join(ARTIFACTS_BASE, 'raw', role.name);
      const cleanDir = path.join(ARTIFACTS_BASE, 'clean', role.name);
      const mktDir = path.join(MARKETING_DIR, role.name);
      [rawDir, cleanDir, mktDir].forEach(d => {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      });
    });
  });

  for (const role of ROLES) {
    test(`Capture screenshots for ${role.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      
      console.log(`Logging in as ${role.name} (${role.email})...`);
      await login(page, role.email);

      for (const sc of role.screenshots) {
        console.log(`Capturing ${sc.name} at ${sc.url}...`);
        try {
          // Double navigate to ensure correct tenant context with headers
          await page.goto(`${WEB_BASE_URL}${sc.url}`, { waitUntil: 'networkidle' });
          await preparePageForScreenshot(page, sc.title);

          const rawPath = path.join(ARTIFACTS_BASE, 'raw', role.name, `${sc.name}.png`);
          const cleanPath = path.join(ARTIFACTS_BASE, 'clean', role.name, `${sc.name}.png`);
          const mktPath = path.join(MARKETING_DIR, role.name, `${sc.name}.png`);

          await page.screenshot({ path: rawPath });
          await page.screenshot({ path: cleanPath });
          fs.copyFileSync(cleanPath, mktPath);
          console.log(`✅ Saved ${sc.name}`);
        } catch (e) {
          console.error(`❌ Failed to capture ${sc.name}:`, e);
        }
      }
    });

    test(`Capture mobile screenshots for ${role.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      
      console.log(`Logging in as ${role.name} (mobile)...`);
      await login(page, role.email);

      // Only capture the main dashboard for mobile
      const mainDashboard = role.screenshots[0];
      console.log(`Capturing mobile ${mainDashboard.name}...`);
      try {
        await page.goto(`${WEB_BASE_URL}${mainDashboard.url}`, { waitUntil: 'networkidle' });
        await preparePageForScreenshot(page, mainDashboard.title);

        const mktPath = path.join(MARKETING_DIR, role.name, `${mainDashboard.name}-mobile.png`);
        await page.screenshot({ path: mktPath });
        console.log(`✅ Saved mobile ${mainDashboard.name}`);
      } catch (e) {
        console.error(`❌ Failed to capture mobile ${mainDashboard.name}:`, e);
      }
    });
  }
});
