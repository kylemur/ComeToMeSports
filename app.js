// Mock events are now loaded from sportsData/mockEvents.json


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
async function findEventsNearZip(zipCode, maxDistance, selectedSport = 'all') {
    const userCoords = getCoordinatesForZip(zipCode);
    if (!userCoords) {
        return [];
    }

    try {
        // const response = await fetch('sportsData/mockEvents.json');
        const response = await fetch('sportsData/BYUSports2025-10-25.json');
        const sportsEvents = await response.json();
        return sportsEvents
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

    // Get selected sport
    const sportSelect = document.getElementById('sportSelect');
    const selectedSport = sportSelect ? sportSelect.value : 'all';

    // Show loading state
    showLoading();

    try {
        const events = await findEventsNearZip(zipCode, distanceInput.value || 50, selectedSport);
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

        // Get selected sport
        const sportSelect = document.getElementById('sportSelect');
        const selectedSport = sportSelect ? sportSelect.value : 'all';

        // Load sports events
        const response = await fetch('sportsData/BYUSports2025-10-25.json');
        const sportsEvents = await response.json();
        
        // Calculate distances and filter events
        const eventsWithDistance = sportsEvents
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
        
        // Clear existing timeout
        clearTimeout(distanceTimeout);
        
        // Set a debounced timeout to trigger search after user stops typing
        distanceTimeout = setTimeout(() => {
            // Check if there are currently displayed results OR no results message
            const resultsSection = document.getElementById('resultsSection');
            const noResults = document.getElementById('noResults');
            
            if (resultsSection.style.display !== 'none' || noResults.style.display !== 'none') {
                // Hide the no results message before re-searching
                noResults.style.display = 'none';
                
                // Trigger a new search with current inputs
                const currentForm = new Event('submit');
                searchForm.dispatchEvent(currentForm);
            }
        }, 800); // Wait 800ms after user stops typing
    });

    // Add event listener for sport filter changes
    const sportSelect = document.getElementById('sportSelect');
    sportSelect.addEventListener('change', (e) => {
        // Hide error when user changes sport filter
        hideError();
        
        // Check if there are currently displayed results OR no results message
        const resultsSection = document.getElementById('resultsSection');
        const noResults = document.getElementById('noResults');
        
        if (resultsSection.style.display !== 'none' || noResults.style.display !== 'none') {
            // Hide the no results message before re-searching
            noResults.style.display = 'none';
            
            // Trigger a new search with current inputs
            const currentForm = new Event('submit');
            searchForm.dispatchEvent(currentForm);
        }
    });

    // Focus on ZIP code input when page loads (default mode)
    zipCodeInput.focus();
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);