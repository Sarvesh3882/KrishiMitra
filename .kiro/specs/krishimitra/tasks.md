# Implementation Plan: KrishiMitra

## Overview

Build the KrishiMitra PWA from the ground up in two parallel tracks: a React (TypeScript) + Tailwind + Vite frontend and a FastAPI Python backend, connected through Supabase (Auth + Postgres + Edge Functions). Tasks are ordered to establish foundations first (project structure, types, translation, auth) before feature modules, and finish with integration wiring, cleanup, and documentation.

---

## Tasks

- [x] 1. Project scaffolding and repository structure
  - [x] 1.1 Scaffold frontend and backend directory layout
    - Create `frontend/` using `npm create vite@latest -- --template react-ts`
    - Create `backend/` with `main.py`, `config.py`, `models.py`, and `data_sources/` package stub
    - Create `supabase/migrations/` directory for SQL migration files
    - Add root `.gitignore` covering `node_modules`, `__pycache__`, `.env`, `dist`, `.venv`
    - _Requirements: 17.1, 16.1_

  - [x] 1.2 Create `.env.example` files for frontend and backend
    - `frontend/.env.example`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FASTAPI_BASE_URL` with placeholder values
    - `backend/.env.example`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` with placeholder values
    - Add comments indicating which variables are server-side only and that secrets must never be committed
    - _Requirements: 14.4, 14.5, 17.3_

  - [x] 1.3 Configure Vite for PWA and Tailwind CSS
    - Install `vite-plugin-pwa`, `tailwindcss`, `postcss`, `autoprefixer`
    - Configure `vite.config.ts` with PWA plugin (manifest: name "KrishiMitra", theme colour `#0b5e2c`, portrait orientation, placeholder icons)
    - Initialise `tailwind.config.ts` with custom colour tokens: `primary` → `#0b5e2c`, `cta` → `#f5820a`
    - Add `manifest.json` and a service worker stub that caches static assets
    - _Requirements: 15.1, 15.2_

  - [x] 1.4 Install and configure Python backend dependencies
    - Create `backend/requirements.txt` pinning: `fastapi`, `uvicorn[standard]`, `httpx`, `pydantic`, `python-dotenv`, `supabase`
    - Implement `backend/config.py` loading `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment via `python-dotenv`
    - Add a minimal `backend/main.py` with FastAPI app init, CORS middleware (allow all origins for dev), and a `GET /health` stub
    - _Requirements: 16.1, 17.1_

- [x] 2. Supabase database schema and RLS migrations
  - [x] 2.1 Write migration for `farmer_profiles` table
    - SQL: `CREATE TABLE farmer_profiles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE, full_name text, phone_number text, state text, district text, taluka text, village text, latitude double precision, longitude double precision, enterprise_type text, primary_crop text, preferred_language text NOT NULL DEFAULT 'en', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
    - Enable RLS; add policy: owner (auth.uid() = user_id) can SELECT, INSERT, UPDATE, DELETE own row
    - _Requirements: 4.1–4.6, 14.2_

  - [x] 2.2 Write migrations for `schemes` and `training_resources` tables
    - `schemes`: columns per design (`name`, `description`, `eligibility`, `benefits`, `required_documents text[]`, `application_process`, `official_link`, `source_url`, `applicable_states text[]`, `applicable_enterprise_types text[]`, `last_fetched timestamptz`)
    - `training_resources`: columns per design (`topic`, `crop_activity`, `language`, `duration`, `material_description`, `source_link`, `enterprise_type`, `last_fetched timestamptz`)
    - Both: RLS enabled; policy: authenticated users may SELECT; service role may INSERT/UPDATE/DELETE
    - _Requirements: 7.1, 8.1, 14.2, 14.3_

  - [x] 2.3 Write migrations for `produce_listings`, `buyer_requirements`, and `local_needs` tables
    - `produce_listings`: `farmer_id uuid REFERENCES farmer_profiles(id)`, `product`, `quantity numeric`, `unit`, `quality_grade`, `expected_price numeric`, `available_from date`, `state`, `district`, `taluka`, `latitude double precision`, `longitude double precision`, `pickup_delivery text`, `photo_url text`, `status text DEFAULT 'active'`
    - `buyer_requirements`: all columns per design; status default `'active'`
    - `local_needs`: `posted_by uuid REFERENCES farmer_profiles(id)`, `need_type`, `title`, `description`, `state`, `district`, `taluka`, `status text DEFAULT 'active'`
    - RLS: active listings/requirements/needs readable by authenticated users; farmer manages own `produce_listings` and `local_needs` rows; `buyer_requirements` service-role write
    - _Requirements: 9.1–9.3, 10.5, 14.2, 14.3_

  - [x] 2.4 Write migrations for `chat_history` and `groups` tables; add seed data
    - `chat_history`: `farmer_id uuid REFERENCES farmer_profiles(id)`, `role text`, `content text`, `language text`, `query_context jsonb`, `created_at timestamptz DEFAULT now()`; RLS: owner-only SELECT/INSERT
    - `groups`: `name`, `description`, `enterprise_type`, `state`, `district`, `join_link text`; RLS: authenticated users SELECT; service role INSERT/UPDATE/DELETE
    - Add a seed SQL file for `buyer_requirements` (at least 5 demo rows across varied products/locations) and `groups` (at least 3 demo WhatsApp groups)
    - _Requirements: 11.9, 10.1, 14.2, 14.3, 9.3_

