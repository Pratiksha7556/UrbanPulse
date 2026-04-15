export interface TrafficForecast {
  time: string;
  congestionLevel: number; // 0-100
  confidence: number;
  label: "Low" | "Moderate" | "High" | "Severe";
}

// Helper: classify congestion
const getCongestionLabel = (value: number): TrafficForecast["label"] => {
  if (value > 75) return "Severe";
  if (value > 50) return "High";
  if (value > 25) return "Moderate";
  return "Low";
};

// Deterministic hourly pattern (no randomness)
const getBaseCongestion = (hour: number): number => {
  // Morning peak
  if (hour >= 8 && hour <= 10) return 80;

  // Evening peak
  if (hour >= 17 && hour <= 19) return 85;

  // Midday moderate
  if (hour >= 11 && hour <= 16) return 55;

  // Night low
  if (hour >= 22 || hour <= 5) return 15;

  // Default off-peak
  return 30;
};

export const predictTraffic = (
  currentHour: number,
  currentSpeed?: number, // from TomTom
  freeFlowSpeed?: number, // from TomTom
): TrafficForecast[] => {
  const forecasts: TrafficForecast[] = [];

  // ✅ derive real-time congestion if live data available
  let realTimeCongestion: number | null = null;

  if (currentSpeed !== undefined && freeFlowSpeed) {
    const ratio = currentSpeed / freeFlowSpeed;
    realTimeCongestion = Math.round((1 - ratio) * 100);
  }

  for (let i = 0; i < 6; i++) {
    const hour = (currentHour + i) % 24;

    // Base pattern
    let congestion = getBaseCongestion(hour);

    // Blend with real-time data if available
    if (realTimeCongestion !== null) {
      congestion = Math.round(congestion * 0.6 + realTimeCongestion * 0.4);
    }

    // Smooth progression (traffic doesn’t jump instantly)
    if (i > 0) {
      const prev = forecasts[i - 1].congestionLevel;
      congestion = Math.round(prev * 0.5 + congestion * 0.5);
    }

    congestion = Math.max(0, Math.min(100, congestion));

    forecasts.push({
      time: `${hour}:00`,
      congestionLevel: congestion,
      confidence: realTimeCongestion !== null ? 92 : 75, // higher if real data used
      label: getCongestionLabel(congestion),
    });
  }

  return forecasts;
};

// ✅ REAL ALERT LOGIC (BASED ON FORECAST, NOT HARD-CODED)
export const getCurrentTrafficAlert = (
  forecasts: TrafficForecast[],
): string | null => {
  const next = forecasts[1]; // next hour

  if (!next) return null;

  if (next.congestionLevel > 75) {
    return "⚠️ Severe traffic expected in the next hour. Consider alternative routes.";
  }

  if (next.congestionLevel > 60) {
    return "⚠️ Heavy traffic building up. Plan ahead.";
  }

  return null;
};
