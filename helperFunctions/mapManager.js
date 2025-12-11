/**
 * Map Manager for displaying sports events on an interactive map
 */
class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.markerGroup = null;
        this.isMapView = false;
        this.userLocation = null;
    }

    /**
     * Initialize the map
     */
    initializeMap(centerLat = 39.8283, centerLon = -98.5795, zoom = 4) {
        // Center of continental US as default
        this.map = L.map('eventsMap').setView([centerLat, centerLon], zoom);

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Initialize marker group
        this.markerGroup = L.layerGroup().addTo(this.map);

        // Add map controls
        this.setupMapControls();
    }

    /**
     * Setup map control event listeners
     */
    setupMapControls() {
        const fitBoundsBtn = document.getElementById('fitMapBounds');

        if (fitBoundsBtn) {
            fitBoundsBtn.addEventListener('click', () => this.fitMapToMarkers());
        }
    }

    /**
     * Add events to the map
     */
    displayEventsOnMap(events, userCoordinates = null) {
        this.clearMarkers();
        this.userLocation = userCoordinates;

        // Add user location marker if provided
        if (userCoordinates) {
            const userMarker = L.marker([userCoordinates.lat, userCoordinates.lon], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: '📍',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(this.markerGroup);

            userMarker.bindPopup(`
                <div class="event-popup">
                    <h4>Your Search Location</h4>
                    <div class="event-details">Search center point</div>
                </div>
            `);
        }

        // Add event markers
        events.forEach(event => {
            if (event.latitude && event.longitude) {
                const marker = this.createEventMarker(event);
                this.markerGroup.addLayer(marker);
                this.markers.push(marker);
            }
        });

        // Fit map to show all markers
        this.fitMapToMarkers();
    }

    /**
     * Create a marker for an event
     */
    createEventMarker(event) {
        // Custom icon based on sport or source
        let iconHtml = '🏟️'; // Default stadium icon
        
        if (event.sport) {
            const sport = event.sport.toLowerCase();
            if (sport.includes('football')) iconHtml = '🏈';
            else if (sport.includes('basketball')) iconHtml = '🏀';
            else if (sport.includes('baseball')) iconHtml = '⚾';
            else if (sport.includes('soccer')) iconHtml = '⚽';
            else if (sport.includes('tennis')) iconHtml = '🎾';
            else if (sport.includes('golf')) iconHtml = '⛳';
            else if (sport.includes('swimming')) iconHtml = '🏊';
            else if (sport.includes('track') || sport.includes('cross country')) iconHtml = '🏃';
        }

        const marker = L.marker([event.latitude, event.longitude], {
            icon: L.divIcon({
                className: 'event-marker',
                html: iconHtml,
                iconSize: [25, 25],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12]
            })
        });

        // Create popup content
        const popupContent = this.createPopupContent(event);
        marker.bindPopup(popupContent);

        return marker;
    }

    /**
     * Create popup content for an event
     */
    createPopupContent(event) {
        const distanceText = event.distance 
            ? `<div class="event-details event-distance">${formatDistance(event.distance)} away</div>`
            : '';

        const dateText = event.date && event.date !== 'TBD' 
            ? `<div class="event-details">📅 ${event.date}${event.time && event.time !== 'TBD' ? ` at ${event.time}` : ''}</div>`
            : '';

        const venueText = event.venue && event.venue !== 'TBD'
            ? `<div class="event-details">🏟️ ${event.venue}</div>`
            : '';

        const locationText = event.location && event.location !== 'TBD'
            ? `<div class="event-details">📍 ${event.location}</div>`
            : '';

        const ticketLink = event.url 
            ? `<a href="${event.url}" target="_blank" class="event-link">View Tickets</a>`
            : '';

        return `
            <div class="event-popup">
                <h4>${event.title || 'Sports Event'}</h4>
                <div class="event-sport">${event.sport || 'Sports'}</div>
                ${dateText}
                ${venueText}
                ${locationText}
                ${distanceText}
                ${ticketLink}
            </div>
        `;
    }

    /**
     * Clear all markers from the map
     */
    clearMarkers() {
        this.markerGroup.clearLayers();
        this.markers = [];
    }

    /**
     * Fit map view to show all markers
     */
    fitMapToMarkers() {
        if (this.markers.length === 0 && !this.userLocation) return;

        const group = new L.featureGroup(this.markers);
        
        if (this.userLocation) {
            // Include user location in bounds
            const bounds = group.getBounds();
            bounds.extend([this.userLocation.lat, this.userLocation.lon]);
            this.map.fitBounds(bounds, { padding: [20, 20] });
        } else if (this.markers.length > 0) {
            this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }

        // If only one marker, zoom to reasonable level
        if (this.markers.length === 1) {
            this.map.setZoom(12);
        }
    }

    /**
     * Toggle between map and list view
     */
    toggleView() {
        const mapSection = document.getElementById('mapSection');
        const resultsSection = document.getElementById('resultsSection');
        const toggleBtn = document.getElementById('toggleMapView');

        if (this.isMapView) {
            // Switch to list view
            mapSection.style.display = 'none';
            resultsSection.style.display = 'block';
            toggleBtn.textContent = 'Show Map View';
            this.isMapView = false;
        } else {
            // Switch to map view
            mapSection.style.display = 'block';
            resultsSection.style.display = 'none';
            toggleBtn.textContent = 'Show List View';
            this.isMapView = true;
            
            // Refresh map size (important for proper rendering)
            setTimeout(() => {
                this.map.invalidateSize();
                this.fitMapToMarkers();
            }, 100);
        }
    }

    /**
     * Show map view
     */
    showMapView() {
        if (!this.isMapView) {
            this.toggleView();
        }
    }

    /**
     * Show list view
     */
    showListView() {
        if (this.isMapView) {
            this.toggleView();
        }
    }

    /**
     * Update map center based on search location
     */
    updateMapCenter(lat, lon, zoom = 10) {
        if (this.map) {
            this.map.setView([lat, lon], zoom);
        }
    }

    /**
     * Destroy the map instance
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.markers = [];
            this.markerGroup = null;
        }
    }
}

// Global map manager instance
window.mapManager = new MapManager();