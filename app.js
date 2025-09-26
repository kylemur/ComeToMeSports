// Mock sporting events data with ZIP codes and coordinates
const mockEvents = [
    {
        id: 1,
        title: "Lakers vs Warriors",
        sport: "Basketball",
        date: "2024-01-15",
        time: "7:30 PM",
        venue: "Crypto.com Arena",
        address: "1111 S Figueroa St, Los Angeles, CA",
        zipCode: "90015",
        latitude: 34.043,
        longitude: -118.267
    },
    {
        id: 2,
        title: "Rams vs 49ers",
        sport: "Football",
        date: "2024-01-20",
        time: "1:00 PM",
        venue: "SoFi Stadium",
        address: "1001 Stadium Dr, Inglewood, CA",
        zipCode: "90301",
        latitude: 33.953,
        longitude: -118.338
    },
    {
        id: 3,
        title: "Dodgers vs Giants",
        sport: "Baseball",
        date: "2024-04-10",
        time: "7:10 PM",
        venue: "Dodger Stadium",
        address: "1000 Vin Scully Ave, Los Angeles, CA",
        zipCode: "90012",
        latitude: 34.073,
        longitude: -118.240
    },
    {
        id: 4,
        title: "Yankees vs Red Sox",
        sport: "Baseball",
        date: "2024-04-15",
        time: "7:05 PM",
        venue: "Yankee Stadium",
        address: "1 E 161st St, Bronx, NY",
        zipCode: "10451",
        latitude: 40.829,
        longitude: -73.926
    },
    {
        id: 5,
        title: "Knicks vs Celtics",
        sport: "Basketball",
        date: "2024-02-01",
        time: "8:00 PM",
        venue: "Madison Square Garden",
        address: "4 Pennsylvania Plaza, New York, NY",
        zipCode: "10001",
        latitude: 40.750,
        longitude: -73.993
    },
    {
        id: 6,
        title: "Giants vs Cowboys",
        sport: "Football",
        date: "2024-01-25",
        time: "4:25 PM",
        venue: "MetLife Stadium",
        address: "1 MetLife Stadium Dr, East Rutherford, NJ",
        zipCode: "07073",
        latitude: 40.813,
        longitude: -74.074
    },
    {
        id: 7,
        title: "Bulls vs Heat",
        sport: "Basketball",
        date: "2024-02-10",
        time: "8:00 PM",
        venue: "United Center",
        address: "1901 W Madison St, Chicago, IL",
        zipCode: "60612",
        latitude: 41.881,
        longitude: -87.674
    },
    {
        id: 8,
        title: "Bears vs Packers",
        sport: "Football",
        date: "2024-01-30",
        time: "1:00 PM",
        venue: "Soldier Field",
        address: "1410 S Museum Campus Dr, Chicago, IL",
        zipCode: "60605",
        latitude: 41.862,
        longitude: -87.617
    },
    {
        id: 9,
        title: "Warriors vs Clippers",
        sport: "Basketball",
        date: "2024-02-05",
        time: "10:00 PM",
        venue: "Chase Center",
        address: "1 Warriors Way, San Francisco, CA",
        zipCode: "94158",
        latitude: 37.768,
        longitude: -122.388
    },
    {
        id: 10,
        title: "49ers vs Seahawks",
        sport: "Football",
        date: "2024-02-12",
        time: "4:05 PM",
        venue: "Levi's Stadium",
        address: "4900 Marie P DeBartolo Way, Santa Clara, CA",
        zipCode: "95054",
        latitude: 37.403,
        longitude: -121.970
    }
];


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
function findEventsNearZip(zipCode, maxDistance = 50) {
    const userCoords = getCoordinatesForZip(zipCode);
    if (!userCoords) {
        return [];
    }

    return mockEvents
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
}

// Format distance for display
function formatDistance(distance) {
    return distance < 1 ? 
        `${(distance * 5280).toFixed(0)} feet` : 
        `${distance.toFixed(1)} miles`;
}

// Create event card HTML
function createEventCard(event) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="event-card">
            <div class="event-title">${event.title}</div>
            <div class="event-sport">${event.sport}</div>
            <div class="event-details">
                <strong>Date:</strong> ${formattedDate}<br>
                <strong>Time:</strong> ${event.time}<br>
                <strong>Venue:</strong> ${event.venue}<br>
                <strong>Address:</strong> ${event.address}<br>
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

function doSearch(zipCode) {
    // Check if we have coordinates for this ZIP code
    if (!getCoordinatesForZip(zipCode)) {
        showError('Sorry, we don\'t have location data for this ZIP code. Try: 90210, 10001, 60612, or other major city ZIP codes.');
        return;
    }

    // Show loading state
    showLoading();

    // Simulate API delay for better UX
    setTimeout(() => {
        const events = findEventsNearZip(zipCode);
        hideLoading();
        displayEvents(events);
    }, 1000);
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