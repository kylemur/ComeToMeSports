// Mock events are now loaded from sportsData/mockEvents.json

// TicketmasterAPI integration for universities other than BYU/BSU
class TicketmasterAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://app.ticketmaster.com/discovery/v2';
    }

    async searchUniversitySports(universityName, zipCode, radius = 50) {
        // Convert ZIP to coordinates first
        const coordinates = getCoordinatesForZip(zipCode);
        if (!coordinates) {
            console.error(`No coordinates found for ZIP: ${zipCode}`);
            return [];
        }
        
        // Handle city searches (when universityName is 'all') differently
        if (universityName === 'all') {
            return this.searchGeneralSportsByCoordinates(coordinates.lat, coordinates.lng, radius);
        }
        
        // Try multiple search variations for better results
        const searchTerms = this.generateSearchTerms(universityName);
        
        console.log(`🏈 Starting Ticketmaster search for university: ${universityName}`);
        console.log(`📍 Search parameters: ZIP ${zipCode} -> lat ${coordinates.lat}, lng ${coordinates.lng}, ${radius} mile radius`);
        
        for (let i = 0; i < searchTerms.length; i++) {
            const searchTerm = searchTerms[i];
            console.log(`🔍 [${i + 1}/${searchTerms.length}] Searching for: "${searchTerm}"`);
            
            const params = new URLSearchParams({
                keyword: searchTerm,
                classificationName: 'Sports',
                latlong: `${coordinates.lat},${coordinates.lng}`,
                radius: radius,
                unit: 'miles',
                size: 200,
                sort: 'date,asc',
                countryCode: 'US',
                apikey: this.apiKey
            });

            try {
                const response = await fetch(`${this.baseURL}/events.json?${params}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`📊 API Response for "${searchTerm}":`, {
                    totalElements: data.page?.totalElements || 0,
                    totalPages: data.page?.totalPages || 0,
                    hasEvents: !!data._embedded?.events
                });
                
                const events = this.formatTicketmasterEvents(data._embedded?.events || []);
                
                if (events.length > 0) {
                    console.log(`✅ SUCCESS! Found ${events.length} events for "${searchTerm}"`);
                    return events;
                }
                console.log(`❌ No events found for "${searchTerm}"`);
                
                // Add small delay between searches to be respectful to the API
                if (i < searchTerms.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error(`💥 Error searching for "${searchTerm}":`, error);
            }
        }
        
        console.log(`🚫 No events found for any search term for ${universityName}`);
        return []; // Return empty array if no search terms yielded results
    }

    async searchGeneralSports(zipCode, radius) {
        // Convert ZIP to coordinates first
        const coordinates = getCoordinatesForZip(zipCode);
        if (!coordinates) {
            console.error(`No coordinates found for ZIP: ${zipCode}`);
            return [];
        }
        
        return this.searchGeneralSportsByCoordinates(coordinates.lat, coordinates.lng, radius);
    }
    
    async searchGeneralSportsByCoordinates(lat, lng, radius) {
        console.log(`🏟️ Starting general sports coordinate search`);
        console.log(`📍 Search parameters: lat ${lat}, lng ${lng}, ${radius} mile radius`);
        
        // Search with empty keyword to find all sports events (this works better than no keyword)
        const params = new URLSearchParams({
            keyword: '', // Empty keyword works better than no keyword parameter
            classificationName: 'Sports',
            latlong: `${lat},${lng}`,
            radius: radius,
            unit: 'miles',
            size: 200,
            sort: 'date,asc',
            countryCode: 'US',
            apikey: this.apiKey
        });

        try {
            const response = await fetch(`${this.baseURL}/events.json?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📊 General sports search results:`, {
                totalElements: data.page?.totalElements || 0,
                totalPages: data.page?.totalPages || 0,
                hasEvents: !!data._embedded?.events
            });
            
            const events = this.formatTicketmasterEvents(data._embedded?.events || []);
            
            if (events.length > 0) {
                console.log(`✅ Found ${events.length} general sports events in the area`);
                return events;
            } else {
                console.log(`❌ No sports events found in area`);
                return [];
            }
        } catch (error) {
            console.error(`💥 Error in general sports search:`, error);
            return [];
        }
    }

    async searchUniversitySportsByCity(universityName, city, stateCode, radius = 50) {
        // Convert city/state to coordinates first
        const coordinates = await getCityCoords(city, stateCode);
        if (!coordinates) {
            console.error(`No coordinates found for city: ${city}, ${stateCode}`);
            return [];
        }
        
        // Handle city searches (when universityName is 'all') differently
        if (universityName === 'all') {
            return this.searchGeneralSportsByCoordinates(coordinates.lat, coordinates.lon, radius);
        }
        
        // Try multiple search variations for better results
        const searchTerms = this.generateSearchTerms(universityName);
        
        console.log(`🏈 Starting Ticketmaster city search for university: ${universityName}`);
        console.log(`📍 Search parameters: ${city}, ${stateCode} -> lat ${coordinates.lat}, lng ${coordinates.lon}, ${radius} mile radius`);
        
        for (let i = 0; i < searchTerms.length; i++) {
            const searchTerm = searchTerms[i];
            console.log(`🔍 [${i + 1}/${searchTerms.length}] Searching for: "${searchTerm}"`);
            
            const params = new URLSearchParams({
                keyword: searchTerm,
                classificationName: 'Sports',
                latlong: `${coordinates.lat},${coordinates.lon}`,
                radius: radius,
                unit: 'miles',
                size: 200,
                sort: 'date,asc',
                countryCode: 'US',
                apikey: this.apiKey
            });

            try {
                const response = await fetch(`${this.baseURL}/events.json?${params}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`📊 City API Response for "${searchTerm}":`, {
                    totalElements: data.page?.totalElements || 0,
                    totalPages: data.page?.totalPages || 0,
                    hasEvents: !!data._embedded?.events
                });
                
                const events = this.formatTicketmasterEvents(data._embedded?.events || []);
                
                if (events.length > 0) {
                    console.log(`✅ SUCCESS! Found ${events.length} events for "${searchTerm}" via city search`);
                    return events;
                }
                console.log(`❌ No events found for "${searchTerm}" via city search`);
                
                // Add small delay between searches to be respectful to the API
                if (i < searchTerms.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error(`💥 Error searching for "${searchTerm}" via city search:`, error);
            }
        }
        
        console.log(`🚫 No events found for any search term for ${universityName} via city search`);
        return []; // Return empty array if no search terms yielded results
    }



    async debugGeneralSportsSearch(zipCode, radius) {
        console.log(`🔍 DEBUG: Checking for ANY sports events in ${zipCode} within ${radius} miles...`);
        
        const params = new URLSearchParams({
            classificationName: 'Sports',
            postalCode: zipCode,
            radius: radius,
            unit: 'miles',
            size: 50,
            sort: 'date,asc',
            countryCode: 'US',
            apikey: this.apiKey
        });

        try {
            const response = await fetch(`${this.baseURL}/events.json?${params}`);
            const data = await response.json();
            
            console.log(`📊 General sports search results:`, {
                totalElements: data.page?.totalElements || 0,
                totalPages: data.page?.totalPages || 0,
                hasEvents: !!data._embedded?.events
            });
            
            if (data._embedded?.events?.length > 0) {
                console.log(`✅ Found ${data._embedded.events.length} general sports events nearby:`, 
                    data._embedded.events.map(e => ({ name: e.name, date: e.dates?.start?.localDate }))
                );
            } else {
                console.log(`❌ No sports events found in ${zipCode} within ${radius} miles`);
            }
        } catch (error) {
            console.error(`💥 Error in general sports search:`, error);
        }
    }

    generateSearchTerms(universityName) {
        const terms = [universityName];
        
        // Add variations for common university naming patterns
        const variations = {
            'Boston College': ['Boston College', 'BC Eagles', 'Eagles', 'BC', 'Boston College Eagles'],
            'University of Alabama': ['Alabama', 'Alabama Crimson Tide', 'Crimson Tide', 'Bama'],
            'Auburn University': ['Auburn', 'Auburn Tigers', 'Tigers', 'Auburn University'],
            'University of California, Berkeley': ['Cal Berkeley', 'California', 'Cal Bears', 'UC Berkeley'],
            'University of California, Los Angeles': ['UCLA', 'UCLA Bruins', 'Bruins', 'California Los Angeles'],
            'UCLA': ['UCLA', 'UCLA Bruins', 'Bruins', 'UCLA Basketball', 'UCLA Football'],
            'University of Southern California': ['USC', 'USC Trojans', 'Trojans', 'Southern California'],
            'University of Notre Dame': ['Notre Dame', 'Notre Dame Fighting Irish', 'Fighting Irish', 'ND'],
            'Texas A&M University': ['Texas A&M', 'Aggies', 'TAMU', 'Texas A&M Aggies'],
            'Pennsylvania State University': ['Penn State', 'Penn State Nittany Lions', 'Nittany Lions', 'PSU'],
            'Duke University': ['Duke', 'Duke Blue Devils', 'Blue Devils'],
            'University of North Carolina': ['UNC', 'North Carolina', 'Tar Heels', 'Carolina'],
            'Stanford University': ['Stanford', 'Stanford Cardinal', 'Cardinal'],
            'University of Michigan': ['Michigan', 'Michigan Wolverines', 'Wolverines'],
            'Ohio State University': ['Ohio State', 'OSU', 'Buckeyes', 'Ohio State Buckeyes'],
            'University of Florida': ['Florida', 'Florida Gators', 'Gators', 'UF'],
            'University of Texas': ['Texas', 'Texas Longhorns', 'Longhorns', 'UT'],
            'Texas': ['Texas', 'Texas Longhorns', 'Longhorns', 'UT', 'Texas Basketball'],
            'University of Georgia': ['Georgia', 'Georgia Bulldogs', 'Bulldogs', 'UGA'],
            'Alabama': ['Alabama', 'Alabama Crimson Tide', 'Crimson Tide', 'Bama'],
            'Kentucky': ['Kentucky', 'Kentucky Wildcats', 'Wildcats', 'UK'],
            'Tennessee': ['Tennessee', 'Tennessee Volunteers', 'Volunteers', 'Vols'],
            'Mississippi': ['Mississippi', 'Ole Miss', 'Rebels', 'Ole Miss Rebels'],
            'Louisiana State University': ['LSU', 'Louisiana State', 'Tigers', 'LSU Tigers'],
            'Arkansas': ['Arkansas', 'Arkansas Razorbacks', 'Razorbacks'],
            'South Carolina': ['South Carolina', 'South Carolina Gamecocks', 'Gamecocks'],
            'Vanderbilt University': ['Vanderbilt', 'Vanderbilt Commodores', 'Commodores']
        };
        
        if (variations[universityName]) {
            console.log(`📝 Using predefined search terms for ${universityName}:`, variations[universityName]);
            return variations[universityName];
        }
        
        // Generic variations for other universities
        if (universityName.includes('University of')) {
            const shortName = universityName.replace('University of ', '');
            terms.push(shortName);
        }
        
        if (universityName.includes('State')) {
            terms.push(universityName.replace('State University', '').trim());
            terms.push(universityName.replace('University', '').trim());
        }
        
        // Add "College" variations
        if (universityName.includes('College')) {
            terms.push(universityName.replace(' College', '').trim());
        }
        
        console.log(`📝 Generated search terms for ${universityName}:`, [...new Set(terms)]);
        return [...new Set(terms)]; // Remove duplicates
    }

    formatTicketmasterEvents(events) {
        return events.map(event => {
            const venue = event._embedded?.venues?.[0];
            const classification = event.classifications?.[0];
            
            return {
                title: event.name,
                sport: classification?.sport?.name || classification?.genre?.name || 'Sports',
                date: event.dates?.start?.localDate || 'TBD',
                time: event.dates?.start?.localTime || 'TBD',
                venue: venue?.name || 'TBD',
                location: venue?.city?.name && venue?.state?.name ? 
                    `${venue.city.name}, ${venue.state.name}` : 'TBD',
                latitude: venue?.location ? parseFloat(venue.location.latitude) : null,
                longitude: venue?.location ? parseFloat(venue.location.longitude) : null,
                url: event.url,
                source: 'Ticketmaster'
            };
        }).filter(event => event.latitude && event.longitude); // Only include events with coordinates
    }

    // NFL search methods
    async searchNFLGames(zipCode, options = {}) {
        // Convert ZIP to coordinates first
        const coordinates = getCoordinatesForZip(zipCode);
        if (!coordinates) {
            console.error(`No coordinates found for ZIP: ${zipCode}`);
            return { events: [], totalElements: 0, totalPages: 0, currentPage: 0 };
        }
        
        const {
            radius = 50,
            size = 200,
            sort = 'date,asc'
        } = options;

        console.log(`🏈 Searching for NFL games near ZIP ${zipCode} -> lat ${coordinates.lat}, lng ${coordinates.lng}...`);

        const params = new URLSearchParams({
            keyword: 'NFL',
            classificationName: 'Sports',
            latlong: `${coordinates.lat},${coordinates.lng}`,
            radius: radius,
            unit: 'miles',
            size: size,
            sort: sort,
            countryCode: 'US',
            apikey: this.apiKey
        });

        return this.executeNFLSearch(params);
    }

    async searchNFLGamesByCoordinates(lat, lon, options = {}) {
        const {
            radius = 50,
            size = 200,
            sort = 'date,asc'
        } = options;

        console.log(`🏈 Searching for NFL games near coordinates ${lat}, ${lon}...`);

        const params = new URLSearchParams({
            keyword: 'NFL',
            classificationName: 'Sports',
            latlong: `${lat},${lon}`,
            radius: radius,
            unit: 'miles',
            size: size,
            sort: sort,
            countryCode: 'US',
            apikey: this.apiKey
        });

        return this.executeNFLSearch(params);
    }

    async executeNFLSearch(params) {

        try {
            const response = await fetch(`${this.baseURL}/events.json?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📊 NFL API Response:`, {
                totalElements: data.page?.totalElements || 0,
                totalPages: data.page?.totalPages || 0,
                hasEvents: !!data._embedded?.events
            });
            
            if (data._embedded?.events) {
                // Filter to only include NFL games
                const nflEvents = data._embedded.events.filter(event => 
                    event.name && (
                        event.name.toLowerCase().includes('nfl') ||
                        event.classifications?.some(c => 
                            c.segment?.name?.toLowerCase().includes('sports') &&
                            c.genre?.name?.toLowerCase().includes('football')
                        ) ||
                        this.isNFLTeam(event.name)
                    )
                );
                
                console.log(`✅ Found ${nflEvents.length} NFL events`);
                const formattedEvents = this.formatTicketmasterEvents(nflEvents);
                
                return {
                    events: formattedEvents,
                    totalElements: data.page?.totalElements || 0,
                    totalPages: data.page?.totalPages || 0,
                    currentPage: data.page?.number || 0
                };
            } else {
                console.log('❌ No NFL events found');
                return {
                    events: [],
                    totalElements: 0,
                    totalPages: 0,
                    currentPage: 0
                };
            }
        } catch (error) {
            console.error('❌ Error searching NFL games:', error);
            throw error;
        }
    }

    async searchNFLGamesByCoordinates(lat, lon, options = {}) {
        const {
            radius = 50,
            size = 200,
            sort = 'date,asc'
        } = options;

        console.log(`🏈 Searching for NFL games near coordinates ${lat}, ${lon}...`);

        const params = new URLSearchParams({
            keyword: 'NFL',
            classificationName: 'Sports',
            latlong: `${lat},${lon}`,
            radius: radius,
            unit: 'miles',
            size: size,
            sort: sort,
            countryCode: 'US',
            apikey: this.apiKey
        });

        try {
            const response = await fetch(`${this.baseURL}/events.json?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📊 NFL API Response:`, {
                totalElements: data.page?.totalElements || 0,
                totalPages: data.page?.totalPages || 0,
                hasEvents: !!data._embedded?.events
            });
            
            if (data._embedded?.events) {
                // Filter to only include NFL games
                const nflEvents = data._embedded.events.filter(event => 
                    event.name && (
                        event.name.toLowerCase().includes('nfl') ||
                        event.classifications?.some(c => 
                            c.segment?.name?.toLowerCase().includes('sports') &&
                            c.genre?.name?.toLowerCase().includes('football')
                        ) ||
                        this.isNFLTeam(event.name)
                    )
                );
                
                console.log(`✅ Found ${nflEvents.length} NFL events`);
                const formattedEvents = this.formatTicketmasterEvents(nflEvents);
                
                return {
                    events: formattedEvents,
                    totalElements: data.page?.totalElements || 0,
                    totalPages: data.page?.totalPages || 0,
                    currentPage: data.page?.number || 0
                };
            } else {
                console.log('❌ No NFL events found');
                return {
                    events: [],
                    totalElements: 0,
                    totalPages: 0,
                    currentPage: 0
                };
            }
        } catch (error) {
            console.error('❌ Error searching NFL games by coordinates:', error);
            throw error;
        }
    }

    isNFLTeam(eventName) {
        const nflTeams = [
            'Cardinals', 'Falcons', 'Ravens', 'Bills', 'Panthers', 'Bears', 'Bengals', 'Browns',
            'Cowboys', 'Broncos', 'Lions', 'Packers', 'Texans', 'Colts', 'Jaguars', 'Chiefs',
            'Raiders', 'Chargers', 'Rams', 'Dolphins', 'Vikings', 'Patriots', 'Saints', 'Giants',
            'Jets', 'Eagles', 'Steelers', '49ers', 'Seahawks', 'Buccaneers', 'Titans', 'Commanders'
        ];
        
        const lowerEventName = eventName.toLowerCase();
        return nflTeams.some(team => 
            lowerEventName.includes(team.toLowerCase()) ||
            lowerEventName.includes('vs ' + team.toLowerCase()) ||
            lowerEventName.includes(team.toLowerCase() + ' vs')
        );
    }
}