- [x] 3. Translation system and language context
  - [x] 3.1 Build the translation dictionary and `useTranslation` hook
    - Create `frontend/src/i18n/translations.ts` exporting a `Translations` object typed as `Record<'en'|'hi'|'mr', Record<string, string>>`
    - Populate with all static UI keys for: nav labels, home screen cards, error messages, loading states, button labels, form labels, section headings, offline banner, AI attribution strings (minimum 80 keys)
    - Implement `frontend/src/i18n/useTranslation.ts`: reads active language from context; `t(key)` returns the string or falls back to English value; never returns `undefined`, `null`, or empty string
    - _Requirements: 1.3, 1.5_

  - [x] 3.2 Implement `LanguageContext` and language persistence
    - Create `LanguageContext` providing `language` state and `setLanguage` setter
    - On `setLanguage`: update `localStorage` immediately; if user is authenticated, upsert `preferred_language` in `farmer_profiles` via Supabase JS client
    - On app load: read `localStorage` value; if absent, show language selection screen (Requirement 1.1)
    - Wrap the app root in `LanguageProvider`
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 3.3 Write property tests for translation completeness and fallback safety
    - **Property 1: Translation Completeness** — for every key in the dictionary, all three language codes have a non-empty string
    - **Property 2: Translation Fallback Safety** — `t(key)` always returns a non-empty string for any string input, including unknown keys
    - **Validates: Requirements 1.3, 1.5**

- [x] 4. Authentication and farmer profile
  - [x] 4.1 Implement Supabase Auth flow (sign-up, sign-in, session management)
    - Install `@supabase/supabase-js`; create `frontend/src/lib/supabaseClient.ts` initialising client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
    - Build `SignUpPage` and `SignInPage` components with email + password fields; minimum 48 px inputs; inline validation error messages
    - On sign-up success: redirect to onboarding (profile creation); on sign-in: redirect to home
    - Implement `AuthContext` with `user`, `session`, `signOut`; redirect to sign-in if session is missing on protected routes
    - Handle session expiry: clear local state and redirect to sign-in
    - _Requirements: 14.1, 14.2_

  - [x] 4.2 Build farmer profile creation and edit form
    - `ProfilePage` with fields: full name, phone, state (dropdown), district, taluka, village, enterprise type (dropdown seeded with 7 types), language preference
    - On load: attempt GPS via `navigator.geolocation`; if granted store `latitude`/`longitude`; if denied proceed with administrative location only
    - On save: upsert row in `farmer_profiles` using Supabase JS client
    - Show the profile page after first sign-up (onboarding flow) and accessible from settings
    - _Requirements: 4.1–4.6_

