# KrishiMitra — Project Documentation
## Part 1: Vision, Idea & Frontend

---

## 1. What is KrishiMitra?

**KrishiMitra** (कृषिमित्र) means "Farmer's Friend" in Hindi/Marathi.

It is a **voice-first, mobile-first Progressive Web App (PWA)** built specifically for Indian farmers — especially those running **allied agricultural enterprises** like poultry, fisheries, dairy, mushroom cultivation, apiculture (beekeeping), vermicomposting, and goat farming.

**The core problem it solves:**
Indian farmers — particularly in rural Maharashtra — lack access to timely, reliable, and language-appropriate information about:
- Weather forecasts and agricultural alerts
- Live mandi (market) commodity prices
- Government schemes they are eligible for
- Nearby markets to sell their produce
- Expert advice and AI-powered guidance
- Community events, training programs, and groups

**The solution:**
KrishiMitra aggregates all of this into one simple, voice-enabled app that works in **English, Hindi, and Marathi** — designed for farmers who may not be tech-savvy.

---

## 2. Target Users

- Small and marginal farmers in rural India (primary: Maharashtra)
- Farmers running **allied enterprises**: poultry, fisheries, dairy, mushroom, apiculture, vermicomposting, goat farming
- Default demo location: **Kopergaon, Ahmednagar district, Maharashtra**
  - Coordinates: lat 19.8826, lon 74.4764

---

## 3. Design Philosophy

- **Government of India color palette**: Primary green `#0b5e2c`, Saffron/Orange `#f5820a`
- **Mobile-first**: Designed for 360–430px viewports (iPhone 14 Pro Max target)
- **Voice-first**: Primary interaction through speech; typing is secondary
- **Accessibility**: Minimum 48px tap targets, 4.5:1 contrast ratio
- **Noto Sans Devanagari** font for Hindi/Marathi text rendering
- Trusted government-style UI with Ashoka Emblem badge branding

---

## 4. Tech Stack — Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router DOM 7 |
| Icons | Lucide React |
| HTTP | Native `fetch` API |
| Auth/DB | Supabase JS Client |
| PWA | vite-plugin-pwa |
| Testing | Vitest + fast-check |

**Dev server:** `http://localhost:5173`
**API base URL:** `http://localhost:8000` (via `VITE_API_BASE_URL` env var)

---

## 5. Frontend File Structure

```
frontend/
├── public/
│   └── Posters/               # Static poster images (PNG)
│       ├── eventtimeline.png
│       ├── climatealert.png
│       ├── marketprice.png
│       └── ...
├── src/
│   ├── App.tsx                # Router + Providers
│   ├── main.tsx               # Entry point
│   ├── components/            # Shared UI components
│   │   ├── DashboardHeader.tsx
│   │   ├── GovHeader.tsx
│   │   ├── UpdatesPosterCarousel.tsx
│   │   ├── BottomNav.tsx
│   │   └── LoadingSpinner.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Supabase auth state
│   │   └── LanguageContext.tsx # Language state (en/hi/mr)
│   ├── hooks/
│   │   └── usePosterData.ts  # Fetches weather + mandi for homepage posters
│   ├── i18n/
│   │   ├── translations.ts   # 200+ translation keys (en/hi/mr)
│   │   └── useTranslation.ts # Hook: t('key') → translated string
│   ├── lib/
│   │   └── supabaseClient.ts # Supabase client init
│   └── pages/
│       ├── HomePage.tsx
│       ├── WeatherPage.tsx
│       ├── MarketLinkagePage.tsx
│       ├── AlliedBazarPage.tsx
│       ├── WhatsAroundMePage.tsx
│       ├── HelpPage.tsx
│       ├── AIChatPage.tsx
│       ├── CommunityPage.tsx
│       ├── BazaarPage.tsx
│       ├── EventDetailsPage.tsx
│       ├── AlliedGuideDetailsPage.tsx
│       └── LanguageSelectionPage.tsx
```

---

## 6. Routing (App.tsx)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Dashboard with poster carousel + nav cards |
| `/ai` | `AIChatPage` | AI voice chat with KisanSLM |
| `/around` | `WhatsAroundMePage` | Nearby markets, services, enterprises |
| `/around/allied-bazar` | `AlliedBazarPage` | Allied product marketplace |
| `/community` | `CommunityPage` | WhatsApp groups, events, guides |
| `/community/event/:id` | `EventDetailsPage` | Event detail page |
| `/community/guide/:id` | `AlliedGuideDetailsPage` | Allied enterprise guide |
| `/market` | `MarketLinkagePage` | Nearby selling points via Mappls API |
| `/bazaar` | `BazaarPage` | Commodity bazaar listings |
| `/weather` | `WeatherPage` | 7-day forecast + alerts + advisory |
| `/help` | `HelpPage` | Expert helplines, Kisan Call Centre |
| `*` | Redirect to `/` | Catch-all |

**Default language:** Marathi (`mr`) — set in localStorage on first load.
No login wall — app works without authentication.

---

## 7. Pages — Detailed

