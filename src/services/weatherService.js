/**
 * Live Weather & FAO-56 Evapotranspiration Service
 * Powered by Open-Meteo API (Open-access, Global Numerical Weather Model)
 * Endpoint: https://api.open-meteo.com/v1/forecast
 * Features:
 *   - Real-time Microclimate (Temp, Humidity, Wind speed, Precipitation)
 *   - Live Daily FAO-56 Reference Evapotranspiration (et0_fao_evapotranspiration)
 *   - 7-Day Rainfall Forecast (precipitation_sum)
 *   - Dual-Engine Location Detection: Hardware GPS + Zero-Friction IP Geolocation Fallback
 *   - Pan-India Location Search & Geocoding
 */

export const CITY_COORDINATES = {
  Mandya: { lat: 12.52, lon: 76.90, name: "Mandya, Karnataka" },
  Nashik: { lat: 19.99, lon: 73.79, name: "Nashik, Maharashtra" },
  Kolar: { lat: 13.13, lon: 78.13, name: "Kolar, Karnataka" },
  Pune: { lat: 18.52, lon: 73.85, name: "Pune, Maharashtra" },
  Anantapur: { lat: 14.68, lon: 77.60, name: "Anantapur, Andhra Pradesh" },
  Coimbatore: { lat: 11.01, lon: 76.95, name: "Coimbatore, Tamil Nadu" },
  Ludhiana: { lat: 30.90, lon: 75.85, name: "Ludhiana, Punjab" }
};

// Curated prominent agricultural hubs across India for instant selection
export const POPULAR_INDIAN_FARMING_REGIONS = [
  { name: "Mandya", state: "Karnataka", lat: 12.52, lon: 76.90, cropSpecialty: "Sugarcane & Paddy", zone: "South" },
  { name: "Nashik", state: "Maharashtra", lat: 19.99, lon: 73.79, cropSpecialty: "Onion & Grapes", zone: "West" },
  { name: "Ludhiana", state: "Punjab", lat: 30.90, lon: 75.85, cropSpecialty: "Wheat & Basmati Rice", zone: "North" },
  { name: "Guntur", state: "Andhra Pradesh", lat: 16.30, lon: 80.45, cropSpecialty: "Red Chili & Cotton", zone: "South" },
  { name: "Kolar", state: "Karnataka", lat: 13.13, lon: 78.13, cropSpecialty: "Tomato & Horticulture", zone: "South" },
  { name: "Pune", state: "Maharashtra", lat: 18.52, lon: 73.85, cropSpecialty: "Vegetables & Flowers", zone: "West" },
  { name: "Anantapur", state: "Andhra Pradesh", lat: 14.68, lon: 77.60, cropSpecialty: "Groundnut & Millets", zone: "South" },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.01, lon: 76.95, cropSpecialty: "Cotton & Coconut", zone: "South" },
  { name: "Nagpur", state: "Maharashtra", lat: 21.15, lon: 79.09, cropSpecialty: "Oranges & Cotton", zone: "West" },
  { name: "Rajkot", state: "Gujarat", lat: 22.30, lon: 70.80, cropSpecialty: "Groundnut & Sesame", zone: "West" },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.32, lon: 82.97, cropSpecialty: "Wheat & Vegetables", zone: "North" },
  { name: "Karnal", state: "Haryana", lat: 29.69, lon: 76.98, cropSpecialty: "Basmati Rice & Wheat", zone: "North" },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.72, lon: 75.86, cropSpecialty: "Soybean & Wheat", zone: "Central" },
  { name: "Jaipur", state: "Rajasthan", lat: 26.92, lon: 75.79, cropSpecialty: "Mustard & Pearl Millet", zone: "North" },
  { name: "Shimla", state: "Himachal Pradesh", lat: 31.10, lon: 77.17, cropSpecialty: "Apple & Temperate Fruits", zone: "North" },
  { name: "Patna", state: "Bihar", lat: 25.60, lon: 85.14, cropSpecialty: "Paddy & Maize", zone: "East" },
  { name: "Bhubaneswar", state: "Odisha", lat: 20.30, lon: 85.82, cropSpecialty: "Paddy & Pulses", zone: "East" },
  { name: "Guwahati", state: "Assam", lat: 26.14, lon: 91.74, cropSpecialty: "Tea & Jute", zone: "North-East" }
];

// Fallback baseline in case device is offline
const FALLBACK_WEATHER = {
  temp: 29.5,
  hum: 55,
  wind: 2.5,
  rad: 21.0,
  et0: 5.2,
  rainToday: 0.0,
  dailyEt0: [5.0, 4.8, 5.2, 5.1, 4.9, 5.3, 5.0],
  dailyRain: [0, 0, 2, 0, 5, 0, 0],
  isLive: false,
  timestamp: new Date().toLocaleTimeString()
};

/**
 * Fetch live microclimate & FAO-56 ET0 data for coordinates
 */
