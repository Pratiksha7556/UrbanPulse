import { ZoneData, Geofence, RouteOption, Coordinate } from "../types";

const LEZ_THRESHOLD_AQI = 200;

// 🟢 Detect real hotspots (no change needed, just cleaned)
export const detectPollutionHotspots = (zones: ZoneData[]): Geofence[] => {
  return zones
    .filter((z) => z.aqi >= LEZ_THRESHOLD_AQI)
    .map((zone) => ({
      id: `lez-${zone.id}`,
      center: zone.coordinates,
      radius: zone.radius * 1.2, // safety buffer
      type: "low_emission_zone",
      triggerValue: zone.aqi,
      isActive: true,
      createdAt: new Date(),
    }));
};

// 📏 Distance (meters)
const getDistance = (a: Coordinate, b: Coordinate): number => {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

// 🚧 Check if point is inside geofence
const isInsideGeofence = (point: Coordinate, geofence: Geofence): boolean => {
  const dist = getDistance(point, geofence.center);
  return dist <= geofence.radius;
};

// 🚗 REAL ROUTE RESTRICTION CHECK
export const checkRouteRestriction = (
  route: RouteOption,
  geofences: Geofence[],
): boolean => {
  if (!geofences.length || !route.path || route.path.length === 0) {
    return false;
  }

  // 🔥 Check every route point against every geofence
  for (const point of route.path) {
    for (const fence of geofences) {
      if (fence.isActive && isInsideGeofence(point, fence)) {
        return true; // 🚨 route intersects restricted zone
      }
    }
  }

  return false;
};
