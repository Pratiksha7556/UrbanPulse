import { GoogleGenAI } from "@google/genai";
import { fetchNearbyResources } from "./tomtomService";

let ai: GoogleGenAI | null = null;

// ✅ FIX: Use Vite env instead of process.env
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

  if (!ai && apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }

  return ai;
};

// 🧠 MAP INSIGHT
export const generateMapInsight = async (
  viewName: string,
  currentData: any,
): Promise<string> => {
  const client = getAI();

  if (!client) {
    return "AI insights unavailable. Check API configuration.";
  }

  const prompt = `
Analyze urban data for "${viewName}".

Data:
${JSON.stringify(currentData)}

Give:
1. One short insight (traffic vs pollution)
2. One actionable suggestion

Max 2 sentences total.
`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No insight generated.";
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Unable to generate insights right now.";
  }
};

// 🚨 SOS HANDLER
export const handleAgentSOS = async (
  userMessage: string,
  location: { lat: number; lng: number },
) => {
  const client = getAI();

  // ✅ Fetch REAL nearby resources
  let resourcesContext = "";

  try {
    const resources = await fetchNearbyResources(location.lat, location.lng);

    resourcesContext = resources
      .map(
        (r: {
          name: any;
          type: any;
          coordinates: { lat: any; lng: any };
          contact: any;
        }) =>
          `- ${r.name} (${r.type}) @ (${r.coordinates.lat}, ${r.coordinates.lng}) Contact: ${r.contact}`,
      )
      .join("\n");
  } catch (e) {
    console.warn("Resource fetch failed:", e);
    resourcesContext = "No live resource data available.";
  }

  // ❌ NO AI → fallback
  if (!client) {
    return {
      text: "AI unavailable. Showing nearest resources on map.",
      action: {
        type: "map_update",
        target: "Nearby resources",
        location,
      },
    };
  }

  const systemInstruction = `
You are UrbanPulse Emergency AI.

User Location: ${JSON.stringify(location)}

Available Resources:
${resourcesContext}

Rules:
- Always return valid JSON
- If emergency → redirect to nearest hospital/police
- If user is lost → guide to nearest safe place
- If general query → respond normally

Format:
{
  "text": "...",
  "action": {
    "type": "redirect" | "map_update" | "none",
    "target": "string",
    "location": { "lat": number, "lng": number }
  }
}
`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    // ✅ SAFE JSON PARSE
    try {
      return JSON.parse(text || "");
    } catch {
      console.warn("Invalid AI JSON, using fallback");

      return {
        text: text || "I couldn't process that properly.",
        action: { type: "none" },
      };
    }
  } catch (error) {
    console.error("SOS Error:", error);

    return {
      text: "Emergency system unavailable. Please contact local authorities immediately.",
      action: {
        type: "none",
      },
    };
  }
};
