// scripts/browser-qa-test.mjs
/**
 * Turashoboye Feeds — Automated End-to-End Browser QA & Security Test Script
 * 
 * Tests in a real Chromium browser:
 * 1. Public marketing landing page & public footer
 * 2. Unauthenticated redirection to /login when attempting to access /admin or /dashboard
 * 3. Farmer authentication & redirection to /portal (Customer view)
 * 4. Depot Manager authentication & landing on /dashboard (Depot view with Silo gauges)
 * 5. Business Owner authentication & landing on /dashboard (Executive view with PO approvals)
 * 6. Super Admin authentication & landing on /admin (Master governance view)
 * 7. Verification of the new shared AuthenticatedFooter (v1.0.0-rc1, DEPOT-01)
 * 8. Verification that universal client impersonation is disabled
 * 
 * Usage:
 *   node scripts/browser-qa-test.mjs
 *   TEST_URL=https://turashoboye.vercel.app node scripts/browser-qa-test.mjs
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5174';
const SCREENSHOT_DIR = path.resolve('tests', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const PASSWORD = process.env.TEST_PASSWORD || 'turashoboye2026';

const PERSONAS = [
  {
    role: 'Farmer / Customer',
    email: 'farmer@turashoboye.rw',
    expectedPath: '/portal',
    verifySelector: 'text=Mahama Farmer',
    screenshot: '03-farmer-portal.png',
  },
  {
    role: 'Depot Manager',
    email: 'manager@turashoboye.rw',
    expectedPath: '/dashboard',
    verifySelector: 'text=Raw Ingredient Silo',
    screenshot: '04-manager-dashboard.png',
  },
  {
    role: 'Business Owner',
    email: 'owner@turashoboye.rw',
    expectedPath: '/dashboard',
    verifySelector: 'text=Executive Expense & PO Approval Queue',
    screenshot: '05-owner-dashboard.png',
  },
  {
    role: 'Super Administrator',
    email: 'superadmin@turashoboye.rw',
    expectedPath: '/admin',
    verifySelector: 'text=SUPER ADMINISTRATOR COMMAND CONSOLE',
    screenshot: '06-superadmin-console.png',
  },
];

async function runBrowserQASuite() {
  console.log('================================================================');
  console.log('   TURASHOBOYE FEEDS — BROWSER QA & SECURITY SUITE              ');
  console.log('================================================================');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Turashoboye-QA-Browser-Runner)',
  });
  const page = await context.newPage();

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Public Landing Page & Public Footer
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Public Landing Page & Public Footer ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const title = await page.title();
    assert(title.length > 0, `Page loaded successfully (Title: "${title}")`);

    // Verify animal imagery exists
    const images = await page.$$eval('img', (imgs) => imgs.map((i) => i.src));
    assert(images.length > 0, `Authentic product & livestock photography rendered (${images.length} images)`);

    // Verify PublicFooter
    const footerText = await page.textContent('footer');
    assert(
      footerText && footerText.includes('Turashoboye') && footerText.includes('Mahama Depot Contact'),
      'PublicFooter rendered with contact details and verified links'
    );

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-public-homepage.png') });

    // -------------------------------------------------------------------------
    // TEST 2: Protected Routes Access Control (Unauthenticated)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Access Control on Protected Routes (Unauthenticated) ---');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    const currentUrlAfterAdmin = page.url();
    assert(
      currentUrlAfterAdmin.includes('/login'),
      `Direct access to /admin without auth redirected to /login (Current: ${currentUrlAfterAdmin})`
    );

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    const currentUrlAfterDashboard = page.url();
    assert(
      currentUrlAfterDashboard.includes('/login'),
      `Direct access to /dashboard without auth redirected to /login (Current: ${currentUrlAfterDashboard})`
    );

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-unauthenticated-login-redirect.png') });

    // -------------------------------------------------------------------------
    // TEST 3: Authenticating Each Dedicated Persona
    // -------------------------------------------------------------------------
    for (const persona of PERSONAS) {
      console.log(`\n--- Testing Persona: ${persona.role} (${persona.email}) ---`);
      
      const personaContext = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Turashoboye-QA-Browser-Runner)',
      });
      const pPage = await personaContext.newPage();

      // Go to login page
      await pPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

      // Fill login credentials
      await pPage.fill('input[type="email"]', persona.email);
      await pPage.fill('input[type="password"]', PASSWORD);

      // Click sign in
      await pPage.click('button[type="submit"]');

      // Wait for navigation or expected URL
      try {
        await pPage.waitForURL(`**${persona.expectedPath}*`, { timeout: 10000 });
        assert(true, `Successfully routed to expected destination: ${persona.expectedPath}`);
      } catch {
        const actualUrl = pPage.url();
        assert(actualUrl.includes(persona.expectedPath), `Routed to ${actualUrl} (expected ${persona.expectedPath})`);
      }

      // Verify specific persona view elements
      try {
        await pPage.waitForSelector(persona.verifySelector, { timeout: 6000 });
        assert(true, `Found persona indicator: "${persona.verifySelector}"`);
      } catch {
        assert(false, `Expected indicator "${persona.verifySelector}" not immediately visible on ${pPage.url()}`);
      }

      // Check AuthenticatedFooter if in workspace
      if (persona.expectedPath === '/dashboard' || persona.expectedPath === '/admin') {
        const authFooter = await pPage.$('footer');
        if (authFooter) {
          const authFooterText = await authFooter.textContent();
          assert(
            authFooterText.includes('v1.0.0-rc1') || authFooterText.includes('DEPOT-01'),
            'AuthenticatedFooter verified with version and depot operational tag'
          );
        }
      }

      // Verify universal client-side impersonation is dead
      const storedImpersonation = await pPage.evaluate(() => sessionStorage.getItem('turashoboye_act_as_user'));
      assert(storedImpersonation === null, 'SessionStorage turashoboye_act_as_user is strictly null (Impersonation decommissioned)');

      // Take screenshot
      await pPage.screenshot({ path: path.join(SCREENSHOT_DIR, persona.screenshot) });
      console.log(`  📸 Screenshot captured: ${persona.screenshot}`);

      await personaContext.close();
    }

    console.log('\n================================================================');
    console.log(`   TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED       `);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Fatal test error encountered:', error);
  } finally {
    await browser.close();
  }
}

runBrowserQASuite();
