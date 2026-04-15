/// <reference types="vite/client" />
import { Coordinate, Suggestion, Resource, Incident } from "../types";

const API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

// ❌ REMOVE PROXY — DIRECT CALL
const fetchDirect = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

export const isTomTomConfigured = () => !!API_KEY;

export const getTomTomTrafficFlowUrl = () =>
  `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${API_KEY}`;

// ----------------------
// ✅ REVERSE GEOCODE
// ----------------------
export const reverseGeocodeTomTom = async (
  lat: number,
  lng: number,
): Promise<string> => {
  try {
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${API_KEY}`;
    const data = await fetchDirect(url);

    const addr = data.addresses?.[0]?.address;
    if (!addr) return "Unknown Location";

    return (
      addr.streetName ||
      addr.municipalitySubdivision ||
      addr.neighbourhood ||
      addr.municipality ||
      "Unknown Location"
    );
  } catch {
    return "Unknown Location";
  }
};

// ----------------------
// ✅ DETAILED GEO (FIXED)
// ----------------------
export const reverseGeocodeDetailed = async (
  lat: number,
  lng: number,
): Promise<string> => {
  try {
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${API_KEY}`;
    const data = await fetchDirect(url);

    const addr = data.addresses?.[0]?.address;
    if (!addr) return `Area near ${lat.toFixed(3)}, ${lng.toFixed(3)}`;

    return (
      addr.streetName ||
      addr.municipalitySubdivision ||
      addr.neighbourhood ||
      addr.freeformAddress ||
      addr.municipality ||
      `Area near ${lat.toFixed(3)}, ${lng.toFixed(3)}`
    );
  } catch {
    return `Area near ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
};

// ----------------------
// ✅ TRAFFIC FLOW
// ----------------------
export const fetchFlowSegmentData = async (lat: number, lng: number) => {
  try {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${API_KEY}&point=${lat},${lng}`;
    const data = await fetchDirect(url);

    return data.flowSegmentData
      ? {
          currentSpeed: data.flowSegmentData.currentSpeed,
          freeFlowSpeed: data.flowSegmentData.freeFlowSpeed,
        }
      : null;
  } catch {
    return null;
  }
};

// ----------------------
// ✅ INCIDENTS (NO MOCK)
// ----------------------
// ----------------------
// ✅ NEARBY EMERGENCY RESOURCES (REAL)
// ----------------------
export const fetchNearbyResources = async (
  lat: number,
  lng: number,
): Promise<Resource[]> => {
  try {
    const url = `https://api.tomtom.com/search/2/search/emergency.json?key=${API_KEY}&lat=${lat}&lon=${lng}&radius=5000&limit=10`;

    const data = await fetchDirect(url);

    if (!data.results) return [];

    return data.results.map((r: any) => {
      let type: Resource["type"] = "safe_zone";

      const name = r.poi?.name?.toLowerCase() || "";

      if (name.includes("hospital")) type = "hospital";
      else if (name.includes("police")) type = "police";
      else if (name.includes("fire")) type = "fire_station";

      return {
        id: r.id,
        name: r.poi?.name || "Emergency Resource",
        type,
        coordinates: {
          lat: r.position.lat,
          lng: r.position.lon,
        },
        available: true,
        contact: r.poi?.phone || "Emergency",
      };
    });
  } catch (error) {
    console.error("Nearby Resource Error:", error);
    return [];
  }
};

// ----------------------
// ✅ SEARCH
// ----------------------
export const getPlaceSuggestions = async (
  query: string,
  lat?: number,
  lng?: number,
): Promise<Suggestion[]> => {
  if (query.length < 3) return [];

  try {
    let url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${API_KEY}&limit=5`;

    if (lat && lng) url += `&lat=${lat}&lon=${lng}`;

    const data = await fetchDirect(url);

    return (
      data.results?.map((r: any) => ({
        id: r.id,
        label: r.poi?.name || r.address.freeformAddress,
        subLabel: r.address.countrySubdivision,
        coordinate: { lat: r.position.lat, lng: r.position.lon },
      })) || []
    );
  } catch {
    return [];
  }
};

// ----------------------
// ✅ ROUTING
// ----------------------
export const fetchTomTomRoute = async (
  start: Coordinate,
  end: Coordinate,
  type: string,
) => {
  const locations = `${start.lat},${start.lng}:${end.lat},${end.lng}`;

  const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${API_KEY}&routeType=${type}&traffic=true&instructionsType=tagged&routeRepresentation=polyline`;

  try {
    const data = await fetchDirect(url);
    return data.routes ? data : null;
  } catch {
    return null;
  }
};
