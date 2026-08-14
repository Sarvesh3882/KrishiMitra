// KrishiMitra AI Advisory Edge Function
// Three-tier fallback: KisanSLM → Claude API → Curated Q&A

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
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
}

interface AIResponse {
  response: string;
  source: "kisanslm" | "fallback-llm" | "curated-qa";
}

// Curated Q&A fallback data (keyed by intent patterns)
const curatedQA: Record<string, { en: string; hi: string; mr: string }> = {
  weather: {
    en: "For current weather information, please check the 'What's Around Me' section on the home screen. You can also contact the Kisan Call Centre at 1800-180-1551 for personalized advice.",
    hi: "वर्तमान मौसम की जानकारी के लिए, कृपया होम स्क्रीन पर 'मेरे आसपास क्या है' अनुभाग देखें। आप व्यक्तिगत सलाह के लिए किसान कॉल सेंटर 1800-180-1551 पर भी संपर्क कर सकते हैं।",
    mr: "सध्याच्या हवामानाच्या माहितीसाठी, कृपया होम स्क्रीनवरील 'माझ्या आजूबाजूला काय आहे' विभाग पहा. वैयक्तिक सल्ल्यासाठी तुम्ही किसान कॉल सेंटर 1800-180-1551 वर संपर्क करू शकता.",
  },
  price: {
    en: "For current market prices, please check the 'What's Around Me' section on the home screen. You can also contact the Kisan Call Centre at 1800-180-1551 for market information.",
    hi: "वर्तमान बाजार मूल्यों के लिए, कृपया होम स्क्रीन पर 'मेरे आसपास क्या है' अनुभाग देखें। आप बाजार की जानकारी के लिए किसान कॉल सेंटर 1800-180-1551 पर भी संपर्क कर सकते हैं।",
    mr: "सध्याच्या बाजार किमतींसाठी, कृपया होम स्क्रीनवरील 'माझ्या आजूबाजूला काय आहे' विभाग पहा. बाजार माहितीसाठी तुम्ही किसान कॉल सेंटर 1800-180-1551 वर संपर्क करू शकता.",
  },
  scheme: {
    en: "For government schemes, please visit the 'Schemes & Training' section. You can also contact the Kisan Call Centre at 1800-180-1551 for scheme eligibility guidance.",
    hi: "सरकारी योजनाओं के लिए, कृपया 'योजनाएं और प्रशिक्षण' अनुभाग पर जाएं। आप योजना पात्रता मार्गदर्शन के लिए किसान कॉल सेंटर 1800-180-1551 पर भी संपर्क कर सकते हैं।",
    mr: "सरकारी योजनांसाठी, कृपया 'योजना आणि प्रशिक्षण' विभागाला भेट द्या. योजना पात्रता मार्गदर्शनासाठी तुम्ही किसान कॉल सेंटर 1800-180-1551 वर संपर्क करू शकता.",
  },
  training: {
    en: "For training resources, please visit the 'Schemes & Training' section. You can also contact the Kisan Call Centre at 1800-180-1551 for training opportunities.",
    hi: "प्रशिक्षण संसाधनों के लिए, कृपया 'योजनाएं और प्रशिक्षण' अनुभाग पर जाएं। आप प्रशिक्षण के अवसरों के लिए किसान कॉल सेंटर 1800-180-1551 पर भी संपर्क कर सकते हैं।",
    mr: "प्रशिक्षण संसाधनांसाठी, कृपया 'योजना आणि प्रशिक्षण' विभागाला भेट द्या. प्रशिक्षण संधींसाठी तुम्ही किसान कॉल सेंटर 1800-180-1551 वर संपर्क करू शकता.",
  },
  general: {
    en: "I apologize, but I'm unable to provide a specific answer at this moment. Please contact the Kisan Call Centre at 1800-180-1551 for expert agricultural advice.",
    hi: "मुझे खेद है, लेकिन मैं इस समय कोई विशिष्ट उत्तर प्रदान करने में असमर्थ हूं। कृपया विशेषज्ञ कृषि सलाह के लिए किसान कॉल सेंटर 1800-180-1551 पर संपर्क करें।",
    mr: "मला माफ करा, परंतु मी या क्षणी विशिष्ट उत्तर देण्यास अक्षम आहे. कृपया तज्ञ कृषी सल्ल्यासाठी किसान कॉल सेंटर 1800-180-1551 वर संपर्क करा.",
  },
};

