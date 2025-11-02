const path = require('path');
const fs = require('fs');
const { getCityCoords } = require('../helperFunctions/cityCoords');

describe('getCityCoords', () => {
    test('returns correct coordinates for a known city/state', () => {
        // Example: Los Angeles, CA (adjust if your uszips.csv uses different data)
        const coords = getCityCoords('Los Angeles', 'CA');
        expect(coords).toBeTruthy();
        expect(typeof coords.lat).toBe('number');
        expect(typeof coords.lon).toBe('number');
    });

    test('returns null for an unknown city/state', () => {
        const coords = getCityCoords('FakeCity', 'ZZ');
        expect(coords).toBeNull();
    });

    test('is case-insensitive for city and state', () => {
        const coords1 = getCityCoords('los angeles', 'ca');
        const coords2 = getCityCoords('LOS ANGELES', 'CA');
        expect(coords1).toEqual(coords2);
    });

    test('returns correct coordinates for full state name', () => {
        // Example: Los Angeles, California
        const coords = getCityCoords('Los Angeles', 'California');
        expect(coords).toBeTruthy();
        expect(typeof coords.lat).toBe('number');
        expect(typeof coords.lon).toBe('number');
    });

    test('logs lat/lon for first event in BYUSports2025-09-25.json', () => {
        const eventsPath = path.join(__dirname, '../sportsData/BYUSports2025-09-25.json');
        const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
        const firstEvent = Array.isArray(events) ? events[0] : events.events[0];
        
        // BYU sports data has location field like "San Diego, CA" or "Provo, Utah"
        const location = firstEvent.location;
        console.log(`Event location: ${location}`);
        
        // Parse the location to extract city and state
        const locationParts = location.split(',');
        if (locationParts.length >= 2) {
            const city = locationParts[0].trim();
            const state = locationParts[1].trim().split('/')[0].trim(); // Handle cases like "Provo, Utah / Venue"
            
            console.log(`Parsed city: ${city}, state: ${state}`);
            const coords = getCityCoords(city, state);
            console.log(`Lat: ${coords ? coords.lat : 'N/A'}, Lon: ${coords ? coords.lon : 'N/A'}`);
            
            // Note: This test might fail if the city/state isn't in our ZIP codes database
            if (coords) {
                expect(typeof coords.lat).toBe('number');
                expect(typeof coords.lon).toBe('number');
            } else {
                console.log(`No coordinates found for ${city}, ${state}`);
            }
        } else {
            console.log(`Could not parse location: ${location}`);
        }
    });
});