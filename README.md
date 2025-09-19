# ComeToMeSports
Web application to find sporting events near a given ZIP code.

## Features

🏆 **Easy ZIP Code Search** - Simply enter your 5-digit ZIP code to find nearby events  
🏀 **Multiple Sports** - Basketball, Football, Baseball and more  
📍 **Distance Calculation** - Shows exact distance from your location  
📱 **Mobile Responsive** - Works perfectly on desktop and mobile devices  
⚡ **Real-time Search** - Instant results with smooth loading animations  
🎯 **Smart Validation** - Input validation and helpful error messages  

## How to Use

1. **Open the Application**: Open `index.html` in your web browser
2. **Enter ZIP Code**: Type your 5-digit ZIP code (e.g., 90210, 10001, 60612)
3. **Find Events**: Click "Find Events" to search for nearby sporting events
4. **View Results**: Browse events sorted by distance from your location

## Supported ZIP Codes

The application currently supports major metropolitan areas including:
- **California**: 90210 (Beverly Hills), 90015 (LA), 94158 (San Francisco), 95054 (Santa Clara)
- **New York**: 10001 (Manhattan), 10451 (Bronx), 07073 (East Rutherford, NJ)
- **Illinois**: 60612 (Chicago), 60605 (Chicago)
- And more major cities...

## Running the Application

### Option 1: Direct File Access
Simply open `index.html` in your web browser.

### Option 2: Local Web Server
For the best experience, serve the files through a web server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## Files Structure

```
ComeToMeSports/
├── index.html      # Main HTML file
├── styles.css      # CSS styling and responsive design
├── app.js          # JavaScript functionality and mock data
└── README.md       # This documentation
```

## Features in Detail

### Search Functionality
- **ZIP Code Validation**: Ensures 5-digit format
- **Distance Calculation**: Uses Haversine formula for accurate distances
- **Smart Filtering**: Shows events within 50 miles radius
- **Distance Sorting**: Results ordered by proximity

### User Interface
- **Modern Design**: Clean, professional interface with gradient backgrounds
- **Responsive Layout**: Adapts to all screen sizes
- **Interactive Elements**: Hover effects and smooth animations
- **Error Handling**: Clear feedback for invalid inputs or no results

### Event Information
Each event displays:
- Event title and sport type
- Date and time
- Venue name and full address
- Calculated distance from your ZIP code

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Future Enhancements

- Real API integration for live event data
- More sports and event types
- Advanced filtering (date range, sport type, price)
- User favorites and bookmarking
- Map integration for visual location display