// ZIP code to coordinates mapping is now loaded in zipCoords.js using PapaParse

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Validate ZIP code format
function isValidZipCode(zipCode) {
    const zipRegex = /^\d{5}$/;
    return zipRegex.test(zipCode);
}

// Helper function to check if event sport matches selected sport filter
function doesSportMatch(eventSport, selectedSport) {
    if (selectedSport === 'all') {
        return true;
    }
    
    if (!eventSport) {
        return false;
    }
    
    // Exact match first
    if (eventSport === selectedSport) {
        return true;
    }
    
    // Gender-neutral sports should match specific gendered versions
    // Define gender-neutral sports that should match their gendered counterparts
    const genderNeutralSports = [
        'Basketball', 'Soccer', 'Hockey', 'Lacrosse', 'Tennis', 'Golf', 
        'Swimming & Diving', 'Track & Field', 'Cross Country', 'Gymnastics',
        'Skiing', 'Rowing', 'Water Polo', 'Fencing', 'Rugby', 'Volleyball'
    ];
    
    // If selected sport is gender-neutral, check if event sport contains it
    if (genderNeutralSports.includes(selectedSport)) {
        const eventSportLower = eventSport.toLowerCase();
        const selectedSportLower = selectedSport.toLowerCase();
        
        // Check if the event sport contains the gender-neutral sport name
        return eventSportLower.includes(selectedSportLower);
    }
    
    return false;
}

