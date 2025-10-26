

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { getCityCoords } = require('./cityCoords');

// Target URL (BYU Athletics Calendar)
const url = 'https://byucougars.com/all-sports-schedule';

async function scrapeBYUEvents() {
  // Format date as YYYY-MM-DD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dirName = path.join(__dirname, 'sportsData');
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName);
  }
  const fileName = `BYUSports${yyyy}-${mm}-${dd}.json`;
  const filePath = path.join(dirName, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`sportsData/${fileName} already exists. No new file created.`);
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for event items to load (adjust selector as needed)
  await page.waitForSelector('.schedule-event-item', { timeout: 10000 }).catch(() => {});

  const events = await page.$$eval('.schedule-event-item', items => {
    return items.map(el => {
      const title = el.querySelector('.schedule-event-links__sport-name')?.textContent.trim() || '';
      const date = el.querySelector('.schedule-event-date__time')?.textContent.trim() || '';
      const location = el.querySelector('.schedule-event-location')?.textContent.trim() || '';
      return { title, date, location };
    });
  }); 

  // Add coordinates to events
  const eventsWithCoords = events.map(event => {
    let latitude = null;
    let longitude = null;
    
    if (event.location) {
      // Parse location: "Provo, Utah / Gail Miller Field"
      // Extract city and state from the first part before "/"
      const locationParts = event.location.split('/')[0].trim();
      const cityStateParts = locationParts.split(',');
      
      if (cityStateParts.length >= 2) {
        const city = cityStateParts[0].trim();
        const state = cityStateParts[1].trim();
        
        const coords = getCityCoords(city, state);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lon;
        }
      }
    }
    
    return {
      title: event.title,
      date: event.date,
      location: event.location,
      latitude,
      longitude
    };
  }); 

  fs.writeFileSync(filePath, JSON.stringify(eventsWithCoords, null, 2), 'utf8');
  console.log(`Events saved to sportsData/${fileName}`);
  await browser.close();
}

scrapeBYUEvents();