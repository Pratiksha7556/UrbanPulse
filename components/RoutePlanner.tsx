import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Geofence,
  RouteOption,
  Coordinate,
  NavigationStep,
  Suggestion,
  ZoneData,
} from "../types";
import { fetchRealRoutes } from "../services/routingService";
import {
  getPlaceSuggestions,
  getTomTomTrafficFlowUrl,
} from "../services/tomtomService";
import {
  Navigation,
  MapPin,
  Moon,
  Sun,
  Fuel,
  CloudRain,
  Rotate3d,
  AlertTriangle,
  ShieldCheck,
  Leaf,
  Clock,
  BarChart3,
  RotateCcw,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  Map as MapIcon,
  Flag,
  Crosshair,
  CornerDownRight,
  CornerDownLeft,
  Merge,
  Repeat,
  GitFork,
  X,
  Search,
  ChevronRight,
  Layers,
  Volume2,
  Zap,
} from "lucide-react";
import SmartTravelRecommendations from "./SmartTravelRecommendations";
import PublicTransportComparison from "./PublicTransportComparison";
import { analyzeRouteSafety } from "../services/safetyService";
import { checkRouteRestriction } from "../services/geofenceService";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  Tooltip,
  Circle,
  Popup,
} from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };

interface RoutePlannerProps {
  activeGeofences: Geofence[];
  currentLocation?: Coordinate;
  zones?: ZoneData[];
}

// Marker Icons
const startIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet-color-markers/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet-color-markers/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const navIcon = new L.DivIcon({
  className: "nav-arrow-icon",
  html: `<div style="width: 20px; height: 20px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Small dot for maneuver steps
const stepIcon = new L.DivIcon({
  className: "step-dot-icon",
  html: `<div style="width: 12px; height: 12px; background-color: #64748b; border: 2px solid white; border-radius: 50%;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// Map Controller
const MapController = ({
  bounds,
  navLocation,
  focusStep,
}: {
  bounds: L.LatLngBounds | null;
  navLocation: Coordinate | null;
  focusStep: Coordinate | null;
}) => {
  const map = useMap();

  // Fit bounds on route select
  useEffect(() => {
    if (bounds && !navLocation && !focusStep) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      } catch (e) {
        console.warn("Invalid bounds", e);
      }
    }
  }, [bounds, navLocation, focusStep, map]);

  // Pan to Nav Location
  useEffect(() => {
    if (navLocation) {
      map.panTo([navLocation.lat, navLocation.lng], {
        animate: true,
        duration: 0.5,
      });
      if (map.getZoom() < 16) map.setZoom(16);
    }
  }, [navLocation, map]);

  // Fly to specific step
  useEffect(() => {
    if (focusStep) {
      map.flyTo([focusStep.lat, focusStep.lng], 16, { duration: 1.5 });
    }
  }, [focusStep, map]);

  return null;
};

const StepIcon = ({ type }: { type: NavigationStep["maneuver"] }) => {
  switch (type) {
    case "turn-left":
      return <CornerUpLeft className="w-6 h-6 text-slate-700" />;
    case "turn-right":
      return <CornerUpRight className="w-6 h-6 text-slate-700" />;
    case "straight":
      return <ArrowUp className="w-6 h-6 text-slate-700" />;
    case "arrive":
      return <Flag className="w-6 h-6 text-red-500" />;
    case "depart":
      return <MapIcon className="w-6 h-6 text-green-500" />;
    case "roundabout":
      return <Repeat className="w-6 h-6 text-slate-700" />;
    case "merge":
      return <Merge className="w-6 h-6 text-slate-700" />;
    case "fork":
      return <GitFork className="w-6 h-6 text-slate-700" />;
    case "bear-left":
      return <CornerUpLeft className="w-6 h-6 text-slate-700 -rotate-45" />;
    case "bear-right":
      return <CornerUpRight className="w-6 h-6 text-slate-700 rotate-45" />;
    default:
      return <Navigation className="w-6 h-6 text-slate-700" />;
  }
};

