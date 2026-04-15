import { ExposureStats, ExposureLog, AwarenessTip, Coordinate } from "../types";
import { getHistoricalAQI } from "./openaqService";

export const getPersonalExposureStats = async (
  timeRange: "daily" | "weekly" | "monthly",
  location?: Coordinate,
): Promise<ExposureStats> => {
  try {
    const lat = location?.lat || 18.5204;
    const lng = location?.lng || 73.8567;

    const allLogs = await getHistoricalAQI(lat, lng, 30);

    if (!allLogs || allLogs.length === 0) {
      throw new Error("No AQI data available");
    }

    const today = allLogs[allLogs.length - 1];
    const last7Days = allLogs.slice(-7);
    const last30Days = allLogs;

    const calculateAverage = (logs: ExposureLog[]) =>
      logs.length
        ? Math.round(
            logs.reduce((acc, log) => acc + log.score, 0) / logs.length,
          )
        : 0;

    const weeklyAvg = calculateAverage(last7Days);
    const monthlyAvg = calculateAverage(last30Days);

    let trendData: ExposureLog[] = last7Days;
    if (timeRange === "monthly") trendData = last30Days;

    // 📊 Better Insight Logic
    let insight = "";

    if (today.score >= weeklyAvg && weeklyAvg >= monthlyAvg) {
      insight =
        "Air quality is improving. Your exposure trend is getting better over time.";
    } else if (today.score < weeklyAvg && weeklyAvg < monthlyAvg) {
      insight = "Air quality is worsening. Consider reducing outdoor exposure.";
    } else if (today.score < weeklyAvg) {
      insight =
        "Today's exposure is higher than your weekly average. Limit outdoor activity.";
    } else {
      insight =
        "Your exposure is stable. Maintain current habits for better air quality.";
    }

    return {
      daily: today,
      weeklyAverage: weeklyAvg,
      monthlyAverage: monthlyAvg,
      trend: trendData,
      insight,
    };
  } catch (error) {
    console.error("Exposure stats error:", error);

    // ✅ Safe fallback (NO crash)
    return {
      daily: {
        date: new Date().toISOString().split("T")[0],
        averageAqi: 0,
        peakAqi: 0,
        hoursExposed: 0,
        score: 100,
      },
      weeklyAverage: 0,
      monthlyAverage: 0,
      trend: [],
      insight: "Unable to fetch exposure data.",
    };
  }
};

// 🎯 DATA-DRIVEN TIP GENERATION
export const generateAwarenessTip = (stats: ExposureStats): AwarenessTip => {
  const trend = stats.trend;

  if (!trend || trend.length < 2) {
    return {
      id: "tip-default",
      title: "Stay Informed",
      message:
        "Monitor daily air quality levels to plan safer outdoor activities.",
      category: "education",
      basedOn: "general",
    };
  }

  const today = trend[trend.length - 1];
  const yesterday = trend[trend.length - 2];

  // 🚨 High Pollution Exposure
  if (today.peakAqi > 150) {
    return {
      id: "tip-high-aqi",
      title: "High Pollution Alert",
      message: `Peak AQI reached ${today.peakAqi}. Avoid outdoor exercise and wear a mask.`,
      category: "health",
      basedOn: "exposure",
    };
  }

  // 📈 Increasing Trend
  if (today.score < yesterday.score) {
    return {
      id: "tip-increasing-pollution",
      title: "Rising Pollution Trend",
      message:
        "Air quality is getting worse compared to yesterday. Reduce outdoor exposure.",
      category: "health",
      basedOn: "exposure",
    };
  }

  // 📉 Improving Trend
  if (today.score > yesterday.score) {
    return {
      id: "tip-improving",
      title: "Improving Air Quality",
      message:
        "Air quality has improved. It's a good time for outdoor activities.",
      category: "health",
      basedOn: "exposure",
    };
  }

  // 🏠 Moderate case
  if (today.averageAqi > 100) {
    return {
      id: "tip-moderate",
      title: "Moderate Air Quality",
      message:
        "Consider indoor activities during peak traffic hours to reduce exposure.",
      category: "health",
      basedOn: "exposure",
    };
  }

  // 🌿 Default (no randomness)
  return {
    id: "tip-stable",
    title: "Stable Conditions",
    message:
      "Air quality is stable. Continue monitoring for any sudden changes.",
    category: "education",
    basedOn: "general",
  };
};