- [x] 5. Government layout shell
  - [x] 5.1 Build the persistent app shell with header, bottom nav, and footer
    - `AppShell` component wrapping all screens: fixed header (KrishiMitra logo left; Ashoka Emblem badge + bilingual attribution right), persistent `BottomNav` bar (Home · Schemes · Community · Ask KrishiMitra), footer attribution line
    - All nav tabs and header elements ≥ 48 px tap targets; use `t()` for all labels
    - Colour tokens: background `#ffffff`, primary `#0b5e2c`, CTA `#f5820a`; body text ≥ 16 px; contrast ≥ 4.5:1
    - Wire React Router routes inside the shell
    - _Requirements: 2.1–2.4, 3.1–3.5_

  - [x] 5.2 Add offline detection banner and language selection screen
    - Use `navigator.onLine` + `window` event listeners to show/hide a sticky offline banner with `t('offlineBanner')` message
    - Language selection screen (shown on first launch): three large buttons (English / हिंदी / मराठी), each ≥ 48 px; calls `setLanguage` then navigates to sign-in or home
    - _Requirements: 1.1, 15.3_

- [ ] 6. FastAPI backend — Pydantic models and route stubs
  - [x] 6.1 Define all Pydantic request/response models
    - `backend/models.py`: `WeatherResponse`, `MandiPriceResponse`, `SchemeRecord`, `SchemesResponse`, `TrainingResource`, `TrainingResponse` — fields match design specification exactly; include `timestamp`/`last_updated`/`last_fetched` fields
    - All optional fields have sensible defaults; all required fields are typed
    - _Requirements: 5.2, 6.2, 7.2, 8.2_

  - [x] 6.2 Implement the four FastAPI route handlers
    - Register `GET /api/weather`, `GET /api/mandi-price`, `GET /api/schemes`, `GET /api/training` in `main.py`
    - Each handler validates query params (return 422 on missing required params), calls its source module, returns the typed response or a structured error body `{"error": "...", "retryable": true}`
    - Add CORS headers and a basic request logger
    - _Requirements: 5.1, 5.4, 6.1, 6.4, 7.1, 7.8, 8.1, 8.7, 16.1_

- [x] 7. FastAPI data source modules
  - [x] 7.1 Implement `weather_source.py`
    - Function `fetch_weather(latitude: float, longitude: float) -> WeatherResponse`
    - Call Open-Meteo `https://api.open-meteo.com/v1/forecast` with `current` params (temperature_2m, relative_humidity_2m, precipitation_probability, wind_speed_10m, weathercode)
    - Map `weathercode` to a human-readable `condition` string; set `timestamp` to current UTC ISO string
    - Raise a descriptive `HTTPException(503)` on any network or parse error — no cached fallback
    - _Requirements: 5.1–5.5, 16.1, 16.2_

  - [x] 7.2 Implement `mandi_source.py`
    - Function `fetch_mandi_price(crop: str, state: str, district: str) -> MandiPriceResponse`
    - Call the AGMARKNET data API (or e-NAM API); parse `minPrice`, `maxPrice`, `modalPrice`, `mandiName`, `lastUpdated`
    - Raise `HTTPException(503)` on failure — no cached fallback; include `"retryable": true` in error detail
    - _Requirements: 6.1–6.6, 16.1, 16.2_

  - [x] 7.3 Implement `scheme_source.py` with Supabase cache logic
    - Function `fetch_schemes(state: str, district: str, enterprise_type: str, crop: str | None) -> list[SchemeRecord]`
    - Check Supabase `schemes` table for records with `last_fetched` within 7 days matching filters; if fresh, return cached rows
    - If stale or empty: call myScheme.gov.in (API or structured scrape); upsert results to Supabase with current `last_fetched`; return fresh records
    - If live source fails: return last cached records (any age) with `cache_timestamp` field in response; raise 503 only if cache is also empty
    - _Requirements: 7.1, 7.7, 16.1, 16.2_

  - [x] 7.4 Implement `training_source.py` with Supabase cache logic
    - Function `fetch_training(enterprise_type: str, language: str | None) -> list[TrainingResource]`
    - Same cache pattern as `scheme_source.py` but 14-day staleness threshold
    - Check Supabase `training_resources`; if stale/empty: call ICAR/KVK endpoint; upsert results
    - If live source fails: return cached records with `cache_timestamp`; raise 503 only if cache also empty
    - _Requirements: 8.1, 8.6, 16.1, 16.2_

