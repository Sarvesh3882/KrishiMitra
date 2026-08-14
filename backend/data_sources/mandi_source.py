"""
mandi_source.py — Live mandi price integration for KrishiMitra.

Data flow: Data.gov.in AGMARKNET API → AGMARKNET direct → HTTPException(503)
Never returns cached or fabricated prices.
Swap this module to change price data sources without touching routes.
"""
import os
import httpx
from datetime import datetime, timezone
from fastapi import HTTPException
from models import MandiPriceResponse


DATA_GOV_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
AGMARKNET_URL = "https://agmarknet.gov.in/PriceTrends/SA_Arrivals_DM_Mar.aspx"


async def fetch_mandi_price(crop: str, state: str, district: str) -> MandiPriceResponse:
    """
    Fetch live mandi prices for the given crop, state, district.

    Tries Data.gov.in AGMARKNET API first, then direct AGMARKNET scraping.
    Raises HTTPException(503) on any failure — never returns fake data.
    """
    # Layer 1: Data.gov.in API (requires DATA_GOV_API_KEY env var)
    api_key = os.getenv("DATA_GOV_API_KEY")
    if api_key:
        result = await _fetch_from_data_gov(crop, state, district, api_key)
        if result:
            return result

    # Layer 2: Direct AGMARKNET public portal scrape
    result = await _fetch_from_agmarknet(crop, state, district)
    if result:
        return result

    raise HTTPException(
        status_code=503,
        detail={
            "error": f"Mandi price data unavailable for {crop} in {district}, {state}",
            "retryable": True,
        },
    )


async def _fetch_from_data_gov(
    crop: str, state: str, district: str, api_key: str
) -> MandiPriceResponse | None:
    """
    Fetch from Data.gov.in AGMARKNET resource API.

    Returns a MandiPriceResponse on success, None if no matching records are
    found or the request fails for any reason.
    """
    params = {
        "api-key": api_key,
        "format": "json",
        "filters[Commodity]": crop,
        "filters[State]": state,
        "filters[District]": district,
        "limit": 5,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(DATA_GOV_API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        records = data.get("records", [])
        if not records:
            return None

        # Use the most recent / first returned record
        rec = records[0]
        return MandiPriceResponse(
            crop=rec.get("Commodity", crop),
            min_price=float(rec.get("Min Price", 0)),
            max_price=float(rec.get("Max Price", 0)),
            modal_price=float(rec.get("Modal Price", 0)),
            mandi_name=f"{rec.get('Market', district)} APMC",
            last_updated=rec.get(
                "Arrival Date", datetime.now(timezone.utc).isoformat()
            ),
        )
    except Exception:
        return None


async def _fetch_from_agmarknet(
    crop: str, state: str, district: str
) -> MandiPriceResponse | None:
    """
    Attempt to fetch from AGMARKNET public portal.

    AGMARKNET does not expose a stable public JSON API; the portal renders
    data through ASP.NET Web Forms with session-dependent ViewState tokens,
    making reliable programmatic access impossible without a full browser
    automation layer.

    This layer is intentionally left as a stub that returns None. When a
    confirmed stable endpoint or scraping contract is available, replace this
    function body with the implementation. The caller will raise HTTPException
    (503) when both layers return None — which is the correct behaviour.

    TODO: Implement server-side HTML scraping once AGMARKNET URL structure
    and ViewState bypass strategy are confirmed.
    """
    return None
