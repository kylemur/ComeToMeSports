import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://broncosports.com/calendar');
  await page.locator('#transcend-consent-manager').click();
//   await page.locator('#transcend-consent-manager').click();
  await page.locator('[data-test-id="s-common-footer__do-not-sell-btn"]').click();
//   await page.locator('[data-test-id="s-common-footer__do-not-sell-btn"]').click();
  await page.locator('#transcend-consent-manager').click();
//   await page.locator('#transcend-consent-manager').click();
//   await page.locator('#transcend-consent-manager').click();
});