- [ ] 8. Home screen and What's Around Me
  - [x] 8.1 Build the Home screen with four tap cards
    - `HomePage` with single-column or 2×2 grid layout; cards for "What's Around Me", "Schemes & Training", "Community", "Ask KrishiMitra"
    - Each card ≥ 48 px tap target, translated label via `t()`, flat government-style icon/illustration
    - Tap routes to the respective module screen
    - _Requirements: 3.1, 3.2_

  - [ ] 8.2 Build the Weather card
    - `WeatherCard` component: on mount calls `GET /api/weather` with GPS coords (or falls back to profile lat/long stub)
    - Shows loading skeleton while fetching; displays temperature, humidity, precipitation probability, wind speed, condition, and `timestamp`
    - On error: shows translated "Weather data unavailable" message with retry button
    - Timestamp always visible
    - _Requirements: 5.1–5.5_

  - [ ] 8.3 Build the Mandi Price card
    - `MandiPriceCard` component: crop name input + location fields auto-filled from farmer profile
    - On submit calls `GET /api/mandi-price`; displays min/max/modal price (₹/quintal), mandi name, `lastUpdated` timestamp
    - On error: translated "Price data unavailable" with retry button
    - Frontend never calls AGMARKNET directly
    - _Requirements: 6.1–6.6_

  - [ ] 8.4 Build the Local Needs feed
    - `LocalNeedsFeed` component: queries Supabase `local_needs` table filtered by farmer's `state` and `district`; renders shortage/surplus alert cards
    - Authenticated farmers can post a new local need (need_type, title, description) via a simple form
    - _Requirements: 3.4_

- [ ] 9. Schemes & Training module
  - [ ] 9.1 Build the Schemes list screen
    - `SchemesPage`: calls `GET /api/schemes` with profile's state, district, enterprise_type; renders scheme cards sorted by relevance
    - "Recommended for you" badge on high-relevance schemes; each card shows name, eligibility summary, benefits summary, source URL, and a CTA linking to `official_link` (external, new tab)
    - If response includes `cache_timestamp`, show "Last updated: [date]" notice in translated text
    - Loading and error states in farmer's language
    - _Requirements: 7.1–7.8_

  - [x] 9.2 Implement scheme ranking/filtering on the frontend
    - Pure function `rankSchemes(schemes, farmerProfile)`: awards score points for state match, enterprise type match, district match; returns schemes sorted descending by score; schemes with score above threshold get "Recommended" flag
    - Deterministic: same inputs always produce same order
    - _Requirements: 7.3_

  - [ ] 9.3 Write property test for scheme ranking determinism
    - **Property 3: Scheme Ranking Determinism** — calling `rankSchemes` twice with identical inputs returns identical ordered arrays
    - **Validates: Requirements 7.3**

  - [ ] 9.4 Build the Training resources screen
    - `TrainingPage`: calls `GET /api/training` with enterprise_type and optional language filter; renders resource cards with topic, language, duration, description, and source link (external)
    - Language filter tabs (EN / HI / MR) narrow results without a new API call
    - Cache notice when applicable
    - _Requirements: 8.1–8.7_

- [ ] 10. Market Linkage module
  - [ ] 10.1 Build the produce listing form and listings view
    - `MarketPage` with two sections: "My Listings" and "Post New Listing"
    - Form fields: product (text), quantity (number), unit (dropdown), quality_grade (dropdown), expected_price (number), available_from (date picker), pickup/delivery preference (radio), optional photo upload (stores to Supabase Storage, saves URL)
    - On submit: INSERT into `produce_listings` via Supabase JS client; show success/error in farmer's language
    - _Requirements: 9.1, 9.2_

  - [x] 10.2 Implement produce-buyer matching and display
    - Function `matchListingToBuyers(listing, buyerRequirements[])`: returns only buyer records where ALL six criteria hold (product match, same state+district, listing qty ≥ buyer qty needed, quality match, price within range, available_from ≤ required_by)
    - `BuyerMatchCard` shows "X potential buyers found"; tapping a card reveals contact method (WhatsApp/phone)
    - e-NAM section: labelled link to `https://enam.gov.in` — clearly separate from in-app matching
    - _Requirements: 9.3–9.7_

  - [ ] 10.3 Write property test for produce-buyer match correctness
    - **Property 4: Produce-Buyer Match Correctness** — for any listing and any set of buyer requirements, every result returned by `matchListingToBuyers` satisfies all six criteria simultaneously; no result that fails any single criterion appears
    - **Validates: Requirements 9.4**

