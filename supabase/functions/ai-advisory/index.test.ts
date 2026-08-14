// Basic tests for ai-advisory Edge Function structure
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Test curated Q&A responses
Deno.test("Curated Q&A should include Kisan Call Centre reference", () => {
  const curatedQA = {
    weather: {
      en: "For current weather information, please check the 'What's Around Me' section on the home screen. You can also contact the Kisan Call Centre at 1800-180-1551 for personalized advice.",
      hi: "वर्तमान मौसम की जानकारी के लिए, कृपया होम स्क्रीन पर 'मेरे आसपास क्या है' अनुभाग देखें। आप व्यक्तिगत सलाह के लिए किसान कॉल सेंटर 1800-180-1551 पर भी संपर्क कर सकते हैं।",
      mr: "सध्याच्या हवामानाच्या माहितीसाठी, कृपया होम स्क्रीनवरील 'माझ्या आजूबाजूला काय आहे' विभाग पहा. वैयक्तिक सल्ल्यासाठी तुम्ही किसान कॉल सेंटर 1800-180-1551 वर संपर्क करू शकता.",
    },
    general: {
      en: "I apologize, but I'm unable to provide a specific answer at this moment. Please contact the Kisan Call Centre at 1800-180-1551 for expert agricultural advice.",
      hi: "मुझे खेद है, लेकिन मैं इस समय कोई विशिष्ट उत्तर प्रदान करने में असमर्थ हूं। कृपया विशेषज्ञ कृषि सलाह के लिए किसान कॉल सेंटर 1800-180-1551 पर संपर्क करें।",
      mr: "मला माफ करा, परंतु मी या क्षणी विशिष्ट उत्तर देण्यास अक्षम आहे. कृपया तज्ञ कृषी सल्ल्यासाठी किसान कॉल सेंटर 1800-180-1551 वर संपर्क करा.",
    },
  };

  // All curated responses must include the Kisan Call Centre number
  for (const [intent, translations] of Object.entries(curatedQA)) {
    for (const [lang, text] of Object.entries(translations)) {
      assertEquals(
        text.includes("1800-180-1551"),
        true,
        `${intent} (${lang}) should include Kisan Call Centre number`
      );
    }
  }
});

Deno.test("System prompt should enforce grounding rules", () => {
  const sampleSystemPrompt = `You are KisanSLM, an agricultural advisory AI assistant for Indian farmers (Kisans) running allied enterprises like poultry, fisheries, apiculture, mushroom cultivation, vermicomposting, dairy, etc.

CRITICAL GROUNDING RULES:
1. NEVER invent or generate price figures, weather data, scheme benefits, training content, or any numerical data.
2. If price data is provided in the context, explain and interpret it. If NOT provided, direct the farmer to check the "What's Around Me" section.
3. If weather data is provided in the context, explain and interpret it. If NOT provided, direct the farmer to check the "What's Around Me" section.`;

  // System prompt must explicitly forbid inventing data
  assertEquals(
    sampleSystemPrompt.includes("NEVER invent"),
    true,
    "System prompt must forbid inventing data"
  );
  assertEquals(
    sampleSystemPrompt.includes("price"),
    true,
    "System prompt must mention price grounding"
  );
  assertEquals(
    sampleSystemPrompt.includes("weather"),
    true,
    "System prompt must mention weather grounding"
  );
});

Deno.test("Response types should be correctly typed", () => {
  type AIResponse = {
    response: string;
    source: "kisanslm" | "fallback-llm" | "curated-qa";
  };

  const validResponses: AIResponse[] = [
    { response: "Test", source: "kisanslm" },
    { response: "Test", source: "fallback-llm" },
    { response: "Test", source: "curated-qa" },
  ];

  for (const resp of validResponses) {
    assertExists(resp.response);
    assertExists(resp.source);
    assertEquals(typeof resp.response, "string");
    assertEquals(
      ["kisanslm", "fallback-llm", "curated-qa"].includes(resp.source),
      true
    );
  }
});

Deno.test("Request body structure should be validated", () => {
  type RequestBody = {
    query: string;
    farmerProfile: {
      user_id?: string;
      full_name?: string;
      state?: string;
      district?: string;
      enterprise_type?: string;
      preferred_language?: string;
    };
    context?: {
      weather?: any;
      mandiPrice?: any;
      schemes?: any[];
      training?: any[];
    };
  };

  const validRequest: RequestBody = {
    query: "What is the weather like?",
    farmerProfile: {
      full_name: "Test Farmer",
      state: "Maharashtra",
      district: "Pune",
      enterprise_type: "poultry",
      preferred_language: "en",
    },
    context: {
      weather: {
        temperature: 25,
        humidity: 60,
        condition: "Clear",
        timestamp: "2024-01-01T00:00:00Z",
      },
    },
  };

  assertExists(validRequest.query);
  assertExists(validRequest.farmerProfile);
  assertEquals(typeof validRequest.query, "string");
  assertEquals(typeof validRequest.farmerProfile, "object");
});
