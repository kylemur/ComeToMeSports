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
    
    // Parse CSV header to find column indices
    const headers = parseCSVLine(lines[0]);
    const cityIdx = headers.findIndex(h => h.toLowerCase() === 'city');
    const stateIdIdx = headers.findIndex(h => h.toLowerCase() === 'state_id');
    const stateNameIdx = headers.findIndex(h => h.toLowerCase() === 'state_name');
    const latIdx = headers.findIndex(h => h.toLowerCase() === 'lat');
    const lonIdx = headers.findIndex(h => h.toLowerCase() === 'lng' || h.toLowerCase() === 'lon' || h.toLowerCase() === 'long');

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const cols = parseCSVLine(lines[i]);
        if (cols.length <= Math.max(cityIdx, stateIdIdx, stateNameIdx, latIdx, lonIdx)) continue;
        
        const csvCity = cols[cityIdx] ? cols[cityIdx].trim() : '';
        const csvStateId = cols[stateIdIdx] ? cols[stateIdIdx].trim() : '';
        const csvStateName = cols[stateNameIdx] ? cols[stateNameIdx].trim() : '';
        
        if (
            csvCity &&
            csvCity.toLowerCase() === city.trim().toLowerCase() &&
            (
                (csvStateId && csvStateId.toLowerCase() === state.trim().toLowerCase()) ||
                (csvStateName && csvStateName.toLowerCase() === state.trim().toLowerCase())
            )
        ) {
            const lat = parseFloat(cols[latIdx]);
            const lon = parseFloat(cols[lonIdx]);
            return {
                lat: lat,
                lon: lon
            };
        }
    }
    return null;
}

// Simple CSV parser that handles quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Handle escaped quotes
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
}

// // Example usage:
// const coords = getCityCoords('Los Angeles', 'CA');
// console.log(coords);

module.exports = { getCityCoords };