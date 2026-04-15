

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface ZoneData {
  id: string;
  name: string;
  type: 'congestion' | 'pollution' | 'safety' | 'safe_zone';
  coordinates: Coordinate;
  radius: number; // in meters
  severity: number; // 0-100
  aqi: number;
  noiseLevel: number; // dB
  trafficSpeed: number; // km/h
  description: string;
  details?: string;
}

export interface Geofence {
  id: string;
  center: Coordinate;
  radius: number;
  type: 'low_emission_zone' | 'avoidance_zone';
  triggerValue: number; // The AQI value that triggered this
  isActive: boolean;
  createdAt: Date;
}

export interface Incident {
  id: string;
  title?: string; // Added for report form
  type: 'accident' | 'closure' | 'hazard' | 'police' | 'pothole';
  severity?: 'low' | 'medium' | 'high' | 'critical'; // Added for report form
  coordinates: Coordinate;
  locationName: string; // e.g., "SB Road"
  description: string; // e.g., "Stalled Truck"
  reportedAt: Date;
  verified: boolean;
  upvotes: number;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
}

export interface Resource {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'safe_zone' | 'fire_station' | 'ev_station';
  coordinates: Coordinate;
  available: boolean;
  contact: string;
}

export interface NavigationStep {
  instruction: string;
  distance: string; // Display string e.g. "200 m"
  maneuver: 'turn-left' | 'turn-right' | 'straight' | 'depart' | 'arrive' | 'uturn' | 'merge' | 'roundabout' | 'fork' | 'bear-left' | 'bear-right' | 'unknown';
  coordinate: Coordinate;
}

export interface Suggestion {
  id: string;
  label: string; // Main text (e.g. "Pune Airport")
  subLabel: string; // Secondary text (e.g. "Lohegaon, Pune")
  coordinate: Coordinate;
}

export interface RouteOption {
  id: string;
  name: string;
  durationMinutes: number;
  distanceKm: number;
  aqiExposure: number;
  safetyScore: number;
  pollutionScore: number;
  type: 'fastest' | 'cleanest' | 'safest' | 'accessible' | 'polluted' | 'noisy';
  isAccessible: boolean; // Wheelchair friendly
  elevationProfile: 'flat' | 'moderate' | 'steep';
  // Safety specific attributes
  lighting?: 'bright' | 'moderate' | 'dim' | 'dark';
  crowdDensity?: 'high' | 'medium' | 'low';
  // Hybrid specific attributes
  noiseLevel: number; // dB
  congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
  congestionCause?: string; // New: Derived from traffic service
  // Geofencing
  passesThroughRestrictedZone?: boolean;
  // Green / Eco Attributes
  ecoSavings?: number; // Percentage of fuel saved compared to baseline
  co2Index?: number; // 0-10 scale (lower is better)
  fuelConsumption?: number; // Liters
  // Visualization
  path: Coordinate[];
  // Navigation Instructions
  steps: NavigationStep[];
  // Risk Analysis
  risks: string[]; // e.g. ["High Pollution", "Noise > 80dB"]
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isSOS?: boolean;
  action?: {
    type: 'redirect' | 'map_update';
    target?: string;
    location?: Coordinate;
  };
}

export interface EnvironmentalConditions {
  aqi: number;
  trafficCongestionIndex: number; // 0-100
  weatherSeverity: number; // 0-10 (0=Clear, 10=Storm/Heavy Rain)
}

export interface TravelRecommendation {
  shouldTravelNow: boolean;
  suggestedDelayMinutes: number;
  reasoning: string;
  confidenceScore: number;
  predictedImprovement: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface PollutionPrediction {
  id: string;
  zoneName: string;
  currentAqi: number;
  predictedPeakAqi: number;
  peakTime: string; // e.g., "10:00 AM Tomorrow"
  severity: 'medium' | 'high' | 'critical';
  trendData: { time: string; aqi: number }[];
  recommendation: string;
  insightText?: string; // Narrative forecast (e.g., "Expected to rise by 20%...")
}

export interface ExposureLog {
  date: string;
  averageAqi: number;
  peakAqi: number;
  hoursExposed: number;
  score: number; // 0-100 (100 is best health, 0 is max exposure)
}

export interface ExposureStats {
  daily: ExposureLog;
  weeklyAverage: number;
  monthlyAverage: number;
  trend: ExposureLog[]; // Last 7 days or 30 days
  insight: string;
}

export interface PlanningSuggestion {
  id: string;
  zoneId: string;
  title: string;
  description: string;
  type: 'green_infrastructure' | 'traffic_regulation' | 'infrastructure' | 'policy';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export interface AwarenessTip {
    id: string;
    title: string;
    message: string;
    category: 'health' | 'education' | 'action';
    basedOn: 'exposure' | 'general' | 'location';
}

export interface DrivingStats {
    dailyScore: number; // 0-100
    fuelWastedMl: number;
    idlingTimeMinutes: number;
    distanceDrivenKm: number;
    events: {
        harshBraking: number;
        rapidAcceleration: number;
        hardCornering: number;
    };
    feedback: string;
    improvementTip: string;
}

export interface SimulationParams {
    trafficVolume: number; // Percentage change -50 to +50
    evAdoption: number; // 0-100%
    publicTransportUsage: number; // Percentage change
    industrialActivity: number; // Percentage change
}

export interface SimulationResult {
    no2: number;
    pm25: number;
    noise: number;
    co2: number;
    healthIndex: number;
    delta: {
        no2: number;
        pm25: number;
        noise: number;
        co2: number;
    }
}

export interface PollutionSource {
    id: string;
    source: 'Traffic' | 'Industrial' | 'Dust' | 'Biomass';
    value: number; // Percentage (0-100)
    color: string;
    trend: 'up' | 'down' | 'stable';
}

export interface Anomaly {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
    zoneId?: string;
    metric: 'AQI' | 'Traffic' | 'Noise';
}

export interface TrafficSignal {
    id: string;
    coordinates: Coordinate;
    currentPhase: 'red' | 'green' | 'yellow';
    timeRemaining: number; // seconds
}

export interface WeeklyStat {
    day: string;
    aqi: number;
    traffic: number;
}