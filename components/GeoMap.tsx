import React, { useState, useEffect, useRef } from "react";
import { ZoneData, Incident, Geofence, Suggestion } from "../types";
import {
  Car,
  Wind,
  Eye,
  EyeOff,
  Map as MapIcon,
  AlertTriangle,
  X,
  AlertOctagon,
  Construction,
  Search,
  Info,
  Camera,
} from "lucide-react";
import { getTomTomTrafficFlowUrl } from "../services/tomtomService";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

// Define Custom SVG Icons for distinct visual style
const createTrafficIcon = (type: string) => {
  let svg = "";
  // SVG strings compacted to single lines to prevent SyntaxErrors
  if (type === "accident") {
    // Red Triangle with exclamation
    svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"><path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19H4.5L12 5.5z"/><path d="M12 9v5" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1" fill="white"/></svg>';
  } else if (type === "closure") {
    // Orange Octagon
    svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f97316" stroke="#c2410c" stroke-width="2"><path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z"/><rect x="6" y="10" width="12" height="4" fill="white"/></svg>';
  } else {
    // Yellow Diamond
    svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#eab308" stroke="#a16207" stroke-width="2"><path d="M12 2L2 12l10 10 10-10L12 2z"/><circle cx="12" cy="12" r="3" fill="black" opacity="0.3"/></svg>';
  }

  return new L.DivIcon({
    className: "custom-traffic-icon",
    html: `<div class="w-8 h-8 drop-shadow-md hover:scale-110 transition-transform">${svg}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 30],
    popupAnchor: [0, -32],
  });
};

const searchResultIcon = new L.DivIcon({
  className: "search-result-icon",
  html: `<div class="w-10 h-10 flex items-center justify-center relative">
             <div class="absolute inset-0 bg-violet-500 rounded-full opacity-30 animate-ping"></div>
             <div class="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
             </div>
           </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

interface GeoMapProps {
  zones: ZoneData[];
  incidents: Incident[];
  geofences?: Geofence[];
  center: { lat: number; lng: number };
  onZoneClick: (zone: ZoneData) => void;
  currentCity?: string;
  onNavigate?: (view: string) => void;
  onSearchArea?: (newCenter: { lat: number; lng: number }) => void;
  searchedPlace?: Suggestion | null;
  darkMode?: boolean;
}

const MapController = ({
  center,
  searchedPlace,
}: {
  center: { lat: number; lng: number };
  searchedPlace?: Suggestion | null;
}) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      // Zoom closer if we just searched for a specific place
      const zoomLevel = searchedPlace ? 16 : 14;
      map.flyTo([center.lat, center.lng], zoomLevel, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [center, map, searchedPlace]);
  return null;
};

// Component to handle map drags and clicks
const MapEvents = ({
  onMove,
  onClick,
}: {
  onMove: () => void;
  onClick: (e: L.LeafletMouseEvent) => void;
}) => {
  useMapEvents({
    dragend: onMove,
    zoomend: onMove,
    click: onClick,
  });
  return null;
};

const GeoMap: React.FC<GeoMapProps> = ({
  zones,
  incidents,
  center,
  onZoneClick,
  currentCity,
  onSearchArea,
  searchedPlace,
  darkMode = false,
}) => {
  const [activeLayer, setActiveLayer] = useState<
    "combined" | "air" | "traffic"
  >("combined");
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showSearchBtn, setShowSearchBtn] = useState(false);

  // Ref to map to get center
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const searchMarkerRef = useRef<L.Marker>(null);

  useEffect(() => {
    // Auto-open popup when search result changes
    if (searchedPlace && searchMarkerRef.current) {
      setTimeout(() => {
        searchMarkerRef.current?.openPopup();
      }, 1600); // Wait for flyTo animation
    }
  }, [searchedPlace]);

  const tomTomKey = process.env.REACT_APP_TOMTOM_API_KEY || "";
  const trafficUrl = getTomTomTrafficFlowUrl();

  const getZoneColor = (aqi: number) => {
    if (aqi > 200) return "#7f1d1d"; // Hazardous
    if (aqi > 150) return "#ef4444"; // Unhealthy
    if (aqi > 100) return "#f97316"; // Sensitive
    if (aqi > 50) return "#eab308"; // Moderate
    return "#22c55e"; // Good
  };

  const showAir = activeLayer === "combined" || activeLayer === "air";
  const showTraffic = activeLayer === "combined" || activeLayer === "traffic";

  const handleMapMove = () => {
    if (mapInstance) {
      const newC = mapInstance.getCenter();
      // Only show if moved significantly from original center props
      const dist = Math.sqrt(
        Math.pow(newC.lat - center.lat, 2) + Math.pow(newC.lng - center.lng, 2),
      );
      if (dist > 0.01) {
        setShowSearchBtn(true);
      }
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    // Allow clicking on blank space to recenter/search there immediately
    if (onSearchArea) {
      onSearchArea({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  };

  const handleSearchHere = () => {
    if (onSearchArea && mapInstance) {
      const c = mapInstance.getCenter();
      onSearchArea({ lat: c.lat, lng: c.lng });
      setShowSearchBtn(false);
    }
  };

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-lg border border-pink-200 dark:border-slate-700 relative bg-slate-100 dark:bg-slate-900 flex flex-col md:flex-row">
      <div className="flex-1 relative z-0 h-full">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          ref={setMapInstance}
        >
          <TileLayer
            attribution="&copy; TomTom"
            url={`https://api.tomtom.com/map/1/tile/basic/${darkMode ? "night" : "main"}/{z}/{x}/{y}.png?key=${tomTomKey}`}
          />

          {/* Traffic Flow Overlay: High opacity for clear speed data visualization */}
          {showTraffic && showTrafficFlow && (
            <TileLayer url={trafficUrl} opacity={0.8} zIndex={20} />
          )}

          <MapController center={center} searchedPlace={searchedPlace} />
          <MapEvents onMove={handleMapMove} onClick={handleMapClick} />

          {/* Searched Location Marker */}
          {searchedPlace && (
            <Marker
              position={[
                searchedPlace.coordinate.lat,
                searchedPlace.coordinate.lng,
              ]}
              icon={searchResultIcon}
              zIndexOffset={2000}
              ref={searchMarkerRef}
            >
              <Popup>
                <div className="font-bold text-slate-900 dark:text-white">
                  {searchedPlace.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {searchedPlace.subLabel}
                </div>
              </Popup>
            </Marker>
          )}

          {/* AQI Zones - Rendered as Circles */}
          {showAir &&
            zones.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.coordinates.lat, zone.coordinates.lng]}
                radius={zone.radius}
                pathOptions={{
                  color: getZoneColor(zone.aqi),
                  fillColor: getZoneColor(zone.aqi),
                  fillOpacity: 0.35,
                  stroke: false,
                  className: "animate-pulse-slow",
                }}
                {...({
                  eventHandlers: {
                    click: (e: L.DomEvent.PropagableEvent) => {
                      L.DomEvent.stopPropagation(e); // Prevent map click logic
                      setSelectedItem(zone);
                      onZoneClick(zone);
                    },
                  },
                } as any)}
              >
                <Popup>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {zone.name}
                  </div>
                  <div className="text-sm font-semibold flex items-center mt-1 mb-2">
                    <Wind className="w-4 h-4 mr-1 text-slate-500 dark:text-slate-400" />{" "}
                    AQI: {zone.aqi}
                  </div>
                </Popup>
              </Circle>
            ))}

          {/* Traffic Incidents - Rendered as Distinct Icons */}
          {showTraffic &&
            incidents.map((inc) => (
              <Marker
                key={inc.id}
                position={[inc.coordinates.lat, inc.coordinates.lng]}
                icon={createTrafficIcon(inc.type)}
                zIndexOffset={1000}
                {...({
                  eventHandlers: {
                    click: (e: L.LeafletMouseEvent) => {
                      L.DomEvent.stopPropagation(e);
                      setSelectedItem(inc);
                    },
                  },
                } as any)}
              >
                <Popup>
                  <div className="flex flex-col gap-1 min-w-[180px]">
                    <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                      {inc.locationName}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      {inc.type === "accident" && (
                        <AlertTriangle className="text-red-500 w-3 h-3" />
                      )}
                      {inc.type === "closure" && (
                        <AlertOctagon className="text-orange-500 w-3 h-3" />
                      )}
                      {inc.type === "hazard" && (
                        <Construction className="text-yellow-500 w-3 h-3" />
                      )}
                      <span className="font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 tracking-wider">
                        {inc.type}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 border-t border-slate-100 dark:border-slate-700 pt-1">
                      {inc.description}
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">
                      Reported:{" "}
                      {new Date(inc.reportedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Search Here Button (Floating) */}
        {showSearchBtn && (
          <button
            onClick={handleSearchHere}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-white dark:bg-slate-800 text-pink-600 font-bold px-4 py-2 rounded-full shadow-xl border border-pink-200 dark:border-slate-700 flex items-center hover:bg-pink-50 dark:hover:bg-slate-700 animate-in fade-in slide-in-from-top-4"
          >
            <Search className="w-4 h-4 mr-2" />
            Search This Area
          </button>
        )}

        {/* Persistent Dynamic Legend (Bottom Right) */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 dark:bg-slate-800/95 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm min-w-[160px] animate-in fade-in duration-300">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1 flex items-center justify-between">
            <span className="flex items-center">
              <Info className="w-3 h-3 mr-1" /> MAP LEGEND
            </span>
            <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-400">
              {activeLayer === "combined" ? "ALL" : activeLayer.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2">
            {/* AQI Section */}
            {showAir && (
              <div className="space-y-1.5">
                <div className="text-[9px] font-bold text-slate-400 uppercase">
                  Air Quality Index
                </div>
                <div className="flex items-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>{" "}
                  Good (0-50)
                </div>
                <div className="flex items-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>{" "}
                  Moderate (51-100)
                </div>
                <div className="flex items-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>{" "}
                  Sensitive (101-150)
                </div>
                <div className="flex items-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>{" "}
                  Unhealthy (150+)
                </div>
              </div>
            )}

            {showAir && showTraffic && (
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
            )}

            {/* Traffic Section */}
            {showTraffic && (
              <div className="space-y-1.5">
                <div className="text-[9px] font-bold text-slate-400 uppercase">
                  Live Traffic Flow
                </div>
                <div className="flex items-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-6 h-1.5 bg-[#ff0000] mr-2 rounded"></span>{" "}
                  Jam / Stopped
                </div>
                <div className="flex items-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-6 h-1.5 bg-[#ff6600] mr-2 rounded"></span>{" "}
                  Heavy Traffic
                </div>
                <div className="h-px bg-slate-50 dark:bg-slate-700 my-1"></div>
                <div className="flex items-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  <AlertTriangle className="w-3 h-3 text-red-500 mr-1" />{" "}
                  Accident
                </div>
                <div className="flex items-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  <AlertOctagon className="w-3 h-3 text-orange-500 mr-1" /> Road
                  Closure
                </div>
                <div className="flex items-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  <Construction className="w-3 h-3 text-yellow-500 mr-1" />{" "}
                  Hazard / Work
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay Controls */}
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 dark:bg-slate-800/95 p-4 rounded-2xl shadow-xl max-w-xs backdrop-blur-sm border border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
            <MapIcon className="w-5 h-5 mr-2 text-pink-600" />
            {currentCity || "Loading..."}
          </h2>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveLayer("combined")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeLayer === "combined" ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveLayer("traffic")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center ${activeLayer === "traffic" ? "bg-orange-500 text-white shadow-md" : "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50"}`}
            >
              <Car className="w-3 h-3 mr-1" /> Traffic
            </button>
            <button
              onClick={() => setActiveLayer("air")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center ${activeLayer === "air" ? "bg-red-500 text-white shadow-md" : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"}`}
            >
              <Wind className="w-3 h-3 mr-1" /> Air
            </button>
          </div>

          {/* Toggles Grid */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {/* Flow Toggle */}
            {(activeLayer === "combined" || activeLayer === "traffic") && (
              <button
                onClick={() => setShowTrafficFlow(!showTrafficFlow)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center border ${
                  showTrafficFlow
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                    : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                {showTrafficFlow ? (
                  <Eye className="w-3 h-3 mr-1" />
                ) : (
                  <EyeOff className="w-3 h-3 mr-1" />
                )}
                Flow
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Detail */}
      {selectedItem && (
        <div className="absolute inset-0 md:relative md:w-80 bg-white dark:bg-slate-900 z-[1100] border-l border-pink-200 dark:border-slate-700 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              Selected Point
            </h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Type
              </label>
              <div className="text-xl font-bold text-slate-800 dark:text-white capitalize flex items-center mt-1">
                {selectedItem.aqi !== undefined ? (
                  <>
                    <Wind className="w-5 h-5 mr-2 text-pink-500" /> Air Quality
                    Zone
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />{" "}
                    Traffic Incident
                  </>
                )}
              </div>
            </div>

            {selectedItem.aqi !== undefined ? (
              // Zone Detail View
              <>
                <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center border border-slate-200 dark:border-slate-700">
                  <div
                    className={`text-4xl font-black ${getZoneColor(selectedItem.aqi)} text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-600 dark:from-white dark:to-slate-300`}
                  >
                    {selectedItem.aqi}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mt-1">
                    Live AQI Score
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Location
                  </label>
                  <div className="text-sm font-medium text-slate-800 dark:text-white">
                    {selectedItem.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedItem.description}
                  </div>
                </div>
              </>
            ) : (
              // Incident Detail View
              <>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-xl">
                  <div className="text-orange-800 dark:text-orange-300 font-bold text-lg capitalize mb-1">
                    {selectedItem.type}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 uppercase">
                    Traffic Impact Event
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Location
                  </label>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-1">
                    {selectedItem.locationName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Description
                  </label>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                    {selectedItem.description}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Time
                  </label>
                  <div className="text-sm font-medium text-slate-800 dark:text-white">
                    {new Date(selectedItem.reportedAt).toLocaleString()}
                  </div>
                </div>
              </>
            )}

            <button className="w-full bg-slate-800 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-slate-200 transition-colors flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 mr-2" /> View Area
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeoMap;
