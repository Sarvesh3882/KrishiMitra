# KrishiMitra — Project Documentation
## Part 3: Configuration, How to Run & Current Status

---

## 1. Full Project Structure (Top Level)

```
KrishiMitra/
├── frontend/                  # React PWA (Vite + TypeScript + Tailwind)
├── backend/                   # FastAPI Python backend
├── agrievents/                # Static event images (avif/jpg)
├── .github/workflows/         # CI/CD (GitHub Actions)
├── .gitignore
├── .gitattributes
├── README.md                  # Project README
│
├── DOCS_PART1_VISION_AND_FRONTEND.md   ← this doc series
├── DOCS_PART2_BACKEND.md
├── DOCS_PART3_CONFIG_AND_STATUS.md
│
└── (various .md files — session reports from development)
    ├── AI_ASSISTANT_IMPLEMENTATION.md
    ├── ALLIED_MARKET_INTEGRATION_COMPLETE.md
    ├── AGMARKNET_API_VERIFICATION_REPORT.md
    └── ... (20+ implementation logs)
```

---

## 2. Environment Configuration

### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder_key_12345
```

- `VITE_API_BASE_URL` — Backend URL. All fetch calls use this as the base.
  - Pattern used: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/...`
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase credentials.
  - If placeholders, app runs in **demo mode** (no auth, no DB reads)
  - Supabase client uses a dummy JWT to avoid "supabaseKey is required" error

### Backend — `backend/.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MAPPLS_CLIENT_ID=your-mappls-client-id
MAPPLS_CLIENT_SECRET=your-mappls-client-secret
```

- `MAPPLS_CLIENT_ID` / `MAPPLS_CLIENT_SECRET` — Required for `/api/v1/nearby-selling-points`
- Supabase keys — Optional (only needed for DB writes/reads)

---

## 3. How to Run (Local Development)

### Step 1 — Start Backend

```powershell
cd backend

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend runs at: `http://localhost:8000`
Swagger docs at: `http://localhost:8000/docs`

### Step 2 — Start Frontend

```powershell
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Step 3 — Verify

Open browser at `http://localhost:5173`. You should see:
- KrishiMitra dashboard with green header
- Poster carousel loading weather + mandi data
- No `ERR_CONNECTION_REFUSED` errors in console

---

## 4. Key API Calls at Runtime

When the HomePage loads, it makes these calls automatically:

| Call | Endpoint | Purpose |
|------|----------|---------|
| 1 | `GET /api/v1/weather?lat=19.88&lon=74.48&location=Kopergaon&state=maharashtra&district=Ahmednagar` | Weather poster data |
| 2 | `GET /api/v1/mandi-price?commodity=Onion&state=Maharashtra` | Market price poster |

When MarketLinkagePage loads or user searches:

| Call | Endpoint | Purpose |
|------|----------|---------|
| 3 | `GET /api/v1/nearby-selling-points?product=Vegetables&location=Kopergaon&radius=5000` | Nearby markets list |

---

## 5. External API Integrations Summary

| API | Purpose | Auth | Cost | Status |
|-----|---------|------|------|--------|
| Open-Meteo | Weather forecast | None (free) | Free | ✅ Working |
| Farmer.in | Mandi prices | None (open) | Free | ✅ Working |
| Mappls (MapmyIndia) | Nearby markets/places | client_id + secret | Paid | ✅ Working |
| NDMA SACHET | Disaster alerts | None (gov) | Free | ✅ Integrated |
| AGMARKNET | Agricultural prices | None (gov) | Free | ✅ Integrated |
| NECC | Egg/poultry prices | None (public) | Free | ✅ Active |
| NFDB FMPIS | Fish prices | TBD | TBD | ⚠ NOT_AVAILABLE |
| e-NAM | Honey/mushroom | TBD | TBD | ⚠ NOT_AVAILABLE |
| Supabase | Auth + DB | anon key | Free tier | ⚠ Demo mode |
| Sarvam AI | Voice STT/TTS | API key | Paid | 🔜 Planned |
| KisanSLM / Claude | AI advisory | API key | Paid | 🔜 Planned |

---

## 6. Language System Summary

| Language | Code | Key |
|----------|------|-----|
| English | `en` | Default greeting: "Namaste Kissan!" |
| Hindi | `hi` | Default greeting: "नमस्ते, किसान!" |
| Marathi | `mr` | Default greeting: "नमस्कार, शेतकरी!" |