const LocationInput = ({
  value,
  onChange,
  onSelect,
  placeholder,
  icon,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelect: (s: Suggestion) => void;
  placeholder: string;
  icon: React.ReactNode;
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length > 2 && showSuggestions) {
        const results = await getPlaceSuggestions(value);
        setSuggestions(results);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative group" ref={wrapperRef}>
      <div className="absolute left-3 top-3 transition-transform group-focus-within:scale-110">
        {icon}
      </div>
      <input
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                onSelect(s);
                setShowSuggestions(false);
              }}
              className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-start"
            >
              <MapPin className="w-4 h-4 mt-0.5 mr-2 text-slate-400" />
              <div>
                <div className="text-sm font-bold text-slate-700">
                  {s.label}
                </div>
                <div className="text-xs text-slate-500">{s.subLabel}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RoutePlanner: React.FC<RoutePlannerProps> = ({
  activeGeofences,
  currentLocation,
  zones = [],
}) => {
  const [startQuery, setStartQuery] = useState("My Location");
  const [endQuery, setEndQuery] = useState("");
  const [startLoc, setStartLoc] = useState<Coordinate>(
    currentLocation || DEFAULT_CENTER,
  );
  const [endLoc, setEndLoc] = useState<Coordinate>(DEFAULT_CENTER);

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [loading, setLoading] = useState(false);

  const [isNightMode, setIsNightMode] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "options" | "directions" | "analysis"
  >("options");

  const [isNavigating, setIsNavigating] = useState(false);
  const [navIndex, setNavIndex] = useState(0);
  const [navLocation, setNavLocation] = useState<Coordinate | null>(null);
  const navInterval = useRef<any>(null);

  const [focusStep, setFocusStep] = useState<Coordinate | null>(null);

  const trafficUrl = getTomTomTrafficFlowUrl();
  const tomTomKey = trafficUrl ? trafficUrl.split("key=")[1] : null; // Extract key from trafficUrl if needed

  const mapBounds = useMemo(() => {
    if (selectedRoute && selectedRoute.path.length > 0) {
      return L.latLngBounds(selectedRoute.path.map((p) => [p.lat, p.lng]));
    }
    if (startLoc.lat !== endLoc.lat) {
      return L.latLngBounds(
        [startLoc.lat, startLoc.lng],
        [endLoc.lat, endLoc.lng],
      );
    }
    return null;
  }, [selectedRoute, startLoc, endLoc]);

  useEffect(() => {
    if (currentLocation && startQuery === "My Location") {
      setStartLoc(currentLocation);
    }
  }, [currentLocation, startQuery]);

  useEffect(() => {
    if (isNavigating && selectedRoute) {
      setNavIndex(0);
      navInterval.current = setInterval(() => {
        setNavIndex((prev) => {
          const next = prev + 5;
          if (next >= selectedRoute.path.length) {
            clearInterval(navInterval.current);
            setIsNavigating(false);
            return prev;
          }
          setNavLocation(selectedRoute.path[next]);
          return next;
        });
      }, 500);
    } else {
      clearInterval(navInterval.current);
      setNavLocation(null);
    }
    return () => clearInterval(navInterval.current);
  }, [isNavigating, selectedRoute]);

  const currentInstruction = useMemo(() => {
    if (!selectedRoute || !isNavigating || !navLocation) return null;
    const progress = navIndex / selectedRoute.path.length;
    const stepIdx = Math.floor(progress * selectedRoute.steps.length);
    return selectedRoute.steps[
      Math.min(stepIdx, selectedRoute.steps.length - 1)
    ];
  }, [navIndex, selectedRoute, isNavigating, navLocation]);

  const handleSearch = async () => {
    if (!endQuery.trim()) return;
    setLoading(true);
    setActiveTab("options");
    setRoutes([]);
    setSelectedRoute(null);
    setFocusStep(null);

    try {
      const fetchedRoutes = await fetchRealRoutes(startLoc, endLoc, zones);
      if (fetchedRoutes.length > 0) {
        fetchedRoutes.forEach((r) => {
          r.passesThroughRestrictedZone = checkRouteRestriction(
            r,
            activeGeofences,
          );
        });
        setRoutes(fetchedRoutes);
        // Prefer Safest route if available, else fastest
        const safest = fetchedRoutes.find((r) => r.type === "safest");
        setSelectedRoute(safest || fetchedRoutes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startNavigation = () => {
    if (selectedRoute) {
      setIsNavigating(true);
      setActiveTab("directions");
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setNavLocation(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50 overflow-hidden rounded-xl shadow-lg border border-slate-200 relative">
      <div className="w-full lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full z-20 shadow-xl relative">
        <div className="p-4 bg-white border-b border-slate-100 space-y-3 z-30">
          <LocationInput
            value={startQuery}
            onChange={setStartQuery}
            onSelect={(s) => {
              setStartQuery(s.label);
              setStartLoc(s.coordinate);
            }}
            placeholder="Start Location"
            icon={<MapPin className="w-4 h-4 text-green-600" />}
          />
          <LocationInput
            value={endQuery}
            onChange={setEndQuery}
            onSelect={(s) => {
              setEndQuery(s.label);
              setEndLoc(s.coordinate);
            }}
            placeholder="Destination"
            icon={<MapPin className="w-4 h-4 text-red-500" />}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !endQuery}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center"
          >
            {loading ? (
              <Rotate3d className="w-4 h-4 animate-spin" />
            ) : (
              "Find Routes"
            )}
          </button>
        </div>

        {routes.length > 0 && (
          <div className="flex border-b border-slate-100 bg-slate-50">
            {(["options", "directions", "analysis"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === tab ? "text-pink-600 border-b-2 border-pink-600 bg-white" : "text-slate-500"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
          {activeTab === "options" && (
            <div className="space-y-3">
              {routes.length === 0 && !loading && (
                <div className="text-center text-slate-400 py-10">
                  <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Search for a destination to start.</p>
                </div>
              )}
              {routes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => {
                    setSelectedRoute(route);
                    setFocusStep(null);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all relative group bg-white ${selectedRoute?.id === route.id ? "border-pink-500 ring-1 ring-pink-100 shadow-md" : "border-slate-200 hover:border-pink-300"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-slate-800">
                      {route.durationMinutes} min
                    </div>
                    <div
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        route.type === "fastest"
                          ? "bg-blue-100 text-blue-700"
                          : route.type === "cleanest"
                            ? "bg-green-100 text-green-700"
                            : route.type === "safest"
                              ? "bg-green-100 text-green-700"
                              : route.type === "polluted"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {route.type}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    {route.distanceKm} km • via {route.name}
                  </div>

                  {/* Environmental & Safety Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div
                      className={`flex items-center text-xs p-1.5 rounded ${route.ecoSavings ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-500"}`}
                    >
                      <Leaf className="w-3 h-3 mr-1.5 flex-shrink-0" />
                      <span className="font-semibold">
                        {route.ecoSavings
                          ? `Save ${route.ecoSavings}% Fuel`
                          : "Standard"}
                      </span>
                    </div>
                    <div
                      className={`flex items-center text-xs p-1.5 rounded ${route.aqiExposure > 150 ? "bg-red-50 text-red-700 border border-red-100" : "bg-blue-50 text-blue-700 border border-blue-100"}`}
                    >
                      <CloudRain className="w-3 h-3 mr-1.5 flex-shrink-0" />
                      <span className="font-semibold">
                        {route.aqiExposure > 150
                          ? "High Pollution"
                          : `Low Exposure (${Math.round(route.aqiExposure)})`}
                      </span>
                    </div>
                  </div>

                  {/* Risks Badges */}
                  {route.risks && route.risks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {route.risks.map((risk, i) => (
                        <span
                          key={i}
                          className="text-[9px] flex items-center bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-semibold"
                        >
                          <AlertTriangle className="w-2 h-2 mr-1" /> {risk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "directions" && selectedRoute && (
            <div className="space-y-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-800 text-lg flex items-center">
                    {selectedRoute.type === "safest" && (
                      <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
                    )}
                    {selectedRoute.durationMinutes} min
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedRoute.distanceKm} km
                  </div>
                </div>
                {!isNavigating ? (
                  <button
                    onClick={startNavigation}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-md transition-transform active:scale-95"
                  >
                    <Navigation className="w-4 h-4 mr-2" /> Start
                  </button>
                ) : (
                  <button
                    onClick={stopNavigation}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-md"
                  >
                    <X className="w-4 h-4 mr-2" /> Stop
                  </button>
                )}
              </div>
              {selectedRoute.type === "safest" && (
                <div className="bg-green-50 p-2 text-xs text-green-800 text-center font-bold border-b border-green-100">
                  You are viewing the Safest Path
                </div>
              )}
              <div className="divide-y divide-slate-100">
                {selectedRoute.steps.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => setFocusStep(step.coordinate)}
                    className="p-3 flex items-start hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="mr-3 mt-1 text-slate-400">
                      <StepIcon type={step.maneuver} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800 leading-tight">
                        {step.instruction}
                      </div>
                      {step.distance && (
                        <div className="text-xs text-slate-400 mt-1 font-mono">
                          {step.distance}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "analysis" && selectedRoute && (
            <div className="space-y-4">
              <SmartTravelRecommendations selectedRoute={selectedRoute} />
              <PublicTransportComparison
                distanceKm={selectedRoute.distanceKm}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-slate-100 relative z-0 h-full">
        {isNavigating && currentInstruction && (
          <div className="absolute top-4 left-4 right-16 z-[500] bg-slate-900/95 backdrop-blur text-white p-4 rounded-xl shadow-2xl flex items-center animate-in slide-in-from-top border border-slate-700">
            <div className="mr-4 p-3 bg-blue-600 rounded-lg shadow-lg">
              <StepIcon type={currentInstruction.maneuver} />
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold leading-tight">
                {currentInstruction.instruction}
              </div>
              <div className="text-slate-400 text-sm mt-1 flex items-center">
                <span className="font-mono text-white font-bold mr-2">
                  {currentInstruction.distance || "0 m"}
                </span>{" "}
                then...
              </div>
            </div>
            <button
              onClick={stopNavigation}
              className="ml-4 p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        )}

        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className={`p-3 rounded-full shadow-lg transition-colors ${isNightMode ? "bg-slate-800 text-yellow-400" : "bg-white text-slate-600 hover:bg-slate-100"}`}
          >
            {isNightMode ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`p-3 rounded-full shadow-lg transition-colors ${showTraffic ? "bg-orange-500 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
            title="Toggle Live Traffic"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>

        <MapContainer
          center={[startLoc.lat, startLoc.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://tomtom.com">TomTom</a>'
            url={
              tomTomKey
                ? `https://api.tomtom.com/map/1/tile/basic/${isNightMode ? "night" : "main"}/{z}/{x}/{y}.png?key=${tomTomKey}`
                : `https://{s}.basemaps.cartocdn.com/${isNightMode ? "dark" : "light"}_all/{z}/{x}/{y}{r}.png`
            }
          />

          {showTraffic && tomTomKey && (
            <TileLayer url={trafficUrl} opacity={0.75} zIndex={10} />
          )}

          <MapController
            bounds={mapBounds}
            navLocation={navLocation}
            focusStep={focusStep}
          />

          {!isNavigating && (
            <>
              <Marker position={[startLoc.lat, startLoc.lng]} icon={startIcon}>
                <Tooltip permanent direction="top" offset={[0, -30]}>
                  Start
                </Tooltip>
              </Marker>
              <Marker position={[endLoc.lat, endLoc.lng]} icon={endIcon}>
                <Tooltip permanent direction="top" offset={[0, -30]}>
                  End
                </Tooltip>
              </Marker>
            </>
          )}

          {isNavigating && navLocation && (
            <Marker
              position={[navLocation.lat, navLocation.lng]}
              icon={navIcon}
              zIndexOffset={1000}
            />
          )}

          {/* Show steps on map when Route is selected (even if not navigating) */}
          {selectedRoute &&
            !isNavigating &&
            selectedRoute.steps.map((step, idx) => (
              <Marker
                key={`step-${idx}`}
                position={[step.coordinate.lat, step.coordinate.lng]}
                icon={stepIcon}
                {...({
                  eventHandlers: { click: () => setFocusStep(step.coordinate) },
                } as any)}
              >
                <Popup>{step.instruction}</Popup>
              </Marker>
            ))}

          {routes.map((route) => {
            const isSelected = selectedRoute?.id === route.id;
            let routeColor = "#94a3b8"; // default grey

            // Color coding based on type/risk
            if (route.type === "safest" || route.type === "cleanest")
              routeColor = "#22c55e"; // Green
            else if (route.type === "polluted" || route.type === "noisy")
              routeColor = "#ef4444"; // Red for danger
            else if (route.type === "fastest") routeColor = "#3b82f6"; // Blue

            return (
              <Polyline
                key={route.id}
                positions={route.path.map((p) => [p.lat, p.lng])}
                {...({
                  pathOptions: {
                    color: routeColor,
                    weight: isSelected ? 8 : 5,
                    opacity: isSelected ? 1 : 0.5,
                    lineCap: "round",
                    lineJoin: "round",
                    dashArray:
                      route.type === "polluted" || route.type === "noisy"
                        ? "10, 10"
                        : undefined, // Dashed for risky routes
                  },
                } as any)}
                {...({
                  eventHandlers: {
                    click: () => {
                      if (!isNavigating) setSelectedRoute(route);
                    },
                  },
                } as any)}
              >
                <Tooltip sticky>
                  <div className="font-bold text-xs">
                    {route.name} ({route.durationMinutes} min)
                    {route.risks.length > 0 && (
                      <div className="text-red-500">{route.risks[0]}</div>
                    )}
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

          {zones.map((z) => (
            <Circle
              key={z.id}
              center={[z.coordinates.lat, z.coordinates.lng]}
              radius={z.radius}
              pathOptions={{
                color: z.type === "pollution" ? "red" : "green",
                fillColor: z.type === "pollution" ? "red" : "green",
                fillOpacity: 0.1,
                stroke: false,
              }}
            />
          ))}

          {selectedRoute && (
            <Polyline
              positions={selectedRoute.path.map((p) => [p.lat, p.lng])}
              {...({
                pathOptions: {
                  color: "white",
                  weight: 2,
                  opacity: 0.8,
                  dashArray: "5, 10",
                },
              } as any)}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default RoutePlanner;
