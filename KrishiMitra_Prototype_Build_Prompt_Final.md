# KrishiMitra — Prototype Build Prompt (for Kiro)

Paste this into Kiro as your spec/prompt to generate the prototype.

---

## Project Overview

Build a **mobile-first, mobile-only optimized** web prototype called **KrishiMitra** — an AI-powered agricultural advisory platform for farmers (Kisan) running allied agricultural enterprises (poultry, fisheries, apiculture, mushroom cultivation, vermicomposting, dairy, etc.). This is NOT a desktop app — design and test only for phone screen widths (360px-420px typical). Assume the primary user is a Kisan with low digital literacy, limited English, and a basic smartphone.

This should be a **real, working build** — not a fully faked demo. Keep the backend deliberately lightweight (Supabase handles almost everything), but wire up actual data flow, actual AI calls, and actual persistence wherever it's reasonably easy. Only fall back to mock/hardcoded content where a real integration would be genuinely heavy (e.g. no free reliable API exists, or it needs a paid key you don't have yet) — and in those spots, structure the code so swapping in the real thing later is a one-line change.

## Visual Identity — Government of India Style

Model the look and feel on official Government of India digital platforms (like the attached Kisan Credit Card portal reference). Specifically:

- **Header bar**: Left side — KrishiMitra logo/wordmark (green + saffron accent, rupee/leaf-style icon). Right side — small Ashoka Emblem/Government of India style badge with bilingual text ("भारत सरकार / Government of India" and "कृषि एवं किसान कल्याण मंत्रालय / Ministry of Agriculture and Farmers Welfare" style attribution, even if fictionalized for the prototype) — this signals trust and authenticity to farmers
- **Color palette**: White background, official green (#0b5e2c-ish) for primary text/headers, saffron/orange (#f5820a-ish) for highlights/CTAs, soft teal/mint illustration accents — same restrained, formal palette as the reference image
- **Typography**: Clean, high-contrast, generously sized (farmers may have low vision/literacy) — no decorative fonts
- **Footer**: Simple copyright/attribution line like official sites: "This platform is a prototype developed for [Hackathon name] — Team Airavata"
- **Illustrations**: Flat, friendly, government-portal-style illustrations (like the maintenance-page character art in the reference) rather than trendy startup-style graphics
- Overall impression: this should feel like an **official, trustworthy government agri-service**, not a flashy consumer app

## Language & Voice — Core to the Product

- App must support switching between **English, Hindi, and Marathi** at minimum (language picker visible on first load, persists across the app)
- All static UI text should pull from a language dictionary/JSON so switching language changes labels, buttons, headers everywhere — not just the chatbot
- **Sarvam AI** is the (mocked, for now) text-to-speech / speech-to-text / translation engine — every screen that shows AI-authored text should have a small "🔊 Listen" button next to it, labeled as powered by Sarvam AI, that (in the prototype) triggers browser TTS as a stand-in
- **KisanSLM** is the (mocked, for now) underlying agricultural language model that answers farmer queries — label AI responses with a small "Powered by KisanSLM" tag for authenticity, even though responses are hardcoded/simulated in this prototype

## Tech Stack

**Frontend**

- React + Tailwind CSS, strictly mobile viewport design (max-width container simulating a phone, or fully responsive with mobile breakpoints as default), PWA-ready structure
- The frontend only ever requests and displays already-processed data — it never talks to AGMARKNET/e-NAM or Open-Meteo directly, and never fetches or renders mandi prices itself.

**Location model**

- Store State, District, Taluka/Block and Village as structured fields in `farmer_profiles`.
- Store latitude/longitude separately when GPS is available.
- Use administrative location for scheme and local-market filtering.
- Use coordinates for weather and distance-based market/buyer matching.
- If GPS permission is denied, continue using the farmer's manually selected location.

**Backend — two lightweight pieces, split by responsibility**

1. **Supabase (Postgres + Auth)** for everything structural and low-churn: farmer profiles, a `schemes` table (populated as a cache from the FastAPI myScheme endpoint below, not hand-seeded), "local needs" alerts, chat history, WhatsApp group directory (see Community module below). No custom server needed for this half — the frontend talks to Supabase directly via the Supabase JS client with Row Level Security.
2. **FastAPI backend** for all *external, live, third-party* data fetching — this is the only place that talks to Open-Meteo, AGMARKNET/e-NAM, myScheme.gov.in, and ICAR/KVK/state training portals. Keep it small (a handful of route handlers, no heavy framework overhead). The React frontend never talks to any of these sources directly — it only ever requests and displays already-processed data from these FastAPI routes. Its jobs:
   - **Weather endpoint** (`/api/weather`): use **Open-Meteo** as the weather-data provider.
     - Input: latitude/longitude, obtained on the frontend from GPS permission or the farmer's selected location, sent to this endpoint.
     - The backend calls Open-Meteo's Forecast API with those coordinates and requests current conditions plus forecast data: temperature, humidity, precipitation/rain probability, wind speed, and weather condition.
     - Open-Meteo returns JSON; the backend processes/normalizes it (localized to Indian coordinates) and sends the cleaned result to the frontend, along with the data's valid/update time.
     - Always a live fetch — never hardcoded, never cached as static fallback data for the demo.
   - **Mandi price endpoint** (`/api/mandi-price`): use **AGMARKNET/e-NAM (or another reliable Indian mandi-price source)** as the data source.
     - Input: crop + location (from the farmer's selection or saved profile location).
     - The backend requests the latest market data from the source, identifies the relevant mandis for that crop/location, and returns: minimum price, maximum price, modal price, the mandi name, and last-updated time.
     - Fetched dynamically on every request — never hardcoded or static.
     - If the official source doesn't expose a usable public API, fall back to an isolated server-side fetch/scrape module rather than hardcoding data — same output shape either way.
     - Keep this data-source logic in its own module/file (e.g. `mandi_source.py`) so the source can be swapped later without touching the rest of the app.
     - **The LLM must never generate or guess a price** — it only explains/summarizes the numbers that came back from this endpoint.
   - **Scheme endpoint** (`/api/schemes`): use **myScheme.gov.in** as the primary source for government scheme data.
     - The backend retrieves scheme information from myScheme through its available structured/API access where possible.
     - If a required scheme or field isn't available through that access, fall back to fetching the official government webpage for that scheme and extracting the needed fields via an appropriate server-side scraping method — same rule as the mandi source: isolate this in its own module (e.g. `scheme_source.py`) so the fetch method can change without touching the rest of the app.
     - Extract, per scheme: name, description, eligibility, benefits, required documents, application process, and the official application link.
     - Input: the farmer's location, crop, and agricultural activity/enterprise type (from their saved profile or current selection) — used to filter and rank which schemes are shown as relevant/recommended.
     - Always retain the official source URL and the latest fetched values for each scheme; store these as a **cache** in Supabase's `schemes` table (refreshed periodically or on-demand) so the app has fast, resilient reads for the demo without ever hardcoding scheme content by hand.
     - **The LLM must never generate, assume, or fill in scheme details** — it may only explain/summarize the eligibility, benefits, or process text that came back from this endpoint, and should always surface the official link alongside its explanation.
   - **Training endpoint** (`/api/training`): use **ICAR, Krishi Vigyan Kendras (KVKs), state agriculture departments, and other verified government agricultural training portals** as the primary sources.
     - The backend fetches available training/course information from these sources through structured/API access where it exists, or an isolated server-side scraping module (e.g. `training_source.py`) where it doesn't — same isolation pattern as the mandi and scheme sources.
     - Extract, per training resource: topic, crop/activity, language, duration, training material (link/description), and the original source link.
     - Input: the farmer's crop/activity and (optionally) preferred language — used to filter which resources are shown.
     - Always retain the original source link with every resource; cache results in Supabase for fast, resilient reads.
     - **The LLM must never generate training content and present it as factual government guidance unless it is grounded in the retrieved official material** — same discipline as prices and schemes: explain/summarize what was fetched, never invent it, and always surface the source link alongside any explanation.

**AI Advisory (KisanSLM stand-in)**

- A real LLM call (Claude API) — either as a third FastAPI route or a Supabase Edge Function, your call — scoped to grounded agricultural advice. When a farmer asks about prices or weather, the LLM's job is to *explain* the number the FastAPI endpoints already fetched, not to invent one itself.
- If a query fails or no key is configured in a given environment, fall back to a small curated set of realistic Q&A pairs (translated into EN/HI/MR) so the demo never breaks live.

**Voice (Sarvam AI stand-in)**

- If you have Sarvam AI API access, wire real speech-to-text / text-to-speech / translation through a backend route (keeps the key server-side).
- If not available yet, use the browser's Web Speech API as the functional stand-in — label it honestly, structured so swapping in real Sarvam AI later is isolated to one function.

## App Structure

### Splash / Language Select (first load)

- KrishiMitra logo, Government-style header
- "Choose your language / अपनी भाषा चुनें / आपली भाषा निवडा" with 3 large buttons: English / हिंदी / मराठी

### Home Screen — 4 Large Cards (core requirement)

A simple, icon-first, single-column (or 2x2 max) mobile layout with exactly these four sections, each a big tappable card with icon + local-language label:

**1. What's Around Me (आसपास काय आहे)**

- **Mandi/market prices**: farmer selects a crop and location (or app uses their saved location); frontend calls the FastAPI mandi-price endpoint, which dynamically fetches the latest AGMARKNET/e-NAM data and returns minimum, maximum, and modal price, mandi name, and last-updated time. Nothing here is hardcoded — always a live fetch, shown with its timestamp so the farmer knows how fresh it is.
- **Weather**: frontend gets the farmer's lat/long (GPS permission or their selected location), sends it to the FastAPI weather endpoint, which calls Open-Meteo and returns current conditions + forecast (temperature, humidity, precipitation/rain chance, wind speed, condition) plus valid/update time — properly localized to Indian coordinates, always live.
- **Market Linkage (Find Buyers / Sell Through e-NAM)**: KrishiMitra positions itself as a **market-discovery and matching layer**, not a competitor to e-NAM's actual trading infrastructure — e-NAM already handles farm-gate and FPO lot-wise trading, so KrishiMitra's job is to help a farmer discover the right opportunity and route them to the right channel. 
  - **Produce Listings**: a farmer creates a structured listing — product, quantity, quality/grade, expected price, available-from date, location, pickup/delivery preference, optional photo — stored in a Supabase `produce_listings` table.
  - **Buyer Requirements**: a buyer (or FPO/aggregator) posts a structured requirement — product, quantity needed, location, required-by date, quality grade, expected price range — stored in a Supabase `buyer_requirements` table.
  - **Matching**: a lightweight matching function (can run as a Supabase Edge Function or a simple query) matches listings to requirements on product + quantity + location + quality + price range + date, and surfaces the result as "3 potential buyers found" (to the farmer) or "5 matching producers found" (to the buyer). No in-app transaction or payment — matches simply reveal a contact method (WhatsApp/phone) so the two sides connect directly, consistent with the "no in-app messaging" design used elsewhere in the app.
  - **Sell Through e-NAM**: alongside the matching results, a clearly separated section links/redirects eligible farmers to **e-NAM** (enam.gov.in) for actual electronic trading — framed as "KrishiMitra finds you the opportunity, e-NAM (or a direct buyer) is where you complete it," not as a replacement for formal trading channels.
  - Keep the "local needs" concept folded into this module (e.g. "Fertilizer shortage reported nearby" style alerts can live alongside buyer requirements as general nearby-needs entries) rather than as a separate, thinner feed.

**2. Schemes & Training Portal (योजना आणि प्रशिक्षण)**

- List of government schemes relevant to allied agriculture, sourced live from **myScheme.gov.in** via the FastAPI `/api/schemes` endpoint (cached into Supabase's `schemes` table for fast reads). Each scheme card shows description, eligibility, benefits, required documents, and application process, plus a "recommended for you" tag matched against the logged-in farmer's profile (enterprise type, location, crop) — and always links out to the **official application link** so the farmer applies through the real government channel, not through KrishiMitra.
- **Training Portal**: a real, browsable library of training/course resources, sourced live from **ICAR, KVKs, state agriculture department portals, and other verified government training sources** via the FastAPI `/api/training` endpoint (cached into a Supabase `training_resources` table). Organize by enterprise type (poultry/fisheries/apiculture/goat farming/mushroom/vermicompost/dairy) with filters for crop/activity and language. Each resource card shows topic, crop/activity, language, duration, and training material, and always keeps the original source link visible. As with schemes, the LLM/chatbot may only explain or summarize a training resource grounded in what this endpoint actually returned — it must never present invented content as official government training guidance.

**3. Farmer Community & Experts (शेतकरी समुदाय)**

- No in-app feed, no post/photo storage of any kind needed for this module. Keep it purely a **redirect layer** pointing the farmer to existing external channels — Supabase here only stores the small directory of groups/links, not any user-generated content: 
  - A list of relevant **WhatsApp groups** (by location/enterprise type — e.g. "Nashik Poultry Farmers," "Maharashtra Beekeepers") stored in a small Supabase table (group name, description, `wa.me` join link); tapping one opens WhatsApp directly via a deep link
  - An **"Ask an Expert"** button that redirects straight to the **Kisan Call Centre** — either a `tel:` link to dial the real KCC number (1800-180-1551) directly, or a WhatsApp deep link if KCC supports that; no in-app form/ticket system needed

**4. Ask KrishiMitra — AI Voice Chatbot (कृषिमित्राला विचारा)**

- Full-screen chat interface, large mic button front and center
- Farmer taps mic, speaks in their local language — routed through a backend route to Sarvam AI (if configured) or Web Speech API (fallback) for speech-to-text
- Query + farmer profile context sent to the AI advisory backend route (Claude API) for a real generated answer, scoped to grounded agricultural advice. If the question is about prices or weather, the LLM calls/reads from the FastAPI endpoints above and only explains those real numbers — it never fabricates a price or forecast itself.
- Show a genuine "Listening... / KisanSLM is thinking... / Sarvam AI is translating..." sequence of loading states while the real calls run
- Response appears as text in the farmer's language AND is read aloud (🔊 Sarvam AI / Web Speech voice button)
- Chat history logged to Supabase per farmer, so past questions are retrievable
- Keep a small curated fallback Q&A set (poultry disease symptoms, mushroom cultivation season, vermicompost setup cost, etc.) purely as a safety net if the live call fails during a demo

### Persistent Bottom Navigation

Government-portal-style bottom tab bar (not a floating modern FAB style) with icon + label for: Home, Schemes, Community, Ask KrishiMitra — always visible, thumb-reachable on mobile.

## Design Details to Get Right

- Everything sized for one-thumb mobile use — large tap targets (min 48px), no hover-dependent interactions
- Avoid English-only jargon; every label should feel like it belongs on an official Indian government portal translated into regional languages
- Keep the "official/trustworthy" visual tone from the reference image throughout — not just the header, but form fields, buttons, and cards should feel formal and government-grade, not like a flashy consumer startup

## Deliverable

A single mobile-optimized React app runnable via `npm run dev`, connected to a real Supabase project, with:

- `.env.example` listing required keys: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, plus placeholders for `ANTHROPIC_API_KEY` (or OpenAI) and `SARVAM_API_KEY` used inside the Edge Functions only (never in frontend code)
- Supabase schema/migration files for: `farmer_profiles`, `schemes` (myScheme cache), `training_resources` (ICAR/KVK cache), `market_prices`, `produce_listings`, `buyer_requirements`, `local_needs` (general nearby alerts, folded into Market Linkage UI), `chat_history`, plus the small WhatsApp `groups` directory table (see Community module)
- Two Supabase Edge Functions: one for AI advisory (LLM call), one for voice (STT/TTS via Sarvam AI or Web Speech fallback)
- Language switcher (EN/HI/MR) working across all static text
- All 4 home modules functional against real Supabase data
- AI chatbot flow working end-to-end with a real LLM call and a documented fallback path
- Government-style visual branding matching the attached reference throughout

---

### Notes for you (Sarvesh) before pasting into Kiro

- I folded in your reference screenshot's exact visual language (bilingual official header, green/saffron palette, flat govt-style illustrations, formal footer) as an explicit design instruction.
- You'll need to actually create a free Supabase project and drop its URL/anon key into `.env` before Kiro's generated app will run against real data — that's the only real setup step here.
- If you don't have a Sarvam AI key yet, tell Kiro to build the voice layer against Web Speech API first and isolate it behind one function so swapping in Sarvam later is quick.
- Same for the LLM: if you don't have an Anthropic/OpenAI key handy right now, say so and Kiro can stub that one Edge Function with the curated fallback Q&A until you add a key.