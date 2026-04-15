import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Map as MapIcon,
  Route as RouteIcon,
  ShieldAlert,
  Settings,
  Search,
  Bell,
  LogOut,
  Moon,
  Sun,
  MapPin,
  RefreshCw,
  User as UserIcon,
  Crosshair,
  FileText,
  Menu,
  X,
  AlertCircle,
} from "lucide-react";
import GeoMap from "./components/GeoMap";
import Dashboard from "./components/Dashboard";
import AgentAssist from "./components/AgentAssist";
import RoutePlanner from "./components/RoutePlanner";
import Auth from "./components/Auth";
import IncidentManagement from "./components/IncidentManagement";
import { TomTomTest } from "./components/TomTomTest";
import LandingPage from "./components/LandingPage";
import ReportsView from "./components/ReportsView";
import LocationDrawer from "./components/LocationDrawer";
import { detectPollutionHotspots } from "./services/geofenceService";
import {
  ZoneData,
  Incident,
  Coordinate,
  UserProfile,
  Geofence,
  Suggestion,
} from "./types";
import { auth, onAuthStateChanged, signOut } from "./services/firebase";
import { useLiveData } from "./hooks/useLiveData";
import {
  getPlaceSuggestions,
  reverseGeocodeTomTom,
} from "./services/tomtomService";
import Logo from "./components/Logo";

// Default Fallback Location (Pune) if EVERYTHING fails
const INITIAL_CENTER = { lat: 18.5204, lng: 73.8567 };