- [ ] 11. Community module
  - [ ] 11.1 Build the Community screen
    - `CommunityPage`: queries Supabase `groups` table filtered by farmer's `state`, `district`, and `enterprise_type`; renders `GroupCard` components
    - Each `GroupCard`: name, description, enterprise type badge; "Join Group" button opens `wa.me` deep link in new tab; button ≥ 48 px
    - "Ask an Expert" fixed button at bottom: `tel:1800-180-1551`; always visible; ≥ 48 px
    - _Requirements: 10.1–10.5_

- [ ] 12. Supabase Edge Functions
  - [ ] 12.1 Implement the `ai-advisory` Edge Function
    - Create `supabase/functions/ai-advisory/index.ts`
    - Accepts POST body: `{ query: string, farmerProfile: object, context?: object }` (context = pre-fetched weather/price data)
    - Step 1: Call KisanSLM at `KISANSLM_API_URL` with system prompt enforcing grounding rules (no inventing prices/weather/scheme data) and injected context
    - Step 2: If KisanSLM fails, call Claude API at `ANTHROPIC_API_KEY` with same grounding system prompt; label result `source: 'fallback-llm'`
    - Step 3: If Claude also fails, return a curated Q&A lookup from a bundled JSON keyed by intent; include Kisan Call Centre number; label `source: 'curated-qa'`
    - Return `{ response: string, source: 'kisanslm' | 'fallback-llm' | 'curated-qa' }`
    - All API keys are Supabase secrets — never in frontend
    - _Requirements: 12.1–12.6, 14.4_

  - [x] 12.2 Implement the `voice-service` Edge Function
    - Create `supabase/functions/voice-service/index.ts`
    - POST `/stt`: accepts audio blob + language code → calls Sarvam AI STT endpoint; returns `{ text: string, source: 'sarvam' }`
    - If Sarvam AI unavailable: return `{ text: null, source: 'web-speech', signal: 'use-browser-fallback' }`
    - POST `/tts`: accepts text + language code → calls Sarvam AI TTS; returns `{ audio: string (base64), source: 'sarvam' }`
    - If Sarvam AI unavailable: return `{ audio: null, source: 'web-speech', signal: 'use-browser-fallback' }`
    - _Requirements: 11.2, 11.7, 11.8_

- [ ] 13. Ask KrishiMitra — AI assistant screen
  - [ ] 13.1 Build the voice-first AI assistant UI
    - `AskPage` with large mic button (primary) and text input (secondary); mic button ≥ 64 px
    - Mic tap flow: call `voice-service/stt`; on `use-browser-fallback` signal, activate `webkitSpeechRecognition` / `SpeechRecognition` and label "Using browser speech"
    - Display recognised text for farmer to verify; show loading state "KisanSLM is thinking…" (translated)
    - Response card: AI text + "🔊 Listen" button; label "Powered by KisanSLM" (or "Powered by [fallback]" for fallback-llm, "Curated Answer" for curated-qa)
    - "🔊 Listen" calls `voice-service/tts`; on `use-browser-fallback` signal, use `SpeechSynthesis`
    - _Requirements: 11.1–11.7_

  - [ ] 13.2 Wire context injection and chat history persistence
    - Before calling `ai-advisory`: if query intent looks price-related, call `GET /api/mandi-price` and include result in `context`; if weather-related, call `GET /api/weather` and include
    - Simple intent detection: check for price/weather/scheme keywords in recognised text
    - After AI response: INSERT row into `chat_history` (role=user + role=assistant) via Supabase JS client
    - Load and display recent chat history on screen mount (owner-only RLS enforced by Supabase)
    - _Requirements: 12.2–12.4, 11.9_

  - [ ] 13.3 Write property test for live-data timestamp requirement
    - **Property 6: Live Data Timestamp Requirement** — for any rendered WeatherCard or MandiPriceCard, the component's output always includes a non-empty timestamp string alongside the data values
    - **Validates: Requirements 5.3, 6.3**

