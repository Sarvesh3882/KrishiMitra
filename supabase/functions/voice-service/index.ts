// voice-service Edge Function
// Handles STT (Speech-to-Text) and TTS (Text-to-Speech) via Sarvam AI
// Falls back to browser Web Speech API when Sarvam AI is unavailable

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";
const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";

interface STTRequest {
  audio: string; // base64 encoded audio blob
  language: string; // language code (e.g., 'en', 'hi', 'mr')
}

interface TTSRequest {
  text: string;
  language: string; // language code (e.g., 'en', 'hi', 'mr')
}

interface STTResponse {
  text: string | null;
  source: "sarvam" | "web-speech";
  signal?: "use-browser-fallback";
}

interface TTSResponse {
  audio: string | null; // base64 encoded audio
  source: "sarvam" | "web-speech";
  signal?: "use-browser-fallback";
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // Route: POST /stt - Speech to Text
    if (path.endsWith("/stt") && req.method === "POST") {
      const body: STTRequest = await req.json();
      const { audio, language } = body;

      if (!audio || !language) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: audio, language" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if Sarvam API key is available
      if (!SARVAM_API_KEY) {
        console.log("Sarvam API key not configured, signaling browser fallback");
        const fallbackResponse: STTResponse = {
          text: null,
          source: "web-speech",
          signal: "use-browser-fallback",
        };
        return new Response(JSON.stringify(fallbackResponse), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Call Sarvam AI STT endpoint
      try {
        const sarvamResponse = await fetch(SARVAM_STT_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SARVAM_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio: audio,
            language_code: language,
          }),
        });

        if (!sarvamResponse.ok) {
          throw new Error(`Sarvam API returned ${sarvamResponse.status}`);
        }

        const sarvamData = await sarvamResponse.json();
        const recognizedText = sarvamData.text || sarvamData.transcript || "";

        const successResponse: STTResponse = {
          text: recognizedText,
          source: "sarvam",
        };

        return new Response(JSON.stringify(successResponse), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (sarvamError) {
        console.error("Sarvam STT failed:", sarvamError);
        
        // Signal browser fallback
        const fallbackResponse: STTResponse = {
          text: null,
          source: "web-speech",
          signal: "use-browser-fallback",
        };
        return new Response(JSON.stringify(fallbackResponse), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Route: POST /tts - Text to Speech
    if (path.endsWith("/tts") && req.method === "POST") {
      const body: TTSRequest = await req.json();
      const { text, language } = body;

      if (!text || !language) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: text, language" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if Sarvam API key is available
      if (!SARVAM_API_KEY) {
        console.log("Sarvam API key not configured, signaling browser fallback");
        const fallbackResponse: TTSResponse = {
          audio: null,
          source: "web-speech",
          signal: "use-browser-fallback",
        };
        return new Response(JSON.stringify(fallbackResponse), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Call Sarvam AI TTS endpoint
      try {
        const sarvamResponse = await fetch(SARVAM_TTS_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SARVAM_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            language_code: language,
          }),
        });

        if (!sarvamResponse.ok) {
          throw new Error(`Sarvam API returned ${sarvamResponse.status}`);
        }

        const sarvamData = await sarvamResponse.json();
        const audioBase64 = sarvamData.audio || sarvamData.audio_base64 || "";

        const successResponse: TTSResponse = {
          audio: audioBase64,
          source: "sarvam",
        };

        return new Response(JSON.stringify(successResponse), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (sarvamError) {
        console.error("Sarvam TTS failed:", sarvamError);
        
        // Signal browser fallback
        const fallbackResponse: TTSResponse = {
          audio: null,
          source: "web-speech",
          signal: "use-browser-fallback",
        };
        return new Response(JSON.stringify(fallbackResponse), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Unknown route
    return new Response(
      JSON.stringify({ error: "Not found. Use POST /stt or POST /tts" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Voice service error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
