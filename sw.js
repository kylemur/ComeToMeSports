// Service Worker for offline map tiles
const CACHE_NAME = 'map-tiles-v1';

// Pre-define essential tiles for continental US (zoom levels 3-6)
const ESSENTIAL_TILES = [
    // Zoom level 3 (covers entire US in ~8 tiles)
    'https://a.tile.openstreetmap.org/3/1/2.png',
    'https://a.tile.openstreetmap.org/3/2/2.png',
    'https://a.tile.openstreetmap.org/3/1/3.png',
    'https://a.tile.openstreetmap.org/3/2/3.png',
    
    // Zoom level 4 (more detail for US regions)
    'https://a.tile.openstreetmap.org/4/2/4.png',
    'https://a.tile.openstreetmap.org/4/3/4.png',
    'https://a.tile.openstreetmap.org/4/4/4.png',
    'https://a.tile.openstreetmap.org/4/2/5.png',
    'https://a.tile.openstreetmap.org/4/3/5.png',
    'https://a.tile.openstreetmap.org/4/4/5.png',
    'https://a.tile.openstreetmap.org/4/2/6.png',
    'https://a.tile.openstreetmap.org/4/3/6.png',
    'https://a.tile.openstreetmap.org/4/4/6.png',
    
    // Zoom level 5 (state-level detail for major regions)
    'https://a.tile.openstreetmap.org/5/4/8.png',
    'https://a.tile.openstreetmap.org/5/5/8.png',
    'https://a.tile.openstreetmap.org/5/6/8.png',
    'https://a.tile.openstreetmap.org/5/7/8.png',
    'https://a.tile.openstreetmap.org/5/8/8.png',
    'https://a.tile.openstreetmap.org/5/4/9.png',
    'https://a.tile.openstreetmap.org/5/5/9.png',
    'https://a.tile.openstreetmap.org/5/6/9.png',
    'https://a.tile.openstreetmap.org/5/7/9.png',
    'https://a.tile.openstreetmap.org/5/8/9.png',
    'https://a.tile.openstreetmap.org/5/4/10.png',
    'https://a.tile.openstreetmap.org/5/5/10.png',
    'https://a.tile.openstreetmap.org/5/6/10.png',
    'https://a.tile.openstreetmap.org/5/7/10.png',
    'https://a.tile.openstreetmap.org/5/8/10.png',
    'https://a.tile.openstreetmap.org/5/4/11.png',
    'https://a.tile.openstreetmap.org/5/5/11.png',
    'https://a.tile.openstreetmap.org/5/6/11.png',
    'https://a.tile.openstreetmap.org/5/7/11.png',
    'https://a.tile.openstreetmap.org/5/8/11.png'
];

self.addEventListener('install', event => {
    console.log('Service Worker installing and caching essential map tiles...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching essential tiles for offline use...');
                return cache.addAll(ESSENTIAL_TILES);
            })
            .then(() => {
                console.log('Essential tiles cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Failed to cache essential tiles:', error);
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Cache additional tiles for major sports cities at zoom level 6
            caches.open(CACHE_NAME).then(cache => {
                const majorCityTiles = [
                    // Los Angeles area (zoom 6)
                    'https://a.tile.openstreetmap.org/6/10/24.png',
                    'https://a.tile.openstreetmap.org/6/11/24.png',
                    'https://a.tile.openstreetmap.org/6/10/25.png',
                    'https://a.tile.openstreetmap.org/6/11/25.png',
                    
                    // New York area (zoom 6)
                    'https://a.tile.openstreetmap.org/6/18/22.png',
                    'https://a.tile.openstreetmap.org/6/19/22.png',
                    'https://a.tile.openstreetmap.org/6/18/23.png',
                    'https://a.tile.openstreetmap.org/6/19/23.png',
                    
                    // Chicago area (zoom 6)
                    'https://a.tile.openstreetmap.org/6/16/22.png',
                    'https://a.tile.openstreetmap.org/6/17/22.png',
                    'https://a.tile.openstreetmap.org/6/16/23.png',
                    'https://a.tile.openstreetmap.org/6/17/23.png',
                    
                    // Dallas/Houston area (zoom 6)
                    'https://a.tile.openstreetmap.org/6/14/25.png',
                    'https://a.tile.openstreetmap.org/6/15/25.png',
                    'https://a.tile.openstreetmap.org/6/14/26.png',
                    'https://a.tile.openstreetmap.org/6/15/26.png'
                ];
                
                return cache.addAll(majorCityTiles).catch(error => {
                    console.log('Some city tiles failed to cache:', error);
                });
            })
        ])
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Check if it's a tile request
    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    if (response) {
                        // Return cached tile
                        console.log('Serving cached tile:', url.pathname);
                        return response;
                    }
                    
                    // Fetch from network and cache
                    return fetch(event.request).then(networkResponse => {
                        if (networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                            console.log('Cached new tile:', url.pathname);
                        }
                        return networkResponse;
                    }).catch(error => {
                        console.log('Network failed, no cached tile available:', url.pathname);
                        // Could return a placeholder tile here
                        return new Response('', { status: 404 });
                    });
                });
            })
        );
    }
});