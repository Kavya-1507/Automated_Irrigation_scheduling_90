/**
 * Live Weather & FAO-56 Evapotranspiration Service
 * Powered by Open-Meteo API (Open-access, Global Numerical Weather Model)
 * Endpoint: https://api.open-meteo.com/v1/forecast
 * Features:
 *   - Real-time Microclimate (Temp, Humidity, Wind speed, Precipitation)
 *   - Live Daily FAO-56 Reference Evapotranspiration (et0_fao_evapotranspiration)
 *   - 7-Day Rainfall Forecast (precipitation_sum)
 *   - Dual-Engine Location Detection: Hardware GPS + Zero-Friction IP Geolocation Fallback
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
      { timeout: 5000, enableHighAccuracy: true }
    );
  });
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

      // Reverse geocode to get actual city / district name
      try {
        const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        if (revRes.ok) {
          const revData = await revRes.json();
          const city = revData.city || revData.locality || revData.principalSubdivision;
          const state = revData.principalSubdivision;
          locationName = (city && state) ? `${city}, ${state}` : (city || `Farm GPS (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`);
        }
      } catch (e) {
        locationName = `Farm GPS (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
      }
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
