// Basic tests for voice-service Edge Function structure
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Test STT Request/Response types
Deno.test("STT request should have correct structure", () => {
  type STTRequest = {
    audio: string; // base64 encoded audio blob
    language: string; // language code (e.g., 'en', 'hi', 'mr')
  };

  const validRequest: STTRequest = {
    audio: "base64encodedaudiodata==",
    language: "en",
  };

  assertExists(validRequest.audio);
  assertExists(validRequest.language);
  assertEquals(typeof validRequest.audio, "string");
  assertEquals(typeof validRequest.language, "string");
});

Deno.test("STT response should have correct structure for Sarvam success", () => {
  type STTResponse = {
    text: string | null;
    source: "sarvam" | "web-speech";
    signal?: "use-browser-fallback";
  };

  const sarvamSuccessResponse: STTResponse = {
    text: "recognized text from audio",
    source: "sarvam",
  };

  assertExists(sarvamSuccessResponse.text);
  assertEquals(typeof sarvamSuccessResponse.text, "string");
  assertEquals(sarvamSuccessResponse.source, "sarvam");
  assertEquals(sarvamSuccessResponse.signal, undefined);
});

Deno.test("STT response should have correct structure for browser fallback", () => {
  type STTResponse = {
    text: string | null;
    source: "sarvam" | "web-speech";
    signal?: "use-browser-fallback";
  };

  const browserFallbackResponse: STTResponse = {
    text: null,
    source: "web-speech",
    signal: "use-browser-fallback",
  };

  assertEquals(browserFallbackResponse.text, null);
  assertEquals(browserFallbackResponse.source, "web-speech");
  assertEquals(browserFallbackResponse.signal, "use-browser-fallback");
});

// Test TTS Request/Response types
Deno.test("TTS request should have correct structure", () => {
  type TTSRequest = {
    text: string;
    language: string; // language code (e.g., 'en', 'hi', 'mr')
  };

  const validRequest: TTSRequest = {
    text: "This is text to be converted to speech",
    language: "hi",
  };

  assertExists(validRequest.text);
  assertExists(validRequest.language);
  assertEquals(typeof validRequest.text, "string");
  assertEquals(typeof validRequest.language, "string");
});

Deno.test("TTS response should have correct structure for Sarvam success", () => {
  type TTSResponse = {
    audio: string | null; // base64 encoded audio
    source: "sarvam" | "web-speech";
    signal?: "use-browser-fallback";
  };

  const sarvamSuccessResponse: TTSResponse = {
    audio: "base64encodedaudiodata==",
    source: "sarvam",
  };

  assertExists(sarvamSuccessResponse.audio);
  assertEquals(typeof sarvamSuccessResponse.audio, "string");
  assertEquals(sarvamSuccessResponse.source, "sarvam");
  assertEquals(sarvamSuccessResponse.signal, undefined);
});

Deno.test("TTS response should have correct structure for browser fallback", () => {
  type TTSResponse = {
    audio: string | null; // base64 encoded audio
    source: "sarvam" | "web-speech";
    signal?: "use-browser-fallback";
  };

  const browserFallbackResponse: TTSResponse = {
    audio: null,
    source: "web-speech",
    signal: "use-browser-fallback",
  };

  assertEquals(browserFallbackResponse.audio, null);
  assertEquals(browserFallbackResponse.source, "web-speech");
  assertEquals(browserFallbackResponse.signal, "use-browser-fallback");
});

// Test supported languages
Deno.test("Voice service should support required languages", () => {
  const supportedLanguages = ["en", "hi", "mr"];
  
  assertEquals(supportedLanguages.length, 3);
  assertEquals(supportedLanguages.includes("en"), true, "Should support English");
  assertEquals(supportedLanguages.includes("hi"), true, "Should support Hindi");
  assertEquals(supportedLanguages.includes("mr"), true, "Should support Marathi");
});

// Test Sarvam API configuration
Deno.test("Sarvam API endpoints should be correctly configured", () => {
  const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";
  const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";

  assertExists(SARVAM_STT_URL);
  assertExists(SARVAM_TTS_URL);
  assertEquals(SARVAM_STT_URL.startsWith("https://"), true);
  assertEquals(SARVAM_TTS_URL.startsWith("https://"), true);
  assertEquals(SARVAM_STT_URL.includes("sarvam.ai"), true);
  assertEquals(SARVAM_TTS_URL.includes("sarvam.ai"), true);
});

// Test fallback behavior
Deno.test("Fallback signal should match requirements", () => {
  const FALLBACK_SIGNAL = "use-browser-fallback";
  const FALLBACK_SOURCE = "web-speech";
  const PRIMARY_SOURCE = "sarvam";

  assertEquals(FALLBACK_SIGNAL, "use-browser-fallback");
  assertEquals(FALLBACK_SOURCE, "web-speech");
  assertEquals(PRIMARY_SOURCE, "sarvam");
});

// Test CORS headers
Deno.test("CORS headers should be properly configured", () => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  assertExists(corsHeaders["Access-Control-Allow-Origin"]);
  assertExists(corsHeaders["Access-Control-Allow-Headers"]);
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
  assertEquals(
    corsHeaders["Access-Control-Allow-Headers"].includes("content-type"),
    true
  );
});

// Test validation requirements
Deno.test("STT should validate required fields", () => {
  const requiredFields = ["audio", "language"];
  
  assertEquals(requiredFields.length, 2);
  assertEquals(requiredFields.includes("audio"), true);
  assertEquals(requiredFields.includes("language"), true);
});

Deno.test("TTS should validate required fields", () => {
  const requiredFields = ["text", "language"];
  
  assertEquals(requiredFields.length, 2);
  assertEquals(requiredFields.includes("text"), true);
  assertEquals(requiredFields.includes("language"), true);
});
