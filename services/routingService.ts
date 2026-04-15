import { Coordinate, RouteOption, NavigationStep, ZoneData } from "../types";
import { fetchTomTomRoute } from "./tomtomService";

interface TomTomRouteResponse {
  routes: Array<{
    summary: {
      lengthInMeters: number;
      travelTimeInSeconds: number;
      trafficDelayInSeconds: number;
    };
    legs?: Array<{
      points: Array<{ latitude: number; longitude: number }>;
    }>;
    guidance?: {
      instructions?: TomTomInstruction[];
    };
  }>;
}

interface TomTomInstruction {
  message?: string;
  instructionType: string;
  routeOffsetInMeters: number;
  point: { latitude: number; longitude: number };
}

const mapTomTomManeuver = (
  instructionType: string,
): NavigationStep["maneuver"] => {
  const type = instructionType ? instructionType.toUpperCase() : "STRAIGHT";

  if (type.includes("LEFT")) {
    if (type.includes("EXIT")) return "fork";
    if (type.includes("KEEP")) return "bear-left";
    return "turn-left";
  }
  if (type.includes("RIGHT")) {
    if (type.includes("EXIT")) return "fork";
    if (type.includes("KEEP")) return "bear-right";
    return "turn-right";
  }

  if (type.includes("ROUNDABOUT")) return "roundabout";
  if (type === "U_TURN") return "uturn";
  if (type === "MERGE") return "merge";
  if (type === "LOCATION_ARRIVAL") return "arrive";
  if (type === "LOCATION_DEPARTURE") return "depart";

  return "straight";
};

