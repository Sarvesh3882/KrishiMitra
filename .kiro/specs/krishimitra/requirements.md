# Requirements Document

## Introduction

KrishiMitra is a mobile-first, PWA agricultural advisory platform for Indian farmers (Kisans) running allied enterprises (poultry, fisheries, apiculture, mushroom cultivation, vermicomposting, dairy, etc.). The platform must look and feel like an official Government of India digital service â€” trustworthy, accessible, voice-first â€” and serve users with low digital literacy, limited English, and basic smartphones (360â€“420 px).

## Glossary

| Term | Meaning |
|------|---------|
| Kisan | Indian farmer (primary end user) |
| Administrative Location | Structured location: State, District, Taluka/Block, Village |
| Mandi | Indian agricultural market/trading centre |
| KisanSLM | Primary agricultural AI model (Gemma 3n + LoRA) |
| RAG | Retrieval-Augmented Generation â€” grounds AI responses in verified sources |
| Sarvam AI | Preferred Indian-language STT/TTS service |
| Web Speech API | Browser-native STT/TTS fallback |
| e-NAM | Electronic National Agriculture Market (enam.gov.in) |
| AGMARKNET | Government of India agricultural marketing network |
| myScheme | Government of India unified scheme discovery portal (myscheme.gov.in) |
| ICAR | Indian Council of Agricultural Research |
| KVK | Krishi Vigyan Kendra (agricultural extension centres) |
| Business Engine | Deterministic calculation module for the Business Planner (not an LLM) |

---

## Requirements

### Requirement 1: Multi-Language Interface

**User Story:** As a Kisan with limited English, I want to use the platform in my preferred language, so I can understand all information and navigate confidently.

#### Acceptance Criteria
1. On first launch (no saved preference), the platform shows a language selection screen with three large buttons: English, à¤¹à¤¿à¤‚à¤¦à¥€, à¤®à¤°à¤¾à¤ à¥€.
2. The selected language persists across sessions (localStorage + Supabase farmer profile).
3. All static UI text (buttons, labels, headers, navigation, error messages) is loaded from a translation dictionary keyed by language code (`en` / `hi` / `mr`).
4. Changing the language updates all visible UI text without a page reload.
5. If a translation key is missing in the selected language, the platform falls back to the English value.

---

### Requirement 2: Government of India Visual Identity

**User Story:** As a Kisan with low digital literacy, I want the platform to look like an official government portal, so I trust the information.

#### Acceptance Criteria
1. Every screen has a header with the KrishiMitra logo (green + saffron) on the left and an Ashoka Emblem-style badge with bilingual attribution ("à¤­à¤¾à¤°à¤¤ à¤¸à¤°à¤•à¤¾à¤° / Government of India") on the right.
2. The colour palette is: background `#ffffff`; primary green `#0b5e2c`; CTA saffron/orange `#f5820a`; accent teal/mint for illustrations.
3. Typography is clean and high-contrast (minimum 16 px body text, minimum 4.5:1 contrast ratio). No decorative fonts.
4. Illustrations are flat and government-portal style â€” no startup-aesthetic graphics.
5. A footer on all screens reads: "This platform is a prototype developed for [Hackathon name] â€” Team Airavata".

---

### Requirement 3: Mobile-First Design

**User Story:** As a Kisan on a basic smartphone, I want the interface optimised for a small screen and one-thumb use.

#### Acceptance Criteria
1. All layouts are designed for 360â€“420 px viewport width. No horizontal scrolling.
2. All interactive elements (buttons, links, inputs, cards, nav tabs) have a minimum 48 px tap target.
3. No interactions depend on hover state.
4. A persistent bottom navigation bar (Home Â· Schemes Â· Community Â· Ask KrishiMitra) is visible on all main screens.
5. All screens render correctly at 360 px, 390 px, and 420 px widths.

---

### Requirement 4: Farmer Profile & Location

**User Story:** As a Kisan, I want to save my location and agricultural activity so the platform shows me relevant information.

#### Acceptance Criteria
1. The profile stores Administrative Location as separate structured fields: state, district, taluka, village.
2. GPS coordinates (latitude, longitude) are stored separately when the user grants GPS permission.
3. If GPS permission is denied, the platform uses the manually entered Administrative Location.
4. Administrative Location is used for scheme filtering and mandi price lookup.
5. GPS coordinates are used for weather calls and distance-based market matching when available.
6. The profile stores the farmer's primary enterprise type (poultry, fisheries, apiculture, mushroom, vermicompost, dairy, etc.) and preferred language.

---

### Requirement 5: Live Weather

**User Story:** As a Kisan, I want to see current weather and a short forecast for my location, so I can plan farming activities.

#### Acceptance Criteria
1. Weather data is fetched live from Open-Meteo via the FastAPI `/api/weather` endpoint on every request â€” never from a cached fallback.
2. The response includes: temperature (Â°C), humidity (%), precipitation probability (%), wind speed (km/h), weather condition description, and data timestamp.
3. The data timestamp is displayed prominently so the farmer knows how fresh the data is.
4. The frontend never calls Open-Meteo directly.
5. If the weather fetch fails, a clear error state with a retry option is shown in the farmer's language.

