"""
Weather Tool - Wrapper around existing Open-Meteo integration
Reuses: backend/services/weather_service.py
"""

from typing import Dict, Any, Optional
from services.weather_service import WeatherService
import logging

logger = logging.getLogger(__name__)

# Mistral Agent function schema
weather_tool = {
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current weather conditions and forecast for farmers in India. Includes temperature, rain prediction, 7-day forecast, and farmer advisory in Hindi. Uses Open-Meteo weather data with rain event detection.",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "Location name in India. Examples: 'Kopergaon', 'कोपरगांव', 'Nashik', 'नाशिक', 'Pune', 'पुणे', 'Mumbai', 'मुंबई'. Defaults to 'Kopergaon' if not specified."
                }
            },
            "required": []
        }
    }
}

# Location coordinates mapping
LOCATION_COORDS = {
    "kopergaon": (19.8826, 74.4764),
    "कोपरगांव": (19.8826, 74.4764),
    "ahmednagar": (19.0948, 74.7480),
    "अहमदनगर": (19.0948, 74.7480),
    "nashik": (19.9975, 73.7898),
    "नाशिक": (19.9975, 73.7898),
    "pune": (18.5204, 73.8567),
    "पुणे": (18.5204, 73.8567),
    "mumbai": (19.0760, 72.8777),
    "मुंबई": (19.0760, 72.8777),
    "delhi": (28.6139, 77.2090),
    "दिल्ली": (28.6139, 77.2090)
}


async def get_weather(location: Optional[str] = None) -> Dict[str, Any]:
    """
    Get weather forecast using existing Open-Meteo integration.
    
    This is a thin wrapper - all logic is in the existing WeatherService.
    
    Args:
        location: Location name (defaults to Kopergaon)
        
    Returns:
        Structured response with weather data and navigation action
    """
    # Default to Kopergaon
    if not location:
        location = "Kopergaon"
    
    logger.info(f"[TOOL:get_weather] location={location}")
    
    try:
        # Normalize location name
        location_key = location.lower().strip()
        
        # Get coordinates
        if location_key in LOCATION_COORDS:
            lat, lon = LOCATION_COORDS[location_key]
            location_display = location
        else:
            # Default to Kopergaon if location not found
            lat, lon = LOCATION_COORDS["kopergaon"]
            location_display = "Kopergaon"
            logger.warning(f"[TOOL:get_weather] Unknown location '{location}', defaulting to Kopergaon")
        
        # Call existing Open-Meteo integration (NO DUPLICATION)
        weather_data = await WeatherService.get_farmer_weather(
            latitude=lat,
            longitude=lon,
            location_name=location_display,
            state="maharashtra"
        )
        
        # Extract relevant data from existing service response
        current = weather_data.get("current", {})
        next_rain = weather_data.get("next_rain")
        daily_forecast = weather_data.get("daily_forecast", [])
        alerts = weather_data.get("alerts", [])
        farmer_advisory = weather_data.get("farmer_advisory", "")
        
        # Format response for Agent
        response = {
            "status": "available",
            "location": location_display,
            "current": {
                "temperature_c": current.get("temperature_c"),
                "weather_description": current.get("weather_description"),
                "weather_icon": current.get("weather_icon"),
                "windspeed_kmh": current.get("windspeed_kmh"),
                "humidity_percent": current.get("humidity_percent")
            },
            "next_rain": next_rain,
            "daily_summary": {
                "today": daily_forecast[0] if daily_forecast else None,
                "tomorrow": daily_forecast[1] if len(daily_forecast) > 1 else None,
                "day_after": daily_forecast[2] if len(daily_forecast) > 2 else None
            },
            "alerts": alerts,
            "farmer_advisory": farmer_advisory,
            "source": "Open-Meteo",
            "navigation": {
                "enabled": True,
                "label": "पूरा मौसम देखें",
                "label_english": "View full weather",
                "route": "/weather",
                "params": {}
            }
        }
        
        logger.info(f"[TOOL:get_weather] Success: {current.get('temperature_c')}°C, {current.get('weather_description')}")
        return response
        
    except Exception as e:
        logger.error(f"[TOOL:get_weather] Error: {e}")
        return {
            "status": "error",
            "message": f"मौसम की जानकारी प्राप्त करने में त्रुटि: {str(e)}",
            "location": location or "Kopergaon",
            "navigation": None
        }