const parseTaggedInstruction = (message: string): string => {
  if (!message) return "Follow route";
  return message
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// ✅ REAL AQI EXPOSURE CALCULATION
const calculateRouteExposure = (
  path: Coordinate[],
  zones: ZoneData[],
): number => {
  if (!path.length) return 0;
  if (!zones.length) return 50;

  let totalAqi = 0;
  let samples = 0;

  const samplingRate = Math.max(1, Math.floor(path.length / 50));

  for (let i = 0; i < path.length; i += samplingRate) {
    const point = path[i];
    samples++;

    let pointAqi = 50;

    for (const zone of zones) {
      const latDiff = point.lat - zone.coordinates.lat;
      const lngDiff = point.lng - zone.coordinates.lng;
      const zoneRadiusDeg = zone.radius / 111000;

      const distSquared = latDiff * latDiff + lngDiff * lngDiff;

      if (distSquared < zoneRadiusDeg * zoneRadiusDeg) {
        pointAqi = Math.max(pointAqi, zone.aqi);
      }
    }

    totalAqi += pointAqi;
  }

  return samples > 0 ? totalAqi / samples : 50;
};

// ✅ DETERMINISTIC DERIVED METRICS
const estimateNoiseLevel = (
  trafficDelaySeconds: number,
  distanceKm: number,
): number => {
  const trafficFactor = Math.min(1, trafficDelaySeconds / 1200);
  const distanceFactor = Math.min(1, distanceKm / 20);

  return Math.round(55 + trafficFactor * 15 + distanceFactor * 5);
};

const estimateEcoSavings = (
  distanceKm: number,
  trafficDelaySeconds: number,
): number => {
  const trafficFactor = Math.min(1, trafficDelaySeconds / 1800);
  return Math.round(distanceKm * 0.8 * (1 - trafficFactor));
};

const processTomTomRoute = (
  apiResponse: TomTomRouteResponse,
  requestedType: "fastest" | "shortest" | "eco",
  idSuffix: string,
  zones: ZoneData[],
): RouteOption | null => {
  if (!apiResponse?.routes?.length) return null;

  const r = apiResponse.routes[0];
  const summary = r.summary;

  const path: Coordinate[] = [];
  r.legs?.forEach((leg: { points: any[] }) => {
    leg.points?.forEach((pt) => {
      path.push({ lat: pt.latitude, lng: pt.longitude });
    });
  });

  if (!path.length) return null;

  const steps: NavigationStep[] = [];
  r.guidance?.instructions?.forEach((inst: TomTomInstruction) => {
    steps.push({
      instruction: parseTaggedInstruction(inst.message || inst.instructionType),
      distance:
        inst.routeOffsetInMeters > 0 ? `${inst.routeOffsetInMeters} m` : "",
      maneuver: mapTomTomManeuver(inst.instructionType),
      coordinate: { lat: inst.point.latitude, lng: inst.point.longitude },
    });
  });

  const distanceKm = parseFloat((summary.lengthInMeters / 1000).toFixed(2));
  const durationMins = Math.round(summary.travelTimeInSeconds / 60);

  const aqiExposure = calculateRouteExposure(path, zones);

  const noiseLevel = estimateNoiseLevel(
    summary.trafficDelayInSeconds,
    distanceKm,
  );
  const ecoSavings = estimateEcoSavings(
    distanceKm,
    summary.trafficDelayInSeconds,
  );

  let name = "Route";
  let safetyScore = 80;
  let type: RouteOption["type"] = "fastest";

  if (requestedType === "fastest") {
    name = "Fastest Route";
    safetyScore = 85;
    type = "fastest";
  } else if (requestedType === "eco") {
    name = "Eco Route";
    safetyScore = 90;
    type = "cleanest";
  } else {
    name = "Shortest Route";
    safetyScore = 75;
    type = "safest";
  }

  const pollutionScore = Math.min(100, (aqiExposure / 200) * 100);

  const risks: string[] = [];

  if (aqiExposure > 150) risks.push("High Pollution");
  if (summary.trafficDelayInSeconds > 600) risks.push("Heavy Traffic");
  if (noiseLevel > 70) risks.push("High Noise");

  return {
    id: `route-${idSuffix}-${Date.now()}`,
    name,
    durationMinutes: durationMins,
    distanceKm,
    aqiExposure,
    safetyScore,
    pollutionScore,
    type,
    isAccessible: true,
    elevationProfile: "flat",
    noiseLevel,
    congestionLevel: summary.trafficDelayInSeconds > 300 ? "high" : "moderate",
    path,
    steps,
    ecoSavings,
    risks,
  };
};

export const fetchRealRoutes = async (
  start: Coordinate,
  end: Coordinate,
  zones: ZoneData[] = [],
): Promise<RouteOption[]> => {
  if (!start || !end) return [];

  try {
    const [resFast, resEco, resShort] = await Promise.all([
      fetchTomTomRoute(start, end, "fastest"),
      fetchTomTomRoute(start, end, "eco"),
      fetchTomTomRoute(start, end, "shortest"),
    ]);

    const routes: RouteOption[] = [];

    const r1 = resFast
      ? processTomTomRoute(resFast, "fastest", "fast", zones)
      : null;
    if (r1) routes.push(r1);

    const r2 = resEco ? processTomTomRoute(resEco, "eco", "eco", zones) : null;
    if (
      r2 &&
      !routes.some((r) => Math.abs(r.distanceKm - r2.distanceKm) < 0.1)
    ) {
      routes.push(r2);
    }

    const r3 = resShort
      ? processTomTomRoute(resShort, "shortest", "short", zones)
      : null;
    if (
      r3 &&
      !routes.some((r) => Math.abs(r.distanceKm - r3.distanceKm) < 0.1)
    ) {
      routes.push(r3);
    }

    // ✅ REAL CLEANEST ROUTE LOGIC
    if (routes.length) {
      let cleanest = routes.reduce((min, r) =>
        r.aqiExposure < min.aqiExposure ? r : min,
      );

      routes.forEach((r) => {
        if (r === cleanest) {
          r.type = "cleanest";
          r.name = "Cleanest Air Route";
        }
      });
    }

    return routes;
  } catch (error) {
    console.error("Routing Error:", error);
    return [];
  }
};