- [ ] 14. Business Planner module
  - [ ] 14.1 Implement the Business Engine calculation module
    - Create `frontend/src/modules/businessEngine.ts`
    - Pure function `calculateBusinessPlan(inputs: BusinessPlanInputs): BusinessPlanResult`
    - Inputs: `enterpriseType`, `scale` (e.g. flock size / pond area), `feedCostPerUnit`, `expectedYieldPerCycle`, `marketPricePerUnit`, `cyclesPerYear`
    - Outputs: `totalCost`, `grossRevenue`, `netProfit`, `profitMarginPercent`, `breakEvenUnits`, `roi`
    - All arithmetic deterministic and pure — no LLM calls, no randomness
    - _Requirements: 13.1, 13.2_

  - [ ] 14.2 Build the Business Planner screen with KisanSLM narrative
    - `BusinessPlannerPage` with input form (enterprise type, scale, feed cost, expected yield, market price, cycles/year)
    - On submit: call `calculateBusinessPlan`; display results table (cost, revenue, profit, margin, ROI) in farmer's language
    - Alongside results: call `ai-advisory` with the plan summary as context and prompt "provide brief contextual advice"; display KisanSLM narrative below the numbers
    - Clearly separate the deterministic numbers from the AI narrative section
    - _Requirements: 13.1–13.4_

- [ ] 15. Checkpoint — end-to-end integration smoke test
  - Start frontend dev server and FastAPI server; manually verify the full flow:
    1. Language selection → sign-up → onboarding (profile save)
    2. Home → What's Around Me: weather loads, mandi price fetches, timestamp visible
    3. Schemes list renders (from cache or live), scheme ranking applies
    4. Market: create produce listing, buyer match count appears
    5. Community: group cards load, expert call button works
    6. Ask KrishiMitra: mic → STT → AI response labelled correctly → TTS playback
    7. Business Planner: inputs → deterministic output → KisanSLM narrative
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. README and final project cleanup
  - [ ] 16.1 Write the project README
    - `README.md` at repo root covering: project description, prerequisites (Node 20, Python 3.11, Supabase CLI), step-by-step local setup for frontend (`npm install && npm run dev`) and backend (`python -m venv .venv && pip install -r requirements.txt && uvicorn main:app --reload`), Supabase project setup (run migrations, deploy Edge Functions), environment variable configuration (referencing `.env.example` files), and a brief architecture diagram (ASCII)
    - _Requirements: 17.2, 17.3_

  - [ ] 16.2 Final project tree cleanup
    - Remove any auto-generated boilerplate files not used (default Vite placeholder assets, unused component stubs)
    - Verify no dead imports, no duplicate implementations, no empty folders
    - Confirm all `.env.example` files are present; confirm real `.env` files are in `.gitignore`
    - _Requirements: 17.5_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- All user-visible strings must go through `t()` — never hardcode English text in JSX
- KisanSLM is always primary; Claude is always labelled as fallback — never swap the labels
- Mandi prices and weather must never be cached as fallback; schemes and training must serve cache when source is unreachable
- The Business Engine is deterministic pure code; KisanSLM only adds narrative, never computes numbers
- All interactive elements must be ≥ 48 px tap targets (check every new component)
- Frontend must never import or call Open-Meteo, AGMARKNET, myScheme.gov.in, ICAR, or KVK directly

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "2.4", "3.1", "6.1"] },
    { "id": 3, "tasks": ["3.2", "4.1", "6.2", "7.1", "7.2"] },
    { "id": 4, "tasks": ["3.3", "4.2", "5.1", "7.3", "7.4"] },
    { "id": 5, "tasks": ["5.2", "8.1", "9.2", "10.2", "12.1", "12.2", "14.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "9.1", "9.4", "10.1", "11.1", "13.1", "14.2"] },
    { "id": 7, "tasks": ["9.3", "10.3", "13.2"] },
    { "id": 8, "tasks": ["13.3", "16.1"] },
    { "id": 9, "tasks": ["16.2"] }
  ]
}
```