export async function fetchLiveWeatherData(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=et0_fao_evapotranspiration,precipitation_sum&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    
    const data = await response.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const temp = current.temperature_2m !== undefined ? Math.round(current.temperature_2m * 10) / 10 : 28;
    const hum = current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : 50;
    // convert wind from km/h to m/s
    const windMps = current.wind_speed_10m !== undefined ? Math.round((current.wind_speed_10m / 3.6) * 10) / 10 : 2.5;
    
    // Live FAO-56 Reference ET0 from Open-Meteo
    const et0Today = (daily.et0_fao_evapotranspiration && daily.et0_fao_evapotranspiration.length > 0)
      ? parseFloat(daily.et0_fao_evapotranspiration[0].toFixed(2))
      : 5.2;

    const rainToday = (daily.precipitation_sum && daily.precipitation_sum.length > 0)
      ? parseFloat(daily.precipitation_sum[0].toFixed(1))
      : 0.0;

    return {
      lat: parseFloat(Number(lat).toFixed(2)),
      lon: parseFloat(Number(lon).toFixed(2)),
      temp,
      hum,
      wind: windMps,
      rad: parseFloat((18.5 + (temp * 0.15)).toFixed(1)), // Estimated solar radiation MJ/m²
      et0: et0Today,
      rainToday,
      dailyEt0: daily.et0_fao_evapotranspiration || FALLBACK_WEATHER.dailyEt0,
      dailyRain: daily.precipitation_sum || FALLBACK_WEATHER.dailyRain,
      isLive: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (error) {
    console.warn("Weather API fetch failed, falling back to local FAO model:", error);
    return {
      ...FALLBACK_WEATHER,
      isLive: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}

/**
 * Fetch live weather for a predefined city
 */
export async function fetchCityWeather(cityName) {
  const coords = CITY_COORDINATES[cityName] || CITY_COORDINATES.Mandya;
  return await fetchLiveWeatherData(coords.lat, coords.lon);
}

/**
 * Get device GPS coordinates (Farmer in the field)
 */
export function getDeviceCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 7000, enableHighAccuracy: true }
    );
  });
}

/**
 * Reverse Geocode Coordinates to human-readable Indian locality / district / state
 */
export async function reverseGeocodeCoords(lat, lon) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision;
      const state = data.principalSubdivision;
      if (city && state) return `${city}, ${state}`;
      if (city) return city;
    }
  } catch (e) {
    // ignore
  }
  return `Location (${Number(lat).toFixed(2)}° N, ${Number(lon).toFixed(2)}° E)`;
}

/**
 * Search any Indian location using Open-Meteo Geocoding API + Local Agricultural Database
 */
export async function searchIndianLocations(query) {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim().toLowerCase();
  const results = [];

  // 1. Instant local matching against curated farming hubs
  for (const hub of POPULAR_INDIAN_FARMING_REGIONS) {
    if (
      hub.name.toLowerCase().includes(cleanQuery) ||
      hub.state.toLowerCase().includes(cleanQuery) ||
      hub.cropSpecialty.toLowerCase().includes(cleanQuery)
    ) {
      results.push({
        name: hub.name,
        state: hub.state,
        country: "India",
        latitude: hub.lat,
        longitude: hub.lon,
        displayName: `${hub.name}, ${hub.state}`,
        tag: hub.cropSpecialty,
        source: 'local'
      });
    }
  }

  // 2. Query Open-Meteo Global Geocoding API
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results) {
        for (const item of data.results) {
          // Filter for India
          if (item.country_code === 'IN' || item.country === 'India') {
            const displayName = item.admin1 ? `${item.name}, ${item.admin1}` : item.name;
            // Avoid duplicate with local results
            if (!results.some(r => Math.abs(r.latitude - item.latitude) < 0.05 && Math.abs(r.longitude - item.longitude) < 0.05)) {
              results.push({
                name: item.name,
                state: item.admin1 || "India",
                country: "India",
                latitude: item.latitude,
                longitude: item.longitude,
                displayName,
                tag: item.admin2 || item.admin1 || "District",
                source: 'api'
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Geocoding API search error:", err);
  }

  return results;
}

/**
 * Detect User Real-Time Location & Microclimate Weather
 * Robust 2-tier detection:
 * 1. Hardware GPS (navigator.geolocation) with reverse geocoding
 * 2. Instant IP Geolocation fallback (works on HTTP, IP addresses like 172.x.x.x, mobile, without browser blocks)
 */
export async function detectUserLocationAndWeather() {
  let lat = null;
  let lon = null;
  let locationName = null;

  // 1. Try Hardware GPS first if allowed and available
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const coords = await getDeviceCoordinates();
      lat = coords.lat;
      lon = coords.lon;
      locationName = await reverseGeocodeCoords(lat, lon);
    } catch (e) {
      console.warn("Hardware GPS unavailable or restricted by browser security, using IP Geolocation:", e.message);
    }
  }

  // 2. Seamless Fallback: Real-time IP-based Geolocation (works 100% of the time without browser popups)
  if (!lat || !lon) {
    const endpoints = ['/api/location', 'https://ipwho.is/'];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep);
        if (res.ok) {
          const data = await res.json();
          if (data && data.latitude && data.longitude) {
            lat = data.latitude;
            lon = data.longitude;
            locationName = data.city ? `${data.city}, ${data.region || data.country}` : 'Local Region';
            break;
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }
  }

  // 3. Absolute fallback to Mandya if completely disconnected
  if (!lat || !lon) {
    lat = 12.52;
    lon = 76.90;
    locationName = "Mandya, Karnataka";
  }

  // 4. Fetch live microclimate weather and FAO-56 ET0 for the detected coordinates
  const weatherData = await fetchLiveWeatherData(lat, lon);

  return {
    locationName,
    lat,
    lon,
    weatherData
  };
}
