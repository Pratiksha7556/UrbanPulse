import { DrivingStats, Coordinate } from "../types";

// Helper to calculate distance (meters)
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

// 🚗 MAIN FUNCTION (REAL DATA BASED)
export const getDrivingBehaviorStats = async (
  path: Coordinate[], // pass user route history
): Promise<DrivingStats> => {
  if (!path || path.length < 2) {
    return {
      dailyScore: 100,
      fuelWastedMl: 0,
      idlingTimeMinutes: 0,
      distanceDrivenKm: 0,
      events: {
        harshBraking: 0,
        rapidAcceleration: 0,
        hardCornering: 0,
      },
      feedback: "No driving data available.",
      improvementTip: "Start moving to analyze driving behavior.",
    };
  }

  let totalDistance = 0;
  let harshBraking = 0;
  let rapidAcceleration = 0;
  let hardCornering = 0;
  let idlingTimeMinutes = 0;

  const speeds: number[] = [];

  for (let i = 1; i < path.length; i++) {
    const dist = getDistance(path[i - 1], path[i]); // meters
    totalDistance += dist;

    const speed = dist; // assume per second updates → m/s approx
    speeds.push(speed);

    // Detect sudden changes
    if (i > 1) {
      const prevSpeed = speeds[i - 2];

      const diff = speed - prevSpeed;

      if (diff > 8) rapidAcceleration++;
      if (diff < -8) harshBraking++;

      // crude corner detection (angle change via lat/lng delta)
      const dx1 = path[i - 1].lat - path[i - 2].lat;
      const dy1 = path[i - 1].lng - path[i - 2].lng;
      const dx2 = path[i].lat - path[i - 1].lat;
      const dy2 = path[i].lng - path[i - 1].lng;

      const dot = dx1 * dx2 + dy1 * dy2;
      if (dot < 0) hardCornering++;
    }

    // Detect idling (very low movement)
    if (dist < 2) idlingTimeMinutes += 1 / 60;
  }

  const distanceDrivenKm = totalDistance / 1000;

  // 🚗 Score Calculation
  let score = 100;
  score -= harshBraking * 4;
  score -= rapidAcceleration * 3;
  score -= hardCornering * 5;
  score -= idlingTimeMinutes * 2;

  score = Math.max(0, Math.min(100, score));

  // ⛽ Fuel Waste
  const fuelWastedMl = idlingTimeMinutes * 15;
  const totalFuelUsedMl = (distanceDrivenKm / 12) * 1000 || 1;
  const wastePercentage = Math.round((fuelWastedMl / totalFuelUsedMl) * 100);

  // 💡 Feedback
  let feedback = "Smooth driving detected.";
  let improvementTip = "Maintain steady speeds for better efficiency.";

  if (score < 60) {
    feedback = "Aggressive driving detected.";
    improvementTip =
      "Avoid sudden acceleration and braking to reduce emissions.";
  } else if (wastePercentage > 8) {
    feedback = `High idling caused ${wastePercentage}% extra fuel usage.`;
    improvementTip = "Turn off engine during long stops.";
  } else if (harshBraking > 2) {
    feedback = "Frequent braking detected.";
    improvementTip = "Maintain safe distance from vehicles ahead.";
  }

  return {
    dailyScore: Math.round(score),
    fuelWastedMl: Math.round(fuelWastedMl),
    idlingTimeMinutes: Math.round(idlingTimeMinutes),
    distanceDrivenKm: Math.round(distanceDrivenKm),
    events: {
      harshBraking,
      rapidAcceleration,
      hardCornering,
    },
    feedback,
    improvementTip,
  };
};
