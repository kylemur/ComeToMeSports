import { test, expect } from '@playwright/test';
// import { handleBSUConsentManager } from '../bsu-consent-automation';

test('BSU Consent Manager Test', async ({ page }) => {
//   await handleBSUConsentManager(page);
    
  // Set a longer timeout for this test
  test.setTimeout(60000);
  
  console.log('Navigating to Boise State website...');
  await page.goto('https://broncosports.com/calendar', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  // Wait a bit for any dynamic content to load
  await page.waitForTimeout(3000);
  
  console.log('Page loaded, looking for consent elements...');
  
  // Try to click consent manager close button
  try {
    const consentButton = page.locator('#transcend-consent-manager');
    await consentButton.waitFor({ state: 'visible', timeout: 10000 });
    await consentButton.click();
    console.log('✅ Consent manager closed');
  } catch (error) {
    console.log('⚠️ Consent manager not found or not visible');
  }
  
  // Scroll to footer to find "Do Not Sell" button
  console.log('Scrolling to footer...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  
  // Try to click "Do Not Sell" button
  try {
    const doNotSellButton = page.locator('[data-test-id="s-common-footer__do-not-sell-btn"]');
    await doNotSellButton.waitFor({ state: 'visible', timeout: 10000 });
    await doNotSellButton.click();
    console.log('✅ Do Not Sell button clicked');
  } catch (error) {
    console.log('⚠️ Do Not Sell button not found');
  }
  
  // Try to click toggle switch
  try {
    const toggleSwitch = page.locator('#switch-all-purposes');
    await toggleSwitch.waitFor({ state: 'visible', timeout: 10000 });
    await toggleSwitch.click();
    console.log('✅ Toggle switch clicked');
  } catch (error) {
    console.log('⚠️ Toggle switch not found');
  }
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'bsu-consent-test-result.png', fullPage: true });
  console.log('📸 Screenshot saved as bsu-consent-test-result.png');
});