- Default language set to **Marathi** (`mr`) on first load
- Language stored in `localStorage` key: `language`
- Switched via dropdown in `DashboardHeader` (EN / हिंदी / मराठी)
- All pages use `useTranslation()` hook → `t('key')` function
- 200+ translation keys covering all UI text

---

## 7. PWA Configuration

- Plugin: `vite-plugin-pwa`
- Service worker for offline caching
- App installable on mobile (Add to Home Screen)
- Target: Mobile web (iPhone 14 Pro Max: 430px wide)
- Designed for unreliable rural internet — fallback to cached data

---

## 8. Authentication

- Supabase Auth is **integrated but optional**
- App works fully without login (demo/guest mode)
- `AuthContext` wraps the app — provides `user`, `signIn()`, `signOut()`
- No login wall on any current page
- RLS (Row Level Security) configured in Supabase for future data protection

---

## 9. Database Schema (Supabase — Planned/Partial)

| Table | Purpose |
|-------|---------|
| `farmer_profiles` | User profile: name, location, enterprise type |
| `schemes` | Cached government schemes |
| `training_resources` | ICAR/KVK training modules |
| `produce_listings` | Farmer produce for market matching |
| `buyer_requirements` | Buyer/FPO demand records |
| `local_needs` | Shortage/surplus alerts |
| `chat_history` | AI conversation logs |
| `groups` | WhatsApp community groups directory |

All tables: Row Level Security (RLS) enabled.

---

## 10. Current Status (As of August 2026)

### ✅ Working
- Full frontend UI with 12 pages
- Language switching (EN / Hindi / Marathi) with 200+ translated strings
- Weather page — live 7-day forecast from Open-Meteo
- Mandi prices — live from Farmer.in (Agmarknet data)
- Nearby selling points — live from Mappls API
- Allied enterprise prices — egg, poultry, milk, meat (live)
- Homepage poster carousel (weather + market data driven)
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- CORS configured (open during development)
- Supabase client in demo mode (no auth errors)

### ⚠ Partial / In Progress
- AI Chat page UI exists but responses are keyword-based placeholders
- Fish prices (NFDB FMPIS API endpoint not yet discovered)
- Honey/Mushroom prices (e-NAM API endpoint not yet discovered)
- Vermicompost — not a market commodity, excluded

### 🔜 Planned
- Full KisanSLM / Claude AI advisory integration
- Sarvam AI voice (STT + TTS) for Indian languages
- Supabase auth with farmer profile creation
- Real produce listings + buyer matching (market linkage)
- Push notifications for weather alerts and price changes
- Production deployment (CORS tightening, env hardening)

---

## 11. Team & Attribution

- **Team:** Airavata
- **Contact:** codex5622@gmail.com
- **Kisan Call Centre (Gov):** 1800-180-1551 (toll-free helpline for farmers)
- **Data attributions:**
  - Weather: Open-Meteo (open-meteo.com)
  - Mandi prices: Agmarknet / Government of India via Farmer.in
  - Alerts: NDMA SACHET
  - Maps: Mappls (MapmyIndia)

---

## 12. Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `ERR_CONNECTION_REFUSED` on port 8000 | Backend not running | Run `uvicorn main:app --host 127.0.0.1 --port 8000 --reload` in `backend/` |
| `supabaseKey is required` error | Empty Supabase key | Fixed: dummy JWT used in demo mode |
| `:8000` without hostname in URL | `VITE_API_BASE_URL` not loaded | Restart frontend dev server after editing `.env` |
| Web-vitals `startTime` error | Browser extension (React DevTools) | Harmless — ignore or disable extension |
| Language not switching | Old session context | Language stored in `localStorage`; `setLanguage()` in `LanguageContext` |
| Weather shows "—" | Backend not running or API timeout | Start backend; Open-Meteo has 15s timeout |

---

## 13. Document Index

| File | Contents |
|------|---------|
| `DOCS_PART1_VISION_AND_FRONTEND.md` | Vision, idea, frontend pages, routing, i18n, components |
| `DOCS_PART2_BACKEND.md` | All API endpoints, data sources, services, architecture |
| `DOCS_PART3_CONFIG_AND_STATUS.md` | This file — config, how to run, status, known issues |
| `README.md` | Public-facing project overview |

---

*KrishiMitra — Built with ❤️ for Indian Farmers by Team Airavata*
