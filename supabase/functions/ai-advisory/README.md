# AI Advisory Edge Function

## Overview

The `ai-advisory` Edge Function implements KrishiMitra's three-tier AI advisory system with proper data grounding and fallback mechanisms.

## Architecture

The function implements a three-tier fallback strategy:

1. **Primary**: KisanSLM (Gemma 3n + LoRA) - Agricultural-specific AI model
2. **Fallback**: Claude API (Anthropic) - General-purpose LLM with agricultural grounding
3. **Last Resort**: Curated Q&A - Pre-written responses with Kisan Call Centre reference

## Request Format

```typescript
POST /ai-advisory

{
  "query": string,                    // User's question/query
  "farmerProfile": {
    "user_id"?: string,
    "full_name"?: string,
    "state"?: string,
    "district"?: string,
    "enterprise_type"?: string,
    "preferred_language"?: string    // "en" | "hi" | "mr"
  },
  "context"?: {                       // Optional pre-fetched data
    "weather"?: {
      "temperature": number,
      "humidity": number,
      "precipitationProbability": number,
      "windSpeed": number,
      "condition": string,
      "timestamp": string
    },
    "mandiPrice"?: {
      "crop": string,
      "minPrice": number,
      "maxPrice": number,
      "modalPrice": number,
      "mandiName": string,
      "lastUpdated": string
    },
    "schemes"?: Array<{
      "name": string,
      "eligibility": string,
      "benefits": string,
      "official_link": string
    }>,
    "training"?: Array<{
      "topic": string,
      "material_description": string,
      "source_link": string
    }>
  }
}
```

## Response Format

```typescript
{
  "response": string,                           // AI-generated or curated response
  "source": "kisanslm" | "fallback-llm" | "curated-qa"  // Response source
}
```

## Grounding Rules

The system prompt enforces strict grounding rules to prevent AI hallucination:

1. **Never invent numerical data**: No generating prices, weather readings, scheme benefits, or training content
2. **Context-based responses**: Only explain data provided in the `context` object
3. **Redirect when data unavailable**: Direct farmers to appropriate sections when data is missing
4. **Verify before stating**: Base all advice on provided context data

## Environment Variables (Supabase Secrets)

Required secrets (set via Supabase CLI or dashboard):

- `KISANSLM_API_URL` - Endpoint for KisanSLM API
- `ANTHROPIC_API_KEY` - Claude API key (fallback)

## Curated Q&A Topics

The final fallback includes pre-written responses for:

- **Weather queries**: Directs to "What's Around Me" section
- **Price queries**: Directs to "What's Around Me" section  
- **Scheme queries**: Directs to "Schemes & Training" section
- **Training queries**: Directs to "Schemes & Training" section
- **General queries**: Apologizes and provides Kisan Call Centre contact

All curated responses include the Kisan Call Centre number: **1800-180-1551**

## Usage Example

```typescript
// Frontend call
const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-advisory`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`,
  },
  body: JSON.stringify({
    query: "What crops should I plant this season?",
    farmerProfile: {
      full_name: "Rajesh Kumar",
      state: "Maharashtra",
      district: "Pune",
      enterprise_type: "poultry",
      preferred_language: "en"
    },
    context: {
      weather: {
        temperature: 28,
        humidity: 65,
        precipitationProbability: 20,
        windSpeed: 15,
        condition: "Partly cloudy",
        timestamp: "2024-01-15T10:30:00Z"
      }
    }
  })
});

const data = await response.json();
console.log(data.response);  // AI response text
console.log(data.source);    // "kisanslm", "fallback-llm", or "curated-qa"
```

## Deployment

Deploy using Supabase CLI:

```bash
supabase functions deploy ai-advisory
```

Set required secrets:

```bash
supabase secrets set KISANSLM_API_URL=<your-kisanslm-endpoint>
supabase secrets set ANTHROPIC_API_KEY=<your-anthropic-key>
```

## Requirements Validation

This implementation satisfies:

- **Requirement 12.1-12.6**: Grounded AI advisory with proper fallback chain
- **Requirement 14.4**: All API keys server-side only (Supabase secrets)
- **Design Property 5**: AI Grounding Invariant enforced via system prompt

## Testing

Run tests locally (requires Deno):

```bash
cd supabase/functions/ai-advisory
deno test --allow-env index.test.ts
```

Test the deployed function:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/ai-advisory \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the weather?",
    "farmerProfile": {
      "full_name": "Test Farmer",
      "state": "Maharashtra",
      "district": "Pune",
      "preferred_language": "en"
    }
  }'
```
