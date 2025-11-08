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

/*
Day containers: .c-calendar__list-item - Each day's events
Date headers: h3 - Date for each day
Event containers: .s-game-card__header-inner-top - Individual events
Sport names: .s-game-card-standard__header-sport-name span - Sport abbreviations like "TF"
Opponent names: a[data-test-id="s-game-card-standard__header-team-opponent-link"] - Event titles
Locations: span[data-test-id="s-game-card-facility-and-location__standard-location-details"] - City, State
Dates: p[data-test-id="s-game-card-standard_header-game-date"] - Event dates
Times: p[data-test-id="s-game-card-standard_header-game-time"] span - Event times
*/

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { getCityCoords } = require('./cityCoords');

// Target URL (BSU Athletics Calendar)
const url = 'https://broncosports.com/calendar';

async function scrapeBSUEvents() {
  // Format date as YYYY-MM-DD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dirName = path.join(__dirname, '../sportsData');
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
  await page.waitForSelector('.c-calendar__list-item', { timeout: 10000 }).catch(() => {});
  // Click on View Type: "List" to ensure all events are visible
  try {
    const listViewButton = page.locator('button#_viewType_list');
    await listViewButton.click();
  } catch (error) {
    console.error('Error clicking List View button:', error);
  }

  const events = await page.$$eval('.c-calendar__list-item', dayContainers => {
    const allEvents = [];
    
    dayContainers.forEach(dayContainer => {
      // Get the date header for this day
      const dateHeader = dayContainer.querySelector('h3')?.textContent.trim() || '';
      
      // Get all event containers for this day
      const eventContainers = dayContainer.querySelectorAll('.s-game-card__header-inner-top');
      
      eventContainers.forEach(eventEl => {
        // Find the parent element that contains all the event data
        const gameCard = eventEl.closest('[class*="s-game-card"]') || eventEl.parentElement;
        
        // Get sport name
        const sport = gameCard.querySelector('.s-game-card-standard__header-sport-name span')?.textContent.trim() || '';
        
        // Get opponent name
        const opponent = gameCard.querySelector('a[data-test-id="s-game-card-standard__header-team-opponent-link"]')?.textContent.trim() || '';
        
        // Create title
        const title = opponent ? `Boise State vs. ${opponent}` : '';
        
        // Get location
        const locationElement = gameCard.querySelector('span[data-test-id="s-game-card-facility-and-location__standard-location-details"]');
        const location = locationElement?.textContent.trim() || '';
        
        // Get date and time
        const date = gameCard.querySelector('p[data-test-id="s-game-card-standard_header-game-date"]')?.textContent.trim() || dateHeader;
        const time = gameCard.querySelector('p[data-test-id="s-game-card-standard_header-game-time"] span')?.textContent.trim() || '';
        
        if (title || sport) { // Only add if we have at least a title or sport
          allEvents.push({ title, sport, date, time, location });
        }
      });
    });
    
    return allEvents;
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

scrapeBSUEvents();