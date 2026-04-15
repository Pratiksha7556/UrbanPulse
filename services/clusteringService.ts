import { ZoneData, Coordinate } from "../types";

export interface Cluster {
  id: string;
  center: Coordinate;
  radius: number;
  intensity: number;
  count: number;
}

// 🌍 Haversine Distance (REAL Earth distance in meters)
const getDistance = (a: Coordinate, b: Coordinate): number => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
};

// 🚀 Improved K-Means Clustering
export const clusterPollutionZones = (
  zones: ZoneData[],
  k: number = 3
): Cluster[] => {
  if (!zones || zones.length === 0) return [];

  if (zones.length <= k) {
    return zones.map((z, i) => ({
      id: `cluster-${i}`,
      center: z.coordinates,
      radius: z.radius,
      intensity: z.aqi,
      count: 1,
    }));
  }

  // ✅ Random centroid initialization (better than fixed slice)
  let centroids: Coordinate[] = zones
    .sort(() => 0.5 - Math.random())
    .slice(0, k)
    .map((z) => ({ ...z.coordinates }));

  let clusters: ZoneData[][] = [];

  const MAX_ITER = 10;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    clusters = Array.from({ length: k }, () => []);

    // Assign to nearest centroid
    zones.forEach((zone) => {
      let minDist = Infinity;
      let closest = 0;

      centroids.forEach((centroid, idx) => {
        const dist = getDistance(zone.coordinates, centroid);
        if (dist < minDist) {
          minDist = dist;
          closest = idx;
        }
      });

      clusters[closest].push(zone);
    });

    // Recalculate centroids
    const newCentroids = centroids.map((old, idx) => {
      const cluster = clusters[idx];
      if (cluster.length === 0) return old;

      const avgLat =
        cluster.reduce((sum, p) => sum + p.coordinates.lat, 0) /
        cluster.length;

      const avgLng =
        cluster.reduce((sum, p) => sum + p.coordinates.lng, 0) /
        cluster.length;

      return { lat: avgLat, lng: avgLng };
    });

    // ✅ Stop early if centroids don’t change
    const hasChanged = newCentroids.some(
      (c, i) =>
        c.lat !== centroids[i].lat || c.lng !== centroids[i].lng
    );

    centroids = newCentroids;
    if (!hasChanged) break;
  }

  // 🎯 Format clusters
  return clusters
    .map((clusterPoints, idx) => {
      if (clusterPoints.length === 0) return null;

      const center = centroids[idx];

      // Max distance from center → radius
      const maxDist = clusterPoints.reduce((max, p) => {
        const dist = getDistance(p.coordinates, center);
        return Math.max(max, dist);
      }, 0);

      const avgAqi =
        clusterPoints.reduce((sum, p) => sum + p.aqi, 0) /
        clusterPoints.length;

      return {
        id: `cluster-${idx}`,
        center,
        radius: maxDist + 300, // small buffer
        intensity: avgAqi,
        count: clusterPoints.length,
      };
    })
    .filter(Boolean) as Cluster[];
};