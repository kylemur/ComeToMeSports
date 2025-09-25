

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Target URL (BYU Athletics Calendar)
const url = 'https://byucougars.com/all-sports-schedule';

async function scrapeBYUEvents() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for event items to load (adjust selector as needed)
  await page.waitForSelector('.schedule-event-item', { timeout: 10000 }).catch(() => {});

  const events = await page.$$eval('.schedule-event-item', items => {
    return items.map(el => {
      const title = el.querySelector('.schedule-event-links__sport-name')?.textContent.trim() || '';
      const date = el.querySelector('.schedule-event-date__time')?.textContent.trim() || '';
      return { title, date };
    });
  });

  // Format date as YYYY-MM-DD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const fileName = `BYUSports${yyyy}-${mm}-${dd}.json`;
  const filePath = path.join(__dirname, fileName);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2), 'utf8');
    console.log(`Events saved to ${fileName}`);
  } else {
    console.log(`${fileName} already exists. No new file created.`);
  }
  await browser.close();
}

scrapeBYUEvents();