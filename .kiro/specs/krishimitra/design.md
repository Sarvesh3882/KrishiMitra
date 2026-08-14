# Design Document

> **Implementation principle:** Use the technologies specified here where they serve a clear purpose. For details not explicitly fixed, choose the simplest reliable and maintainable solution. Do not introduce unnecessary infrastructure.

---

## Overview

KrishiMitra is a mobile-first PWA agricultural advisory platform for Indian farmers (Kisans) running allied enterprises — poultry, fisheries, apiculture, mushroom cultivation, vermicomposting, dairy, and similar activities.

The platform must feel like an **official Government of India service**: trustworthy, formal, accessible to users with low digital literacy, limited English, and a basic Android smartphone (360–420 px).

### Design Principles

- **Grounded data only.** The AI never invents prices, weather, scheme eligibility, or training content. It explains and summarises data fetched from verified external sources.
- **Frontend isolation.** The React frontend never calls external third-party data sources directly. All live data flows through FastAPI; all AI/voice calls go through Supabase Edge Functions.
- **Voice-first.** The primary interaction mode is speech. Typing is secondary.
- **Lightweight and fast.** Pages must load acceptably on a slow mobile connection. Avoid heavy dependencies.

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (TypeScript) + Tailwind CSS, Vite, PWA |
| Backend API | FastAPI (Python 3.11+) |
| Database & Auth | Supabase (PostgreSQL + RLS + Auth) |
| Edge Functions | Supabase Edge Functions (Deno / TypeScript) |
| AI — Primary | KisanSLM (Gemma 3n + LoRA) via `ai-advisory` Edge Function |
| AI — Fallback | Claude API (Anthropic) or OpenAI — fallback only, never labelled as KisanSLM |
| Voice — Primary | Sarvam AI (STT/TTS) via `voice-service` Edge Function |
| Voice — Fallback | Browser Web Speech API (client-side) |
| Weather | Open-Meteo (free, no auth) via `weather_source.py` |
| Mandi Prices | AGMARKNET / e-NAM via `mandi_source.py` |
| Schemes | myScheme.gov.in via `scheme_source.py` |
| Training | ICAR / KVK portals via `training_source.py` |

### Environment Variables

All secrets are server-side only. A `.env.example` must document all of these:

**Frontend** (`VITE_` prefix): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FASTAPI_BASE_URL`

**Backend**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Supabase secrets** (Edge Functions): `KISANSLM_API_URL`, `ANTHROPIC_API_KEY`, `SARVAM_API_KEY`

---

## Architecture

```
React PWA (mobile 360–420 px)
        │
        ├─► Supabase JS client → Supabase (Auth + Postgres + RLS)
        │                        Supabase Edge Functions
        │                          ├── ai-advisory   (KisanSLM → fallback LLM)
        │                          └── voice-service (Sarvam AI → Web Speech)
        │
        └─► REST → FastAPI backend
                     ├── GET /api/weather       → weather_source.py    → Open-Meteo
                     ├── GET /api/mandi-price   → mandi_source.py      → AGMARKNET/e-NAM
                     ├── GET /api/schemes       → scheme_source.py     → myScheme.gov.in
                     └── GET /api/training      → training_source.py   → ICAR/KVK portals