// Helper function to check if event sport matches selected sport filter
function doesSportMatch(eventSport, selectedSport) {
    if (selectedSport === 'all') {
        return true;
    }
    
    if (!eventSport) {
        return false;
    }
    
    // Exact match first
    if (eventSport === selectedSport) {
        return true;
    }
    
    // Gender-neutral sports should match specific gendered versions
    // Define gender-neutral sports that should match their gendered counterparts
    const genderNeutralSports = [
        'Basketball', 'Soccer', 'Hockey', 'Lacrosse', 'Tennis', 'Golf', 
        'Swimming & Diving', 'Track & Field', 'Cross Country', 'Gymnastics',
        'Skiing', 'Rowing', 'Water Polo', 'Fencing', 'Rugby', 'Volleyball'
    ];
    
    // If selected sport is gender-neutral, check if event sport contains it
    if (genderNeutralSports.includes(selectedSport)) {
        const eventSportLower = eventSport.toLowerCase();
        const selectedSportLower = selectedSport.toLowerCase();
        
        // Check if the event sport contains the gender-neutral sport name
        return eventSportLower.includes(selectedSportLower);
    }
    
    return false;
}

// getCoordinatesForZip is now defined in zipCoords.js

// Find events near a ZIP code
// Helper function to parse event dates that may not include year
function parseEventDate(eventDateString) {
    if (!eventDateString || eventDateString === 'TBD') {
        return null;
    }
    
    // First try parsing as-is (works for ISO dates and full date strings)
    let eventDate = new Date(eventDateString);
    
    // If that didn't work or resulted in a very old date (like 2001), try to fix it
    if (isNaN(eventDate.getTime()) || eventDate.getFullYear() < 2020) {
        // Handle formats like "Wed., Dec. 10" or "Dec. 10"
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        
        // Remove day of week prefix if present (e.g., "Wed., ")
        const cleanDateString = eventDateString.replace(/^[A-Za-z]+\.?,\s*/, '');
        
        // Try current year first
        eventDate = new Date(`${cleanDateString}, ${currentYear}`);
        
        // If the date has already passed this year, try next year
        if (eventDate.getTime() < Date.now()) {
            eventDate = new Date(`${cleanDateString}, ${nextYear}`);
        }
    }
    
    return isNaN(eventDate.getTime()) ? null : eventDate;
}