// Sleek Nav Item
const NavItem = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center justify-center lg:justify-start w-12 lg:w-full lg:px-4 py-3 rounded-2xl transition-all duration-300 ${
      active
        ? "bg-urban-green text-white shadow-glow"
        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`}
  >
    <div className="relative z-10">{icon}</div>
    <span
      className={`hidden lg:block ml-3 text-sm font-semibold ${active ? "text-white" : "text-slate-600 dark:text-slate-400"}`}
    >
      {label}
    </span>
    {active && (
      <div className="absolute inset-0 bg-urban-green rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
    )}
  </button>
);

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  // Navigation State
  const [currentView, setCurrentView] = useState("dashboard");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Core Data State
  const [center, setCenter] = useState<Coordinate | null>(null);
  const [activeGeofences, setActiveGeofences] = useState<Geofence[]>([]);
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);

  // Selection State for Drawer
  const [selectedItem, setSelectedItem] = useState<ZoneData | Incident | null>(
    null,
  );

  const [locating, setLocating] = useState(false);
  const [currentCity, setCurrentCity] = useState<string>("Locating...");
  const [locationError, setLocationError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<Suggestion | null>(
    null,
  );

  // Live Data Hook - Initialize with fallback to prevent hook crash if center is null initially
  const {
    zones,
    incidents: liveIncidents,
    resources,
    weeklyStats,
    currentCity: hookCity,
    loading: dataLoading,
    refreshData,
    alerts: incomingAlerts,
    currentTrafficSpeed,
  } = useLiveData(center || INITIAL_CENTER);

  const allIncidents = [...userIncidents, ...liveIncidents];

  // UX States
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const alerts = incomingAlerts.filter(
    (a) => !dismissedAlertIds.includes(a.id),
  );

  // --- Effects ---

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser)
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
        });
      else setUser(null);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // --- ROBUST LOCATION STRATEGY ---
  const handleLocateMe = async () => {
    setLocating(true);
    setCurrentCity("Locating...");
    setLocationError(null);

    // 1. Try High-Accuracy GPS (Browser)
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation)
            return reject(new Error("GPS not supported"));
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0,
          });
        },
      );

      console.log(
        "✅ GPS Locked:",
        position.coords.latitude,
        position.coords.longitude,
      );
      const newCenter = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCenter(newCenter);
      setLocating(false);

      // Fetch specific address immediately
      reverseGeocodeTomTom(newCenter.lat, newCenter.lng).then((name) => {
        if (name) setCurrentCity(name);
      });
      return;
    } catch (gpsError: any) {
      console.warn(
        "⚠️ GPS Failed. Switching to IP Geolocation.",
        gpsError.message,
      );
      setLocationError("GPS blocked. Using IP location...");
    }

    // 2. High-Reliability IP Fallback (geojs.io)
    // Works reliably in most browsers and AI Studio
    try {
      const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
      if (res.ok) {
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          console.log("✅ IP Location Found (GeoJS):", lat, lng);
          const newCenter = { lat, lng };
          setCenter(newCenter);

          // Construct location name from IP data first
          setCurrentCity(`${data.city}, ${data.country}`);
          setLocating(false);
          setLocationError(null);

          // Then refine with TomTom for street level if possible
          reverseGeocodeTomTom(lat, lng).then((name) => {
            if (name) setCurrentCity(name);
          });
          return;
        }
      }
    } catch (ipError) {
      console.error("❌ IP Geolocation Failed:", ipError);
    }

    // 3. Final Fallback
    console.error("❌ All Location Strategies Failed. Using Default.");
    setCenter(INITIAL_CENTER);
    setLocating(false);
    setCurrentCity("Pune (Default)");
    setLocationError("Location services unavailable. Showing default.");
    setTimeout(() => setLocationError(null), 5000);
  };

  // Run location detection once on mount
  useEffect(() => {
    handleLocateMe();
  }, []);

  // Sync city name when center changes (e.g. Map Drag or Search)
  useEffect(() => {
    let active = true;
    if (center) {
      reverseGeocodeTomTom(center.lat, center.lng).then((name) => {
        if (active && name) setCurrentCity(name);
      });
    }
    return () => {
      active = false;
    };
  }, [center]);

  // Keep hook city in sync if it updates
  useEffect(() => {
    if (
      hookCity &&
      hookCity !== "Locating..." &&
      hookCity !== "Unknown Location"
    )
      setCurrentCity(hookCity);
  }, [hookCity]);

  useEffect(() => {
    setActiveGeofences(detectPollutionHotspots(zones));
  }, [zones]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        const results = await getPlaceSuggestions(
          searchQuery,
          center?.lat,
          center?.lng,
        );
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, center]);

  const handleSearchSelect = (s: Suggestion) => {
    setCenter(s.coordinate);
    setSearchedLocation(s);
    setSearchQuery("");
    setShowSuggestions(false);
    handleNavigate("map");
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setSelectedItem(null);
    setShowMobileMenu(false);
  };

  // Handle click on Map Items (Open Drawer)
  const handleMapItemClick = (item: ZoneData | Incident) => {
    setSelectedItem(item);
    setCenter(item.coordinates);
  };

  const handleReportIncident = (data: Partial<Incident>) => {
    const incCoords = data.coordinates || center;
    if (!incCoords) return;
    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      type: data.type || "hazard",
      description: data.description || "User Reported",
      title: data.title || "Incident Report",
      severity: data.severity || "medium",
      locationName: data.locationName || "My Reported Location",
      coordinates: incCoords,
      reportedAt: new Date(),
      verified: false,
      upvotes: 1,
      media: data.media,
    };
    setUserIncidents((prev) => [newInc, ...prev]);
  };

  const handleIncidentAction = (id: string, action: "verify" | "flag") => {
    setUserIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== id) return inc;
        if (action === "verify")
          return { ...inc, verified: true, upvotes: inc.upvotes + 1 };
        if (action === "flag")
          return { ...inc, upvotes: Math.max(0, inc.upvotes - 1) };
        return inc;
      }),
    );
  };

  const handleRedirect = (target: string, loc?: Coordinate) => {
    if (loc) {
      setCenter(loc);
      handleNavigate("map");
    }
  };

  if (loadingAuth)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-urban-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  // Logic for Rendering Views
  if (!user) {
    if (showAuth) {
      return (
        <Auth
          onLogin={(u) => {
            setUser(u);
            setShowAuth(false);
          }}
          onBack={() => setShowAuth(false)}
        />
      );
    }
    return <LandingPage onLoginClick={() => setShowAuth(true)} user={user} />;
  }

  // Logged In Dashboard
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Location Error Toast */}
      {locationError && (
        <div className="fixed top-24 right-4 z-[9999] bg-white dark:bg-slate-800 border-l-4 border-orange-500 shadow-xl p-4 rounded-r-lg animate-in slide-in-from-right fade-in duration-300 max-w-sm flex items-start">
          <AlertCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              Location Alert
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {locationError}
            </p>
          </div>
          <button
            onClick={() => setLocationError(null)}
            className="ml-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modern Floating Sidebar (Desktop) */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-glass rounded-[2rem] z-50 flex-col py-6 transition-all duration-300">
        <div className="px-6 mb-8">
          <Logo
            className="w-10 h-10"
            showText={true}
            orientation="horizontal"
          />
        </div>

        <nav className="flex-1 space-y-2 px-3 w-full">
          <NavItem
            icon={<LayoutDashboard />}
            label="Dashboard"
            active={currentView === "dashboard"}
            onClick={() => handleNavigate("dashboard")}
          />
          <NavItem
            icon={<MapIcon />}
            label="Live Map"
            active={currentView === "map"}
            onClick={() => handleNavigate("map")}
          />
          <NavItem
            icon={<RouteIcon />}
            label="Routes"
            active={currentView === "routes"}
            onClick={() => handleNavigate("routes")}
          />
          <NavItem
            icon={<ShieldAlert />}
            label="Incidents"
            active={currentView === "incidents"}
            onClick={() => handleNavigate("incidents")}
          />
          <NavItem
            icon={<FileText />}
            label="Reports"
            active={currentView === "reports"}
            onClick={() => handleNavigate("reports")}
          />
        </nav>

        <div className="mt-auto px-3 w-full border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
          <NavItem
            icon={<Settings />}
            label="Settings"
            active={currentView === "settings"}
            onClick={() => handleNavigate("settings")}
          />
          <button
            onClick={() => {
              signOut(auth);
              setUser(null);
              setShowAuth(false);
            }}
            className="w-full flex items-center justify-start px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3 text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header / Sidebar Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
        <Logo className="w-8 h-8" showText={true} />
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 text-slate-600 dark:text-slate-300"
        >
          {showMobileMenu ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-slate-900 pt-20 px-6 space-y-4 lg:hidden animate-in slide-in-from-right">
          <NavItem
            icon={<LayoutDashboard />}
            label="Dashboard"
            active={currentView === "dashboard"}
            onClick={() => handleNavigate("dashboard")}
          />
          <NavItem
            icon={<MapIcon />}
            label="Live Map"
            active={currentView === "map"}
            onClick={() => handleNavigate("map")}
          />
          <NavItem
            icon={<RouteIcon />}
            label="Routes"
            active={currentView === "routes"}
            onClick={() => handleNavigate("routes")}
          />
          <NavItem
            icon={<ShieldAlert />}
            label="Incidents"
            active={currentView === "incidents"}
            onClick={() => handleNavigate("incidents")}
          />
          <NavItem
            icon={<FileText />}
            label="Reports"
            active={currentView === "reports"}
            onClick={() => handleNavigate("reports")}
          />
          <NavItem
            icon={<Settings />}
            label="Settings"
            active={currentView === "settings"}
            onClick={() => handleNavigate("settings")}
          />
          <button
            onClick={() => {
              signOut(auth);
              setUser(null);
              setShowAuth(false);
            }}
            className="w-full flex items-center px-4 py-3 text-red-500 font-bold mt-8 border-t border-slate-100"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sign Out
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-72 mr-0 lg:mr-4 my-0 lg:my-4 bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm lg:rounded-[2.5rem] border-0 lg:border border-white/40 dark:border-slate-700/50 shadow-inner overflow-hidden relative pt-16 lg:pt-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-20 items-center justify-between px-8 py-4 z-20">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white text-sm rounded-full focus:ring-2 focus:ring-urban-green focus:border-transparent block w-full pl-10 p-3 shadow-sm transition-all"
              placeholder="Search city, district, or place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSearchSelect(s)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700 flex items-center"
                  >
                    <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">
                        {s.label}
                      </div>
                      <div className="text-xs text-slate-500">{s.subLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4 ml-6">
            <div className="hidden md:flex items-center px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm">
              <MapPin className="w-4 h-4 text-urban-green mr-2" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {currentCity}
              </span>
            </div>

            <button
              onClick={handleLocateMe}
              className={`p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md transition-all ${locating ? "animate-pulse text-urban-green" : "text-slate-600 dark:text-slate-300"}`}
              title="Locate Me (GPS)"
            >
              <Crosshair className="w-5 h-5" />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-yellow-400"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <div className="relative" ref={notificationRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications((prev) => !prev);
                }}
                className={`p-3 rounded-full shadow-sm hover:shadow-md transition-all relative ${
                  showNotifications
                    ? "bg-slate-100 dark:bg-slate-700 text-slate-800"
                    : "bg-white dark:bg-slate-800 text-slate-600"
                }`}
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-4 w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[60] p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                      Notifications
                    </h4>
                    {alerts.length > 0 && (
                      <button
                        onClick={() =>
                          setDismissedAlertIds((prev) => [
                            ...prev,
                            ...alerts.map((a) => a.id),
                          ])
                        }
                        className="text-[10px] text-blue-500 hover:underline"
                      >
                        Dismiss All
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                    {alerts.length === 0 ? (
                      <div className="text-center py-6 text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No active alerts</p>
                      </div>
                    ) : (
                      alerts.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-start">
                            <div
                              className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${a.severity === "high" ? "bg-red-50" : "bg-orange-400"}`}
                            ></div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-white mb-0.5">
                                {a.title}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 leading-tight">
                                {a.description}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(a.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-urban-green to-urban-blue p-0.5 cursor-pointer">
                <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-sm font-bold text-slate-700 dark:text-white">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
              </div>
              {/* Profile Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 hidden group-hover:block z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                  <div className="font-bold text-sm text-slate-800 dark:text-white">
                    {user.displayName || "User"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={() => handleNavigate("settings")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    signOut(auth);
                    setUser(null);
                    setShowAuth(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-hidden relative p-1 lg:px-8 h-full">
          {center ? (
            <>
              {/* View Router */}
              {currentView === "dashboard" && (
                <Dashboard
                  currentLocation={center}
                  incidents={allIncidents}
                  onNavigate={handleNavigate}
                  weeklyStats={weeklyStats}
                  zones={zones}
                  alerts={alerts}
                  currentTrafficSpeed={currentTrafficSpeed ?? undefined}
                />
              )}
              {currentView === "map" && (
                <div className="h-full w-full rounded-3xl overflow-hidden shadow-inner border border-white/20 relative">
                  <GeoMap
                    zones={zones}
                    incidents={allIncidents}
                    geofences={activeGeofences}
                    center={center}
                    onZoneClick={handleMapItemClick}
                    currentCity={currentCity}
                    onNavigate={handleNavigate}
                    onSearchArea={setCenter}
                    searchedPlace={searchedLocation}
                    darkMode={darkMode}
                  />
                  <LocationDrawer
                    data={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onNavigate={() => handleNavigate("routes")}
                  />
                </div>
              )}
              {currentView === "routes" && (
                <div className="h-full rounded-3xl overflow-hidden shadow-inner flex flex-col">
                  <RoutePlanner
                    activeGeofences={activeGeofences}
                    currentLocation={center}
                    zones={zones}
                  />
                </div>
              )}
              {currentView === "incidents" && (
                <div className="h-full rounded-3xl overflow-hidden shadow-inner">
                  <IncidentManagement
                    incidents={allIncidents}
                    onReportIncident={handleReportIncident}
                    onIncidentAction={handleIncidentAction}
                    currentLocation={center}
                    resources={resources}
                  />
                </div>
              )}
              {currentView === "reports" && (
                <ReportsView weeklyStats={weeklyStats} zones={zones} />
              )}
              {currentView === "settings" && (
                <div className="h-full overflow-y-auto bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-3xl p-8">
                  <TomTomTest
                    darkMode={darkMode}
                    onToggleTheme={() => setDarkMode(!darkMode)}
                  />
                </div>
              )}

              {/* Global AI Assistant Overlay */}
              <AgentAssist
                currentLocation={center}
                onRedirect={handleRedirect}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full flex-col text-slate-400">
              <RefreshCw className="w-10 h-10 animate-spin mb-4 text-urban-green" />
              <span className="text-sm font-medium tracking-wide">
                INITIALIZING GEOSENSE CORE...
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
