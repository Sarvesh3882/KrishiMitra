"""
Mandi Price Tool - Wrapper around existing Farmer.in integration
Reuses: backend/data_sources/mandi_source.py
"""

from typing import Dict, Any, Optional
from data_sources.mandi_source import MandiSource
import logging

logger = logging.getLogger(__name__)

# Mistral Agent function schema
mandi_tool = {
    "type": "function",
    "function": {
        "name": "get_mandi_price",
        "description": "Get current mandi/market prices for agricultural commodities in India. Uses live data from Farmer.in (Agmarknet). Returns price per quintal, min/max prices, and market trends. Supports Hindi commodity names like प्याज (onion), टमाटर (tomato), आलू (potato).",
        "parameters": {
            "type": "object",
            "properties": {
                "commodity": {
                    "type": "string",
                    "description": "Commodity name in English or Hindi. Examples: 'Onion', 'प्याज', 'Tomato', 'टमाटर', 'Potato', 'आलू', 'Wheat', 'गेहूं'"
                },
                "state": {
                    "type": "string",
                    "description": "Optional state name for filtering. Examples: 'Maharashtra', 'Punjab', 'Uttar Pradesh'"
                },
                "market": {
                    "type": "string",
                    "description": "Optional market/district name. Examples: 'Kopergaon', 'Pune', 'Nashik'"
                }
            },
            "required": ["commodity"]
        }
    }
}

# Commodity name mappings (Hindi to English)
COMMODITY_ALIASES = {
    "प्याज": "Onion",
    "टमाटर": "Tomato",
    "आलू": "Potato",
    "गेहूं": "Wheat",
    "चावल": "Rice",
    "बाजरा": "Bajra",
    "ज्वार": "Jowar",
    "मक्का": "Maize",
    "सोयाबीन": "Soyabean",
    "कपास": "Cotton",
    "मूंगफली": "Groundnut",
    "गन्ना": "Sugarcane",
    "सरसों": "Mustard",
    "सूरजमुखी": "Sunflower",
    "अरहर": "Arhar",
    "मूंग": "Moong",
    "उड़द": "Urad",
    "चना": "Chickpea",
    "हल्दी": "Turmeric",
    "मिर्च": "Chilli"
}


async def get_mandi_price(
    commodity: str,
    state: Optional[str] = None,
    market: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get mandi prices for a commodity using existing Farmer.in integration.
    
    This is a thin wrapper - all logic is in the existing MandiSource.
    
    Args:
        commodity: Commodity name (English or Hindi)
        state: Optional state filter
        market: Optional market filter
        
    Returns:
        Structured response with price data and navigation action
    """
    logger.info(f"[TOOL:get_mandi_price] commodity={commodity}, state={state}, market={market}")
    
    try:
        # Normalize Hindi commodity names to English
        commodity_normalized = COMMODITY_ALIASES.get(commodity, commodity)
        
        # Call existing Farmer.in integration (NO DUPLICATION)
        result = await MandiSource.fetch_mandi_prices(
            commodity=commodity_normalized,
            state=state,
            market=market
        )
        
        # Check availability
        availability = result.get("availability", "available")
        prices = result.get("prices", [])
        
        if availability == "not_available" or not prices:
            logger.warning(f"[TOOL:get_mandi_price] No data available for {commodity}")
            return {
                "status": "unavailable",
                "message": f"वर्तमान में {commodity} के लिए मंडी भाव उपलब्ध नहीं है।",
                "commodity": commodity,
                "navigation": None
            }
        
        # Extract price data from existing service response
        price_data = prices[0]
        price_per_quintal = price_data.get("price_per_quintal", 0)
        min_price = price_data.get("min_price", 0)
        max_price = price_data.get("max_price", 0)
        trend = price_data.get("trend", "")
        change = price_data.get("change", 0)
        date = price_data.get("date", "")
        state_name = price_data.get("state", "")
        major_states = price_data.get("major_states", [])
        
        # Format response for Agent
        response = {
            "status": "available",
            "commodity": commodity,
            "commodity_english": commodity_normalized,
            "price_per_quintal": price_per_quintal,
            "min_price": min_price,
            "max_price": max_price,
            "trend": trend,
            "change": change,
            "date": date,
            "state": state_name or (major_states[0] if major_states else ""),
            "source": "Farmer.in (Agmarknet)",
            "navigation": {
                "enabled": True,
                "label": "अधिक जानकारी देखें",
                "label_english": "View more details",
                "route": "/bazaar",
                "params": {
                    "commodity": commodity_normalized.lower()
                }
            }
        }
        
        logger.info(f"[TOOL:get_mandi_price] Success: ₹{price_per_quintal}/quintal")
        return response
        
    except Exception as e:
        logger.error(f"[TOOL:get_mandi_price] Error: {e}")
        return {
            "status": "error",
            "message": f"मंडी भाव प्राप्त करने में त्रुटि: {str(e)}",
            "commodity": commodity,
            "navigation": None
        }