---

### Requirement 6: Live Mandi Prices

**User Story:** As a Kisan, I want to see current market prices for my crop at nearby mandis, so I can make informed selling decisions.

#### Acceptance Criteria
1. Mandi prices are fetched live via the FastAPI `/api/mandi-price` endpoint on every request â€” never cached as fallback.
2. The response includes: minimum price, maximum price, modal price (â‚¹/quintal), mandi name, and last-updated timestamp.
3. The last-updated timestamp is displayed prominently.
4. The frontend never calls AGMARKNET or e-NAM directly.
5. KisanSLM and any fallback LLM must never generate or invent price figures.
6. If the price fetch fails, a clear "data unavailable" error state is shown with a retry option.

---

### Requirement 7: Government Scheme Discovery

**User Story:** As a Kisan, I want to discover government schemes relevant to my activity and location, so I can apply for benefits I'm eligible for.

#### Acceptance Criteria
1. Scheme data is sourced from myScheme.gov.in via the FastAPI `/api/schemes` endpoint and cached in the Supabase `schemes` table (refreshed if stale > 7 days).
2. Each scheme record contains: name, description, eligibility, benefits, required documents, application process, official application link, and source URL.
3. Schemes are filtered and ranked by the farmer's state, district, and enterprise type. High-relevance schemes are tagged "Recommended for you".
4. Each scheme card links directly to the official government application URL â€” never through KrishiMitra.
5. The source URL is retained and visible for verification.
6. KisanSLM must never generate or invent scheme details. It may only explain content fetched from the endpoint.
7. If the live source is unreachable, the last cached records are served with a visible cache timestamp.
8. The frontend never calls myScheme.gov.in directly.

---

### Requirement 8: Kisan Training Resources

**User Story:** As a Kisan, I want to access government training materials relevant to my enterprise, so I can improve my farming practices.

#### Acceptance Criteria
1. Training data is sourced from ICAR, KVK, and state agriculture portals via the FastAPI `/api/training` endpoint and cached in the Supabase `training_resources` table (refreshed if stale > 14 days).
2. Each resource record contains: topic, enterprise type, language, duration, description, and original source link.
3. Resources are browseable by enterprise type and filterable by language (EN/HI/MR).
4. The original source link is visible on every resource card.
5. KisanSLM must never generate training content as if it were official government material unless it is grounded in a retrieved record.
6. If the live source is unreachable, the last cached records are served with a visible cache timestamp.
7. The frontend never calls ICAR/KVK portals directly.

---

### Requirement 9: Market Linkage

**User Story:** As a Kisan, I want to list my produce and find potential buyers, so I can sell at fair prices through the right channel.

#### Acceptance Criteria
1. A farmer can create a produce listing with: product, quantity + unit, quality/grade, expected price, available-from date, location, pickup/delivery preference, and an optional photo.
2. Listings are stored in the Supabase `produce_listings` table.
3. A buyer requirements table (`buyer_requirements`) holds demand records (product, quantity needed, quality grade, price range, location, required-by date, contact method). For the prototype this table may be pre-seeded with demo data.
4. A matching function compares listings against buyer requirements on: product, location (same state/district), quantity, quality, price range, and date. Results are shown as "X potential buyers found".
5. Matching reveals the buyer's contact method (WhatsApp/phone) â€” there is no in-app messaging or transaction.
6. A clearly separated section on the screen links to e-NAM (enam.gov.in) for formal electronic trading.
7. No in-app payments, escrow, or logistics are implemented.

---

### Requirement 10: Community & Expert Access

**User Story:** As a Kisan, I want to connect with other farmers and reach an agricultural expert, so I can get advice and support.

#### Acceptance Criteria
1. The Supabase `groups` table stores WhatsApp group records: name, description, enterprise type, state, district, and `wa.me` join link.
2. Groups are filtered by the farmer's location and enterprise type and displayed as tap cards.
3. Tapping a group opens WhatsApp directly via the deep link â€” no in-app messaging.
4. An "Ask an Expert" button is always visible and triggers a `tel:1800-180-1551` call (Kisan Call Centre).
5. No in-app social feed, posts, or user-generated content storage.

---

### Requirement 11: Voice-First AI Assistant

**User Story:** As a Kisan with low digital literacy, I want to speak my questions in my language and hear responses, so I can get advice without typing.

