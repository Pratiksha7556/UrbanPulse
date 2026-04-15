import { Anomaly, PollutionSource } from "../types";
import { getAirQualityData } from "./openaqService"; // use your existing service

// Convert AQI data into Pollution Sources
export const getPollutionSources = async (
  lat: number,
  lng: number,
): Promise<PollutionSource[]> => {
  try {
    const data = await getAirQualityData(lat, lng);

    if (!data || !data.components) return [];

    const components = data.components;

    return [
      {
        id: "pm25",
        source: "Dust",
        value: components.pm25 || 0,
        color: "#ef4444",
        trend: "stable",
      },
      {
        id: "pm10",
        source: "Dust",
        value: components.pm10 || 0,
        color: "#f97316",
        trend: "stable",
      },
      {
        id: "no2",
        source: "Traffic",
        value: components.no2 || 0,
        color: "#3b82f6",
        trend: "stable",
      },
      {
        id: "o3",
        source: "Industrial",
        value: components.o3 || 0,
        color: "#22c55e",
        trend: "stable",
      },
    ];
  } catch (error) {
    console.error("Pollution source fetch failed:", error);
    return [];
  }
};

// Detect anomalies based on real AQI thresholds
export const detectAnomalies = async (
  lat: number,
  lng: number,
): Promise<Anomaly[]> => {
  try {
    const data = await getAirQualityData(lat, lng);

    if (!data) return [];

    const anomalies: Anomaly[] = [];
    const now = new Date();

    const aqi = data.aqi;
    const comp = data.components;

    // 🚨 AQI Spike
    if (aqi > 200) {
      anomalies.push({
        id: "aqi-high",
        title: "Critical AQI Level",
        description: `AQI is dangerously high (${aqi}). Avoid outdoor exposure.`,
        severity: "high",
        timestamp: now,
        metric: "AQI",
      });
    } else if (aqi > 120) {
      anomalies.push({
        id: "aqi-medium",
        title: "Moderate Pollution",
        description: `AQI is elevated (${aqi}). Sensitive groups should take precautions.`,
        severity: "medium",
        timestamp: now,
        metric: "AQI",
      });
    }

    // 🚨 PM2.5 anomaly
    if (comp.pm25 > 100) {
      anomalies.push({
        id: "pm25-alert",
        title: "High PM2.5 Levels",
        description: `PM2.5 concentration is very high (${comp.pm25}).`,
        severity: "high",
        timestamp: now,
        metric: "AQI",
      });
    }

    // 🚨 NO2 anomaly
    if (comp.no2 > 80) {
      anomalies.push({
        id: "no2-alert",
        title: "NO₂ Spike Detected",
        description: `Nitrogen dioxide levels are elevated (${comp.no2}). Likely traffic congestion.`,
        severity: "medium",
        timestamp: now,
        metric: "Traffic",
      });
    }

    // 🚨 Ozone anomaly
    if (comp.o3 > 100) {
      anomalies.push({
        id: "o3-alert",
        title: "Ozone Level High",
        description: `Ozone levels are high (${comp.o3}). Avoid outdoor activity.`,
        severity: "medium",
        timestamp: now,
        metric: "AQI",
      });
    }

    return anomalies;
  } catch (error) {
    console.error("Anomaly detection failed:", error);
    return [];
  }
};
