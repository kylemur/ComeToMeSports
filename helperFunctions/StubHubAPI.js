/**
 * StubHub API Client
 * Implements OAuth2 client credentials flow for accessing public event data
 * 
 * See https://developer.stubhub.com/docs/overview/introduction for details
 * See https://developer.stubhub.ie/ for details
 */

const https = require('https');
const querystring = require('querystring');

class StubHubAPI {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseURL = 'https://api.stubhub.com';
  }

  /**
   * Step 1: Create Basic Authorization header
   * URL encode client id and secret, concatenate with colon, then base64 encode
   */
  createBasicAuthHeader() {
    // URL encode according to RFC 1738
    const encodedClientId = encodeURIComponent(this.clientId);
    const encodedClientSecret = encodeURIComponent(this.clientSecret);
    
    // Concatenate with colon
    const credentials = `${encodedClientId}:${encodedClientSecret}`;
    
    // Base64 encode
    const base64Credentials = Buffer.from(credentials).toString('base64');
    
    return `Basic ${base64Credentials}`;
  }

  /**
   * Step 2: Obtain access token using client credentials grant
   */
  async getClientAccessToken(scopes = ['read:events']) {
    const authHeader = this.createBasicAuthHeader();
    const scopeString = Array.isArray(scopes) ? scopes.join(' ') : scopes;
    
    const postData = querystring.stringify({
      grant_type: 'client_credentials',
      scope: scopeString
    });

    const options = {
      hostname: 'api.stubhub.com',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ComeToMeSports/1.0'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200) {
              // Store token and expiry
              this.accessToken = response.access_token;
              this.tokenExpiry = new Date(Date.now() + (response.expires_in * 1000));
              
              console.log('✅ Successfully obtained access token');
              console.log(`Token expires at: ${this.tokenExpiry.toISOString()}`);
              
              resolve(response);
            } else {
              console.error('❌ Failed to obtain access token:', response);
              reject(new Error(`HTTP ${res.statusCode}: ${response.error_description || response.error}`));
            }
          } catch (error) {
            console.error('❌ Error parsing response:', error);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Request error:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Check if current access token is valid and not expired
   */
  isTokenValid() {
    return this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry;
  }

  /**
   * Ensure we have a valid access token, refresh if needed
   */
  async ensureValidToken() {
    if (!this.isTokenValid()) {
      console.log('🔄 Obtaining new access token...');
      await this.getClientAccessToken();
    } else {
      console.log('✅ Using existing valid token');
    }
  }

  /**
   * Make authenticated API requests
   */
  async makeAPIRequest(endpoint, method = 'GET', data = null) {
    await this.ensureValidToken();

    const url = new URL(endpoint, this.baseURL);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'ComeToMeSports/1.0'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      const postData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const response = responseData ? JSON.parse(responseData) : null;
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              console.error(`❌ API request failed (${res.statusCode}):`, response);
              reject(new Error(`HTTP ${res.statusCode}: ${response?.message || 'API request failed'}`));
            }
          } catch (error) {
            console.error('❌ Error parsing API response:', error);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ API request error:', error);
        reject(error);
      });

      if (data && (method === 'POST' || method === 'PUT')) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Search for events
   */
  async searchEvents(params = {}) {
    const query = querystring.stringify(params);
    const endpoint = `/v3/events/search${query ? '?' + query : ''}`;
    
    console.log(`🔍 Searching events: ${endpoint}`);
    return await this.makeAPIRequest(endpoint);
  }

  /**
   * Get event details by ID
   */
  async getEvent(eventId) {
    console.log(`📅 Getting event details for ID: ${eventId}`);
    return await this.makeAPIRequest(`/v3/events/${eventId}`);
  }

  /**
   * Search events by location (city, coordinates, etc.)
   */
  async searchEventsByLocation(location, params = {}) {
    const searchParams = {
      ...params,
      q: location
    };
    
    return await this.searchEvents(searchParams);
  }

  /**
   * Get events near coordinates
   */
  async getEventsNearCoordinates(latitude, longitude, radiusMiles = 50, params = {}) {
    const searchParams = {
      ...params,
      lat: latitude,
      lon: longitude,
      radius: radiusMiles
    };
    
    return await this.searchEvents(searchParams);
  }
}

