const axios = require("axios");

const getGeminiUrl = () => {
  return `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
};

/* ======================================================
   SAFE JSON EXTRACTOR (AUTO REPAIR)
====================================================== */
function extractAndFixJSON(text) {
  if (!text) throw new Error("Empty response from model");

  // Remove markdown if present
  text = text.replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch { }

  // Try extracting first valid JSON block
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    const possibleJson = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(possibleJson);
    } catch { }
  }

  console.error("Unrecoverable JSON:", text);
  throw new Error("Model did not return valid JSON");
}

/* ======================================================
   ANALYZE EMERGENCY (ROBUST VERSION)
====================================================== */
const analyzeEmergency = async (imageBase64, voiceTranscript) => {
  const parts = [];

  parts.push({
    text: `
You are an emergency AI.

Analyze the emergency image and transcript.

Transcript: "${voiceTranscript || "None"}"

Return ONLY valid JSON:

{
"incidentType": "Fire | Medical | Security | Flood | Electrical | Other",
"severity": "Low | Medium | High | Critical",
"description": "Short description",
"immediateAction": "Immediate action",
"alertRecipients": ["Nearest Staff"],
"evacuationNeeded": true,
"confidence": 0-100
}

No markdown. No explanation.
`
  });

  if (imageBase64) {
    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    });
  }

  try {
    const response = await axios.post(
      getGeminiUrl(),
      {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1200
        }
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const text =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return extractAndFixJSON(text);

  } catch (error) {
    console.error(
      "Gemini analysis error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to analyze emergency");
  }
};

/* ======================================================
   CRISIS BOT
====================================================== */
const getCrisisBotResponse = async (message, incidentContext) => {
  try {
    const response = await axios.post(
      getGeminiUrl(),
      {
        contents: [{
          parts: [{
            text: `
You are CrisisBot for ASAP hotel emergency system.

Incident:
Type: ${incidentContext.type || "Unknown"}
Severity: ${incidentContext.severity || "Unknown"}
Room: ${incidentContext.roomNumber || "Unknown"}
Floor: ${incidentContext.floor || "Unknown"}
Role: ${incidentContext.userRole || "Guest"}

User message:
"${message}"

Give clear emergency guidance in under 3 sentences.
`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 400
        }
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    return (
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to process request. Contact staff immediately."
    );

  } catch (error) {
    console.error(
      "CrisisBot error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to generate crisis guidance");
  }
};

/* ======================================================
   INCIDENT REPORT GENERATOR
====================================================== */
const generateIncidentReport = async (incidents) => {
  try {
    const summary = incidents
      .map((inc, i) =>
        `${i + 1}. ${inc.type} | ${inc.severity} | Room ${inc.roomNumber} | Floor ${inc.floor} | ${inc.status}`
      )
      .join("\n");

    const response = await axios.post(
      getGeminiUrl(),
      {
        contents: [{
          parts: [{
            text: `
Generate a professional hotel emergency report.

Incidents:
${summary}

Sections:
## Summary
## Timeline
## Staff Performance
## Recommendations
`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1200
        }
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    return (
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate report."
    );

  } catch (error) {
    console.error(
      "Report generation error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to generate incident report");
  }
};

module.exports = {
  analyzeEmergency,
  getCrisisBotResponse,
  generateIncidentReport
};