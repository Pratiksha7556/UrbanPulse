import {
  EnvironmentalConditions,
  TravelRecommendation,
  RouteOption,
} from "../types";

// Normalize helpers
const normalize = (value: number, max: number) => Math.min(1, value / max);

// Deterministic scoring function
const calculateTravelScore = (env: EnvironmentalConditions): number => {
  const aqiScore = 1 - normalize(env.aqi, 300); // lower AQI = better
  const trafficScore = 1 - normalize(env.trafficCongestionIndex, 100);
  const weatherScore = 1 - normalize(env.weatherSeverity, 10);

  // Weighted score
  return aqiScore * 0.4 + trafficScore * 0.4 + weatherScore * 0.2;
};

export const getSmartTravelRecommendation = (
  current: EnvironmentalConditions,
  selectedRoute?: RouteOption,
): TravelRecommendation => {
  // ✅ Current condition score
  const currentScore = calculateTravelScore(current);

  // ✅ Estimate near-future improvement (simple deterministic trend)
  const futureConditions: EnvironmentalConditions = {
    aqi: Math.max(20, current.aqi * 0.92), // slight improvement expected
    trafficCongestionIndex: Math.max(0, current.trafficCongestionIndex * 0.85),
    weatherSeverity: current.weatherSeverity,
  };

  const futureScore = calculateTravelScore(futureConditions);

  // ✅ Improvement delta
  const improvementDelta = futureScore - currentScore;

  // Convert improvement into delay suggestion
  let suggestedDelay = 0;

  if (improvementDelta > 0.15) suggestedDelay = 45;
  else if (improvementDelta > 0.1) suggestedDelay = 30;
  else if (improvementDelta > 0.05) suggestedDelay = 15;
  else suggestedDelay = 0;

  // ✅ Route-based adjustment
  if (selectedRoute?.type === "cleanest") {
    suggestedDelay = Math.max(0, suggestedDelay - 10);
  }

  // ✅ Reasoning
  let reasoning = "";
  let improvementText = "";

  if (suggestedDelay === 0) {
    reasoning = selectedRoute
      ? `Conditions on ${selectedRoute.name} are suitable for travel.`
      : "Conditions are suitable for travel.";
    improvementText = "Minimal change expected.";
  } else {
    if (current.aqi > 150) reasoning += "High pollution levels. ";
    if (current.trafficCongestionIndex > 70)
      reasoning += "Heavy traffic congestion. ";
    if (current.weatherSeverity > 5) reasoning += "Adverse weather. ";

    improvementText = selectedRoute
      ? `Waiting ${suggestedDelay} minutes may improve conditions on ${selectedRoute.name}.`
      : `Waiting ${suggestedDelay} minutes may improve overall travel conditions.`;
  }

  // ✅ Deterministic confidence score
  const confidenceScore = Math.round(currentScore * 60 + futureScore * 40);

  return {
    shouldTravelNow: suggestedDelay < 15,
    suggestedDelayMinutes: suggestedDelay,
    reasoning: reasoning.trim(),
    confidenceScore,
    predictedImprovement: improvementText,
  };
};
