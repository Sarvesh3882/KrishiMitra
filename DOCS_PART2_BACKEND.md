# KrishiMitra — Project Documentation
## Part 2: Backend — APIs, Services & Data Sources

---

## 1. Tech Stack — Backend

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI 0.115.5 |
| Server | Uvicorn 0.32.1 (ASGI) |
| HTTP Client | httpx 0.28.1 |
| Data Validation | Pydantic 2.10.3 |
| Auth/DB | Supabase Python Client 2.11.0 |
| Env Vars | python-dotenv 1.0.1 |
| File Uploads | python-multipart 0.0.20 |
| Language | Python 3.11+ |

**Start command:** `uvicorn main:app --host 127.0.0.1 --port 8000 --reload`
**API base URL:** `http://localhost:8000`
**Interactive docs:** `http://localhost:8000/docs` (Swagger UI)

---

## 2. Backend File Structure

```
backend/
├── main.py                    # FastAPI app + all route definitions
├── config.py                  # Loads .env via python-dotenv
├── models.py                  # Pydantic models (top-level)
├── schemas.py                 # Request/Response schemas
├── requirements.txt
├── .env                       # Environment variables (not committed)
├── .env.example               # Template for .env
│
├── data/                      # Static JSON data files
│   ├── advisory_options.json
│   ├── enterprises.json
│   ├── experts.json
│   ├── markets.json
│   ├── market_prices_cache.json
│   ├── schemes.json
│   └── training_modules.json
│
├── data_sources/              # External API integrations
│   ├── weather_source.py      # Open-Meteo weather API
│   ├── mandi_source.py        # Farmer.in mandi prices API
│   ├── scheme_source.py       # Government schemes
│   ├── training_source.py     # ICAR/KVK training
│   ├── sachet_source.py       # NDMA SACHET disaster alerts
│   └── allied/                # Allied enterprise data providers
│       ├── base.py            # Base provider class
│       ├── egg_provider.py    # Egg prices
│       ├── poultry_provider.py # Poultry prices
│       ├── fish_provider.py   # Fish prices (NFDB FMPIS)
│       ├── meat_provider.py   # Meat/goat prices
│       ├── milk_provider.py   # Milk prices
│       ├── enam.py            # e-NAM (honey, mushroom)
│       ├── agmarknet.py       # AGMARKNET prices
│       ├── nfdb_fmpis.py      # National Fisheries Board
│       └── __init__.py
│
├── services/                  # Business logic layer
│   ├── allied_service.py      # Allied enterprise market routing
│   ├── advisory_service.py    # Agricultural advisory engine
│   ├── advisory_engine.py     # AI advisory logic
│   ├── data_provider.py       # Enterprise/Scheme/Training data
│   ├── weather_service.py     # Weather processing service
│   └── mappls_service.py      # Mappls maps/places API
│
├── routes/                    # Modular route files
│   ├── ai_routes.py           # AI chat routes
│   ├── scheme_routes.py       # Scheme search routes
│   └── __init__.py
│
└── models/                    # Pydantic models (sub-package)
    ├── ai.py
    └── __init__.py
```

---

## 3. All API Endpoints

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness probe — returns `{"status": "ok"}` |

### Weather
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/weather` | 7-day farmer-focused weather forecast |

**Parameters:** `lat` (float), `lon` (float), `location` (str, default: Kopergaon), `state` (str, default: maharashtra), `district` (str, optional)

**Returns:**
```json
{
  "location": { "name": "Kopergaon", "latitude": 19.88, "longitude": 74.48 },
  "current": { "temperature_c": 28, "weather_code": 61, "weather_icon": "🌧", "weather_description": "Rain" },
  "next_rain": { "time_start": "...", "total_rain_mm": 12.5, "probability": 85 },
  "daily_forecast": [...],
  "alerts": [...],
  "farmer_advisory": "...",
  "source": "Open-Meteo + SACHET"
}
```

### Mandi Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mandi-price` | Live mandi commodity prices |

**Parameters:** `commodity` (str, e.g. "Onion"), `state` (str, optional), `market` (str, optional)

**Supported states:** Maharashtra, Uttar Pradesh, Punjab, Madhya Pradesh, Karnataka

**Data source:** Farmer.in Open API → Agmarknet / Government of India
**Cache:** 6 hours

### Allied Market Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/allied-price` | Allied enterprise prices (egg, fish, milk, etc.) |
| GET | `/api/v1/allied-enterprises` | List supported allied enterprise types |
| GET | `/api/v1/allied-commodities` | List commodities for an enterprise |

**Parameters for `/api/v1/allied-price`:** `enterprise` (str), `commodity` (str), `state` (str, optional), `district` (str, optional)

### Market Linkage (Mappls)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/nearby-selling-points` | Find nearby markets/selling points via Mappls |

**Parameters:** `product` (str), `location` (str, default: Kopergaon), `radius` (int, default: 5000 meters)

**Hardcoded location coords:**
- Kopergaon: (19.8826, 74.4764)
- Ahmednagar: (19.0948, 74.7480)
- Nashik: (19.9975, 73.7898)
- Mumbai: (19.0760, 72.8777)
- Pune: (18.5204, 73.8567)

**Returns:** List of nearby places with name, distance, category, rating, contact info

### Schemes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/schemes/search` | Search government schemes |

**Request body:** `query` (str), `state` (str), `enterprise` (str)

**Data source:** Local JSON file (`data/schemes.json`) — cached, not live

