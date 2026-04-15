import { ZoneData, Coordinate, WeeklyStat, ExposureLog } from "../types";
import { reverseGeocodeDetailed } from "./tomtomService";

// --- Configuration ---
const PROXY_BASE = "https://allorigins.hexlet.app/get?url=";
const API_URL = "https://api.openaq.org/v2";
const FETCH_TIMEOUT_MS = 20000;

// --- AQI Calculation ---
export const calculateAQI = (pm25: number): number => {
  if (pm25 < 0) return 0;
  if (pm25 <= 12.0) return Math.round((50 / 12.0) * pm25);
  if (pm25 <= 35.4)
    return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
  if (pm25 <= 55.4)
    return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
  if (pm25 <= 150.4)
    return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
  if (pm25 <= 250.4)
    return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
  return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301);
};

const classifyZone = (aqi: number) => {
  if (aqi < 50) return "safe_zone";
  if (aqi < 100) return "safety";
  if (aqi < 150) return "congestion";
  return "pollution";
};

// --- Deterministic fallback (NO RANDOM) ---
const generateFallbackZones = async (
  center: Coordinate,
): Promise<ZoneData[]> => {
  const fallbackPoints = [
    { lat: center.lat + 0.02, lng: center.lng },
    { lat: center.lat - 0.02, lng: center.lng },
    { lat: center.lat, lng: center.lng + 0.02 },
  ];

  const zones = await Promise.all(
    fallbackPoints.map(async (p, i) => {
      const name = await reverseGeocodeDetailed(p.lat, p.lng);

      const aqi = 120; // constant safe fallback

      return {
        id: `fallback-${i}`,
        name,
        type: classifyZone(aqi),
        coordinates: p,
        radius: 1500,
        severity: Math.round((aqi / 300) * 100),
        aqi,
        noiseLevel: 60,
        trafficSpeed: 35,
        description: `Estimated Air Quality at ${name}`,
        details: "Fallback Data (No Sensor Available)",
      } as ZoneData;
    }),
  );

  return zones;
};

// --- Real-Time Data ---
export const fetchRealTimeAirQuality = async (
  center: Coordinate,
): Promise<ZoneData[]> => {
  if (!center || typeof center.lat !== "number") return [];

  const params = new URLSearchParams({
    coordinates: `${center.lat},${center.lng}`,
    radius: "100000",
    limit: "10",
    parameter: "pm25",
  });

  const url = `${PROXY_BASE}${encodeURIComponent(`${API_URL}/latest?${params}`)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Proxy Error");

    const proxyData = await response.json();
    const data = JSON.parse(proxyData.contents || "{}");

    if (!data.results?.length) {
      return await generateFallbackZones(center);
    }

    const zones = data.results
      .map((loc: any) => {
        const measurement = loc.measurements?.find(
          (m: any) => m.parameter === "pm25",
        );
        if (!measurement) return null;

        const aqi = calculateAQI(measurement.value);

        return {
          id: `openaq-${loc.id}`,
          name: loc.location || loc.city || `Station ${loc.id}`,
          type: classifyZone(aqi),
          coordinates: {
            lat: loc.coordinates.latitude,
            lng: loc.coordinates.longitude,
          },
          radius: 2000,
          severity: Math.round((aqi / 300) * 100),
          aqi,
          noiseLevel: 50 + Math.round(aqi * 0.1),
          trafficSpeed: Math.max(10, 60 - Math.round(aqi * 0.15)),
          description: `Live Sensor: ${loc.city || "Unknown"}`,
          details: `Updated: ${new Date(measurement.lastUpdated).toLocaleTimeString()}`,
        } as ZoneData;
      })
      .filter(Boolean);

    return zones.length ? zones : await generateFallbackZones(center);
  } catch (error) {
    console.warn("Air Quality Fetch Failed:", error);
    return await generateFallbackZones(center);
  }
};

// --- Weekly Trend ---
export const getWeeklyAirQualityTrend = async (
  lat: number,
  lng: number,
): Promise<WeeklyStat[]> => {
  const date = new Date();
  date.setDate(date.getDate() - 7);

  const params = new URLSearchParams({
    coordinates: `${lat},${lng}`,
    radius: "100000",
    limit: "100",
    parameter: "pm25",
    date_from: date.toISOString(),
    order_by: "date",
    sort: "asc",
  });

  const url = `${PROXY_BASE}${encodeURIComponent(`${API_URL}/measurements?${params}`)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error();

    const proxyData = await response.json();
    const data = JSON.parse(proxyData.contents || "{}");

    const results = data.results || [];

    if (!results.length) throw new Error("No data");

    const map = new Map<string, { sum: number; count: number }>();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    results.forEach((r: any) => {
      const d = new Date(r.date.utc);
      const day = days[d.getDay()];

      if (!map.has(day)) map.set(day, { sum: 0, count: 0 });

      const entry = map.get(day)!;
      entry.sum += r.value;
      entry.count++;
    });

    return days.map((day) => {
      const entry = map.get(day);
      const avg = entry ? entry.sum / entry.count : 20;

      const aqi = calculateAQI(avg);

      return {
        day,
        aqi,
        traffic: Math.min(100, Math.round(aqi * 0.4 + 20)),
      };
    });
  } catch {
    // deterministic fallback
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      aqi: 100,
      traffic: 50,
    }));
  }
};

// --- Historical AQI ---
export const getHistoricalAQI = async (
  lat: number,
  lng: number,
  days: number = 30,
): Promise<ExposureLog[]> => {
  const date = new Date();
  date.setDate(date.getDate() - days);

  const params = new URLSearchParams({
    coordinates: `${lat},${lng}`,
    radius: "100000",
    limit: "200",
    parameter: "pm25",
    date_from: date.toISOString(),
    order_by: "date",
    sort: "asc",
  });

  const url = `${PROXY_BASE}${encodeURIComponent(`${API_URL}/measurements?${params}`)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error();

    const proxyData = await response.json();
    const data = JSON.parse(proxyData.contents || "{}");

    const results = data.results || [];

    if (!results.length) throw new Error();

    return results.map((r: any) => {
      const aqi = calculateAQI(r.value);

      return {
        date: new Date(r.date.utc).toISOString().split("T")[0],
        averageAqi: aqi,
        peakAqi: aqi,
        hoursExposed: 2,
        score: Math.max(0, 100 - aqi / 3),
      };
    });
  } catch {
    // deterministic fallback
    return Array.from({ length: days })
      .map((_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
        averageAqi: 100,
        peakAqi: 120,
        hoursExposed: 2,
        score: 70,
      }))
      .reverse();
  }
};
