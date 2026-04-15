import { ZoneData, PollutionPrediction } from "../types";

// Helper to format future time
const getFutureTime = (hoursToAdd: number): string => {
  const date = new Date();
  date.setHours(date.getHours() + hoursToAdd);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// REAL deterministic prediction (based on actual inputs)
export const predictFutureHotspots = async (
  zones: ZoneData[],
  weatherSeverity: number = 2,
): Promise<PollutionPrediction[]> => {
  const predictions: PollutionPrediction[] = zones.map((zone) => {
    // ✅ REAL FEATURE ENGINEERING
    const congestion = Math.max(
      0,
      Math.min(100, (60 - zone.trafficSpeed) * 1.6),
    );
    const weatherImpact = weatherSeverity * 8;

    // ✅ Deterministic model (NO RANDOM)
    const baseGrowth = 1.08;

    const predictedPeak = Math.floor(
      zone.aqi * baseGrowth + congestion * 0.5 + weatherImpact,
    );

    // ✅ Smooth trend curve (time-series logic)
    const trendData = [
      { time: "Now", aqi: zone.aqi },
      {
        time: getFutureTime(2),
        aqi: Math.floor(zone.aqi * 1.03 + congestion * 0.1),
      },
      {
        time: getFutureTime(4),
        aqi: Math.floor(zone.aqi * 1.06 + congestion * 0.2),
      },
      { time: getFutureTime(8), aqi: predictedPeak },
      { time: getFutureTime(12), aqi: Math.floor(predictedPeak * 0.92) },
    ];

    // ✅ Severity classification
    let severity: "medium" | "high" | "critical" = "medium";
    if (predictedPeak > 200) severity = "high";
    if (predictedPeak > 300) severity = "critical";

    // ✅ Recommendations
    let recommendation = "Monitor conditions.";
    if (severity === "critical") recommendation = "Avoid travel to this area.";
    else if (severity === "high") recommendation = "Wear a mask outdoors.";

    // ✅ Insight generation (no fake factors)
    const increasePct = Math.round(
      ((predictedPeak - zone.aqi) / zone.aqi) * 100,
    );

    let primaryFactor = "moderate conditions";
    if (congestion > 60) primaryFactor = "heavy traffic congestion";
    else if (weatherSeverity > 5) primaryFactor = "adverse weather conditions";

    const insightText = `Pollution may rise by ${Math.abs(increasePct)}% in ${zone.name} by ${getFutureTime(8)} due to ${primaryFactor}.`;

    return {
      id: `pred-${zone.id}`,
      zoneName: zone.name,
      currentAqi: zone.aqi,
      predictedPeakAqi: predictedPeak,
      peakTime: getFutureTime(8),
      severity,
      trendData,
      recommendation,
      insightText,
    };
  });

  return predictions
    .filter((p) => p.predictedPeakAqi > 150)
    .sort((a, b) => b.predictedPeakAqi - a.predictedPeakAqi)
    .slice(0, 3);
};

// ✅ REAL LOCAL HOTSPOT (NO RANDOM, USE INPUTS)
export const predictLocalHotspot = async (
  zone: ZoneData,
  weatherSeverity: number = 2,
): Promise<PollutionPrediction | null> => {
  const congestion = Math.max(0, Math.min(100, (60 - zone.trafficSpeed) * 1.6));
  const weatherImpact = weatherSeverity * 8;

  const predictedPeak = Math.floor(
    zone.aqi * 1.12 + congestion * 0.6 + weatherImpact,
  );

  if (predictedPeak < 150) return null;

  const trendData = [
    { time: "Now", aqi: zone.aqi },
    { time: getFutureTime(4), aqi: Math.floor(zone.aqi * 1.05) },
    { time: getFutureTime(8), aqi: Math.floor(predictedPeak * 0.95) },
    { time: getFutureTime(12), aqi: predictedPeak },
  ];

  const increasePct = Math.round(((predictedPeak - zone.aqi) / zone.aqi) * 100);

  return {
    id: `local-${zone.id}`,
    zoneName: zone.name,
    currentAqi: zone.aqi,
    predictedPeakAqi: predictedPeak,
    peakTime: getFutureTime(12),
    severity: predictedPeak > 300 ? "critical" : "high",
    trendData,
    recommendation: `${zone.name} may become a pollution hotspot. Take precautions.`,
    insightText: `Pollution may increase by ${increasePct}% due to traffic and weather conditions.`,
  };
};