// Build system prompt with grounding rules
function buildSystemPrompt(
  farmerProfile: RequestBody["farmerProfile"],
  context?: RequestBody["context"]
): string {
  const systemPrompt = `You are KisanSLM, an agricultural advisory AI assistant for Indian farmers (Kisans) running allied enterprises like poultry, fisheries, apiculture, mushroom cultivation, vermicomposting, dairy, etc.

CRITICAL GROUNDING RULES:
1. NEVER invent or generate price figures, weather data, scheme benefits, training content, or any numerical data.
2. If price data is provided in the context, explain and interpret it. If NOT provided, direct the farmer to check the "What's Around Me" section.
3. If weather data is provided in the context, explain and interpret it. If NOT provided, direct the farmer to check the "What's Around Me" section.
4. If scheme data is provided in the context, explain eligibility and benefits based ONLY on that data. If NOT provided, direct the farmer to the "Schemes & Training" section.
5. For training resources, direct farmers to the "Schemes & Training" section.
6. Always provide practical, actionable advice based on verified data only.
7. Respond in a respectful, supportive tone appropriate for farmers with varying levels of digital literacy.

FARMER PROFILE:
- Name: ${farmerProfile.full_name || "Farmer"}
- Location: ${farmerProfile.district || "Unknown"}, ${farmerProfile.state || "Unknown"}
- Enterprise Type: ${farmerProfile.enterprise_type || "Not specified"}
- Preferred Language: ${farmerProfile.preferred_language || "en"}

${context ? buildContextSection(context) : "No pre-fetched context data provided for this query."}

IMPORTANT: Base your response strictly on the provided context data. Do not generate or assume any data not explicitly provided above.`;

  return systemPrompt;
}

// Build context section from pre-fetched data
function buildContextSection(context: RequestBody["context"]): string {
  let contextSection = "PRE-FETCHED CONTEXT DATA:\n";

  if (context?.weather) {
    contextSection += `\nWEATHER DATA (timestamp: ${context.weather.timestamp || "unknown"}):
- Temperature: ${context.weather.temperature}°C
- Humidity: ${context.weather.humidity}%
- Precipitation Probability: ${context.weather.precipitationProbability}%
- Wind Speed: ${context.weather.windSpeed} km/h
- Condition: ${context.weather.condition}`;
  }

  if (context?.mandiPrice) {
    contextSection += `\n\nMANDI PRICE DATA (last updated: ${context.mandiPrice.lastUpdated || "unknown"}):
- Crop: ${context.mandiPrice.crop || "Unknown"}
- Mandi: ${context.mandiPrice.mandiName || "Unknown"}
- Min Price: ₹${context.mandiPrice.minPrice}/quintal
- Max Price: ₹${context.mandiPrice.maxPrice}/quintal
- Modal Price: ₹${context.mandiPrice.modalPrice}/quintal`;
  }

  if (context?.schemes && context.schemes.length > 0) {
    contextSection += `\n\nRELEVANT GOVERNMENT SCHEMES:`;
    context.schemes.forEach((scheme: any, idx: number) => {
      contextSection += `\n${idx + 1}. ${scheme.name}
   - Eligibility: ${scheme.eligibility || "See official link"}
   - Benefits: ${scheme.benefits || "See official link"}
   - Link: ${scheme.official_link || scheme.source_url || "Unknown"}`;
    });
  }

  if (context?.training && context.training.length > 0) {
    contextSection += `\n\nRELEVANT TRAINING RESOURCES:`;
    context.training.forEach((resource: any, idx: number) => {
      contextSection += `\n${idx + 1}. ${resource.topic}
   - Description: ${resource.material_description || "N/A"}
   - Link: ${resource.source_link || "Unknown"}`;
    });
  }

  return contextSection;
}

