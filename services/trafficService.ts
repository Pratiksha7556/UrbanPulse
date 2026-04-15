import { Incident, RouteOption } from "../types";

interface CongestionAnalysis {
  cause: string;
  delayMinutes: number;
}

// Helper: distance (approx in degrees)
const getDistance = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) => {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

// Check if incident lies near ANY point of route (not just start/end)
const isIncidentNearRoute = (
  route: RouteOption,
  incident: Incident,
): boolean => {
  if (!route.path?.length) return false;

  const threshold = 0.02; // ~2km

  // sample path (optimize)
  const step = Math.max(1, Math.floor(route.path.length / 30));

  for (let i = 0; i < route.path.length; i += step) {
    if (getDistance(route.path[i], incident.coordinates) < threshold) {
      return true;
    }
  }

  return false;
};

export const analyzeCongestionCause = (
  route: RouteOption,
  incidents: Incident[],
): CongestionAnalysis | null => {
  if (route.congestionLevel === "low") return null;

  // -------------------------------
  // ✅ 1. INCIDENT-BASED ANALYSIS
  // -------------------------------
  const matchingIncident = incidents.find((inc) =>
    isIncidentNearRoute(route, inc),
  );

  if (matchingIncident) {
    let delay = 0;
    let causePrefix = "";

    switch (matchingIncident.type) {
      case "accident":
        delay = 25; // deterministic realistic avg
        causePrefix = "Accident reported";
        break;

      case "closure":
        delay = 35;
        causePrefix = "Road closure";
        break;

      case "hazard":
        delay = 15;
        causePrefix = "Road hazard";
        break;

      default:
        delay = 10;
        causePrefix = "Traffic disruption";
    }

    return {
      cause: `${causePrefix}: ${matchingIncident.description}`,
      delayMinutes: delay,
    };
  }

  // -------------------------------
  // ✅ 2. TRAFFIC FLOW ANALYSIS
  // -------------------------------
  if (route.congestionLevel === "severe") {
    return {
      cause: "Traffic volume exceeds road capacity (bottleneck)",
      delayMinutes: 15,
    };
  }

  if (route.congestionLevel === "high") {
    return {
      cause: "Peak hour congestion",
      delayMinutes: 10,
    };
  }

  return null;
};