### 7.1 HomePage (`/`)
- **DashboardHeader** at top (logo, language switcher)
- **AI Voice Card** (green `#0b5e2c` card) — navigates to `/ai`
  - Mic icon + "Ask KrishiMitra" text + chevron + "Listen" button
- **UpdatesPosterCarousel** — horizontal scroll of poster cards fetched from backend
- **Main Services Grid** — 4 navigation cards:
  - 🛒 What's Around Me → `/around`
  - 🌧 Weather → `/weather`
  - 👥 Community → `/community`
  - ❓ Help → `/help`
- **Bottom Navigation Bar** with Home, Market, Weather, Community, Help

### 7.2 WeatherPage (`/weather`)
- Fetches from `GET /api/v1/weather?lat=19.88&lon=74.48&location=Kopergaon&state=maharashtra&district=Ahmednagar`
- Displays:
  - Current temperature + weather condition + icon
  - "When will it rain?" section with next rain timing
  - 7-day daily forecast (date, max/min temp, rain mm, probability)
  - Weather alerts list
  - Farmer advisory text (AI-generated from backend)
- All text translated via `useTranslation()` hook
- Default location: Kopergaon, Ahmednagar

### 7.3 MarketLinkagePage (`/market`)
- Fetches nearby selling points via Mappls API (through backend)
- Search by product type (Vegetables, Fruits, Dairy, Fish, Poultry, etc.)
- Shows cards with:
  - Place image (Unsplash, category-matched)
  - Name, distance, rating, category
  - "Get Directions" button
- Quick search buttons for: Onion, Tomato, Potato, Sugarcane, Cotton, etc.
- Location: Kopergaon (hardcoded)
- API: `GET /api/v1/nearby-selling-points?product=Vegetables&location=Kopergaon&radius=5000`

### 7.4 AlliedBazarPage (`/around/allied-bazar`)
- Marketplace for allied agricultural products (eggs, milk, fish, meat, etc.)
- Fetches live prices from allied data providers
- Categories: Eggs, Poultry, Fish, Milk, Meat

### 7.5 WhatsAroundMePage (`/around`)
- Shows nearby agricultural infrastructure
- Fetches mandi prices from backend
- Lists: FPOs, KVKs, Cold Storages, Warehouses, nearby markets

### 7.6 HelpPage (`/help`)
- **Kisan Call Centre**: 1800-180-1551 (toll-free)
- Expert helplines list
- WhatsApp community group links
- Government agricultural department contacts
- All translated in 3 languages

### 7.7 AIChatPage (`/ai`)
- Voice + text input interface
- Connects to AI advisory backend
- Chat history display
- Sarvam AI for speech-to-text / text-to-speech (Indian languages)

### 7.8 CommunityPage (`/community`)
- Events calendar/timeline
- Allied enterprise guides
- WhatsApp group directory
- Training resources from ICAR/KVK

---

## 8. i18n System

**Languages supported:** English (`en`), Hindi (`hi`), Marathi (`mr`)

**How it works:**
1. `translations.ts` — flat key-value dictionary with 200+ keys for all 3 languages
2. `useTranslation.ts` — hook that reads `language` from `localStorage` and returns `t(key)` function
3. `LanguageContext.tsx` — React context wrapping the app, holds `language` state + `setLanguage()`
4. `DashboardHeader.tsx` — has a language dropdown (EN / हिंदी / मराठी) that calls `setLanguage()`

**Key translation categories:**
- `home.*` — HomePage strings
- `weather.*` — WeatherPage strings
- `mandi.*` — Market price strings
- `help.*` — HelpPage strings
- `nav.*` — Navigation labels
- `around.*` — WhatsAroundMe strings
- `allied.*` — Allied bazar strings
- `day.*`, `month.*` — Date/time localization
- `enterprise.*` — Enterprise type labels

**Example:**
```ts
const { t } = useTranslation();
// In English: "Namaste Kissan!"
// In Hindi: "नमस्ते, किसान!"
// In Marathi: "नमस्कार, शेतकरी!"
t('home.greeting')
```

---

## 9. Key Components

### DashboardHeader
- KrishiMitra logo/title (green, with Ashoka emblem)
- Language switcher dropdown (EN / हिंदी / मराठी)
- Notification bell icon

### UpdatesPosterCarousel
- Horizontal scrollable poster cards
- Data from `usePosterData` hook
- Posters: Event Timeline, Weather Alert, Market Prices, Schemes
- Each poster navigates to its relevant page on tap

### usePosterData Hook
- Fetches weather data from `/api/v1/weather`
- Fetches mandi prices from `/api/v1/mandi-price?commodity=Onion&state=Maharashtra`
- Builds poster cards with dynamic titles/subtitles
- Fallback to static images if API fails
- Poster priority order: Event (0) → Weather (1) → Market Price (2) → Scheme (3)

---

## 10. Supabase (Frontend)

File: `frontend/src/lib/supabaseClient.ts`

- Used for authentication (optional — app works without it)
- Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`
- If credentials are missing/placeholder → runs in **demo mode** with a dummy JWT
- `isSupabaseConfigured` boolean exported to check if auth is available

**Current `.env`:**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder_key_12345
```

---

*→ Continue in DOCS_PART2_BACKEND.md*
