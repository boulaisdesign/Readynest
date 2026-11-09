// Live outdoor weather from Open-Meteo (free, no API key). Cached for 10 minutes.

const WMO = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Cloudy",
  45: "Fog", 48: "Freezing fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 56: "Freezing drizzle", 57: "Freezing drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm, hail", 99: "Thunderstorm, hail",
};

let cache = { at: 0, key: "", data: null };
export const _resetWeather = () => (cache = { at: 0, key: "", data: null });

/** Returns { now, high, low, text } in °C, or null if no location is set or the service is down. */
export async function outdoor(env) {
  const lat = Number(env.LAT), lon = Number(env.LON);
  if (!env.LAT || !env.LON || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const key = `${lat},${lon}`;
  if (cache.data && cache.key === key && Date.now() - cache.at < 600e3) return cache.data;
  try {
    const url = "https://api.open-meteo.com/v1/forecast?" + new URLSearchParams({
      latitude: lat, longitude: lon,
      current: "temperature_2m,weather_code",
      daily: "temperature_2m_max,temperature_2m_min",
      timezone: "auto", forecast_days: "1",
    });
    const r = await fetch(url, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (!r.ok) throw new Error();
    const j = await r.json();
    const data = {
      now: j.current?.temperature_2m ?? null,
      high: j.daily?.temperature_2m_max?.[0] ?? null,
      low: j.daily?.temperature_2m_min?.[0] ?? null,
      text: WMO[j.current?.weather_code] ?? "",
    };
    cache = { at: Date.now(), key, data };
    return data;
  } catch {
    return cache.data; // last good reading, or null
  }
}
