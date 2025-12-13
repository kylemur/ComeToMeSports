# ComeToMeSports
**Advanced Sports Event Discovery Platform** - Find college and professional sporting events near you with comprehensive filtering, interactive mapping, and personalized preferences.

## 🚀 **Key Features**

### **🔍 Smart Event Search**
- **ZIP Code Search** - Enter your 5-digit ZIP code for instant nearby events
- **City & State Search** - Search by city name and state for broader coverage
- **Distance Filtering** - Customizable radius from 1-500 miles
- **Real-time Results** - Fast, responsive search with loading animations

### **🏆 Comprehensive Sports Coverage**
- **College Sports** - 50+ major universities with extensive sport selection
- **NFL Integration** - All 32 NFL teams with live game data via Ticketmaster API
- **70+ Sports** - From Football and Basketball to Curling and Cricket
- **Gender-Neutral Options** - Both general (Hockey) and specific (Men's/Women's Hockey) filters

### **🗺️ Interactive Map Experience** 
- **Live Event Mapping** - Leaflet.js powered interactive maps
- **Sport-Specific Icons** - 30+ custom emoji markers (🏈, 🏀, ⚾, 🏒, etc.)
- **Offline Support** - Service worker enables offline map functionality
- **Event Popups** - Detailed event information with distance and venue details

### **⚙️ User Preferences & Personalization**
- **Saved Settings** - Favorite university, default ZIP code, search preferences
- **localStorage Integration** - Preferences persist across browser sessions
- **Settings Panel** - Easy-to-use modal for preference management
- **Smart Defaults** - Intelligent default values for optimal user experience

### **📅 Advanced Date Filtering**
- **Date Range Selection** - Filter events by start and end dates
- **Smart Validation** - Prevents invalid date combinations
- **Auto-correction** - Automatically adjusts invalid date ranges
- **Flexible Defaults** - Current date to 3 months ahead

## 🎯 **How to Use**
Go to [https://kylemur.github.io/ComeToMeSports/](https://kylemur.github.io/ComeToMeSports/) or open `index.html` in your browser.

### **Quick Start**
1. **Open the Application**: Launch `index.html` in your web browser
2. **Choose Event Type**: Select between College Sports or NFL
3. **Select Filters**: Pick university, sport, and date range
4. **Search Location**: Enter ZIP code or city/state  
5. **Set Distance**: Choose your preferred search radius
6. **Find Events**: Click "Find Events" for instant results
7. **View Results**: Browse events in list view or interactive map

### **Pro Tips**
- **Save Preferences**: Use the ⚙️ Settings button to save your favorite university and default ZIP
- **Try Map View**: Toggle to map view to see event locations visually
- **Use Date Filters**: Set specific date ranges for targeted event discovery
- **Explore Sports**: Try gender-neutral options like "Basketball" for broader results

## 🛠️ **Installation & Setup**

### **Option 1: Direct Browser Access**
```bash
# Simply open the file directly
open index.html  # macOS
start index.html # Windows
```

### **Option 2: Local Web Server** (Recommended)
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

### **Option 3: VS Code Live Server**
Install the Live Server extension and right-click `index.html` → "Open with Live Server"

## 📁 **Project Structure**

```
ComeToMeSports/
├── index.html                    # Main application interface
├── styles.css                    # Responsive styling and animations  
├── app.js                        # Core application logic
├── sw.js                         # Service worker for offline functionality
├── helperFunctions/
│   ├── mapManager.js             # Leaflet.js map management
│   ├── TicketmasterAPI.js        # Live NFL game data integration
│   ├── zipCoords.js              # ZIP code coordinate lookup
│   ├── cityCoords.js             # City coordinate resolution
│   ├── scrapeBYU.js              # BYU sports data collection
│   ├── scrapeBSU.js              # Boise State data collection
│   └── StubHubAPI.js             # Alternative ticket data source
├── sportsData/                   # Local event data storage
├── ZIPCodes/
│   └── uszips.csv                # US ZIP code database
└── images/
    └── CTMS_ComeToMeSports_crop.png # Application logo
```

## 🏢 **Supported Institutions**

### **College Sports** (50+ Universities)
- **Major Conferences**: SEC, Big Ten, Pac-12, Big 12, ACC
- **Popular Schools**: Alabama, Ohio State, Texas, USC, Notre Dame, BYU
- **Custom Entry**: "Other" option for unlisted universities

### **Professional Sports**
- **NFL**: All 32 teams with live Ticketmaster integration

## 🌐 **Browser Compatibility**

| Browser | Status | Notes |
|---------|--------|--------|
| Chrome | ✅ Full Support | Recommended for best performance |
| Firefox | ✅ Full Support | All features working |
| Safari | ✅ Full Support | iOS and macOS compatible |
| Edge | ✅ Full Support | Windows optimized |
| Mobile | ✅ Responsive | Optimized mobile experience |

## 🔧 **Technical Implementation**

### **Frontend Technologies**
- **Vanilla JavaScript** - No framework dependencies
- **HTML5 & CSS3** - Modern web standards
- **Leaflet.js** - Interactive mapping
- **localStorage API** - Client-side data persistence
- **Service Worker** - Offline functionality

### **API Integrations**
- **Ticketmaster Discovery API** - Live NFL and university event data
- **Custom Data Sources** - BYU and Boise State scraped data
- **Coordinate Services** - ZIP code and city geolocation

### **Key Features**
- **Responsive Design** - Mobile-first CSS approach
- **Error Handling** - Comprehensive user feedback
- **Performance Optimized** - Efficient data loading and caching
- **Accessibility** - Proper semantic HTML and ARIA labels

## 🎮 **Advanced Features**

### **Map Functionality**
- **Interactive Controls** - Zoom, pan, fit to bounds
- **Offline Preparation** - Pre-cache tiles for offline use
- **Custom Markers** - Sport-specific emoji icons
- **Event Clustering** - Organized display of nearby events

### **User Experience**
- **Auto-complete** - Smart input suggestions
- **Real-time Validation** - Instant feedback on form inputs
- **Loading States** - Smooth transitions and progress indicators
- **Error Recovery** - Graceful handling of network issues

### **Data Management**
- **Smart Caching** - Efficient data storage and retrieval
- **Fallback Support** - Multiple data sources for reliability
- **Date Intelligence** - Automatic timezone and date handling

## 🚀 **Future Roadmap**

- **Enhanced Professional Sports** - NBA, MLB, NHL, MLS, etc. integration
- **Ticket Pricing** - Real-time pricing and availability
- **Social Features** - Event sharing and group planning
- **Advanced Analytics** - Event popularity and trends
- **Calendar Integration** - Export events to personal calendars
- **Push Notifications** - Event reminders and updates

## 📝 **License & Contributing**

This project is open source and available for educational and personal use. Contributions welcome!

---

**ComeToMeSports** - *Your ultimate sports event discovery platform* 🏟️
