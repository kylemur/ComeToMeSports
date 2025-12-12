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

        // Add tile layer (OpenStreetMap) with offline fallback
        this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            // Add error handling for offline scenarios
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA5wjbTgAAAABJRU5ErkJggg==',
            keepBuffer: 4 // Keep more tiles in memory
        }).addTo(this.map);

        // Initialize marker group
        this.markerGroup = L.layerGroup().addTo(this.map);

        // Add map controls
        this.setupMapControls();
        
        // Add offline status indicator
        this.setupOfflineIndicator();
    }

    /**
     * Setup map control event listeners
     */
    setupMapControls() {
        const fitBoundsBtn = document.getElementById('fitMapBounds');
        const prepareOfflineBtn = document.getElementById('prepareOffline');

        if (fitBoundsBtn) {
            fitBoundsBtn.addEventListener('click', () => this.fitMapToMarkers());
        }

        if (prepareOfflineBtn) {
            prepareOfflineBtn.addEventListener('click', () => this.prepareForOfflineUse());
        }
    }

    /**
     * Setup offline status indicator
     */
    setupOfflineIndicator() {
        const offlineIndicator = document.createElement('div');
        offlineIndicator.id = 'offline-indicator';
        offlineIndicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff4444;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
            display: none;
        `;
        offlineIndicator.textContent = 'Offline Mode - Limited Map Data';
        
        const mapContainer = document.getElementById('eventsMap');
        if (mapContainer) {
            mapContainer.appendChild(offlineIndicator);
        }

        // Monitor online/offline status
        window.addEventListener('online', () => {
            offlineIndicator.style.display = 'none';
        });

        window.addEventListener('offline', () => {
            offlineIndicator.style.display = 'block';
        });

        // Initial check
        if (!navigator.onLine) {
            offlineIndicator.style.display = 'block';
        }
    }

    /**
     * Preload tiles for a specific area (useful for offline preparation)
     */
    preloadTilesForArea(bounds, minZoom = 8, maxZoom = 12) {
        console.log('Preloading tiles for offline use...');
        
        for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
            const tileCoords = this.getTileCoordsFromBounds(bounds, zoom);
            
            tileCoords.forEach(coord => {
                const url = `https://a.tile.openstreetmap.org/${zoom}/${coord.x}/${coord.y}.png`;
                
                // Preload by creating image elements
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    // Store in cache via service worker
                    if ('caches' in window) {
                        caches.open('map-tiles-v1').then(cache => {
                            cache.add(url).catch(e => console.log('Cache add failed:', e));
                        });
                    }
                };
                img.src = url;
            });
        }
    }

    /**
     * Calculate tile coordinates from bounds
     */
    getTileCoordsFromBounds(bounds, zoom) {
        const coords = [];
        const tileSize = 256;
        const earthCircum = 40075016.686; // Earth's circumference in meters
        
        const deg2rad = (deg) => deg * (Math.PI / 180);
        const rad2deg = (rad) => rad * (180 / Math.PI);
        
        // Convert bounds to tile coordinates
        const nwTile = this.latLonToTile(bounds.getNorthWest().lat, bounds.getNorthWest().lng, zoom);
        const seTile = this.latLonToTile(bounds.getSouthEast().lat, bounds.getSouthEast().lng, zoom);
        
        for (let x = nwTile.x; x <= seTile.x; x++) {
            for (let y = nwTile.y; y <= seTile.y; y++) {
                coords.push({ x, y });
            }
        }
        
        return coords;
    }

    /**
     * Convert lat/lon to tile coordinates
     */
    latLonToTile(lat, lon, zoom) {
        const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        return { x, y };
    }

    /**
     * Prepare map for offline use by caching current view
     */
    prepareForOfflineUse() {
        if (!this.map) return;

        // Check if user is online
        if (!navigator.onLine) {
            alert('Cannot prepare for offline use while you are already offline. Please connect to the internet and try again.');
            return;
        }

        // Trigger flash effect
        this.triggerMapFlash();

        const button = document.getElementById('prepareOffline');
        const originalText = button.textContent;
        button.textContent = 'Caching tiles...';
        button.disabled = true;

        const bounds = this.map.getBounds();
        const currentZoom = this.map.getZoom();
        const maxZoom = Math.min(currentZoom + 2, 15); // Don't go too detailed to avoid too many requests
        const minZoom = Math.max(currentZoom - 1, 8);

        console.log(`Preparing offline tiles for zoom levels ${minZoom}-${maxZoom}`);
        
        this.preloadTilesForArea(bounds, minZoom, maxZoom);

        // Reset button after a delay
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            alert('Map tiles cached for offline use in current view area.');
        }, 3000);
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
     * Trigger white flash effect on map (like screenshot flash)
     */
    triggerMapFlash() {
        console.log('Triggering map flash effect for offline caching...');
        const mapContainer = document.getElementById('eventsMap');
        let flashOverlay = mapContainer.querySelector('.map-flash-overlay');
        
        // Create overlay if it doesn't exist
        if (!flashOverlay) {
            flashOverlay = document.createElement('div');
            flashOverlay.className = 'map-flash-overlay';
            mapContainer.appendChild(flashOverlay);
        }
        
        // Trigger flash animation
        flashOverlay.classList.add('flash');
        
        // Remove flash after animation
        setTimeout(() => {
            flashOverlay.classList.remove('flash');
        }, 200); // Flash duration
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