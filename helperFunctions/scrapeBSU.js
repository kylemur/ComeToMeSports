// import { test, expect } from '@playwright/test';
// import { handleBSUConsentManager } from '../bsu-consent-automation';

// test('test', async ({ page }) => {
//   await page.goto('https://broncosports.com/calendar');
//   await handleBSUConsentManager(page);
// });



/* Scrape Boise State Athletics events and save to JSON with coordinates 

Edge cases to handle:
- 
*/

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { getCityCoords } = require('./cityCoords');

// Target URL (BYU Athletics Calendar)
const url = 'https://broncosports.com/calendar';

async function scrapeBSUEvents() {
  // Format date as YYYY-MM-DD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dirName = path.join(__dirname, 'sportsData');
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName);
  }
  const fileName = `BSUSports${yyyy}-${mm}-${dd}.json`;
  const filePath = path.join(dirName, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`sportsData/${fileName} already exists. No new file created.`);
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Wait for event items to load (adjust selector as needed)
  await page.waitForSelector('button#_viewType_list', { timeout: 10000 }).catch(() => {});
  // Switch to list view to simplify scraping
  await page.click('button#_viewType_list');

  // <div class="c-calendar__list-item">...</div> is a day of events container
  // <h3> is the date header
  // <div data-v-001a9f8e="" class="s-game-card__header-inner-top flex w-full flex-row"> ...</div> is the event container
  // <div class="s-game-card-standard__header-sport-name"> <span>TF</span> </div> is the sport name container ex. TF is for Track & Field
  // <a data-test-id="s-game-card-standard__header-team-opponent-link">Sharon Colyear-Danville Season Opener</a> is the opponent name container ex. Sharon Colyear-Danville Season Opener
  // <p data-test-id="s-game-card-facility-and-location__details-standard"> <span data-test-id="s-game-card-facility-and-location__standard-location-details">Boston, Mass.</span> </p> is the location container ex. Boston, Mass.
  // <p data-test-id="s-game-card-standard_header-game-date">...</p> is the date container
  // <p data-test-id="s-game-card-standard_header-game-time"><span>...</span></p> is the time container
  const events = await page.$$eval('.schedule-event-item', items => {
    return items.map(el => {
      const divider = el.querySelector('.schedule-event-item__divider')?.textContent.trim() || 
                     el.querySelector('.schedule-event-item__neutral-divider')?.textContent.trim() || '';
      const title = (
        "Boise State " + 
        divider + // "at" or "vs." 
        " " + 
        el.querySelector('.schedule-event-item__opponent-name')?.textContent.trim()) || '';
      const sport = el.querySelector('.schedule-event-links__sport-name')?.textContent.trim() || '';
      
      // Get date and time from separate <time> elements
      const dateTimeElement = el.querySelector('.schedule-event-date__time');
      const timeElements = dateTimeElement ? dateTimeElement.querySelectorAll('time') : [];
      const date = timeElements[0] ? timeElements[0].textContent.trim() : '';
      const time = timeElements[1] ? timeElements[1].textContent.trim() : '';
      
      const location = el.querySelector('.schedule-event-location')?.textContent.trim() || '';
      
      return { title, sport, date, time, location };
    });
  }); 

  // Add coordinates to events
  const eventsWithCoords = events.map(event => {
    let latitude = null;
    let longitude = null;
    let location = '';
    let venue = '';
    
    if (event.location) {
      // Parse location: "Lawrence, Kansas / Rim Rock Farm"
      // Split into location and venue
      const locationParts = event.location.split('/');
      location = locationParts[0].trim(); // "Lawrence, Kansas"
      venue = locationParts.length > 1 ? locationParts[1].trim() : ''; // "Rim Rock Farm"
      
      // Extract city and state for coordinates
      const cityStateParts = location.split(',');
      
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
      sport: event.sport,
      date: event.date,
      time: event.time,
      location: location,
      venue: venue,
      latitude,
      longitude
    };
  }); 

  fs.writeFileSync(filePath, JSON.stringify(eventsWithCoords, null, 2), 'utf8');
  console.log(`Events saved to sportsData/${fileName}`);
  await browser.close();
}

scrapeBYUEvents();