// Step 1: Call KisanSLM
async function callKisanSLM(
  query: string,
  systemPrompt: string
): Promise<string | null> {
  const kisanSLMUrl = Deno.env.get("KISANSLM_API_URL");

  if (!kisanSLMUrl) {
    console.error("KISANSLM_API_URL not configured");
    return null;
  }

  try {
    const response = await fetch(kisanSLMUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system: systemPrompt,
        prompt: query,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error(
        `KisanSLM API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    return data.response || data.text || data.output || null;
  } catch (error) {
    console.error("KisanSLM call failed:", error);
    return null;
  }
}

// Step 2: Fallback to Claude API
async function callClaudeAPI(
  query: string,
  systemPrompt: string
): Promise<string | null> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!anthropicKey) {
    console.error("ANTHROPIC_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        `Claude API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (error) {
    console.error("Claude API call failed:", error);
    return null;
  }
}

// Step 3: Fallback to curated Q&A
function getCuratedResponse(
  query: string,
  language: string = "en"
): string {
  const queryLower = query.toLowerCase();
  const lang = language as "en" | "hi" | "mr";

  // Simple intent detection
  if (
    queryLower.includes("weather") ||
    queryLower.includes("मौसम") ||
    queryLower.includes("हवामान") ||
    queryLower.includes("rain") ||
    queryLower.includes("temperature")
  ) {
    return curatedQA.weather[lang] || curatedQA.weather.en;
  }

  if (
    queryLower.includes("price") ||
    queryLower.includes("mandi") ||
    queryLower.includes("कीमत") ||
    queryLower.includes("किंमत") ||
    queryLower.includes("market") ||
    queryLower.includes("sell")
  ) {
    return curatedQA.price[lang] || curatedQA.price.en;
  }

  if (
    queryLower.includes("scheme") ||
    queryLower.includes("योजना") ||
    queryLower.includes("subsidy") ||
    queryLower.includes("government") ||
    queryLower.includes("सरकार")
  ) {
    return curatedQA.scheme[lang] || curatedQA.scheme.en;
  }

  if (
    queryLower.includes("training") ||
    queryLower.includes("प्रशिक्षण") ||
    queryLower.includes("learn") ||
    queryLower.includes("course")
  ) {
    return curatedQA.training[lang] || curatedQA.training.en;
  }

  // Default general response
  return curatedQA.general[lang] || curatedQA.general.en;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, farmerProfile, context }: RequestBody = await req.json();

    // Validate input
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query is required and must be a non-empty string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!farmerProfile || typeof farmerProfile !== "object") {
      return new Response(
        JSON.stringify({ error: "farmerProfile is required and must be an object" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = buildSystemPrompt(farmerProfile, context);
    const language = farmerProfile.preferred_language || "en";

    let response: AIResponse;

    // Step 1: Try KisanSLM
    console.log("Attempting KisanSLM...");
    const kisanSLMResponse = await callKisanSLM(query, systemPrompt);

    if (kisanSLMResponse) {
      console.log("KisanSLM succeeded");
      response = {
        response: kisanSLMResponse,
        source: "kisanslm",
      };
    } else {
      // Step 2: Fallback to Claude API
      console.log("KisanSLM failed, attempting Claude API...");
      const claudeResponse = await callClaudeAPI(query, systemPrompt);

      if (claudeResponse) {
        console.log("Claude API succeeded");
        response = {
          response: claudeResponse,
          source: "fallback-llm",
        };
      } else {
        // Step 3: Fallback to curated Q&A
        console.log("Claude API failed, using curated Q&A");
        response = {
          response: getCuratedResponse(query, language),
          source: "curated-qa",
        };
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
