const { chromium } = require('playwright');

async function handleBSUConsentManager() {
    // Launch browser
    const browser = await chromium.launch({ 
        headless: false, // Set to true for headless mode
        slowMo: 1000 // Add delay between actions for visibility
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        console.log('Navigating to Boise State Broncos Sports website...');
        await page.goto('https://broncosports.com/calendar', { waitUntil: 'networkidle' });
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        // Step 1: Close consent manager
        console.log('Step 1: Looking for consent manager close button...');
        
        // Try multiple selectors for the close button
        const closeButtonSelectors = [
            'button[aria-label="Close consent manager"]',
            '.privacy-policy-notice-with-close-button-close',
            '#consentManagerMainDialog button[aria-label="Close consent manager"]'
        ];
        
        let closeButtonClicked = false;
        for (const selector of closeButtonSelectors) {
            try {
                const closeButton = await page.locator(selector).first();
                if (await closeButton.isVisible({ timeout: 5000 })) {
                    console.log(`Found close button with selector: ${selector}`);
                    await closeButton.click();
                    console.log('✓ Consent manager closed successfully');
                    closeButtonClicked = true;
                    break;
                }
            } catch (error) {
                console.log(`Close button not found with selector: ${selector}`);
            }
        }
        
        if (!closeButtonClicked) {
            console.log('⚠️ Consent manager close button not found - it may not be present');
        }
        
        // Wait a moment for any animations
        await page.waitForTimeout(2000);
        
        // Step 2: Click "Do Not Sell or Share My Personal Information" button
        console.log('Step 2: Looking for "Do Not Sell" button...');
        
        // Try multiple approaches to find the "Do Not Sell" button
        const doNotSellSelectors = [
            '#app > div.main-footer.overflow-hidden > div:nth-child(4) > footer > ul > li.px-\\[30px\\]\\.py-3\\.md\\:py-0\\.md\\:pl-3\\.md\\:pr-0 > button',
            'button:has-text("Do Not Sell")',
            'button:has-text("Do Not Sell or Share")',
            'button[data-test-id*="do-not-sell"]',
            'a:has-text("Do Not Sell")',
            'a:has-text("Do Not Sell or Share")'
        ];
        
        let doNotSellClicked = false;
        for (const selector of doNotSellSelectors) {
            try {
                const doNotSellButton = await page.locator(selector).first();
                if (await doNotSellButton.isVisible({ timeout: 5000 })) {
                    console.log(`Found "Do Not Sell" button with selector: ${selector}`);
                    await doNotSellButton.click();
                    console.log('✓ "Do Not Sell" button clicked successfully');
                    doNotSellClicked = true;
                    break;
                }
            } catch (error) {
                console.log(`"Do Not Sell" button not found with selector: ${selector}`);
            }
        }
        
        if (!doNotSellClicked) {
            // Try scrolling to footer and searching again
            console.log('Scrolling to footer to look for "Do Not Sell" button...');
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);
            
            // Try again after scrolling
            for (const selector of doNotSellSelectors) {
                try {
                    const doNotSellButton = await page.locator(selector).first();
                    if (await doNotSellButton.isVisible({ timeout: 3000 })) {
                        console.log(`Found "Do Not Sell" button after scrolling with selector: ${selector}`);
                        await doNotSellButton.click();
                        console.log('✓ "Do Not Sell" button clicked successfully');
                        doNotSellClicked = true;
                        break;
                    }
                } catch (error) {
                    // Continue to next selector
                }
            }
        }
        
        if (!doNotSellClicked) {
            console.log('⚠️ "Do Not Sell" button not found');
        }
        
        // Wait for potential page navigation or modal
        await page.waitForTimeout(3000);
        
        // Step 3: Click the toggle switch
        console.log('Step 3: Looking for toggle switch...');
        
        const toggleSelectors = [
            '#switch-all-purposes',
            'input#switch-all-purposes',
            'label[for="switch-all-purposes"]',
            '.switch label',
            'input[type="checkbox"]#switch-all-purposes'
        ];
        
        let toggleClicked = false;
        for (const selector of toggleSelectors) {
            try {
                const toggleSwitch = await page.locator(selector).first();
                if (await toggleSwitch.isVisible({ timeout: 5000 })) {
                    console.log(`Found toggle switch with selector: ${selector}`);
                    await toggleSwitch.click();
                    console.log('✓ Toggle switch clicked successfully');
                    toggleClicked = true;
                    break;
                }
            } catch (error) {
                console.log(`Toggle switch not found with selector: ${selector}`);
            }
        }
        
        if (!toggleClicked) {
            console.log('⚠️ Toggle switch not found');
        }
        
        // Wait a moment to see the results
        await page.waitForTimeout(3000);
        
        console.log('\n=== Summary ===');
        console.log(`Close consent manager: ${closeButtonClicked ? '✓ Success' : '⚠️ Not found'}`);
        console.log(`"Do Not Sell" button: ${doNotSellClicked ? '✓ Success' : '⚠️ Not found'}`);
        console.log(`Toggle switch: ${toggleClicked ? '✓ Success' : '⚠️ Not found'}`);
        
        // Optional: Take a screenshot of the final state
        await page.screenshot({ path: 'bsu-consent-final-state.png', fullPage: true });
        console.log('Screenshot saved as bsu-consent-final-state.png');
        
    } catch (error) {
        console.error('Error during automation:', error);
    } finally {
        // Keep browser open for 5 seconds to see the results
        console.log('\nKeeping browser open for 5 seconds...');
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

// Run the automation
handleBSUConsentManager().catch(console.error);