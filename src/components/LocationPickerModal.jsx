import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  Navigation, 
  Check, 
  Globe, 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  CloudRain, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Compass
} from 'lucide-react';
import L from 'leaflet';
import { 
  searchIndianLocations, 
  reverseGeocodeCoords, 
  fetchLiveWeatherData, 
  getDeviceCoordinates,
  POPULAR_INDIAN_FARMING_REGIONS 
} from '../services/weatherService';

export default function LocationPickerModal({
  isOpen,
  onClose,
  currentLocationName,
  currentCoords = { lat: 12.52, lon: 76.90 },
  onSelectLocation
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedCoords, setSelectedCoords] = useState(currentCoords);
  const [selectedName, setSelectedName] = useState(currentLocationName || 'Selected Location');
  const [previewWeather, setPreviewWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Manual input state
  const [manualLat, setManualLat] = useState(currentCoords.lat || 12.52);
  const [manualLon, setManualLon] = useState(currentCoords.lon || 76.90);

  // Custom emerald animated map pin
  const createPinIcon = (label = "🌾") => {
    return L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            width: 40px; 
            height: 40px; 
            background: linear-gradient(135deg, #10b981, #059669); 
            border: 2px solid #ffffff; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.7);
            font-size: 20px;
            animation: bounce 1.5s infinite;
          ">
            ${label}
          </div>
          <div style="
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent; 
            border-right: 6px solid transparent; 
            border-top: 8px solid #059669;
            margin-top: -1px;
          "></div>
        </div>
      `,
      iconSize: [40, 48],
      iconAnchor: [20, 48]
    });
  };

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const initialLat = selectedCoords.lat || 12.52;
      const initialLon = selectedCoords.lon || 76.90;

      if (!mapInstanceRef.current) {
        // Create Leaflet map centered at selected coords
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLon],
          zoom: 7,
          zoomControl: true
        });

        // Add dark styled CartoDB / OpenStreetMap tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        // Marker placement
        const marker = L.marker([initialLat, initialLon], {
          icon: createPinIcon(),
          draggable: true
        }).addTo(map);

        // Click on map to place pin
        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          handleUpdatePosition(lat, lng, true);
        });

        // Drag marker
        marker.on('dragend', async (e) => {
          const { lat, lng } = e.target.getLatLng();
          handleUpdatePosition(lat, lng, true);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } else {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.setView([initialLat, initialLon], 7);
        if (markerRef.current) {
          markerRef.current.setLatLng([initialLat, initialLon]);
        }
      }

      // Initial weather fetch for current coordinates
      fetchLocationTelemetry(initialLat, initialLon, selectedName);
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Clean up map when modal closes
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [isOpen]);

  // Update position helper
  const handleUpdatePosition = async (lat, lon, fetchName = true) => {
    const formattedLat = parseFloat(Number(lat).toFixed(4));
    const formattedLon = parseFloat(Number(lon).toFixed(4));

    setSelectedCoords({ lat: formattedLat, lon: formattedLon });
    setManualLat(formattedLat);
    setManualLon(formattedLon);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([formattedLat, formattedLon], Math.max(mapInstanceRef.current.getZoom(), 8), {
        duration: 0.8
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([formattedLat, formattedLon]);
      }
    }

    let locName = selectedName;
    if (fetchName) {
      locName = await reverseGeocodeCoords(formattedLat, formattedLon);
      setSelectedName(locName);
    }

    fetchLocationTelemetry(formattedLat, formattedLon, locName);
  };

  // Fetch telemetry for chosen location
  const fetchLocationTelemetry = async (lat, lon, name) => {
    setIsLoadingWeather(true);
    try {
      const data = await fetchLiveWeatherData(lat, lon);
      setPreviewWeather(data);
    } catch (err) {
      console.warn("Error fetching telemetry for preview:", err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Handle Search Input (Debounced)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchIndianLocations(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.warn("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Select item from search or quick hubs
  const handleSelectSearchResult = (item) => {
    setSelectedName(item.displayName || `${item.name}, ${item.state}`);
    setSearchQuery('');
    setSearchResults([]);
    handleUpdatePosition(item.latitude || item.lat, item.longitude || item.lon, false);
  };

  // Detect My Live GPS Location
  const handleDetectLiveGps = async () => {
    setIsDetectingGps(true);
    try {
      const coords = await getDeviceCoordinates();
      const locName = await reverseGeocodeCoords(coords.lat, coords.lon);
      setSelectedName(`📍 My Live Location (${locName})`);
      handleUpdatePosition(coords.lat, coords.lon, false);
    } catch (err) {
      alert("GPS detection failed or permission denied by browser. You can click on the map or search any city in India.");
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Manual Coordinate Submit
  const handleManualCoordsSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) return;
    handleUpdatePosition(lat, lon, true);
  };

  // Final Confirmation: Apply to Farm
  const handleConfirm = () => {
    if (onSelectLocation) {
      onSelectLocation({
        name: selectedName,
        lat: selectedCoords.lat,
        lon: selectedCoords.lon,
        weather: previewWeather
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Select Farm Location Across India</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                  Google Maps & GPS Telemetry
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Click anywhere on the map, search any Indian district, or fetch your device GPS.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Search, Map, and Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Search Bar & Live GPS Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            
            {/* Live Autocomplete Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any city, village, or district in India (e.g. Jaipur, Guntur, Shimla, Nashik, Mandya)..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900/90 border border-white/10 focus:border-emerald-500 text-sm text-white placeholder-zinc-500 focus:outline-none transition shadow-inner font-sans"
              />
              {isSearching && (
                <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 animate-spin" />
              )}

              {/* Autocomplete Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-white/5">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full px-4 py-2.5 text-left hover:bg-emerald-500/10 hover:border-l-4 hover:border-emerald-500 transition flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-white">{item.displayName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {item.latitude.toFixed(2)}° N, {item.longitude.toFixed(2)}° E • {item.tag || "India"}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fetch Device Live GPS Button */}
            <button
              onClick={handleDetectLiveGps}
              disabled={isDetectingGps}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
              <span>{isDetectingGps ? 'Detecting GPS...' : '📍 Fetch My Live GPS'}</span>
            </button>
          </div>

          {/* Quick Indian Farming Hub Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-blend">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1 flex-shrink-0">
              <Compass className="w-3 h-3 text-emerald-400" /> Top Farming Hubs:
            </span>
            {POPULAR_INDIAN_FARMING_REGIONS.map((hub) => (
              <button
                key={hub.name}
                onClick={() => handleSelectSearchResult({
                  name: hub.name,
                  state: hub.state,
                  latitude: hub.lat,
                  longitude: hub.lon,
                  displayName: `${hub.name}, ${hub.state}`
                })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 transition border ${
                  selectedName.includes(hub.name)
                    ? 'bg-emerald-500 text-black font-bold border-emerald-400'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={`${hub.name} (${hub.cropSpecialty})`}
              >
                {hub.name}
              </button>
            ))}
          </div>

          {/* Map Container & Interactive Pin */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-zinc-900 h-64 sm:h-80 w-full">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Floating Map Helper Badge */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Click or drag pin to select any farm</span>
            </div>
          </div>

          {/* Coordinates Fine-Tuning & Live Microclimate Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Selected Location Card & Manual Coords (Col 1) */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  Selected Farm Location
                </span>
                <div className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{selectedName}</span>
                </div>
                <div className="text-xs font-mono text-zinc-400 mt-1">
                  Latitude: {selectedCoords.lat.toFixed(4)}° N, Longitude: {selectedCoords.lon.toFixed(4)}° E
                </div>
              </div>

              {/* Manual Coord Fine Tuning */}
              <form onSubmit={handleManualCoordsSubmit} className="pt-2 border-t border-white/5 flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="Lat"
                  className="w-1/2 px-2 py-1 text-xs font-mono rounded bg-zinc-950 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  step="any"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  placeholder="Lon"
                  className="w-1/2 px-2 py-1 text-xs font-mono rounded bg-zinc-950 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white border border-white/10"
                >
                  Go
                </button>
              </form>
            </div>

            {/* Live Microclimate Telemetry Preview (Col 2 & 3) */}
            <div className="md:col-span-2 p-4 rounded-xl bg-zinc-900/70 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <RefreshCw className={`w-3 h-3 ${isLoadingWeather ? 'animate-spin text-emerald-400' : 'text-zinc-500'}`} />
                  Open-Meteo Satellite Live Telemetry Preview
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Real-Time Synced
                </span>
              </div>

              {previewWeather ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                    <div className="text-zinc-500 text-[10px] flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-amber-400" /> Temp
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">{previewWeather.temp}°C</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                    <div className="text-zinc-500 text-[10px] flex items-center gap-1">
                      <Activity className="w-3 h-3 text-cyan-400" /> Humidity
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">{previewWeather.hum}%</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                    <div className="text-zinc-500 text-[10px] flex items-center gap-1">
                      <Wind className="w-3 h-3 text-zinc-400" /> Wind Speed
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">{previewWeather.wind} m/s</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                    <div className="text-zinc-500 text-[10px] flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-emerald-400" /> Live ET₀
                    </div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">{previewWeather.et0} mm/d</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 font-mono py-3">Fetching satellite microclimate...</div>
              )}

              <div className="text-[11px] text-zinc-500 font-mono mt-2">
                * FAO-56 Reference Evapotranspiration (ET₀) is automatically calculated by Open-Meteo for these coordinates.
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-8 py-4 border-t border-white/10 bg-zinc-900/80 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 hidden sm:block">
            Target Coordinates: <span className="text-emerald-400 font-mono">{selectedCoords.lat.toFixed(4)}° N, {selectedCoords.lon.toFixed(4)}° E</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-black transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Apply Location to Farm</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
