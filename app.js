// Mock events are now loaded from sportsData/mockEvents.json

// TicketmasterAPI integration for universities other than BYU/BSU
class TicketmasterAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://app.ticketmaster.com/discovery/v2';
    }

    async searchUniversitySports(universityName, zipCode, radius = 50) {
        // Try multiple search variations for better results
        const searchTerms = this.generateSearchTerms(universityName);
        
        console.log(`🏈 Starting Ticketmaster search for university: ${universityName}`);
        console.log(`📍 Search parameters: ZIP ${zipCode}, ${radius} mile radius`);
        
        for (let i = 0; i < searchTerms.length; i++) {
            const searchTerm = searchTerms[i];
            console.log(`🔍 [${i + 1}/${searchTerms.length}] Searching for: "${searchTerm}"`);
            
            const params = new URLSearchParams({
                keyword: searchTerm,
                classificationName: 'Sports',
                postalCode: zipCode,
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

// getCoordinatesForZip is now defined in zipCoords.js

// Find events near a ZIP code
async function findEventsNearZip(zipCode, maxDistance, selectedSport = 'all', selectedUniversity = 'all') {
    const userCoords = getCoordinatesForZip(zipCode);
    if (!userCoords) {
        return [];
    }

    try {
        const { dataFiles, events } = await getEventDataFiles(selectedUniversity, zipCode, maxDistance);
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
            .filter(event => selectedSport === 'all' || event.sport === selectedSport)
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
        // For other universities, use Ticketmaster API
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
    // Check if we have coordinates for this ZIP code
    if (!getCoordinatesForZip(zipCode)) {
        showError('Sorry, we don\'t have location data for this ZIP code. Try: 90210, 10001, 60612, or other major city ZIP codes.');
        return;
    }

    // Get selected sport and university
    const sportSelect = document.getElementById('sportSelect');
    const universitySelect = document.getElementById('universitySelect');
    const selectedSport = sportSelect ? sportSelect.value : 'all';
    const selectedUniversity = universitySelect ? universitySelect.value : 'all';

    // Show loading state
    showLoading();

    try {
        const events = await findEventsNearZip(zipCode, distanceInput.value || 50, selectedSport, selectedUniversity);
        hideLoading();
        displayEvents(events);
    } catch (error) {
        hideLoading();
        showError('Error loading events. Please try again.');
        console.error('Error:', error);
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
        // Get coordinates for the city/state using getCityCoords (async)
        const cityCoords = await getCityCoords(city, state);
        
        if (!cityCoords) {
            hideLoading();
            showError(`Sorry, we don't have location data for ${city}, ${state}. Please try a different city or use ZIP code search.`);
            return;
        }

        // Get selected sport and university
        const sportSelect = document.getElementById('sportSelect');
        const universitySelect = document.getElementById('universitySelect');
        const selectedSport = sportSelect ? sportSelect.value : 'all';
        
        // For city search, ignore custom university input and default to 'all'
        // City search should find all sports events in the area, not university-specific
        const selectedUniversity = 'all';

        // Look up ZIP code from the city using uszips.csv data
        let zipCode = await getCityZip(city, state);
        if (!zipCode) {
            // If no ZIP found, try common city variations
            const cityVariations = [
                city.replace(' city', ''),
                city.replace('saint ', 'st. '),
                city.replace('st. ', 'saint ')
            ];
            
            for (const variation of cityVariations) {
                zipCode = await getCityZip(variation, state);
                if (zipCode) break;
            }
        }
        
        // Final fallback to a default ZIP if still not found
        if (!zipCode) {
            zipCode = '90210';
            console.warn(`⚠️ No ZIP code found for ${city}, ${state}. Using fallback ZIP ${zipCode}`);
        } else {
            console.log(`🏙️ City search: ${city}, ${state} -> Found ZIP ${zipCode}`);
        }

        // Get appropriate data files and events (including Ticketmaster)
        const { dataFiles, events } = await getEventDataFiles(selectedUniversity, zipCode, distanceInput.value || 50);
        let allEvents = [...events]; // Start with Ticketmaster events
        
        // Load file-based events (BYU/BSU)
        for (const dataFile of dataFiles) {
            try {
                const response = await fetch(dataFile);
                const sportsEvents = await response.json();
                allEvents = allEvents.concat(sportsEvents);
            } catch (error) {
                console.warn(`Could not load ${dataFile}:`, error);
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
            .filter(event => event.distance <= (distanceInput.value || 50)) // Default 50 mile radius
            .filter(event => selectedSport === 'all' || event.sport === selectedSport)
            .sort((a, b) => a.distance - b.distance);

        hideLoading();
        displayEvents(eventsWithDistance);
        
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
        
        // Reset university selection when switching to city mode (city search finds all events)
        const universitySelect = document.getElementById('universitySelect');
        if (!searchModeZip.checked && universitySelect) {
            // Switching to city mode - reset to "All Universities"
            universitySelect.value = 'all';
            toggleCustomUniversityInput(); // Hide custom input
        }
        
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

    // Focus on ZIP code input when page loads (default mode)
    zipCodeInput.focus();
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);