async function findEventsNearZip(zipCode, maxDistance, selectedSport = 'all', selectedUniversity = 'all', startDate = null, endDate = null) {
    console.log(`🔍 Starting findEventsNearZip for ZIP: ${zipCode}, university: ${selectedUniversity}`);
    
    const userCoords = getCoordinatesForZip(zipCode);
    if (!userCoords) {
        console.error('No coordinates found for ZIP code:', zipCode);
        return [];
    }
    console.log('User coordinates:', userCoords);

    try {
        console.log('Calling getEventDataFiles...');
        const { dataFiles, events } = await getEventDataFiles(selectedUniversity, zipCode, maxDistance);
        console.log(`Found ${events.length} Ticketmaster events, ${dataFiles.length} data files to process`);
        
        let allEvents = [...events]; // Start with Ticketmaster events
        
        // Load events from file-based data (BYU/BSU)
        for (const dataFileInfo of dataFiles) {
            // Handle both old string format and new object format for backward compatibility
            if (typeof dataFileInfo === 'string') {
                // Legacy format - just try the file path
                try {
                    const response = await fetch(dataFileInfo);
                    const sportsEvents = await response.json();
                    allEvents = allEvents.concat(sportsEvents);
                    console.log(`✅ Loaded ${sportsEvents.length} events from ${dataFileInfo}`);
                } catch (error) {
                    console.warn(`Could not load ${dataFileInfo}:`, error);
                }
            } else {
                // New format with primary and fallback paths
                const { primary, fallback, type } = dataFileInfo;
                let fileLoaded = false;
                
                // Try primary file (today's data)
                try {
                    console.log(`🔍 Trying to load today's ${type} data: ${primary}`);
                    const response = await fetch(primary);
                    if (response.ok) {
                        const sportsEvents = await response.json();
                        allEvents = allEvents.concat(sportsEvents);
                        console.log(`✅ Loaded ${sportsEvents.length} events from today's ${type} data`);
                        fileLoaded = true;
                    } else {
                        throw new Error(`HTTP ${response.status}`);
                    }
                } catch (error) {
                    console.warn(`Could not load today's ${type} data (${primary}):`, error.message);
                }
                
                // If primary failed, try fallback file (yesterday's data)
                if (!fileLoaded) {
                    try {
                        console.log(`🔍 Trying to load yesterday's ${type} data: ${fallback}`);
                        const response = await fetch(fallback);
                        if (response.ok) {
                            const sportsEvents = await response.json();
                            allEvents = allEvents.concat(sportsEvents);
                            console.log(`✅ Loaded ${sportsEvents.length} events from yesterday's ${type} data`);
                            fileLoaded = true;
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    } catch (error) {
                        console.warn(`Could not load yesterday's ${type} data (${fallback}):`, error.message);
                    }
                }
                
                if (!fileLoaded) {
                    console.warn(`❌ No ${type} data available (tried both today and yesterday)`);
                }
            }
        }

        return allEvents
            .map(event => {
                const distance = calculateDistance(
                    userCoords.lat,
                    userCoords.lng,
                    event.latitude,
                    event.longitude
                );
                return { ...event, distance };
            })
            .filter(event => event.distance <= maxDistance)
            .filter(event => doesSportMatch(event.sport, selectedSport))
            .filter(event => {
                // Apply date filtering if start or end date is specified
                console.log('Date filtering check:', { 
                    startDate, 
                    endDate, 
                    eventName: event.name, 
                    eventDate: event.date 
                });
                
                // If no dates specified, include all events
                if ((!startDate || startDate === '') && (!endDate || endDate === '')) {
                    console.log('No date filters applied - including event');
                    return true;
                }
                
                const eventDate = event.date;
                if (!eventDate || eventDate === 'TBD') {
                    console.log('Event has no date or TBD - including event');
                    return true; // Include events with unknown dates
                }
                
                const eventDateObj = parseEventDate(eventDate);
                if (!eventDateObj) {
                    console.log('Event has invalid date - including event');
                    return true; // Include events with invalid dates
                }
                
                console.log('Parsed event date:', { original: eventDate, parsed: eventDateObj });
                
                // Check if event date is within range
                if (startDate && startDate !== '') {
                    const startDateObj = new Date(startDate);
                    console.log('Checking start date:', { eventDate: eventDateObj, startDate: startDateObj, passes: eventDateObj >= startDateObj });
                    if (eventDateObj < startDateObj) return false;
                }
                
                if (endDate && endDate !== '') {
                    const endDateObj = new Date(endDate);
                    console.log('Checking end date:', { eventDate: eventDateObj, endDate: endDateObj, passes: eventDateObj <= endDateObj });
                    if (eventDateObj > endDateObj) return false;
                }
                
                console.log('Event passed all date filters');
                return true;
            })
            .sort((a, b) => a.distance - b.distance);
    } catch (error) {
        console.error('Error loading events:', error);
        return [];
    }
}

// Get appropriate data files based on university selection
async function getEventDataFiles(selectedUniversity, zipCode = null, radius = 50) {
    const dataFiles = [];
    const events = [];

    // Generate current date for filename
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    // Generate yesterday's date for fallback
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayYyyy = yesterday.getFullYear();
    const yesterdayMm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yesterdayDd = String(yesterday.getDate()).padStart(2, '0');

    const BYUfileName = `BYUSports${yyyy}-${mm}-${dd}.json`;
    const BYUfilePath = `sportsData/${BYUfileName}`;
    const BYUYesterdayFileName = `BYUSports${yesterdayYyyy}-${yesterdayMm}-${yesterdayDd}.json`;
    const BYUYesterdayFilePath = `sportsData/${BYUYesterdayFileName}`;

    const BSUfileName = `BSUSports${yyyy}-${mm}-${dd}.json`;
    const BSUfilePath = `sportsData/${BSUfileName}`;
    const BSUYesterdayFileName = `BSUSports${yesterdayYyyy}-${yesterdayMm}-${yesterdayDd}.json`;
    const BSUYesterdayFilePath = `sportsData/${BSUYesterdayFileName}`;
    
    if (selectedUniversity === 'BYU') {
        // Try to scrape fresh BYU data first
        await triggerBYUScraper();
        // Add both today's and yesterday's file paths for fallback
        dataFiles.push({ primary: BYUfilePath, fallback: BYUYesterdayFilePath, type: 'BYU' });
    } else if (selectedUniversity === 'BSU') {
        // Add both today's and yesterday's file paths for fallback
        dataFiles.push({ primary: BSUfilePath, fallback: BSUYesterdayFilePath, type: 'BSU' });
    } else if (selectedUniversity !== 'other' && zipCode) {
        // For other universities or general 'all' search, use Ticketmaster API
        try {
            const ticketmaster = new TicketmasterAPI('BMHyV7S1mxGcjdcNizEYY5JpxQGJLlZF');
            const ticketmasterEvents = await ticketmaster.searchUniversitySports(selectedUniversity, zipCode, radius);
            events.push(...ticketmasterEvents);
        } catch (error) {
            console.error(`Error fetching Ticketmaster events for ${selectedUniversity}:`, error);
        }
    } else if (selectedUniversity === 'other' && zipCode) {
        // For custom university input
        const customUniversity = document.getElementById('customUniversityInput')?.value;
        if (customUniversity) {
            try {
                const ticketmaster = new TicketmasterAPI('BMHyV7S1mxGcjdcNizEYY5JpxQGJLlZF');
                const ticketmasterEvents = await ticketmaster.searchUniversitySports(customUniversity, zipCode, radius);
                events.push(...ticketmasterEvents);
            } catch (error) {
                console.error(`Error fetching Ticketmaster events for ${customUniversity}:`, error);
            }
        }
    }
    
    return { dataFiles, events };
}

// Get appropriate data files based on university selection for city searches
async function getEventDataFilesForCity(selectedUniversity, city, stateCode, radius = 50) {
    const dataFiles = [];
    const events = [];

    // Generate current date for filename
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    // Generate yesterday's date for fallback
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayYyyy = yesterday.getFullYear();
    const yesterdayMm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yesterdayDd = String(yesterday.getDate()).padStart(2, '0');

    const BYUfileName = `BYUSports${yyyy}-${mm}-${dd}.json`;
    const BYUfilePath = `sportsData/${BYUfileName}`;
    const BYUYesterdayFileName = `BYUSports${yesterdayYyyy}-${yesterdayMm}-${yesterdayDd}.json`;
    const BYUYesterdayFilePath = `sportsData/${BYUYesterdayFileName}`;

    const BSUfileName = `BSUSports${yyyy}-${mm}-${dd}.json`;
    const BSUfilePath = `sportsData/${BSUfileName}`;
    const BSUYesterdayFileName = `BSUSports${yesterdayYyyy}-${yesterdayMm}-${yesterdayDd}.json`;
    const BSUYesterdayFilePath = `sportsData/${BSUYesterdayFileName}`;

    // Handle specific universities
    if (selectedUniversity === 'BYU') {
        await triggerBYUScraper();
        dataFiles.push({ primary: BYUfilePath, fallback: BYUYesterdayFilePath, type: 'BYU' });
    } else if (selectedUniversity === 'Boise State') {
        dataFiles.push({ primary: BSUfilePath, fallback: BSUYesterdayFilePath, type: 'BSU' });
    } else if (selectedUniversity !== 'other' && city && stateCode) {
        // For other universities or general 'all' search, use Ticketmaster API with city search
        try {
            const ticketmaster = new TicketmasterAPI('BMHyV7S1mxGcjdcNizEYY5JpxQGJLlZF');
            const ticketmasterEvents = await ticketmaster.searchUniversitySportsByCity(selectedUniversity, city, stateCode, radius);
            events.push(...ticketmasterEvents);
        } catch (error) {
            console.error(`Error fetching Ticketmaster events for ${selectedUniversity}:`, error);
        }
    } else if (selectedUniversity === 'other' && city && stateCode) {
        // For custom university input
        const customUniversity = document.getElementById('customUniversityInput')?.value;
        if (customUniversity) {
            try {
                const ticketmaster = new TicketmasterAPI('BMHyV7S1mxGcjdcNizEYY5JpxQGJLlZF');
                const ticketmasterEvents = await ticketmaster.searchUniversitySportsByCity(customUniversity, city, stateCode, radius);
                events.push(...ticketmasterEvents);
            } catch (error) {
                console.error(`Error fetching Ticketmaster events for ${customUniversity}:`, error);
            }
        }
    }
    
    return { dataFiles, events };
}

// Trigger BYU scraper (Build Process approach)
async function triggerBYUScraper() {
    console.log('🔄 Checking for fresh BYU data...');
    
    // In a build process approach, data would be pre-generated
    // For now, show user how to update data manually
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const expectedFile = `sportsData/BYUSports${dateString}.json`;
    
    console.log(`📁 Looking for: ${expectedFile}`);
    console.log('💡 To get fresh data, run: npm run scrape-byu');
    console.log('🔧 Or set up automated builds with GitHub Actions');
    
    // Note: In a proper build process, this function wouldn't be needed
    // because data files would already exist from the build step
}

// NFL search function
async function doNFLSearch(zipCode, distanceInput) {
    hideError();
    showLoading();
    
    try {
        console.log(`🏈 Searching for NFL games near ZIP: ${zipCode}`);
        
        const distance = parseInt(distanceInput.value) || 50;
        const coordinates = getCoordinatesForZip(zipCode);
        const selectedTeam = document.getElementById('nflTeamSelect')?.value || 'all';
        
        // Create local ticketmaster instance
        const ticketmaster = new TicketmasterAPI('BMHyV7S1mxGcjdcNizEYY5JpxQGJLlZF');
        
        // Search for NFL games using TicketmasterAPI
        const nflEvents = await ticketmaster.searchNFLGames(zipCode, {
            radius: distance,
            size: 200
        });
        
        let allEvents = [];
        
        if (nflEvents && nflEvents.events) {
            console.log(`Found ${nflEvents.events.length} NFL events`);
            // Events are already in the correct format
            allEvents = nflEvents.events;
        }
        
        // Filter by selected team if not "all"
        if (selectedTeam !== 'all') {
            allEvents = allEvents.filter(event => {
                const eventName = event.title.toLowerCase();
                const teamName = selectedTeam.toLowerCase();
                return eventName.includes(teamName) || 
                       eventName.includes(teamName.split(' ').pop()); // Check for team nickname
            });
            console.log(`Filtered to ${allEvents.length} events for ${selectedTeam}`);
        }
        
        // Filter events based on date criteria
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const startDate = startDateInput && startDateInput.value ? startDateInput.value : null;
        const endDate = endDateInput && endDateInput.value ? endDateInput.value : null;
        
        allEvents = allEvents.filter(event => {
            // Apply date filtering if start or end date is specified
            console.log('NFL date filtering check:', { 
                startDate, 
                endDate, 
                eventName: event.title, 
                eventDate: event.date 
            });
            
            // If no dates specified, include all events
            if ((!startDate || startDate === '') && (!endDate || endDate === '')) {
                console.log('No date filters applied - including event');
                return true;
            }
            
            const eventDate = event.date;
            if (!eventDate || eventDate === 'TBD') {
                console.log('Event has no date or TBD - including event');
                return true; // Include events with unknown dates
            }
            
            const eventDateObj = parseEventDate(eventDate);
            if (!eventDateObj) {
                console.log('Event has invalid date - including event');
                return true; // Include events with invalid dates
            }
            
            console.log('Parsed event date:', { original: eventDate, parsed: eventDateObj });
            
            // Check if event date is within range
            if (startDate && startDate !== '') {
                const startDateObj = new Date(startDate);
                console.log('Checking start date:', { eventDate: eventDateObj, startDate: startDateObj, passes: eventDateObj >= startDateObj });
                if (eventDateObj < startDateObj) return false;
            }
            
            if (endDate && endDate !== '') {
                const endDateObj = new Date(endDate);
                console.log('Checking end date:', { eventDate: eventDateObj, endDate: endDateObj, passes: eventDateObj <= endDateObj });
                if (eventDateObj > endDateObj) return false;
            }
            
            console.log('Event passed all date filters');
            return true;
        });
        
        console.log(`🏆 Total NFL events after filtering: ${allEvents.length}`);
        
        if (allEvents.length === 0) {
            hideLoading();
            showNoResults();
            return;
        }
        
        // Calculate distances for NFL events
        const eventsWithDistance = allEvents.map(event => {
            if (!event.latitude || !event.longitude) {
                console.warn('Event missing coordinates:', event.title);
                return null; // Skip events without coordinates
            }
            
            const eventDistance = calculateDistance(
                coordinates.lat,
                coordinates.lng || coordinates.lon, // Handle both lng (ZIP) and lon (city) formats
                event.latitude,
                event.longitude
            );
            
            return { 
                ...event, 
                distance: eventDistance
            };
        }).filter(event => event !== null) // Remove events without coordinates
        .sort((a, b) => a.distance - b.distance);
        
        // Display results with map
        // Ensure coordinates are in the correct format for map display
        const mapCoordinates = {
            lat: coordinates.lat,
            lng: coordinates.lng || coordinates.lon,
            lon: coordinates.lon || coordinates.lng
        };
        displayEventsWithMap(eventsWithDistance, mapCoordinates);
        
    } catch (error) {
        console.error('NFL search error:', error);
        showError('Failed to search for NFL games. Please try again.');
    } finally {
        hideLoading();
    }
}

// Format distance for display
function formatDistance(distance) {
    return distance < 1 ? 
        `${(distance * 5280).toFixed(0)} feet` : 
        `${distance.toFixed(1)} miles`;
}

// Create event card HTML
function createEventCard(event) {
    // const eventDate = new Date(event.date);
    // const formattedDate = eventDate.toLocaleDateString('en-US', {
    //     weekday: 'long',
    //     year: 'numeric',
    //     month: 'long',
    //     day: 'numeric'
    // });

    // <strong>Date:</strong> ${formattedDate}<br> // This was used as part of return 

    return `
        <div class="event-card">
            <div class="event-title">${event.title}</div>
            <div class="event-sport">${event.sport}</div>
            <div class="event-details">
                <strong>Date:</strong> ${event.date}<br>
                <strong>Time:</strong> ${event.time}<br>
                <strong>Venue:</strong> ${event.venue}<br>
                <strong>Location:</strong> ${event.location}<br>
                <strong>Distance:</strong> <span class="distance">${formatDistance(event.distance)} away</span>
            </div>
            ${event.source ? `<div class="event-source">📊 ${event.source}</div>` : ''}
            ${event.url ? `<div class="event-tickets"><a href="${event.url}" target="_blank" rel="noopener noreferrer">🎫 Buy Tickets</a></div>` : ''}
        </div>
    `;
}

// Display events
function displayEvents(events) {
    const eventsList = document.getElementById('eventsList');
    const resultsSection = document.getElementById('resultsSection');
    const noResults = document.getElementById('noResults');

    if (events.length === 0) {
        resultsSection.style.display = 'none';
        noResults.style.display = 'block';
    } else {
        eventsList.innerHTML = events.map(createEventCard).join('');
        resultsSection.style.display = 'block';
        noResults.style.display = 'none';
    }
}

// Enhanced display events function with map support
function displayEventsWithMap(events, searchCoordinates = null) {
    try {
        // Display list view
        displayEvents(events);
        
        // Check if mapManager is available
        if (typeof window.mapManager === 'undefined') {
            console.warn('MapManager not available, skipping map functionality');
            return;
        }
        
        // Initialize map if not already done
        if (!window.mapManager.map) {
            window.mapManager.initializeMap();
        }
        
        // Display events on map
        window.mapManager.displayEventsOnMap(events, searchCoordinates);
        
        // Always show both map and results sections
        const mapSection = document.getElementById('mapSection');
        const resultsSection = document.getElementById('resultsSection');
        
        if (events.length > 0) {
            // Show map section
            if (mapSection) {
                mapSection.style.display = 'block';
                
                // Fix map rendering issue - invalidate size after display
                setTimeout(() => {
                    if (window.mapManager && window.mapManager.map) {
                        window.mapManager.map.invalidateSize();
                        window.mapManager.fitMapToMarkers();
                    }
                }, 100);
            }
            
            // Show results section (list view)
            if (resultsSection) {
                resultsSection.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error in displayEventsWithMap:', error);
        // Fall back to just showing the list view if map fails
        displayEvents(events);
    }
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Hide error message
function hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
}

// Show no results message
function showNoResults() {
    document.getElementById('noResults').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
}

// Show loading state
function showLoading() {
    document.getElementById('loadingMessage').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
}

// Hide loading state
function hideLoading() {
    document.getElementById('loadingMessage').style.display = 'none';
}

// Handle form submission

async function doSearch(zipCode, distanceInput) {
    // Add debugging to check if required functions are available
    console.log('doSearch called with:', zipCode, distanceInput.value);
    console.log('getCoordinatesForZip available:', typeof getCoordinatesForZip);
    console.log('window.mapManager available:', typeof window.mapManager);
    
    // Check if we have coordinates for this ZIP code
    if (!getCoordinatesForZip(zipCode)) {
        showError('Sorry, we don\'t have location data for this ZIP code. Try: 90210, 10001, 60612, or other major city ZIP codes.');
        return;
    }

    // Get selected event type
    const eventType = document.querySelector('input[name="eventType"]:checked')?.value || 'college';
    
    if (eventType === 'nfl') {
        await doNFLSearch(zipCode, distanceInput);
        return;
    }

    // College events logic continues below
    // Get selected sport, university, and date range
    const sportSelect = document.getElementById('sportSelect');
    const universitySelect = document.getElementById('universitySelect');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    const selectedSport = sportSelect ? sportSelect.value : 'all';
    const selectedUniversity = universitySelect ? universitySelect.value : 'all';
    const startDate = startDateInput && startDateInput.value ? startDateInput.value : null;
    const endDate = endDateInput && endDateInput.value ? endDateInput.value : null;
    
    console.log('Date filtering:', { startDate, endDate });

    // Show loading state
    showLoading();

    try {
        const events = await findEventsNearZip(zipCode, distanceInput.value || 50, selectedSport, selectedUniversity, startDate, endDate);
        hideLoading();
        
        // Get coordinates for the ZIP code to center the map
        const zipCoordinates = getCoordinatesForZip(zipCode);
        console.log('ZIP coordinates:', zipCoordinates);
        
        // Convert lng to lon for map compatibility
        const mapCoordinates = zipCoordinates ? { lat: zipCoordinates.lat, lon: zipCoordinates.lng } : null;
        console.log('Map coordinates:', mapCoordinates);
        
        displayEventsWithMap(events, mapCoordinates);
    } catch (error) {
        hideLoading();
        console.error('Detailed error in doSearch:', error);
        console.error('Error stack:', error.stack);
        showError(`Error loading events: ${error.message || 'Please try again.'}`);
    }
}

function handleSearch(event) {
    event.preventDefault();

    const searchModeZip = document.getElementById('searchModeZip');
    const zipCodeInput = document.getElementById('zipCode');
    const cityInput = document.getElementById('cityInput');
    const distanceInput = document.getElementById('distanceInput');

    // Hide previous results and errors
    hideError();
    hideLoading();
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';

    if (searchModeZip.checked) {
        // ZIP code search mode
        const zipCode = zipCodeInput.value.trim();

        if (!zipCode) {
            showError('Please enter a ZIP code.');
            return;
        }

        if (!isValidZipCode(zipCode)) {
            showError('Please enter a valid 5-digit ZIP code.');
            return;
        }

        // Wait for ZIP data to be loaded if not already
        if (!window.zipCoordsLoaded) {
            showLoading();
            loadZipCoords(() => {
                hideLoading();
                doSearch(zipCode, distanceInput);
            });
            return;
        }

        doSearch(zipCode, distanceInput);
    } else {
        // City, State search mode
        const cityState = cityInput.value.trim();
        
        if (!cityState) {
            showError('Please enter a city and state.');
            return;
        }

        // Parse city and state (e.g., "Los Angeles, CA")
        const parts = cityState.split(',');
        if (parts.length < 2) {
            showError('Please enter city and state separated by a comma (e.g., "Los Angeles, CA").');
            return;
        }

        const city = parts[0].trim();
        const state = parts[1].trim();

        if (!city || !state) {
            showError('Please enter both city and state.');
            return;
        }

        // Wait for ZIP data to be loaded if not already
        if (!window.zipCoordsLoaded) {
            showLoading();
            loadZipCoords(() => {
                hideLoading();
                doSearchByCity(city, state, distanceInput);
            });
            return;
        }

        doSearchByCity(city, state, distanceInput);
    }
}

async function doSearchByCity(city, state, distanceInput) {
    // Show loading state early
    showLoading();

    try {
        // Get selected event type first
        const eventType = document.querySelector('input[name="eventType"]:checked')?.value || 'college';
        
        // Get coordinates for the city/state using getCityCoords (async)
        const cityCoords = await getCityCoords(city, state);
        
        if (!cityCoords) {
            hideLoading();
            showError(`Sorry, we don't have location data for ${city}, ${state}. Please try a different city or use ZIP code search.`);
            return;
        }

        if (eventType === 'nfl') {
            // NFL search for city
            await doNFLCitySearch(city, state, cityCoords, distanceInput);
        } else {
            // College search for city  
            await doCollegeCitySearch(city, state, cityCoords, distanceInput);
        }
        
    } catch (error) {
        console.error('City search error:', error);
        showError('Failed to search by city. Please check your input and try again.');
    } finally {
        hideLoading();
    }
}

// NFL city search function
async function doNFLCitySearch(city, state, cityCoords, distanceInput) {
    try {
        const distance = parseInt(distanceInput.value) || 50;
        const selectedTeam = document.getElementById('nflTeamSelect')?.value || 'all';
        
        console.log(`🏈 Searching for NFL games near ${city}, ${state}`);
        
        // Create local ticketmaster instance
        const ticketmaster = new TicketmasterAPI('BMHyV7S1mxGcjdcNizEYY5JpxQGJLlZF');
        
        // Use coordinate-based search instead of ZIP conversion
        const nflEvents = await ticketmaster.searchNFLGamesByCoordinates(cityCoords.lat, cityCoords.lon, {
            radius: distance,
            size: 200
        });
        
        let allEvents = [];
        
        if (nflEvents && nflEvents.events) {
            console.log(`Found ${nflEvents.events.length} NFL events`);
            // Events are already in the correct format
            allEvents = nflEvents.events;
        }
        
        // Filter by selected team if not "all"
        if (selectedTeam !== 'all') {
            allEvents = allEvents.filter(event => {
                const eventName = event.title.toLowerCase();
                const teamName = selectedTeam.toLowerCase();
                return eventName.includes(teamName) || 
                       eventName.includes(teamName.split(' ').pop());
            });
            console.log(`Filtered to ${allEvents.length} events for ${selectedTeam}`);
        }
        
        // Filter events based on date criteria
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const startDate = startDateInput && startDateInput.value ? startDateInput.value : null;
        const endDate = endDateInput && endDateInput.value ? endDateInput.value : null;
        
        allEvents = allEvents.filter(event => {
            // Apply date filtering if start or end date is specified
            console.log('NFL city date filtering check:', { 
                startDate, 
                endDate, 
                eventName: event.title, 
                eventDate: event.date 
            });
            
            // If no dates specified, include all events
            if ((!startDate || startDate === '') && (!endDate || endDate === '')) {
                console.log('No date filters applied - including event');
                return true;
            }
            
            const eventDate = event.date;
            if (!eventDate || eventDate === 'TBD') {
                console.log('Event has no date or TBD - including event');
                return true; // Include events with unknown dates
            }
            
            const eventDateObj = parseEventDate(eventDate);
            if (!eventDateObj) {
                console.log('Event has invalid date - including event');
                return true; // Include events with invalid dates
            }
            
            console.log('Parsed event date:', { original: eventDate, parsed: eventDateObj });
            
            // Check if event date is within range
            if (startDate && startDate !== '') {
                const startDateObj = new Date(startDate);
                console.log('Checking start date:', { eventDate: eventDateObj, startDate: startDateObj, passes: eventDateObj >= startDateObj });
                if (eventDateObj < startDateObj) return false;
            }
            
            if (endDate && endDate !== '') {
                const endDateObj = new Date(endDate);
                console.log('Checking end date:', { eventDate: eventDateObj, endDate: endDateObj, passes: eventDateObj <= endDateObj });
                if (eventDateObj > endDateObj) return false;
            }
            
            console.log('Event passed all date filters');
            return true;
        });
        
        if (allEvents.length === 0) {
            hideLoading();
            showNoResults();
            return;
        }
        
        // Calculate distances for NFL events
        const eventsWithDistance = allEvents.map(event => {
            if (!event.latitude || !event.longitude) {
                console.warn('Event missing coordinates:', event.title);
                return null; // Skip events without coordinates
            }
            
            const eventDistance = calculateDistance(
                cityCoords.lat,
                cityCoords.lon, // City coordinates use 'lon' not 'lng'
                event.latitude,
                event.longitude
            );
            
            return { 
                ...event, 
                distance: eventDistance
            };
        }).filter(event => event !== null) // Remove events without coordinates
        .sort((a, b) => a.distance - b.distance);
        
        // Ensure coordinates are in the correct format for map display
        const mapCoordinates = {
            lat: cityCoords.lat,
            lng: cityCoords.lon, 
            lon: cityCoords.lon
        };
        displayEventsWithMap(eventsWithDistance, mapCoordinates);
        
    } catch (error) {
        console.error('NFL city search error:', error);
        showError('Failed to search for NFL games. Please try again.');
    }
}

// College city search function
async function doCollegeCitySearch(city, state, cityCoords, distanceInput) {
    try {
        const distance = parseInt(distanceInput.value) || 50;

        // Get selected sport, university, and date range
        const sportSelect = document.getElementById('sportSelect');
        const universitySelect = document.getElementById('universitySelect');
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        const selectedSport = sportSelect ? sportSelect.value : 'all';
        const selectedUniversity = universitySelect ? universitySelect.value : 'all';
        const startDate = startDateInput && startDateInput.value ? startDateInput.value : null;
        const endDate = endDateInput && endDateInput.value ? endDateInput.value : null;
        
        console.log('City search date filtering:', { startDate, endDate });

        // Use direct city-based search instead of converting to ZIP
        console.log(`🏙️ College city search: ${city}, ${state} - direct city search`);

        // Get appropriate data files and events (including Ticketmaster) using city search
        const { dataFiles, events } = await getEventDataFilesForCity(selectedUniversity, city, state, distance);
        let allEvents = [...events]; // Start with Ticketmaster events
        
        // Load file-based events (BYU/BSU) with fallback mechanism
        for (const dataFileInfo of dataFiles) {
            if (typeof dataFileInfo === 'string') {
                // Old format - simple string path
                try {
                    const response = await fetch(dataFileInfo);
                    const sportsEvents = await response.json();
                    allEvents = allEvents.concat(sportsEvents);
                } catch (error) {
                    console.warn(`Could not load ${dataFileInfo}:`, error);
                }
            } else {
                // New format with primary and fallback paths
                const { primary, fallback, type } = dataFileInfo;
                let fileLoaded = false;
                
                // Try primary file (today's data)
                try {
                    console.log(`🔍 Trying to load today's ${type} data: ${primary}`);
                    const response = await fetch(primary);
                    if (response.ok) {
                        const sportsEvents = await response.json();
                        allEvents = allEvents.concat(sportsEvents);
                        console.log(`✅ Loaded ${sportsEvents.length} events from today's ${type} data`);
                        fileLoaded = true;
                    } else {
                        throw new Error(`HTTP ${response.status}`);
                    }
                } catch (error) {
                    console.warn(`Could not load today's ${type} data (${primary}):`, error.message);
                }
                
                // If primary failed, try fallback file (yesterday's data)
                if (!fileLoaded) {
                    try {
                        console.log(`🔍 Trying to load yesterday's ${type} data: ${fallback}`);
                        const response = await fetch(fallback);
                        if (response.ok) {
                            const sportsEvents = await response.json();
                            allEvents = allEvents.concat(sportsEvents);
                            console.log(`✅ Loaded ${sportsEvents.length} events from yesterday's ${type} data`);
                            fileLoaded = true;
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    } catch (error) {
                        console.warn(`Could not load yesterday's ${type} data (${fallback}):`, error.message);
                    }
                }
                
                if (!fileLoaded) {
                    console.warn(`❌ Could not load any ${type} data files`);
                }
            }
        }
        
        // Calculate distances and filter events
        const eventsWithDistance = allEvents
            .map(event => {
                const distance = calculateDistance(
                    cityCoords.lat,
                    cityCoords.lon,
                    event.latitude,
                    event.longitude
                );
                return { ...event, distance };
            })
            .filter(event => event.distance <= distance) // Use the parsed distance variable
            .filter(event => doesSportMatch(event.sport, selectedSport))
            .filter(event => {
                // Apply date filtering if start or end date is specified
                console.log('City search date filtering check:', { 
                    startDate, 
                    endDate, 
                    eventName: event.name, 
                    eventDate: event.date 
                });
                
                // If no dates specified, include all events
                if ((!startDate || startDate === '') && (!endDate || endDate === '')) {
                    console.log('No date filters applied - including event');
                    return true;
                }
                
                const eventDate = event.date;
                if (!eventDate || eventDate === 'TBD') {
                    console.log('Event has no date or TBD - including event');
                    return true; // Include events with unknown dates
                }
                
                const eventDateObj = parseEventDate(eventDate);
                if (!eventDateObj) {
                    console.log('Event has invalid date - including event');
                    return true; // Include events with invalid dates
                }
                
                console.log('Parsed event date:', { original: eventDate, parsed: eventDateObj });
                
                // Check if event date is within range
                if (startDate && startDate !== '') {
                    const startDateObj = new Date(startDate);
                    console.log('Checking start date:', { eventDate: eventDateObj, startDate: startDateObj, passes: eventDateObj >= startDateObj });
                    if (eventDateObj < startDateObj) return false;
                }
                
                if (endDate && endDate !== '') {
                    const endDateObj = new Date(endDate);
                    console.log('Checking end date:', { eventDate: eventDateObj, endDate: endDateObj, passes: eventDateObj <= endDateObj });
                    if (eventDateObj > endDateObj) return false;
                }
                
                console.log('Event passed all date filters');
                return true;
            })
            .sort((a, b) => a.distance - b.distance);

        hideLoading();
        displayEventsWithMap(eventsWithDistance, { lat: cityCoords.lat, lon: cityCoords.lon });
        
    } catch (error) {
        hideLoading();
        showError('Error loading city coordinate data or events. Please try again.');
        console.error('Error in doSearchByCity:', error);
    }
}

// Toggle custom university input visibility
function toggleCustomUniversityInput() {
    const universitySelect = document.getElementById('universitySelect');
    const customUniversityGroup = document.getElementById('customUniversityGroup');
    
    if (universitySelect && customUniversityGroup) {
        if (universitySelect.value === 'other') {
            customUniversityGroup.style.display = 'block';
        } else {
            customUniversityGroup.style.display = 'none';
        }
    }
}

// Initialize the application
function init() {
    const searchForm = document.getElementById('searchForm');
    const zipCodeInput = document.getElementById('zipCode');
    const cityInput = document.getElementById('cityInput');
    const searchModeZip = document.getElementById('searchModeZip');
    const searchModeCity = document.getElementById('searchModeCity');
    const zipCodeGroup = document.getElementById('zipCodeGroup');
    const cityStateGroup = document.getElementById('cityStateGroup');

    // Add radio button functionality
    function switchSearchMode() {
        // Clear any previous results when switching modes
        const resultsSection = document.getElementById('resultsSection');
        const noResults = document.getElementById('noResults');
        if (resultsSection) resultsSection.style.display = 'none';
        if (noResults) noResults.style.display = 'none';
        
        if (searchModeZip.checked) {
            // Switch to ZIP Code mode
            zipCodeGroup.style.display = 'block';
            cityStateGroup.style.display = 'none';
            zipCodeInput.required = true;
            cityInput.required = false;
            zipCodeInput.focus();
        } else {
            // Switch to City, State mode
            zipCodeGroup.style.display = 'none';
            cityStateGroup.style.display = 'block';
            zipCodeInput.required = false;
            cityInput.required = true;
            cityInput.focus();
        }
        hideError(); // Clear any existing errors when switching modes
    }

    searchModeZip.addEventListener('change', switchSearchMode);
    searchModeCity.addEventListener('change', switchSearchMode);

    // Initialize the required attributes based on default selection
    switchSearchMode();

    // Add form submission handler
    searchForm.addEventListener('submit', handleSearch);

    // Add input validation for ZIP code
    zipCodeInput.addEventListener('input', (e) => {
        // Only allow digits
        e.target.value = e.target.value.replace(/\D/g, '');
        
        // Hide error when user starts typing
        if (e.target.value.length > 0) {
            hideError();
        }
    });

    // Add input validation for city input
    cityInput.addEventListener('input', (e) => {
        // Hide error when user starts typing
        if (e.target.value.length > 0) {
            hideError();
        }
    });

    // Add input validation for distance input
    const distanceInput = document.getElementById('distanceInput');
    let distanceTimeout;
    
    distanceInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value < 1) {
            e.target.value = 1;
        } else if (value > 500) {
            e.target.value = 500;
        }
        // Hide error when user changes distance
        hideError();
    });

    // Add event listener for sport filter changes
    const sportSelect = document.getElementById('sportSelect');
    sportSelect.addEventListener('change', (e) => {
        // Hide error when user changes sport filter
        hideError();
    });

    // Add event listener for university filter changes
    const universitySelect = document.getElementById('universitySelect');
    universitySelect.addEventListener('change', (e) => {
        // Hide error when user changes university filter
        hideError();
        
        // Handle custom university input visibility
        toggleCustomUniversityInput();
    });

    // Add event listeners for College/NFL toggle
    const eventTypeRadios = document.querySelectorAll('input[name="eventType"]');
    eventTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateToggleButtonStyles();
            updateUIForEventType();
        });
    });

    // Initialize toggle button styles and UI
    updateToggleButtonStyles();
    updateUIForEventType();

    // Initialize custom university input visibility based on current selection
    toggleCustomUniversityInput();

    // Focus on ZIP code input when page loads (default mode)
    zipCodeInput.focus();
}

