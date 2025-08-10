const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const pagesToCheck = [
  'index.html',
  'INEX-Portal-Agreement.html',
  'status.html',
  'test.html',
];

test.describe('INEX smoke', () => {
  for (const pagePath of pagesToCheck) {
    test(`visit ${pagePath}`, async ({ page }) => {
      const outDir = path.join(process.cwd(), 'playwright-output', pagePath.replace(/\W+/g, '_'));
      fs.mkdirSync(outDir, { recursive: true });

      const logs = [];
      page.on('console', (msg) => {
        const entry = `[console:${msg.type()}] ${msg.text()}`;
        logs.push(entry);
        console.log(entry);
      });
      page.on('pageerror', (error) => {
        const entry = `[pageerror] ${error.message}`;
        logs.push(entry);
        console.log(entry);
      });
      page.on('requestfailed', (request) => {
        const failure = request.failure();
        const entry = `[requestfailed] ${request.url()} -> ${failure && failure.errorText}`;
        logs.push(entry);
        console.log(entry);
      });

      await page.goto(`${BASE_URL}/${pagePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      await page.screenshot({ path: path.join(outDir, 'screenshot.png'), fullPage: true });
      await fs.promises.writeFile(path.join(outDir, 'console.log'), logs.join('\n'), 'utf8');

      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
    });
  }
});