### Training
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/training` | Training modules from ICAR/KVK |

### AI / Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/assistant/chat` | AI advisory chat (placeholder — full AI coming soon) |
| GET | `/api/v1/market/prices` | Market prices (legacy endpoint) |

---

## 4. Data Sources

### 4.1 Weather — Open-Meteo
- **URL:** `https://api.open-meteo.com/v1/forecast`
- **Auth:** None required (free API)
- **Data fetched:**
  - Hourly: temperature_2m, precipitation, rain, precipitation_probability, weathercode, relativehumidity_2m, windspeed_10m
  - Daily: temperature_2m_max/min, precipitation_sum, weathercode, etc.
  - Timezone: `Asia/Kolkata`
- **SACHET Integration:** NDMA SACHET CAP feed for official disaster/weather alerts
  - File: `data_sources/sachet_source.py`
  - Provides flood, cyclone, drought alerts for Indian states/districts

### 4.2 Mandi Prices — Farmer.in
- **Primary URL:** `https://www.farmer.in/api/open/prices.json`
- **Fallback:** `https://mandi-api.onrender.com/v1/prices`
- **Auth:** None (open API, keyless)
- **Cache TTL:** 6 hours
- **Attribution:** "Data sourced from Agmarknet / Government of India via Farmer.in"
- **Timeout:** 8 seconds, 1 retry
- **Returns:** Prices per quintal (min, max, modal) per commodity per market

### 4.3 Allied Enterprises — Provider Architecture
Each allied enterprise category has its own dedicated provider:

| Provider | Enterprise | Data Source | Status |
|----------|-----------|-------------|--------|
| EggProvider | Eggs | National Egg Coordination Committee (NECC) | Active |
| PoultryProvider | Poultry (broiler) | NECC / state boards | Active |
| FishProvider | Fish | NFDB FMPIS | NOT_AVAILABLE (API pending) |
| MeatProvider | Meat / Goat | State livestock boards | Active |
| MilkProvider | Milk | State milk cooperatives | Active |
| ENAMProvider | Honey, Mushroom | e-NAM | NOT_AVAILABLE |
| AgmarknetProvider | Agri commodities | AGMARKNET | Active |

### 4.4 Mappls (Maps API)
- **Service:** `services/mappls_service.py`
- **API:** Mappls (MapmyIndia) Places Nearby Search
- **URL:** `https://search.mappls.com/search/places/nearby/json`
- **Auth:** Access token (loaded from env: `MAPPLS_CLIENT_ID`, `MAPPLS_CLIENT_SECRET`)
- **Used for:** Finding nearby selling points, markets, mandis, collection centres
- **Token refresh:** Automatic, cached

### 4.5 Government Schemes
- **Source:** Local JSON `data/schemes.json` (pre-loaded, not live)
- **Filtering:** By enterprise type, state, keyword search
- **Fields:** name, description, department, state, eligibility, subsidy_percentage, subsidy_amount, application_process, required_documents, official_source_url

### 4.6 AI Advisory (Placeholder)
- Current: Keyword-based intent detection + static responses
- Intent categories: `scheme_search`, `market_search`, `training`, `advisory`, `general`
- Planned: KisanSLM → Claude → Q&A fallback chain
- Planned voice: Sarvam AI for Indian language STT/TTS

---

## 5. Services

### WeatherService (`services/weather_service.py`)
- Calls `WeatherSource.fetch_weather()` → processes raw Open-Meteo data
- Detects rain events (groups consecutive rainy hours, threshold: 0.5mm)
- Calculates `next_rain_event` with date label ("Today", "Tomorrow", "Mon Aug 29")
- Fetches SACHET alerts for state/district
- Generates `farmer_advisory` text based on weather conditions
- Response cached for 30 minutes

### AlliedMarketService (`services/allied_service.py`)
- Routes enterprise requests to the correct provider
- Enterprise → Provider mapping:
  - `egg` → EggProvider
  - `poultry` → PoultryProvider
  - `fish` → FishProvider
  - `meat` / `goat` → MeatProvider
  - `milk` → MilkProvider
  - `honey` / `mushroom` → ENAMProvider (NOT_AVAILABLE)
  - `vermicompost` → None (not a market commodity)
- Cache TTL: 30 minutes

### MapplsService (`services/mappls_service.py`)
- OAuth token management (client_id + client_secret → access_token)
- `find_nearby_selling_points(product, lat, lon, radius, max_results)`
- Product-based keyword mapping:
  - `Vegetables` → "vegetable market;fruit market;mandi;APMC;agricultural market"
  - `Milk` → "dairy;milk collection;Amul;dairy cooperative"
  - `Fish` → "fish market;seafood;machli bazaar"
  - etc.

### DataProvider (`services/data_provider.py`)
- `EnterpriseProvider` — serves enterprise data from `data/enterprises.json`
- `SchemeProvider` — serves schemes from `data/schemes.json`
- `TrainingProvider` — serves training from `data/training_modules.json`
- `MarketProvider` — serves market data from `data/markets.json`

---

## 6. CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # All origins (development mode)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

> Note: In production this should be tightened to the deployed frontend domain.

---

## 7. Backend Environment Variables

File: `backend/.env`

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Optional |
| `MAPPLS_CLIENT_ID` | Mappls API client ID | Required for market linkage |
| `MAPPLS_CLIENT_SECRET` | Mappls API client secret | Required for market linkage |
| `OPENAI_API_KEY` | OpenAI key (for AI chat) | Optional |
| `ANTHROPIC_API_KEY` | Claude key (for AI chat) | Optional |

---

*→ Continue in DOCS_PART3_CONFIG_AND_STATUS.md*
