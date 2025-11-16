/**
 * Normalizes location strings from BSU athletics data to work with cityCoords.js
 * Handles common formats like:
 * - "Seattle, Wash." -> "Seattle, WA"
 * - "San Diego, Calif." -> "San Diego, CA" 
 * - "Boise State Esports Arena" -> "Boise, ID"
 * - "Hinkle Fieldhouse (Indianapolis, Ind.)" -> "Indianapolis, IN"
 * 
 * 
 * No coordinates found for normalized location: Lake Nona, FL (original: Lake Nona, Fla.)
 * No coordinates found for normalized location: USAFA, CO (original: USAFA, Colo.)
 */

/**
 * Maps abbreviated state names to two-letter state codes
 */
const stateAbbreviationMap = {
  'Ala.': 'AL', 'Alabama': 'AL',
  'Alaska': 'AK',
  'Ariz.': 'AZ', 'Arizona': 'AZ',
  'Ark.': 'AR', 'Arkansas': 'AR',
  'Calif.': 'CA', 'California': 'CA',
  'Colo.': 'CO', 'Colorado': 'CO',
  'Conn.': 'CT', 'Connecticut': 'CT',
  'Del.': 'DE', 'Delaware': 'DE',
  'Fla.': 'FL', 'Florida': 'FL',
  'Ga.': 'GA', 'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Ill.': 'IL', 'Illinois': 'IL',
  'Ind.': 'IN', 'Indiana': 'IN',
  'Iowa': 'IA',
  'Kan.': 'KS', 'Kansas': 'KS',
  'Ky.': 'KY', 'Kentucky': 'KY',
  'La.': 'LA', 'Louisiana': 'LA',
  'Maine': 'ME',
  'Md.': 'MD', 'Maryland': 'MD',
  'Mass.': 'MA', 'Massachusetts': 'MA',
  'Mich.': 'MI', 'Michigan': 'MI',
  'Minn.': 'MN', 'Minnesota': 'MN',
  'Miss.': 'MS', 'Mississippi': 'MS',
  'Mo.': 'MO', 'Missouri': 'MO',
  'Mont.': 'MT', 'Montana': 'MT',
  'Neb.': 'NE', 'Nebraska': 'NE',
  'Nev.': 'NV', 'Nevada': 'NV',
  'N.H.': 'NH', 'New Hampshire': 'NH',
  'N.J.': 'NJ', 'New Jersey': 'NJ',
  'N.M.': 'NM', 'New Mexico': 'NM',
  'N.Y.': 'NY', 'New York': 'NY',
  'N.C.': 'NC', 'North Carolina': 'NC',
  'N.D.': 'ND', 'North Dakota': 'ND',
  'Ohio': 'OH',
  'Okla.': 'OK', 'Oklahoma': 'OK',
  'Ore.': 'OR', 'Oregon': 'OR',
  'Pa.': 'PA', 'Pennsylvania': 'PA',
  'R.I.': 'RI', 'Rhode Island': 'RI',
  'S.C.': 'SC', 'South Carolina': 'SC',
  'S.D.': 'SD', 'South Dakota': 'SD',
  'Tenn.': 'TN', 'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vt.': 'VT', 'Vermont': 'VT',
  'Va.': 'VA', 'Virginia': 'VA',
  'Wash.': 'WA', 'Washington': 'WA',
  'W.Va.': 'WV', 'West Virginia': 'WV',
  'Wis.': 'WI', 'Wisconsin': 'WI',
  'Wyo.': 'WY', 'Wyoming': 'WY'
};

/**
 * Maps venue names to their likely city and state
 */
const venueLocationMap = {
  'Boise State Esports Arena': 'Boise, ID',
  'ExtraMile Arena': 'Boise, ID',
  'Albertsons Stadium': 'Boise, ID',
  'Dona Larsen Park': 'Boise, ID'
};

/**
 * Normalizes a location string to city, state format that works with cityCoords
 * @param {string} rawLocation - The raw location string from BSU athletics
 * @returns {Object|null} - {city, state} or null if cannot be parsed
 */
function normalizeBSULocation(rawLocation) {
  if (!rawLocation || typeof rawLocation !== 'string') {
    return null;
  }

  let location = rawLocation.trim();
  
  // Handle venue-only locations first
  if (venueLocationMap[location]) {
    const normalized = venueLocationMap[location];
    const parts = normalized.split(',');
    return {
      city: parts[0].trim(),
      state: parts[1].trim()
    };
  }

  // Extract city/state from parentheses: "Hinkle Fieldhouse (Indianapolis, Ind.)"
  const parenthesesMatch = location.match(/\(([^)]+)\)/);
  if (parenthesesMatch) {
    location = parenthesesMatch[1];
  }

  // Split by comma to get city and state
  const parts = location.split(',');
  if (parts.length < 2) {
    return null;
  }

  let city = parts[0].trim();
  let state = parts[1].trim();

  // Remove any extra text after the state (like venue names)
  // "Boston, Mass. / Conte Forum" -> "Boston, Mass."
  const stateOnly = state.split('/')[0].trim();
  state = stateOnly;

  // Convert abbreviated state to postal code
  if (stateAbbreviationMap[state]) {
    state = stateAbbreviationMap[state];
  }

  // Validate we have both city and state
  if (!city || !state) {
    return null;
  }

  return {
    city: city,
    state: state
  };
}

/**
 * Converts a normalized location back to "City, State" format for cityCoords lookup
 * @param {string} rawLocation - The raw location string from BSU athletics
 * @returns {string|null} - "City, ST" format or null if cannot be normalized
 */
function getBSULocationForCoords(rawLocation) {
  const normalized = normalizeBSULocation(rawLocation);
  if (!normalized) {
    return null;
  }
  
  return `${normalized.city}, ${normalized.state}`;
}

module.exports = {
  normalizeBSULocation,
  getBSULocationForCoords,
  stateAbbreviationMap,
  venueLocationMap
};
