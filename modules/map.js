/* =============================================
   modules/map.js — Leaflet.js integration,
   geocoding, geolocation (lazy-loaded)
   ============================================= */

(function() {
    'use strict';

    var leafletLoaded = false;
    var mapInstance = null;
    var markers = [];

    // ========== Lazy Load Leaflet ==========
    function loadLeaflet() {
        return new Promise(function(resolve, reject) {
            if (leafletLoaded) {
                resolve();
                return;
            }

            // Check if already loaded by another source
            if (window.L) {
                leafletLoaded = true;
                resolve();
                return;
            }

            // Load CSS
            var cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(cssLink);

            // Load JS
            var jsScript = document.createElement('script');
            jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            jsScript.onload = function() {
                leafletLoaded = true;
                resolve();
            };
            jsScript.onerror = function() {
                reject(new Error('Failed to load Leaflet.js'));
            };
            document.head.appendChild(jsScript);
        });
    }

    // ========== Geocode with Nominatim ==========
    function geocode(query) {
        var url = 'https://nominatim.openstreetmap.org/search?format=json&q=' +
            encodeURIComponent(query) + '&limit=10&addressdetails=1';

        return fetch(url, {
            headers: { 'Accept-Language': 'en' }
        })
        .then(function(resp) { return resp.json(); })
        .catch(function() {
            return [];
        });
    }

    // ========== Render Map ==========
    function renderMap(results, centerLat, centerLon) {
        var container = document.getElementById('mapContainer');
        var resultsDiv = document.getElementById('mapResults');

        if (!container || !window.L) return;

        // Destroy previous map
        destroy();

        // Create map
        var lat = centerLat || (results.length > 0 ? parseFloat(results[0].lat) : 51.505);
        var lon = centerLon || (results.length > 0 ? parseFloat(results[0].lon) : -0.09);

        mapInstance = window.L.map(container).setView([lat, lon], 13);

        // Add tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapInstance);

        // Add markers and results list
        markers = [];
        resultsDiv.innerHTML = '';

        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="widget-empty" style="padding:20px;">No results found.</div>';
            return;
        }

        for (var i = 0; i < results.length; i++) {
            (function(result, index) {
                var mLat = parseFloat(result.lat);
                var mLon = parseFloat(result.lon);
                var marker = window.L.marker([mLat, mLon]).addTo(mapInstance);
                marker.bindPopup('<strong>' + result.display_name + '</strong>');
                markers.push({ marker: marker, lat: mLat, lon: mLon });

                // List item
                var item = document.createElement('div');
                item.className = 'map-result-item';
                item.innerHTML = '<div class="map-result-name">' + escapeHtml(result.display_name.split(',').slice(0, 2).join(', ')) + '</div>' +
                    '<div class="map-result-type">' + escapeHtml(result.type || 'place') + '</div>';
                item.addEventListener('click', function() {
                    mapInstance.panTo([mLat, mLon], { animate: true });
                    marker.openPopup();
                });
                resultsDiv.appendChild(item);
            })(results[i], i);
        }

        // Fit bounds if multiple results
        if (results.length > 1) {
            var group = window.L.featureGroup(markers.map(function(m) { return m.marker; }));
            mapInstance.fitBounds(group.getBounds().pad(0.2));
        }

        // Force recalc after layout
        setTimeout(function() {
            if (mapInstance) mapInstance.invalidateSize();
        }, 200);
    }

    // ========== Geolocation ==========
    function getUserLocation() {
        return new Promise(function(resolve, reject) {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                function(pos) {
                    resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                },
                function(err) {
                    reject(err);
                },
                { enableHighAccuracy: true, timeout: 10000
