import { useState, useEffect, useRef, useCallback } from "react";
import {
  ZoneData,
  Incident,
  Resource,
  Anomaly,
  Coordinate,
  WeeklyStat,
} from "../types";
import {
  fetchRealTimeAirQuality,
  getWeeklyAirQualityTrend,
} from "../services/openaqService";
import {
  fetchFlowSegmentData,
  reverseGeocodeTomTom,
} from "../services/tomtomService";

interface LiveDataState {
  zones: ZoneData[];
  incidents: Incident[];
  resources: Resource[];
  weeklyStats: WeeklyStat[];
  currentCity: string;
  loading: boolean;
  error: string | null;
  lastUpdated: Date;
  alerts: Anomaly[];
  currentTrafficSpeed: number | null;
}

export const useLiveData = (center: Coordinate) => {
  const [data, setData] = useState<LiveDataState>({
    zones: [],
    incidents: [],
    resources: [],
    weeklyStats: [],
    currentCity: "Locating...",
    loading: true,
    error: null,
    lastUpdated: new Date(),
    alerts: [],
    currentTrafficSpeed: null,
  });

  const isMounted = useRef(true);

  // -------------------------------
  // ✅ SAFE FETCH WRAPPER
  // -------------------------------
  const safeFetch = async <T>(
    fn: () => Promise<T>,
    fallback: T,
  ): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      console.warn("API failed:", e);
      return fallback;
    }
  };

  // -------------------------------
  // ✅ MAIN REFRESH
  // -------------------------------
  const refreshData = useCallback(async () => {
    if (!center?.lat || !center?.lng) return;

    try {
      // 🔹 Fetch city (fast)
      const cityName = await safeFetch(
        () => reverseGeocodeTomTom(center.lat, center.lng),
        "Unknown Location",
      );

      // 🔹 Parallel API calls (safe)
      const [aqiZones, historyStats, flowData] =
        await Promise.all([
          safeFetch(() => fetchRealTimeAirQuality(center), []),
          safeFetch(() => getWeeklyAirQualityTrend(center.lat, center.lng), []),
          safeFetch(() => fetchFlowSegmentData(center.lat, center.lng), null),
        ]);

      const trafficIncidents = [];

      // -------------------------------
      // ✅ ALERT ENGINE (DEDUP SAFE)
      // -------------------------------
      const newAlerts: Anomaly[] = [];

      aqiZones.forEach((z) => {
        if (z.aqi > 150) {
          newAlerts.push({
            id: `aqi-${z.id}`,
            title: `Hazardous Air: ${z.name}`,
            description: `AQI ${z.aqi} detected.`,
            severity: z.aqi > 200 ? "high" : "medium",
            timestamp: new Date(),
            metric: "AQI",
            zoneId: z.id,
          });
        }
      });

      const speed = flowData?.currentSpeed ?? null;

      if (speed !== null && speed < 20) {
        newAlerts.push({
          id: `traffic-low-speed`,
          title: "Heavy Traffic",
          description: `Speed dropped to ${speed} km/h`,
          severity: "medium",
          timestamp: new Date(),
          metric: "Traffic",
        });
      }

      // -------------------------------
      // ✅ STATE UPDATE
      // -------------------------------
      if (isMounted.current) {
        setData((prev: any) => ({
          ...prev,
          zones: aqiZones,
          incidents: [],
          resources: [],
          weeklyStats: historyStats,
          currentCity: cityName,
          loading: false,
          error: null,
          lastUpdated: new Date(),
          alerts: newAlerts,
          currentTrafficSpeed: speed,
        }));
      }
    } catch (err) {
      console.error("Live Data Error:", err);

      if (isMounted.current) {
        setData((prev: any) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch live data",
        }));
      }
    }
  }, [center]);

  // -------------------------------
  // ✅ INITIAL LOAD
  // -------------------------------
  useEffect(() => {
    isMounted.current = true;
    refreshData();

    return () => {
      isMounted.current = false;
    };
  }, [refreshData]);

  // -------------------------------
  // ✅ POLLING (REAL-TIME)
  // -------------------------------
  useEffect(() => {
    const interval = setInterval(refreshData, 60000); // 60s

    return () => clearInterval(interval);
  }, [refreshData]);

  return { ...data, refreshData };
};
