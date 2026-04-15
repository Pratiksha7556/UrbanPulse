export interface PM25Forecast {
  hourOffset: number;
  pm25: number;
}

// Simple deterministic trend-based forecasting (NO RANDOM)
export const forecastPM25 = (
  currentPM25: number,
  trafficTrend: "up" | "down" | "stable",
): PM25Forecast[] => {
  const result: PM25Forecast[] = [];

  // Trend multipliers (can be tuned or made dynamic later)
  let trendFactor = 0;

  if (trafficTrend === "up") trendFactor = 2.5;
  else if (trafficTrend === "down") trendFactor = -2;
  else trendFactor = 0.5;

  for (let i = 1; i <= 12; i++) {
    // Time-based smoothing (pollution doesn’t jump instantly)
    const timeDecay = Math.exp(-i / 10);

    const predicted = currentPM25 + trendFactor * i * timeDecay;

    result.push({
      hourOffset: i,
      pm25: Math.round(Math.max(5, predicted)),
    });
  }

  return result;
};
