import { ZoneData, PlanningSuggestion } from "../types";

// --- Helper functions ---
const calculateConfidence = (zone: ZoneData, factors: number[]): number => {
  const score = factors.reduce((sum, f) => sum + f, 0) / factors.length;
  return Math.min(100, Math.round(score));
};

const calculateImpact = (aqi: number): "low" | "medium" | "high" => {
  if (aqi > 200) return "high";
  if (aqi > 150) return "medium";
  return "low";
};

export const generateUrbanInterventions = (
  zones: ZoneData[],
): PlanningSuggestion[] => {
  const suggestions: PlanningSuggestion[] = [];

  // Real hotspot detection
  const hotspots = zones.filter((z) => z.aqi > 150);

  hotspots.forEach((zone) => {
    // Normalize metrics (0–100 scale)
    const pollutionFactor = Math.min(100, (zone.aqi / 300) * 100);
    const trafficFactor = 100 - Math.min(100, zone.trafficSpeed * 2);
    const noiseFactor = Math.min(100, zone.noiseLevel);

    // --- Pattern 1: Traffic + Pollution ---
    if (zone.trafficSpeed < 25 && zone.aqi > 150) {
      const confidence = calculateConfidence(zone, [
        pollutionFactor,
        trafficFactor,
      ]);

      suggestions.push({
        id: `sugg-traffic-${zone.id}`,
        zoneId: zone.id,
        title: `Implement Low Emission Zone: ${zone.name}`,
        description: `High pollution levels combined with slow traffic indicate congestion-driven emissions. Restricting heavy vehicles and optimizing flow can reduce pollution.`,
        type: "traffic_regulation",
        confidence,
        impact: calculateImpact(zone.aqi),
      });
    }

    // --- Pattern 2: Severe AQI ---
    if (zone.aqi > 180) {
      const confidence = calculateConfidence(zone, [
        pollutionFactor,
        70, // environmental baseline factor
      ]);

      suggestions.push({
        id: `sugg-green-${zone.id}`,
        zoneId: zone.id,
        title: `Introduce Green Buffers & Urban Forestry`,
        description: `Sustained high AQI suggests lack of environmental absorption. Increasing vegetation can help reduce particulate matter.`,
        type: "green_infrastructure",
        confidence,
        impact: calculateImpact(zone.aqi),
      });
    }

    // --- Pattern 3: Noise Pollution ---
    if (zone.noiseLevel > 75) {
      const confidence = calculateConfidence(zone, [
        noiseFactor,
        trafficFactor,
      ]);

      suggestions.push({
        id: `sugg-noise-${zone.id}`,
        zoneId: zone.id,
        title: `Install Acoustic Barriers & Traffic Calming`,
        description: `Elevated noise levels indicate heavy traffic or urban stress. Barriers and speed control can reduce environmental and health impact.`,
        type: "infrastructure",
        confidence,
        impact: "medium",
      });
    }
  });

  // --- Pattern 4: City-wide Policy ---
  if (hotspots.length >= 2) {
    const avgAqi =
      hotspots.reduce((sum, z) => sum + z.aqi, 0) / hotspots.length;

    const confidence = Math.min(100, Math.round((avgAqi / 300) * 100));

    suggestions.push({
      id: `sugg-policy-screens`,
      zoneId: "all",
      title: `Deploy Real-Time AQI Public Displays`,
      description: `Multiple high-pollution zones detected. Public awareness through real-time AQI displays can influence safer travel and behavior.`,
      type: "policy",
      confidence,
      impact: calculateImpact(avgAqi),
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
};
