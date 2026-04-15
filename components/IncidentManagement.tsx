import React, { useState, useMemo, useEffect } from "react";
import { Incident, Resource, Coordinate } from "../types";
import {
  ShieldAlert,
  AlertTriangle,
  Plus,
  Search,
  Navigation,
  Phone,
  MapPin,
  Eye,
  Siren,
  ArrowRight,
  ExternalLink,
  Camera,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import IncidentMediaModal from "./IncidentMediaModal";
import ReportIncidentModal from "./ReportIncidentModal";
import L from "leaflet";

const iconIncident = (type: string) =>
  new L.Icon({
    iconUrl: `https://unpkg.com/leaflet-color-markers/img/marker-icon-2x-${type === "accident" ? "red" : "gold"}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const iconResource = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet-color-markers/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface IncidentManagementProps {
  incidents: Incident[];
  resources: Resource[];
  onReportIncident: (data: Partial<Incident>) => void;
  onIncidentAction?: (id: string, action: "verify" | "flag") => void;
  currentLocation: Coordinate;
}

const MapController = ({ target }: { target: Coordinate }) => {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 14, { duration: 1.0 });
  }, [target, map]);
  return null;
};

const IncidentManagement: React.FC<IncidentManagementProps> = ({
  incidents,
  resources,
  onReportIncident,
  onIncidentAction,
  currentLocation,
}) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [isReporting, setIsReporting] = useState(false);
  const [viewingMediaId, setViewingMediaId] = useState<string | null>(null);
  const [dispatchAlert, setDispatchAlert] = useState<{
    msg: string;
    resource: string;
  } | null>(null);

  // Nearest Resources (Sorted by distance from current selection)
  const activeResources = useMemo(() => {
    const target = selectedIncident
      ? selectedIncident.coordinates
      : currentLocation;
    if (!resources.length) return [];

    return [...resources]
      .map((res) => {
        const dist = Math.sqrt(
          Math.pow(res.coordinates.lat - target.lat, 2) +
            Math.pow(res.coordinates.lng - target.lng, 2),
        );
        return { ...res, distance: dist };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [resources, selectedIncident, currentLocation]);

  const tomTomKey = process.env.REACT_APP_TOMTOM_KEY || "";

  const handleFormSubmit = (data: Partial<Incident>) => {
    onReportIncident(data);
    setIsReporting(false);

    // Auto-Alert Logic: Find nearest appropriate resource
    const nearestRes = activeResources[0];
    if (nearestRes) {
      setDispatchAlert({
        msg: `Alert dispatched to nearest ${nearestRes.type.toUpperCase()}`,
        resource: nearestRes.name,
      });
      setTimeout(() => setDispatchAlert(null), 5000); // Clear after 5s
    }
  };

  const activeMediaIncident = useMemo(
    () => incidents.find((i) => i.id === viewingMediaId),
    [incidents, viewingMediaId],
  );

  const mapCenter = selectedIncident
    ? selectedIncident.coordinates
    : currentLocation;

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-pink-50 overflow-hidden relative">
      {/* View Media Modal */}
      {activeMediaIncident && (
        <IncidentMediaModal
          incident={activeMediaIncident}
          onClose={() => setViewingMediaId(null)}
          onVerify={(id) => {
            onIncidentAction?.(id, "verify");
            setViewingMediaId(null);
          }}
          onFlag={(id) => {
            onIncidentAction?.(id, "flag");
            setViewingMediaId(null);
          }}
        />
      )}

      {/* Report Incident Modal */}
      {isReporting && (
        <ReportIncidentModal
          currentLocation={currentLocation}
          onClose={() => setIsReporting(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Dispatch Toast Alert */}
      {dispatchAlert && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[2000] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center animate-in slide-in-from-top-10 fade-in border border-slate-700">
          <Siren className="w-5 h-5 text-red-500 mr-3 animate-pulse" />
          <div>
            <div className="font-bold text-sm">{dispatchAlert.msg}</div>
            <div className="text-xs text-slate-400">
              {dispatchAlert.resource} notified successfully.
            </div>
          </div>
        </div>
      )}

      <div className="w-full lg:w-1/3 border-r border-pink-200 bg-white flex flex-col h-full z-10">
        <div className="p-6 border-b border-pink-100 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <ShieldAlert className="w-6 h-6 mr-2 text-red-500" />
              Incidents & Response
            </h2>
            <button
              onClick={() => setIsReporting(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white text-sm px-4 py-2 rounded-lg flex items-center shadow-lg shadow-pink-200 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" /> Report New
            </button>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search active reports..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-slate-700 text-sm focus:outline-none focus:border-pink-300 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedIncident?.id === inc.id
                  ? "bg-pink-50 border-pink-400 shadow-md ring-1 ring-pink-100"
                  : "bg-white border-pink-100 hover:bg-pink-50 hover:border-pink-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div
                    className={`p-2 rounded-lg mr-3 ${
                      inc.type === "accident"
                        ? "bg-red-100 text-red-600"
                        : inc.type === "closure"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-slate-800 font-bold text-sm uppercase flex items-center">
                      {inc.type}
                      {inc.severity === "critical" && (
                        <span className="ml-2 w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      )}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      {inc.locationName}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  {new Date(inc.reportedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {inc.title && (
                <div className="font-bold text-sm text-slate-700 mt-2 pl-11">
                  {inc.title}
                </div>
              )}

              <p className="text-xs text-slate-600 mt-1 pl-11 line-clamp-2 leading-relaxed">
                "{inc.description}"
              </p>

              {/* Action Bar */}
              <div className="flex gap-2 mt-3 ml-11">
                {inc.media && (
                  <button
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded flex items-center border border-slate-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingMediaId(inc.id);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" /> Media
                  </button>
                )}
              </div>
            </div>
          ))}
          {incidents.length === 0 && (
            <div className="text-center text-slate-400 py-10 flex flex-col items-center">
              <div className="bg-slate-100 p-4 rounded-full mb-3">
                <ShieldAlert className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-sm">No active incidents found.</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative">
        <div className="h-2/3 w-full bg-white relative z-0">
          <MapContainer
            center={[currentLocation.lat, currentLocation.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://tomtom.com">TomTom</a>'
              url={
                tomTomKey
                  ? `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${tomTomKey}`
                  : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              }
            />
            <MapController target={mapCenter} />

            {incidents.map((inc) => (
              <Marker
                key={inc.id}
                position={[inc.coordinates.lat, inc.coordinates.lng]}
                icon={iconIncident(inc.type)}
                {...({
                  eventHandlers: {
                    click: () => setSelectedIncident(inc),
                  },
                } as any)}
              >
                <Popup className="text-slate-900 font-sans min-w-[200px]">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold uppercase text-slate-700 text-xs">
                      {inc.type}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getSeverityColor(inc.severity)}`}
                    >
                      {inc.severity || "Medium"}
                    </span>
                  </div>
                  <div className="text-sm font-bold mb-1">
                    {inc.title || "Incident Report"}
                  </div>
                  <div className="text-xs text-slate-600 mb-3">
                    {inc.description}
                  </div>
                </Popup>
              </Marker>
            ))}

            {activeResources.map((res) => (
              <Marker
                key={res.id}
                position={[res.coordinates.lat, res.coordinates.lng]}
                icon={iconResource}
              >
                <Popup className="text-slate-900 font-sans">
                  <div className="font-bold text-blue-800">{res.name}</div>
                  <div className="text-xs">{res.type}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="h-1/3 bg-white border-t border-pink-200 p-6 flex flex-col z-10">
          <h3 className="text-slate-800 font-bold flex items-center mb-4">
            <Navigation className="w-5 h-5 mr-2 text-pink-600" />
            Nearest Actionable Resources
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
            {activeResources.map((res, idx) => (
              <div
                key={res.id}
                className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-pink-400 transition-colors group relative overflow-hidden"
              >
                {idx === 0 && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-bl font-bold">
                    CLOSEST
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold mr-3 border border-blue-100">
                      {idx + 1}
                    </div>
                    <div>
                      <div
                        className="text-slate-800 font-bold text-sm line-clamp-1"
                        title={res.name}
                      >
                        {res.name}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {res.type.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 bg-white hover:bg-slate-100 text-slate-600 text-xs py-2 rounded border border-slate-300 flex items-center justify-center">
                    <Phone className="w-3 h-3 mr-1" /> Call
                  </button>
                </div>
              </div>
            ))}
            {activeResources.length === 0 && (
              <div className="col-span-3 text-center text-slate-400 text-sm py-4">
                Searching for nearby resources...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentManagement;
