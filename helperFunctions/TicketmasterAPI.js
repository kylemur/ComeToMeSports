/**
 * Ticketmaster Discovery API v2 Client
 * Allows searching for sporting events by university name and ZIP code
 */

const https = require('https');
const querystring = require('querystring');

class TicketmasterAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://app.ticketmaster.com/discovery/v2';
    this.rateLimit = {
      requestsPerSecond: 5,
      dailyQuota: 5000,
      lastRequestTime: 0,
      requestCount: 0
    };
  }

  /**
   * Rate limiting to respect Ticketmaster's 5 requests per second limit
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimit.lastRequestTime;
    const minInterval = 1000 / this.rateLimit.requestsPerSecond; // 200ms between requests

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.rateLimit.lastRequestTime = Date.now();
    this.rateLimit.requestCount++;
  }

  /**
   * Make API request to Ticketmaster
   */
  async makeAPIRequest(endpoint, params = {}) {
    await this.enforceRateLimit();

    // Add API key to parameters
    const queryParams = {
      ...params,
      apikey: this.apiKey
    };

    const query = querystring.stringify(queryParams);
    const url = `${this.baseURL}${endpoint}?${query}`;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
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
              resolve(response);
            } else if (res.statusCode === 401) {
              reject(new Error('Invalid API Key - Please check your Ticketmaster API credentials'));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${response.fault?.faultstring || 'API request failed'}`));
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

      req.end();
    });
  }

  /**
   * Search for sporting events by university name and ZIP code
   */
  async searchUniversitySports(universityName, zipCode, options = {}) {
    const {
      radius = 50,           // miles
      size = 20,            // number of results
      page = 0,             // page number
      sort = 'date,asc',    // sort order
      startDateTime = null, // ISO date string
      endDateTime = null    // ISO date string
    } = options;

    console.log(`🔍 Searching for ${universityName} sporting events near ZIP ${zipCode}...`);

    // Build search parameters
    const params = {
      keyword: universityName,
      classificationName: 'Sports',
      postalCode: zipCode,
      radius: radius,
      unit: 'miles',
      size: size,
      page: page,
      sort: sort,
      countryCode: 'US'
    };

    // Add date filters if provided
    if (startDateTime) {
      params.startDateTime = startDateTime;
    }
    if (endDateTime) {
      params.endDateTime = endDateTime;
    }

    try {
      const response = await this.makeAPIRequest('/events.json', params);
      
      if (response._embedded?.events) {
        console.log(`✅ Found ${response._embedded.events.length} events`);
        return this.formatSportingEvents(response._embedded.events, response.page);
      } else {
        console.log('❌ No events found');
        return {
          events: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: page
        };
      }
    } catch (error) {
      console.error(`❌ Error searching for ${universityName} events:`, error.message);
      throw error;
    }
  }

  /**
   * Format sporting events for consistent output
   */
  formatSportingEvents(events, pageInfo) {
    const formattedEvents = events.map(event => {
      const venue = event._embedded?.venues?.[0];
      const classification = event.classifications?.[0];
      const priceRanges = event.priceRanges?.[0];

      return {
        id: event.id,
        name: event.name,
        date: event.dates?.start?.localDate,
        time: event.dates?.start?.localTime,
        dateTime: event.dates?.start?.dateTime,
        url: event.url,
        venue: {
          name: venue?.name,
          address: venue?.address?.line1,
          city: venue?.city?.name,
          state: venue?.state?.name,
          postalCode: venue?.postalCode,
          country: venue?.country?.name,
          coordinates: venue?.location ? {
            latitude: parseFloat(venue.location.latitude),
            longitude: parseFloat(venue.location.longitude)
          } : null
        },
        sport: {
          segment: classification?.segment?.name,
          genre: classification?.genre?.name,
          subGenre: classification?.subGenre?.name,
          sport: classification?.sport?.name
        },
        pricing: priceRanges ? {
          min: priceRanges.min,
          max: priceRanges.max,
          currency: priceRanges.currency
        } : null,
        status: event.dates?.status?.code,
        salesDates: {
          public: {
            startDateTime: event.sales?.public?.startDateTime,
            endDateTime: event.sales?.public?.endDateTime
          }
        },
        images: event.images?.map(img => ({
          url: img.url,
          width: img.width,
          height: img.height,
          ratio: img.ratio
        })) || []
      };
    });

    return {
      events: formattedEvents,
      totalElements: pageInfo?.totalElements || 0,
      totalPages: pageInfo?.totalPages || 0,
      currentPage: pageInfo?.number || 0,
      size: pageInfo?.size || 0
    };
  }

  /**
   * Search for events by multiple universities in a single ZIP code area
   */
  async searchMultipleUniversities(universityNames, zipCode, options = {}) {
    const results = {};
    
    for (const university of universityNames) {
      try {
        const events = await this.searchUniversitySports(university, zipCode, options);
        results[university] = events;
        
        // Add delay between university searches to respect rate limits
        if (universityNames.indexOf(university) < universityNames.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      } catch (error) {
        console.error(`Error searching for ${university}:`, error.message);
        results[university] = { events: [], error: error.message };
      }
    }
    
    return results;
  }

  /**
   * Get detailed event information by event ID
   */
  async getEventDetails(eventId) {
    console.log(`📅 Getting details for event ID: ${eventId}`);
    
    try {
      const response = await this.makeAPIRequest(`/events/${eventId}.json`);
      return this.formatSportingEvents([response], null).events[0];
    } catch (error) {
      console.error(`❌ Error getting event details:`, error.message);
      throw error;
    }
  }
}

module.exports = TicketmasterAPI;

// Example usage and testing
if (require.main === module) {
  async function testTicketmaster() {
    // Replace with your actual Ticketmaster API key
    const API_KEY = process.env.TICKETMASTER_API_KEY || 'BMHyV7S1mxGcjdcNizEYY5JpxQGJLlZF';
    
    if (API_KEY === 'your_api_key_here') {
      console.log('⚠️ Please set TICKETMASTER_API_KEY environment variable');
      console.log('Or replace the placeholder value in this file');
      console.log('Get your API key from: https://developer.ticketmaster.com/');
      return;
    }

    try {
      const ticketmaster = new TicketmasterAPI(API_KEY);
      
      // Test university sports search
      console.log('🏈 Testing University Sports Search...\n');
      
      const universities = ['Alabama', 'Auburn', 'University of Alabama'];
      const zipCode = '35401'; // Tuscaloosa, AL
      
      console.log(`Searching for sporting events near ZIP code ${zipCode}:`);
      console.log('Universities:', universities.join(', '));
      console.log('=' .repeat(60));
      
      const results = await ticketmaster.searchMultipleUniversities(universities, zipCode, {
        radius: 75,
        size: 10,
        sort: 'date,asc'
      });
      
      // Display results
      for (const [university, result] of Object.entries(results)) {
        console.log(`\n🏫 ${university.toUpperCase()}`);
        console.log('-'.repeat(40));
        
        if (result.error) {
          console.log(`❌ Error: ${result.error}`);
          continue;
        }
        
        if (result.events.length === 0) {
          console.log('No sporting events found');
          continue;
        }
        
        result.events.slice(0, 5).forEach((event, index) => {
          console.log(`\n${index + 1}. ${event.name}`);
          console.log(`   📅 Date: ${event.date} ${event.time || ''}`);
          console.log(`   🏟️ Venue: ${event.venue.name}`);
          console.log(`   📍 Location: ${event.venue.city}, ${event.venue.state}`);
          if (event.sport.sport) {
            console.log(`   🏈 Sport: ${event.sport.sport}`);
          }
          if (event.pricing) {
            console.log(`   💰 Price: $${event.pricing.min} - $${event.pricing.max}`);
          }
          console.log(`   🔗 URL: ${event.url}`);
        });
        
        if (result.events.length > 5) {
          console.log(`\n   ... and ${result.events.length - 5} more events`);
        }
        
        console.log(`\nTotal: ${result.totalElements} events found`);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
  
  testTicketmaster();
}