```

**Hard rules:**
- The React frontend must never directly call Open-Meteo, AGMARKNET, myScheme.gov.in, ICAR, or KVK.
- All AI/voice calls go through Supabase Edge Functions (keeps API keys server-side).
- All secrets stay in server-side environment variables.

### FastAPI Routes

| Route | Required inputs | Response fields |
|-------|----------------|-----------------|
| `GET /api/weather` | `latitude`, `longitude` | `temperature`, `humidity`, `precipitationProbability`, `windSpeed`, `condition`, `timestamp` |
| `GET /api/mandi-price` | `crop`, `state`, `district` | `minPrice`, `maxPrice`, `modalPrice`, `mandiName`, `lastUpdated` |
| `GET /api/schemes` | `state`, `district`, `enterprise_type`, `crop?` | `schemes[]` (from Supabase cache; fetch fresh if stale > 7 days) |
| `GET /api/training` | `enterprise_type`, `language?` | `resources[]` (from Supabase cache; fetch fresh if stale > 14 days) |

### External Integration Isolation

Each external data source has its own module. Route handlers call the module; the module owns all source-specific logic. Swapping data source = changing only the module.

| Module | Source | If source fails |
|--------|--------|----------------|
| `weather_source.py` | Open-Meteo | Return error — no cached fallback for weather |
| `mandi_source.py` | AGMARKNET / e-NAM (API or scrape) | Return error — no cached fallback for prices |
| `scheme_source.py` | myScheme.gov.in (API or scrape) | Serve last cached Supabase records with cache timestamp |
| `training_source.py` | ICAR / KVK (API or scrape) | Serve last cached Supabase records with cache timestamp |

### AI Advisory Flow

1. Parse query intent (price / weather / scheme / training / general).
2. If price-related: call `/api/mandi-price` first; inject result as context.
3. If weather-related: call `/api/weather` first; inject result as context.
4. Call KisanSLM (`ai-advisory` Edge Function) with enriched context and farmer profile.
5. KisanSLM response returned to frontend.
6. If KisanSLM fails → try fallback LLM (same grounding rules, labelled as fallback).
7. If fallback LLM also fails → serve curated Q&A; include Kisan Call Centre reference (1800-180-1551).

**KisanSLM must never invent: prices, weather readings, scheme eligibility/benefits, training content, or Business Planner numerical outputs.**

### Voice Flow

1. Farmer taps mic → frontend records audio.
2. Audio sent to `voice-service` Edge Function → Sarvam AI STT → recognised text returned.
3. If Sarvam AI unavailable → browser Web Speech API handles STT client-side (label "Using browser speech").
4. TTS follows the same primary/fallback pattern for reading AI responses aloud.

### Business Engine

Deterministic module (not LLM) responsible for cost/profit/yield calculations in the Business Planner. KisanSLM may provide narrative context around the Engine's output but does not produce the numbers.

---

## Components and Interfaces

This section describes the functional responsibilities of the major UI and backend components. Kiro has autonomy over exact file structure, naming, and implementation detail — the descriptions below define **what** each piece must do.

### Frontend Modules

**Language System**
- A translation dictionary (`en` / `hi` / `mr`) covers all static UI text.
- A React context provides a `t(key)` function used by all components.
- Language preference stored in localStorage, synced to Supabase farmer profile on change.
- Falls back to English for missing keys.

**Government Layout Shell**
- Fixed header (KrishiMitra logo left; Ashoka Emblem badge right).
- Persistent bottom nav bar (Home · Schemes · Community · Ask KrishiMitra) with 48 px+ tap targets.
- Footer attribution on all screens.
- Offline banner when network unavailable.

**Home Screen**
- Four large tap cards: What's Around Me · Schemes & Training · Community · Ask KrishiMitra.
- Single-column or 2×2 grid; min 48 px tap targets; translated labels and icons.

**What's Around Me**
- Weather card: fetches `/api/weather` on load; displays current conditions + timestamp; shows loading/error states.
- Mandi Price card: crop selector + location → fetches `/api/mandi-price`; shows min/max/modal price + last-updated timestamp; shows loading/error states.
- Local Needs feed: reads `local_needs` table; shows nearby shortage/surplus alerts.

**Market Linkage**
- Produce listing form: product, quantity, quality, expected price, available-from date, location, pickup/delivery preference, optional photo.
- Listings stored in Supabase `produce_listings`.
- Matching displays "X potential buyers found" based on `buyer_requirements` table; reveals contact on tap.
- Separate "Sell via e-NAM" link to enam.gov.in.

**Schemes & Training**
- Schemes list: reads from Supabase `schemes` cache; filter/rank by profile; show recommended badge; link to official application URL.
- Training list: reads from Supabase `training_resources` cache; filter by enterprise type and language; show source link.

**Community**
- WhatsApp group cards: reads `groups` table filtered by location and enterprise type; tap opens WhatsApp via `wa.me` deep link.
- "Ask an Expert" button: `tel:1800-180-1551`.

**AI Assistant (Ask KrishiMitra)**
- Large mic button as primary input; text input as secondary.
- Loading states: "Listening…" / "KisanSLM is thinking…".
- Response text + "🔊 Listen" TTS button; labelled "Powered by KisanSLM".
- Chat history persisted to Supabase `chat_history`, displayed on screen.

**Business Planner**
- Input form for enterprise parameters.
- Business Engine computes cost/profit/yield estimates.
- KisanSLM provides narrative context around the computed figures.

**Farmer Profile**
- Registration and edit form: name, phone, state/district/taluka/village, enterprise type, language preference.
- GPS coordinates captured optionally and stored separately.

### Backend Modules

**FastAPI (`backend/`)**
- `main.py`: app init, CORS, route registration.
- `config.py`: environment variable loading.
- `data_sources/`: one module per external source (`weather_source.py`, `mandi_source.py`, `scheme_source.py`, `training_source.py`).
- `models.py`: Pydantic request/response models.

**Supabase Edge Functions**
- `ai-advisory`: receives query + farmer profile + optional pre-fetched context → calls KisanSLM → fallback LLM → curated Q&A. Returns `{ response, source }`.
- `voice-service`: handles STT and TTS via Sarvam AI. Returns `{ text, source }` for STT or `{ audio, source }` for TTS. If Sarvam AI unavailable, signals client to use Web Speech fallback.

---

## Data Models

All tables live in Supabase Postgres. Supabase migration files must be provided for all tables. All tables have RLS enabled.

### farmer_profiles
Stores user identity, structured administrative location, optional GPS coordinates, enterprise type, and language preference. Accessible only to the authenticated owner.

Key columns: `user_id` (FK → auth.users), `full_name`, `phone_number`, `state`, `district`, `taluka`, `village`, `latitude`, `longitude`, `enterprise_type`, `primary_crop`, `preferred_language`.

### schemes
Cache of government schemes from myScheme.gov.in. Public read; service-role write.

Key columns: `name`, `description`, `eligibility`, `benefits`, `required_documents` (array), `application_process`, `official_link`, `source_url`, `applicable_states` (array), `applicable_enterprise_types` (array), `last_fetched`.

### training_resources
Cache of training resources from ICAR/KVK. Public read; service-role write.

Key columns: `topic`, `crop_activity`, `language`, `duration`, `material_description`, `source_link`, `enterprise_type`, `last_fetched`.

### produce_listings
Farmer produce listings for market matching. Active listings publicly readable; farmer manages own records.

Key columns: `farmer_id` (FK), `product`, `quantity`, `unit`, `quality_grade`, `expected_price`, `available_from`, `state`, `district`, `taluka`, `latitude`, `longitude`, `pickup_delivery`, `photo_url`, `status` (active/sold/expired).

### buyer_requirements
Buyer/FPO demand records. Active requirements publicly readable. Pre-seeded for prototype.

Key columns: `product`, `quantity_needed`, `unit`, `quality_grade`, `price_range_min`, `price_range_max`, `required_by`, `state`, `district`, `contact_method`, `status`.

### local_needs
Nearby shortage/surplus/alert posts. Active needs publicly readable; authenticated farmers can post.

Key columns: `posted_by` (FK), `need_type`, `title`, `description`, `state`, `district`, `taluka`, `status`.

### chat_history
AI assistant conversation records. Owner-only access.

Key columns: `farmer_id` (FK), `role` (user/assistant), `content`, `language`, `query_context` (JSONB), `created_at`.

### groups
WhatsApp group directory. Public read; service-role write.

Key columns: `name`, `description`, `enterprise_type`, `state`, `district`, `join_link` (wa.me URL).

---

## Error Handling

All error and loading states must be shown in the farmer's selected language. No screen should ever be left blank or unresponsive.

| Scenario | Behaviour |
|----------|-----------|
| Weather fetch fails | "Weather data unavailable" error with retry button |
| Mandi price fetch fails | "Price data unavailable" error with retry button |
| myScheme unreachable | Serve cached schemes with "Last updated: [date]" notice |
| ICAR/KVK unreachable | Serve cached training with "Last updated: [date]" notice |
| KisanSLM unavailable | Try fallback LLM; if also fails, serve curated Q&A |
| Sarvam AI unavailable | Use Web Speech API fallback; label clearly |
| Network offline | Offline banner; live-data features show "unavailable offline" with retry |
| Auth session expired | Redirect to login; clear local session state |
| Form validation error | Inline field error messages; highlight problematic field |

**Never present stale mandi prices or weather data as if they were live.** Always show a "last updated" or "fetched at" timestamp with live data.

---

## Testing Strategy

Kiro has autonomy over the testing framework and exact test structure. The following describes what must be covered:

### Unit tests
- Language translation utility (key lookup, language switching, fallback to English).
- Scheme ranking/filtering algorithm (enterprise type match, state match, relevance scoring).
- Training resource filtering (by enterprise type, by language).
- Produce-buyer matching logic (product, quantity, location, quality, price, date criteria).
- Business Engine calculations (deterministic outputs for given inputs).

### Integration tests
- Authentication flow: sign-up → profile creation → sign-in → session persistence.
- FastAPI endpoints: each returns the correct shape and handles error cases.
- Edge Functions: AI advisory returns a response (LLM or fallback); voice service handles STT/TTS.
- Supabase RLS: user cannot read another user's farmer profile or chat history.

### Manual checklist (before considering complete)
- All screens render at 360 px, 390 px, 420 px without horizontal scroll.
- All interactive elements have ≥ 48 px tap targets.
- Language switch updates all visible text in all modules.
- Weather and mandi data always show a timestamp.
- AI responses labelled "Powered by KisanSLM"; fallback labelled appropriately.
- Voice fallback (Web Speech API) activates cleanly when Sarvam AI key is absent.
- Offline banner appears when network is disconnected.
- No API keys appear in browser developer tools network requests or source.

---

## Correctness Properties

The following properties must hold universally across all valid inputs, not just for specific test cases.

### Property 1: Translation Completeness

For every key defined in the translation dictionary, all three languages (`en`, `hi`, `mr`) must have a non-empty string value. No key may be missing or empty in any supported language.

**Validates: Requirements 1.3, 1.5**

### Property 2: Translation Fallback Safety

For any call to `t(key)`, the function must always return a non-empty string. If the key is missing in the active language, it returns the English value. It never returns `undefined`, `null`, or an empty string.

**Validates: Requirements 1.5**

### Property 3: Scheme Ranking Determinism

Given the same farmer profile and the same set of schemes as input, the ranking algorithm must always return the same ordered result. No randomness or instability in ordering.

**Validates: Requirements 7.3**

### Property 4: Produce-Buyer Match Correctness

A match between a produce listing and a buyer requirement is valid if and only if ALL of the following hold simultaneously: product names match; listing quantity ≥ buyer quantity needed; both share the same state and district; listing quality grade meets or exceeds buyer quality grade; listing expected price falls within buyer price range; listing available-from date ≤ buyer required-by date. A result that violates any one condition must not appear as a match.

**Validates: Requirements 9.4**

### Property 5: AI Grounding Invariant

KisanSLM and any fallback LLM must never return a specific numerical figure for prices, temperatures, or scheme benefit amounts unless that figure was retrieved from the corresponding FastAPI endpoint and injected into the request context in the same call. This is enforced through system prompt constraints and the context injection flow described in the Architecture section.

**Validates: Requirements 6.5, 12.2, 12.3, 12.4**

### Property 6: Live Data Timestamp Requirement

Every rendered weather data point and every rendered mandi price data point must be accompanied by its source timestamp. The UI must never display live-data results without their timestamp, and must never label cached scheme or training data as "live".

**Validates: Requirements 5.3, 6.3**
