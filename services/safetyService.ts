import { RouteOption, EnvironmentalConditions } from "../types";

export interface SafetyAnalysis {
  dynamicScore: number;
  riskFactors: string[];
  anomalyDetected: boolean;
  recommendation: string;
  pasBreakdown?: {
    promiseBit: number;
    envBit: number;
    xorResult: number;
  };
}

export const analyzeRouteSafety = (
  route: RouteOption,
  isNight: boolean,
  conditions: EnvironmentalConditions,
): SafetyAnalysis => {
  let score = route.safetyScore;
  const risks: string[] = [];

  // ✅ LIGHTING IMPACT
  if (isNight) {
    if (route.lighting === "dark") {
      score -= 30;
      risks.push("No street lighting");
    } else if (route.lighting === "dim") {
      score -= 15;
      risks.push("Low visibility lighting");
    } else if (route.lighting === "bright") {
      score += 5;
    }
  }

  // ✅ CROWD / ISOLATION IMPACT
  if (route.crowdDensity === "low") {
    if (isNight) {
      score -= 20;
      risks.push("Isolated area at night");
    } else {
      score -= 8;
      risks.push("Low crowd density");
    }
  }

  // ✅ WEATHER IMPACT
  if (conditions.weatherSeverity >= 7) {
    score -= 15;
    risks.push("Severe weather conditions");
  } else if (conditions.weatherSeverity >= 4) {
    score -= 8;
    risks.push("Moderate weather disturbance");
  }

  // ✅ TRAFFIC / ENVIRONMENT IMPACT
  if (conditions.trafficCongestionIndex > 80) {
    score -= 10;
    risks.push("Heavy traffic congestion");
  }

  // -------------------------------
  // ✅ SAFETY CONSISTENCY CHECK (XOR LOGIC – REAL USE)
  // -------------------------------

  const safetyPromiseBit =
    route.type === "safest" || route.type === "accessible" ? 1 : 0;

  const isLit = !isNight || route.lighting !== "dark";
  const isPopulated = route.crowdDensity !== "low";
  const isWeatherSafe = conditions.weatherSeverity < 7;

  const environmentSafeBit = isLit && isPopulated && isWeatherSafe ? 1 : 0;

  const xorResult = safetyPromiseBit ^ environmentSafeBit;

  // ✅ TRUE anomaly = "Safe route but unsafe environment"
  const anomalyDetected = xorResult === 1 && safetyPromiseBit === 1;

  if (anomalyDetected) {
    score -= 25;
    risks.push("Route safety does not match current conditions");
  }

  // -------------------------------
  // ✅ FINAL SCORE NORMALIZATION
  // -------------------------------
  score = Math.max(0, Math.min(100, Math.round(score)));

  // -------------------------------
  // ✅ RECOMMENDATION ENGINE
  // -------------------------------
  let recommendation = "Route conditions are acceptable.";

  if (score < 40) {
    recommendation = "High risk detected. Avoid this route.";
  } else if (score < 70) {
    recommendation = "Moderate risk. Stay alert while traveling.";
  }

  if (anomalyDetected) {
    recommendation = "Safety mismatch detected. Consider alternative route.";
  }

  return {
    dynamicScore: score,
    riskFactors: risks,
    anomalyDetected,
    recommendation,
    pasBreakdown: {
      promiseBit: safetyPromiseBit,
      envBit: environmentSafeBit,
      xorResult,
    },
  };
};