// Update toggle button visual styles
function updateToggleButtonStyles() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => btn.classList.remove('active'));
    
    const activeRadio = document.querySelector('input[name="eventType"]:checked');
    if (activeRadio) {
        const activeLabel = document.querySelector(`label[for="${activeRadio.id}"]`);
        if (activeLabel) {
            activeLabel.classList.add('active');
        }
    }
}

// Update UI based on selected event type
function updateUIForEventType() {
    const eventType = document.querySelector('input[name="eventType"]:checked')?.value;
    const universitySection = document.querySelector('.search-university');
    const sportSection = document.querySelector('.search-sport');
    const nflTeamSection = document.querySelector('.search-nfl-team');
    
    if (eventType === 'nfl') {
        // Hide university and sport selection for NFL, show team selection
        universitySection.style.display = 'none';
        sportSection.style.display = 'none';
        nflTeamSection.style.display = 'block';
    } else {
        // Show university and sport selection for college, hide team selection
        universitySection.style.display = 'block';
        sportSection.style.display = 'block';
        nflTeamSection.style.display = 'none';
    }
}

// Helper function to get ZIP code from coordinates (reverse geocoding)
async function getZipCodeFromCoordinates(lat, lon) {
    try {
        const response = await fetch(`https://api.zippopotam.us/us/${Math.round(lat * 100) / 100}/${Math.round(lon * 100) / 100}`);
        if (response.ok) {
            const data = await response.json();
            return data.places?.[0]?.['post code'] || '10001'; // Default to NYC if not found
        }
    } catch (error) {
        console.warn('Reverse geocoding failed:', error);
    }
    return '10001'; // Default ZIP if reverse geocoding fails
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);