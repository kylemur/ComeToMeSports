// This script loads uszips.csv using PapaParse and provides a browser-compatible getCoordinatesForZip function.
// It expects PapaParse to be loaded via CDN in index.html.

let zipToCoords = {};
let zipCoordsLoaded = false;

function loadZipCoords(callback) {
    if (zipCoordsLoaded) {
        callback();
        return;
    }
    Papa.parse('../ZIPCodes/uszips.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            results.data.forEach(row => {
                const zip = row.zip;
                const lat = parseFloat(row.lat);
                const lng = parseFloat(row.lng);
                if (zip && !isNaN(lat) && !isNaN(lng)) {
                    zipToCoords[zip] = { lat, lng };
                }
            });
            zipCoordsLoaded = true; // set before callback
            if (typeof callback === 'function') callback();
        }
    });
}

function getCoordinatesForZip(zipCode) {
    return zipToCoords[zipCode] || null;
}