#### Acceptance Criteria
1. A large microphone button is the primary interaction element on the Ask KrishiMitra screen.
2. Tapping the mic initiates STT via Sarvam AI (server-side Edge Function). If Sarvam AI is unavailable, the browser Web Speech API is used client-side as fallback.
3. The recognised text is displayed so the farmer can verify it.
4. Loading states are shown during each phase: "Listeningâ€¦" during STT, "KisanSLM is thinkingâ€¦" during the AI call.
5. The AI response is shown as text with a "ðŸ”Š Listen" TTS button that reads it aloud.
6. AI responses are labelled "Powered by KisanSLM".
7. Voice feature attribution shows "Powered by Sarvam AI" (or "Using browser speech" when fallback is active).
8. All API keys remain server-side. The frontend never sends API keys.
9. Chat history is persisted to the Supabase `chat_history` table and retrievable by the farmer.

---

### Requirement 12: Grounded AI Advisory (KisanSLM)

**User Story:** As a Kisan, I want accurate agricultural advice grounded in real data, so I can trust the answers.

#### Acceptance Criteria
1. KisanSLM (Gemma 3n + LoRA) is the primary AI model for all agricultural advisory responses.
2. When a query relates to prices, KisanSLM receives data fetched from `/api/mandi-price` as context and explains those real numbers â€” it does not generate its own price figures.
3. When a query relates to weather, KisanSLM receives data fetched from `/api/weather` as context and explains that real forecast â€” it does not generate its own weather data.
4. KisanSLM must not generate or invent scheme eligibility, benefits, training content, or any numerical data that should come from a verified source.
5. If KisanSLM is unavailable, a general-purpose LLM (Claude / OpenAI) may be used as a fallback â€” clearly labelled as a fallback, never presented as KisanSLM.
6. If both AI services fail, a curated fallback Q&A (EN/HI/MR) is used. The fallback always includes a reference to Kisan Call Centre (1800-180-1551) for unanswered topics.

---

### Requirement 13: Business Planner

**User Story:** As a Kisan, I want to estimate the costs and expected returns for my enterprise, so I can make informed investment decisions.

#### Acceptance Criteria
1. The Business Planner accepts farmer inputs (e.g. flock size, feed cost, expected yield/cycle, market price) and produces deterministic cost/profit estimates via the Business Engine module.
2. The Business Engine performs the calculations â€” KisanSLM does not generate the numbers.
3. KisanSLM may provide contextual narrative (e.g. advice on improving margins) alongside the Engine's output.
4. Results are displayed in the farmer's selected language.

---

### Requirement 14: Authentication & Data Security

**User Story:** As a Kisan, I want my account and data to be secure so my personal information is protected.

#### Acceptance Criteria
1. Authentication is handled by Supabase Auth (email + password; phone OTP optional).
2. All Supabase tables have Row Level Security (RLS) enabled. User-owned data (profile, chat history, listings) is accessible only to the authenticated owner.
3. Public/cached data (schemes, training resources, WhatsApp groups, local needs) is readable by any authenticated user but writable only by the service role.
4. All external API keys (KisanSLM, Anthropic, Sarvam AI, etc.) are stored in server-side environment variables only â€” never in frontend code or committed to version control.
5. A `.env.example` file documents all required environment variables with placeholder values.

---

### Requirement 15: PWA & Offline Support

**User Story:** As a Kisan with intermittent connectivity, I want the app to stay partially usable when I'm offline.

#### Acceptance Criteria
1. The app has a `manifest.json` (app name, theme colour `#0b5e2c`, portrait orientation, app icons) enabling install-to-home-screen.
2. A service worker caches static assets (HTML, CSS, JS, translation dictionary, images) for offline access.
3. When the network is unavailable, a clear offline banner is shown in the farmer's language.
4. Live data features (weather, mandi prices, AI advisory) show a clear "unavailable offline" state with a retry button for when connectivity returns.
5. The app does not attempt complex offline sync (IndexedDB write queues) for the prototype.

---

### Requirement 16: Data Architecture Constraints

**User Story:** As a developer, I want external data sources isolated so I can swap or update integrations independently.

#### Acceptance Criteria
1. Each external data source has its own isolated module in the FastAPI backend: `weather_source.py`, `mandi_source.py`, `scheme_source.py`, `training_source.py`.
2. Each module exposes a consistent interface regardless of whether its data comes from an official API or a server-side scrape.
3. The React frontend never calls Open-Meteo, AGMARKNET, myScheme.gov.in, ICAR, or KVK portals directly.
4. Supabase migration files are provided for all database tables.

---

### Requirement 17: Developer Setup & Documentation

**User Story:** As a developer, I want clear setup documentation so I can run the application quickly.

#### Acceptance Criteria
1. `npm run dev` starts the frontend. `uvicorn main:app --reload` starts the backend. Both work without additional undocumented steps.
2. A `README.md` covers: prerequisites, local setup for frontend and backend, Supabase project setup, Edge Function deployment, and environment variable configuration.
3. `.env.example` files exist for both frontend and backend listing all required variables with placeholder values and indicating which are server-side only.
4. Supabase migration files are runnable to create the full schema from scratch.
5. The final project tree is clean: no dead files, no duplicate implementations, no unused folders. Kiro reviews and cleans the tree before marking implementation complete.

