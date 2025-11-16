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
const { getBSULocationForCoords } = require('./locationCity');

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

  // Wait for calendar component to load first
  console.log('Looking for calendar component...');
  try {
    await page.waitForSelector('#calendarComponent', { timeout: 10000 });
    console.log('✅ Calendar component found');
  } catch (error) {
    console.log('❌ Calendar component not found:', error.message);
  }
  
  // Click on View Type: "List" to ensure all events are visible
  try {
    const listViewButton = page.locator('button#_viewType_list');
    await listViewButton.click();
    console.log('Clicked List View button');
  } catch (error) {
    console.error('Error clicking List View button:', error);
    console.log('Continuing without switching to List View');
  }

  // Give the page a moment to fully load after clicking list view
  console.log('Waiting for page to settle after list view click...');
  await page.waitForTimeout(2000);

  // NOW wait for event items to load (after list view is activated)
  console.log('Looking for calendar day elements...');
  try {
    await page.waitForSelector('#calendarComponent .c-calendar__list.grid > div', { timeout: 10000 });
    const elementCount = await page.$$eval('#calendarComponent .c-calendar__list.grid > div', elements => elements.length);
    console.log(`✅ Found ${elementCount} calendar day elements`);
  } catch (error) {
    console.log('❌ No calendar day elements found within 10 seconds');
    console.log('Error:', error.message);
  }
  
  const events = await page.$$eval('#calendarComponent .c-calendar__list.grid > div', dayContainers => {
    const allEvents = [];
    console.log('Starting to process day containers...');
    
    dayContainers.forEach(dayContainer => {
      // Get the date header for this day
      const dateHeader = dayContainer.querySelector('h3')?.textContent.trim() || '';
      console.log(`Processing events for date: ${dateHeader}`);
      
      // Get all event containers for this day
      const eventContainers = dayContainer.querySelectorAll('.s-game-card__header-inner-top');
      console.log(`Found ${eventContainers.length} events for date: ${dateHeader}`);
      
      eventContainers.forEach(eventEl => {
        // Find the parent element that contains all the event data
        const gameCard = eventEl.closest('[class*="s-game-card"]') || eventEl.parentElement;
        console.log(`Processing event: ${gameCard.textContent.trim().slice(0, 50)}...`);
        
        // Get sport name
        const sport = gameCard.querySelector('.s-game-card__header-sport-name span')?.textContent.trim() || '';
        
        // Get opponent name
        let opponent = gameCard.querySelector('a[data-test-id="s-game-card-standard__header-team-opponent-link"]')?.textContent.trim() || '';
        
        // If no opponent found with primary selector, try alternative selector
        if (!opponent) {
          opponent = gameCard.querySelector('.s-game-card__header__team p')?.textContent.trim() || '';
        }
        
        // Create title
        const title = opponent ? `Boise State vs. ${opponent}` : '';
        
        // Get location      // weird and inconsistent formatting on locations 
                                // ex. Boston, Mass. 
                                // ex. Hinkle Fieldhouse (Indianapolis, Ind.)
                                // ex. ExtraMile Arena Boise, Idaho
        const locationElement = gameCard.querySelector('span[data-test-id="s-game-card-facility-and-location__standard-location-details"]');
        const location = locationElement?.textContent.trim() || ''; 
        
        // Get date and time
        const date = gameCard.querySelector('p[data-test-id="s-game-card-standard_header-game-date"]')?.textContent.trim() || dateHeader;
        const time = gameCard.querySelector('.s-game-card__header__game-score-time p span.s-text-paragraph-small')?.textContent.trim() || '';
        
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
      
      // Use location normalization to get coordinates
      const normalizedLocation = getBSULocationForCoords(location);
      if (normalizedLocation) {
        const cityStateParts = normalizedLocation.split(',');
        
        if (cityStateParts.length >= 2) {
          const city = cityStateParts[0].trim();
          const state = cityStateParts[1].trim();
          
          const coords = getCityCoords(city, state);
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lon;
          } else {
            console.log(`No coordinates found for normalized location: ${normalizedLocation} (original: ${location})`);
          }
        }
      } else {
        console.log(`Could not normalize location: ${location}`);
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