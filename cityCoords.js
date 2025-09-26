const fs = require('fs');
const path = require('path');

// Assumes uszips.csv is in the same directory as this file
const CSV_PATH = path.join(__dirname, 'ZIPCodes/uszips.csv');

/**
 * Finds the latitude and longitude for a given city and state using uszips.csv.
 * @param {string} city - The city name (case-insensitive).
 * @param {string} state - The 2-letter state abbreviation or full state name (case-insensitive).
 * @returns {{lat: number, lon: number} | null} The coordinates or null if not found.
 */
function getCityCoords(city, state) {
    const data = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = data.split('\n');
    // Find header indices
    const headers = lines[0].split(',');
    const cityIdx = headers.findIndex(h => h.toLowerCase() === 'city');
    const stateIdIdx = headers.findIndex(h => h.toLowerCase() === 'state_id');
    const stateNameIdx = headers.findIndex(h => h.toLowerCase() === 'state_name');
    const latIdx = headers.findIndex(h => h.toLowerCase() === 'lat');
    const lonIdx = headers.findIndex(h => h.toLowerCase() === 'lng' || h.toLowerCase() === 'lon' || h.toLowerCase() === 'long');

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (
            cols[cityIdx] && (cols[stateIdIdx] || cols[stateNameIdx]) &&
            cols[cityIdx].trim().toLowerCase() === city.trim().toLowerCase() &&
            (
                (cols[stateIdIdx] && cols[stateIdIdx].trim().toLowerCase() === state.trim().toLowerCase()) ||
                (cols[stateNameIdx] && cols[stateNameIdx].trim().toLowerCase() === state.trim().toLowerCase())
            )
        ) {
            return {
                lat: parseFloat(cols[latIdx]),
                lon: parseFloat(cols[lonIdx])
            };
        }
    }
    return null;
}

// Example usage:
// const coords = getCityCoords('Los Angeles', 'CA');
// console.log(coords);

module.exports = { getCityCoords };