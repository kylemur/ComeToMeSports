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
async function findEventsNearZip(zipCode, maxDistance = 1500) {
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

async function doSearch(zipCode) {
    // Check if we have coordinates for this ZIP code
    if (!getCoordinatesForZip(zipCode)) {
        showError('Sorry, we don\'t have location data for this ZIP code. Try: 90210, 10001, 60612, or other major city ZIP codes.');
        return;
    }

    // Show loading state
    showLoading();

    try {
        const events = await findEventsNearZip(zipCode);
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

    const zipCodeInput = document.getElementById('zipCode');
    const zipCode = zipCodeInput.value.trim();

    // Hide previous results and errors
    hideError();
    hideLoading();
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';

    // Validate ZIP code
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
            doSearch(zipCode);
        });
        return;
    }

    doSearch(zipCode);
}

// Initialize the application
function init() {
    const searchForm = document.getElementById('searchForm');
    const zipCodeInput = document.getElementById('zipCode');

    // Add form submission handler
    searchForm.addEventListener('submit', handleSearch);

    // Add input validation
    zipCodeInput.addEventListener('input', (e) => {
        // Only allow digits
        e.target.value = e.target.value.replace(/\D/g, '');
        
        // Hide error when user starts typing
        if (e.target.value.length > 0) {
            hideError();
        }
    });

    // Focus on ZIP code input when page loads
    zipCodeInput.focus();
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);