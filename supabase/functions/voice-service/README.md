# Voice Service Edge Function

Handles Speech-to-Text (STT) and Text-to-Speech (TTS) for KrishiMitra using Sarvam AI as primary provider with browser Web Speech API as fallback.

## Purpose

Provides voice interaction capabilities for farmers with low digital literacy. All API keys remain server-side for security.

## Environment Variables

- `SARVAM_API_KEY`: Sarvam AI API key (required for Sarvam AI integration)

If `SARVAM_API_KEY` is not set, the function signals the client to use browser-native Web Speech API.

## Endpoints

### POST `/stt` - Speech to Text

Converts audio to text using Sarvam AI.

**Request Body:**
```json
{
  "audio": "base64-encoded-audio-blob",
  "language": "en" // or "hi", "mr"
}
```

**Response (Sarvam AI available):**
```json
{
  "text": "recognized text from audio",
  "source": "sarvam"
}
```

**Response (Sarvam AI unavailable - fallback signal):**
```json
{
  "text": null,
  "source": "web-speech",
  "signal": "use-browser-fallback"
}
```

### POST `/tts` - Text to Speech

Converts text to speech audio using Sarvam AI.

**Request Body:**
```json
{
  "text": "Text to be converted to speech",
  "language": "hi" // or "en", "mr"
}
```

**Response (Sarvam AI available):**
```json
{
  "audio": "base64-encoded-audio-data",
  "source": "sarvam"
}
```

**Response (Sarvam AI unavailable - fallback signal):**
```json
{
  "audio": null,
  "source": "web-speech",
  "signal": "use-browser-fallback"
}
```

## Supported Languages

- `en` - English
- `hi` - Hindi (हिंदी)
- `mr` - Marathi (मराठी)

## Error Handling

- **400 Bad Request**: Missing required fields (`audio`/`text` or `language`)
- **404 Not Found**: Invalid route (only `/stt` and `/tts` are supported)
- **500 Internal Server Error**: Unexpected server error

## Fallback Strategy

1. **Primary**: Sarvam AI (Indian-language optimized, server-side)
2. **Fallback**: Browser Web Speech API (client-side)

When Sarvam AI is unavailable (no API key or API error), the function returns a response with:
- `text: null` or `audio: null`
- `source: "web-speech"`
- `signal: "use-browser-fallback"`

The frontend should detect this signal and activate browser-native speech recognition/synthesis with clear attribution: "Using browser speech".

## Requirements Validation

This Edge Function validates:
- **Requirement 11.2**: STT via Sarvam AI with Web Speech API fallback
- **Requirement 11.7**: Voice feature attribution (source field)
- **Requirement 11.8**: API keys remain server-side only

## Testing

Run tests with Deno:

```bash
deno test index.test.ts
```

Tests validate:
- Request/response structure
- Type correctness
- Fallback behavior
- Required field validation
- CORS configuration
- Supported languages

## Deployment

Deploy using Supabase CLI:

```bash
supabase functions deploy voice-service
```

Set the Sarvam API key as a secret:

```bash
supabase secrets set SARVAM_API_KEY=your_api_key_here
```

## Integration Example

Frontend usage:

```typescript
// STT
const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-service/stt`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`
  },
  body: JSON.stringify({
    audio: audioBase64,
    language: 'hi'
  })
});

const data = await response.json();
if (data.signal === 'use-browser-fallback') {
  // Use browser Web Speech API
} else {
  // Use recognized text from Sarvam AI
  console.log(data.text);
}
```
