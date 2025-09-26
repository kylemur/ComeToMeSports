const path = require('path');
const fs = require('fs');
const { getCityCoords } = require('../cityCoords');

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
        const eventsPath = path.join(__dirname, '../BYUSports2025-09-25.json');
        const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
        const firstEvent = Array.isArray(events) ? events[0] : events.events[0];
        // Assume event has city and state fields
        const { city, state } = firstEvent;
        const coords = getCityCoords(city, state);
        console.log(`Lat: ${coords ? coords.lat : 'N/A'}, Lon: ${coords ? coords.lon : 'N/A'}`);
        expect(coords).toBeTruthy();
        expect(typeof coords.lat).toBe('number');
        expect(typeof coords.lon).toBe('number');
    });
});