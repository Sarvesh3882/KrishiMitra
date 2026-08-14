"""
Weather data source — Open-Meteo integration.

Full implementation in task 7.1.
"""

# TODO (task 7.1): Implement fetch_weather(latitude: float, longitude: float) -> WeatherResponse
#   Calls Open-Meteo /v1/forecast with current weather params.
#   Raises HTTPException(503) on any network or parse error — no cached fallback.