module.exports = StubHubAPI;

// Example usage:
if (require.main === module) {
  async function getAlabamaEvents() {
    // Replace with your actual StubHub API credentials
    const CLIENT_ID = process.env.STUBHUB_CLIENT_ID || 'your_client_id';
    const CLIENT_SECRET = process.env.STUBHUB_CLIENT_SECRET || 'your_client_secret';
    
    if (CLIENT_ID === 'your_client_id' || CLIENT_SECRET === 'your_client_secret') {
      console.log('⚠️ Please set STUBHUB_CLIENT_ID and STUBHUB_CLIENT_SECRET environment variables');
      console.log('Or replace the placeholder values in this file');
      return;
    }

    try {
      const stubhub = new StubHubAPI(CLIENT_ID, CLIENT_SECRET);
      
      // Test authentication
      console.log('🚀 Testing StubHub API authentication...');
      await stubhub.getClientAccessToken(['read:events']);
      
      // Search for University of Alabama events
      console.log('\n🏈 Searching for University of Alabama events...');
      
      const searchQueries = [
        'Alabama Crimson Tide',
        'University of Alabama',
        'Alabama Football',
        'Alabama Basketball'
      ];
      
      let allEvents = [];
      
      for (const query of searchQueries) {
        console.log(`\n🔍 Searching for: "${query}"`);
        try {
          const events = await stubhub.searchEventsByLocation('Tuscaloosa, AL', {
            q: query,
            limit: 20,
            sort: 'eventDate'
          });
          
          if (events?.events?.length > 0) {
            console.log(`Found ${events.events.length} events for "${query}"`);
            allEvents = allEvents.concat(events.events);
          } else {
            console.log(`No events found for "${query}"`);
          }
        } catch (error) {
          console.log(`Error searching for "${query}": ${error.message}`);
        }
      }
      
      // Also search by coordinates (Tuscaloosa, AL coordinates)
      console.log('\n📍 Searching by Tuscaloosa coordinates...');
      try {
        const coordinateEvents = await stubhub.getEventsNearCoordinates(33.2098, -87.5692, 25, {
          limit: 20,
          q: 'Alabama',
          sort: 'eventDate'
        });
        
        if (coordinateEvents?.events?.length > 0) {
          console.log(`Found ${coordinateEvents.events.length} events near Tuscaloosa`);
          allEvents = allEvents.concat(coordinateEvents.events);
        }
      } catch (error) {
        console.log(`Error searching by coordinates: ${error.message}`);
      }
      
      // Remove duplicates based on event ID
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      
      console.log(`\n📊 Total unique Alabama events found: ${uniqueEvents.length}`);
      
      if (uniqueEvents.length > 0) {
        console.log('\n🎫 University of Alabama Events:');
        console.log('=' .repeat(60));
        
        uniqueEvents.slice(0, 10).forEach((event, index) => {
          console.log(`\n${index + 1}. ${event.name}`);
          console.log(`   📅 Date: ${event.eventDate}`);
          console.log(`   🏟️  Venue: ${event.venue?.name || 'N/A'}`);
          console.log(`   📍 Location: ${event.venue?.city || 'N/A'}, ${event.venue?.state || 'N/A'}`);
          console.log(`   💰 Price Range: $${event.minListPrice || 'N/A'} - $${event.maxListPrice || 'N/A'}`);
          console.log(`   🎫 Available Tickets: ${event.totalTickets || 'N/A'}`);
          if (event.categories?.length > 0) {
            console.log(`   🏷️  Category: ${event.categories[0].name}`);
          }
        });
        
        if (uniqueEvents.length > 10) {
          console.log(`\n... and ${uniqueEvents.length - 10} more events`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  
  getAlabamaEvents();
}
