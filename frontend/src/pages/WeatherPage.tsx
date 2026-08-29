// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { CloudRain, Cloud, Sun, Wind, MapPin, Calendar, Droplets, AlertTriangle, CheckCircle, Sprout } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface WeatherData {
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  current: {
    temperature_c: number;
    weather_code: number;
    weather_icon: string;
    weather_description: string;
  };
  next_rain: {
    time_start: string;
    time_end: string;
    total_rain_mm: number;
    probability: number;
    duration_hours: number;
  } | null;
  daily_forecast: Array<{
    date: string;
    max_temp_c: number;
    min_temp_c: number;
    rain_mm: number;
    rain_probability: number;
    weather_code: number;
    weather_icon: string;
    weather_description: string;
  }>;
  alerts: Array<{
    type: string;
    icon: string;
    title: string;
    description: string;
  }>;
  farmer_advisory: string;
  source: string;
}

export function WeatherPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  // Default location: Kopergaon, Ahmednagar, Maharashtra
  const LOCATION = {
    name: 'Kopergaon',
    lat: 19.88,
    lon: 74.48,
    district: 'Ahmednagar',
    state: 'maharashtra'
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    setLoading(true);
    setError(false);
    try {
      // Build API URL with SACHET parameters
      const params = new URLSearchParams({
        lat: LOCATION.lat.toString(),
        lon: LOCATION.lon.toString(),
        location: LOCATION.name,
        state: LOCATION.state,
        district: LOCATION.district
      });
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/weather?${params.toString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getDayNameHindi = (dateStr: string, index: number): string => {
    if (index === 0) return t('day.today');
    if (index === 1) return t('day.tomorrow');
    
    const date = new Date(dateStr);
    const dayNames = [
      t('day.sunday'),
      t('day.monday'),
      t('day.tuesday'),
      t('day.wednesday'),
      t('day.thursday'),
      t('day.friday'),
      t('day.saturday')
    ];
    return dayNames[date.getDay()];
  };

  const getWeatherIcon = (code: number): React.ReactElement => {
    const iconProps = { size: 40, strokeWidth: 2, className: "text-gray-700" };
    
    if (code === 0) return <Sun {...iconProps} className="text-yellow-500" />;
    if (code <= 2) return <Cloud {...iconProps} className="text-gray-400" />;
    if (code === 3) return <Cloud {...iconProps} className="text-gray-500" />;
    if (code <= 48) return <Wind {...iconProps} className="text-gray-400" />;
    if (code <= 67) return <CloudRain {...iconProps} className="text-blue-500" />;
    if (code <= 77) return <CloudRain {...iconProps} className="text-blue-400" />;
    if (code <= 82) return <CloudRain {...iconProps} className="text-blue-600" />;
    if (code <= 86) return <CloudRain {...iconProps} className="text-blue-400" />;
    return <CloudRain {...iconProps} className="text-blue-700" />;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <DashboardHeader />

      <main className="flex-1 content-with-nav">
        <div className="max-w-[420px] mx-auto px-4 py-6">
          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6 h-56 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="bg-white rounded-xl p-4 h-32 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="flex gap-2">
                  <div className="flex-1 h-20 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-20 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <CloudRain size={40} strokeWidth={2} className="text-blue-500" />
                </div>
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-2">
                {t('weather.unavailable')}
              </h3>
              <p className="text-gray-600 text-[14px] mb-4">
                {t('help.tryLater')}
              </p>
              <button
                onClick={fetchWeather}
                className="px-6 py-3 bg-[#0b5e2c] text-white rounded-lg text-[14px] font-semibold hover:bg-[#094d24] transition-colors"
              >
                {t('general.retry')}
              </button>
            </div>
          )}

          {/* Weather Content */}
          {!loading && !error && weatherData && (
            <div className="space-y-4">
              {/* Hero Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={16} strokeWidth={2} className="text-gray-400" />
                  <div className="text-[13px] text-gray-600">
                    {weatherData.location.name}
                  </div>
                </div>
                <h1 className="text-[28px] font-bold text-gray-900 mb-6 leading-tight">
                  {t('weather.rainWhenQuestion')}
                </h1>

                {weatherData.next_rain ? (
                  <div className="text-center py-4">
                    <div className="mb-4 flex justify-center">
                      {getWeatherIcon(weatherData.daily_forecast[0]?.weather_code || 61)}
                    </div>
                    <div className="text-[20px] font-bold text-gray-900 mb-1">
                      {weatherData.next_rain.time_start}
                    </div>
                    {weatherData.next_rain.duration_hours > 1 && (
                      <div className="text-[14px] text-gray-600 mb-4">
                        {weatherData.next_rain.time_end} {t('help.until')}
                      </div>
                    )}
                    <div className="flex justify-center gap-8 mt-5">
                      <div>
                        <div className="text-[12px] text-gray-500 mb-1.5">{t('weather.approximately')}</div>
                        <div className="flex items-center justify-center gap-1.5">
                          <Droplets size={18} strokeWidth={2} className="text-blue-500" />
                          <span className="text-[18px] font-bold text-blue-600">
                            {weatherData.next_rain.total_rain_mm} mm
                          </span>
                        </div>
                      </div>
                      <div className="w-px bg-gray-200"></div>
                      <div>
                        <div className="text-[12px] text-gray-500 mb-1.5">{t('weather.probability')}</div>
                        <div className="text-[18px] font-bold text-blue-600">
                          {weatherData.next_rain.probability}%
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="mb-4 flex justify-center">
                      {getWeatherIcon(weatherData.current.weather_code)}
                    </div>
                    <div className="text-[17px] font-semibold text-gray-900 mb-2">
                      {t('weather.noRainExpected')}
                    </div>
                    <div className="text-[13px] text-gray-600">
                      {t('weather.forecastDays')}
                    </div>
                  </div>
                )}
              </div>

              {/* Weather Alerts - First Instance (remove this duplicate) */}
              {weatherData.alerts && weatherData.alerts.length > 0 && (
                <div className="space-y-2">
                  {weatherData.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="bg-orange-50 border-l-4 border-orange-400 rounded-r-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} strokeWidth={2} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-[14px] font-bold text-orange-900 mb-1">
                            {alert.title}
                          </h3>
                          <p className="text-[13px] text-orange-800 leading-relaxed">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 7-Day Forecast */}
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} strokeWidth={2} className="text-gray-600" />
                  <h3 className="text-[16px] font-bold text-gray-900">
                    {t('weather.forecastDays')}
                  </h3>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {weatherData.daily_forecast.map((day, index) => (
                    <div
                      key={day.date}
                      className="flex-shrink-0 bg-gray-50 rounded-xl p-3 text-center min-w-[80px]"
                    >
                      <div className="text-[11px] font-semibold text-gray-700 mb-2">
                        {getDayNameHindi(day.date, index)}
                      </div>
                      <div className="mb-2 flex justify-center">
                        <div style={{ transform: 'scale(0.8)' }}>
                          {getWeatherIcon(day.weather_code)}
                        </div>
                      </div>
                      <div className="text-[16px] font-bold text-gray-900 mb-1">
                        {Math.round(day.max_temp_c)}°
                      </div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-blue-600 font-semibold">
                        {day.rain_mm > 0 && <Droplets size={12} strokeWidth={2} />}
                        <span>{day.rain_mm > 0 ? `${day.rain_mm}mm` : '0mm'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Alerts - Second Instance */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} strokeWidth={2} className="text-orange-500" />
                  <h3 className="text-[16px] font-bold text-gray-900">
                    {t('weather.alerts')}
                  </h3>
                </div>
                {weatherData.alerts && weatherData.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {weatherData.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="bg-orange-50 border-l-4 border-orange-500 rounded-r-lg p-3"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={18} strokeWidth={2} className="text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-[14px] font-bold text-orange-900 mb-1">
                              {alert.title}
                            </h4>
                            <p className="text-[13px] text-orange-800 leading-relaxed">
                              {alert.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                    <CheckCircle size={18} strokeWidth={2} className="text-green-600 flex-shrink-0" />
                    <p className="text-[13px] font-medium">
                      {t('weather.noAlerts')}
                    </p>
                  </div>
                )}
              </div>

              {/* Farmer Advisory */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sprout size={20} strokeWidth={2} className="text-green-700" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-green-900 mb-1.5">
                      {t('weather.advisory')}
                    </h3>
                    <p className="text-[13px] text-green-800 leading-relaxed">
                      {weatherData.farmer_advisory}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Source */}
              <div className="text-center py-2">
                <p className="text-[10px] text-gray-400">
                  {weatherData.source} • {t('weather.updateFrequency')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
