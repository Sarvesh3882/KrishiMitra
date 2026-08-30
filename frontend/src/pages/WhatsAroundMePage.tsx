import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslation } from '../i18n/useTranslation';
import { ChevronRight, Store } from 'lucide-react';

// Commodity name translations
const COMMODITY_NAMES: Record<string, Record<string, string>> = {
  en: {
    Onion: 'Onion', Tomato: 'Tomato', Potato: 'Potato', Cotton: 'Cotton',
    Sugarcane: 'Sugarcane', Wheat: 'Wheat', Rice: 'Rice', Bajra: 'Bajra',
    Jowar: 'Jowar', Groundnut: 'Groundnut', Soyabean: 'Soyabean',
    Chilli: 'Chilli', Turmeric: 'Turmeric', Garlic: 'Garlic', Ginger: 'Ginger',
    Cabbage: 'Cabbage', Cauliflower: 'Cauliflower', Coriander: 'Coriander',
  },
  hi: {
    Onion: 'प्याज', Tomato: 'टमाटर', Potato: 'आलू', Cotton: 'कपास',
    Sugarcane: 'गन्ना', Wheat: 'गेहूँ', Rice: 'चावल', Bajra: 'बाजरा',
    Jowar: 'ज्वार', Groundnut: 'मूंगफली', Soyabean: 'सोयाबीन',
    Chilli: 'मिर्च', Turmeric: 'हल्दी', Garlic: 'लहसुन', Ginger: 'अदरक',
    Cabbage: 'पत्तागोभी', Cauliflower: 'फूलगोभी', Coriander: 'धनिया',
  },
  mr: {
    Onion: 'कांदा', Tomato: 'टोमॅटो', Potato: 'बटाटा', Cotton: 'कापूस',
    Sugarcane: 'ऊस', Wheat: 'गहू', Rice: 'तांदूळ', Bajra: 'बाजरी',
    Jowar: 'ज्वारी', Groundnut: 'भुईमूग', Soyabean: 'सोयाबीन',
    Chilli: 'मिरची', Turmeric: 'हळद', Garlic: 'लसूण', Ginger: 'आले',
    Cabbage: 'कोबी', Cauliflower: 'फ्लॉवर', Coriander: 'कोथिंबीर',
  },
};

// Season translations
const SEASON_NAMES: Record<string, Record<string, string>> = {
  en: {
    Kharif: 'Kharif', Rabi: 'Rabi', 'Year-round': 'Year-round',
    'Year-round with peaks Jun-Aug': 'Year-round (peaks Jun–Aug)',
    'Year-round with peaks Oct-Feb': 'Year-round (peaks Oct–Feb)',
  },
  hi: {
    Kharif: 'खरीफ', Rabi: 'रबी', 'Year-round': 'वर्ष भर',
    'Year-round with peaks Jun-Aug': 'वर्ष भर (जून–अगस्त)',
    'Year-round with peaks Oct-Feb': 'वर्ष भर (अक्टूबर–फरवरी)',
  },
  mr: {
    Kharif: 'खरीप', Rabi: 'रब्बी', 'Year-round': 'वर्षभर',
    'Year-round with peaks Jun-Aug': 'वर्षभर (जून–ऑगस्ट)',
    'Year-round with peaks Oct-Feb': 'वर्षभर (ऑक्टोबर–फेब्रुवारी)',
  },
};

// Kopergaon location
const LOCATION = {
  name: 'Kopergaon',
  district: 'Ahmednagar',
  state: 'Maharashtra'
};

// Popular crops in the region - choosing ones with more data availability
const POPULAR_CROPS = ['Onion', 'Tomato', 'Potato', 'Cotton'];

// More crops for search
const ALL_CROPS = [
  'Onion', 'Tomato', 'Potato', 'Cotton', 'Sugarcane', 'Wheat', 'Rice',
  'Bajra', 'Jowar', 'Groundnut', 'Soyabean', 'Chilli', 'Turmeric',
  'Coriander', 'Garlic', 'Ginger', 'Cabbage', 'Cauliflower'
];

interface MandiPrice {
  commodity: string;
  state: string;
  district: string;
  market: string;
  variety: string;
  grade: string;
  price_per_quintal: number;
  min_price: number;
  max_price: number;
  date: string;
  fetched_at: string;
  source: string;
  // Farmer.in API additions
  trend?: 'up' | 'down' | 'same';
  change?: number;
  unit?: string;
  msp?: number | null;
  season?: string;
  major_states?: string[];
  markets_count?: number;
}

export function WhatsAroundMePage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  // Translate commodity name and season from API English → current language
  const translateCommodity = (name: string) =>
    COMMODITY_NAMES[language]?.[name] ?? COMMODITY_NAMES['en']?.[name] ?? name;

  const translateSeason = (season: string) => {
    if (!season) return '';
    const base = season.split('(')[0].trim();
    return SEASON_NAMES[language]?.[base] ?? SEASON_NAMES[language]?.[season] ?? base;
  };

  // Reverse-lookup: convert Hindi/Marathi input back to English for API
  const toEnglishCommodity = (input: string): string => {
    const trimmed = input.trim();
    // Check all languages for a match → return the English key
    for (const lang of ['hi', 'mr'] as const) {
      const map = COMMODITY_NAMES[lang];
      const entry = Object.entries(map).find(
        ([, localName]) => localName.toLowerCase() === trimmed.toLowerCase()
      );
      if (entry) return entry[0]; // return English key
    }
    return trimmed; // already English or unknown
  };
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch popular crop prices for Kopergaon
  useEffect(() => {
    fetchAllPrices();
  }, []);

  const fetchAllPrices = async () => {
    setLoading(true);
    setError(null);
    setIsSearching(false);
    
    try {
      // Fetch all crops in parallel for better performance
      const fetchPromises = POPULAR_CROPS.map(async (crop) => {
        try {
          const params = new URLSearchParams({
            commodity: crop,
            state: LOCATION.state,
          });

          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/mandi-price?${params}`
          );

          if (response.ok) {
            const data = await response.json();
            // Return prices if available
            if (data.prices && data.prices.length > 0 && data.availability === 'available') {
              return data.prices[0]; // Take first price record per crop
            }
          }
          return null;
        } catch (err) {
          console.error(`Error fetching ${crop}:`, err);
          return null;
        }
      });

      // Wait for all requests to complete
      const results = await Promise.all(fetchPromises);
      
      // Filter out null results and set prices
      const validPrices = results.filter(p => p !== null);
      setPrices(validPrices);
      
      if (validPrices.length === 0) {
        setError(t('mandi.noResults'));
      }
    } catch (err: any) {
      setError(t('mandi.loading'));
      console.error('Price fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchCrop = async (cropName: string) => {
    if (!cropName.trim()) return;
    
    setIsSearching(true);
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        commodity: cropName,
        state: LOCATION.state,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/mandi-price?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        
        // Check if data is available
        if (data.availability === 'not_available' || data.availability === 'not_available_in_state') {
          // Show helpful message
          setError(data.message || t('mandi.noResults'));
          setPrices([]);
        } else if (data.prices && data.prices.length > 0) {
          // Farmer.in provides state-level aggregated prices
          setPrices(data.prices);
        } else {
          setError(t('mandi.unavailable'));
          setPrices([]);
        }
      } else {
        setError(t('mandi.unavailable'));
        setPrices([]);
      }
    } catch (err: any) {
      setError(t('error.networkError'));
      console.error('Search error:', err);
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchCrop(toEnglishCommodity(searchQuery));
    }
  };

  const handleQuickSearch = (crop: string) => {
    setSearchQuery(crop);
    searchCrop(crop); // quick search chips always send English keys directly
  };

  const handleBackToFeed = () => {
    setSearchQuery('');
    setIsSearching(false);
    fetchAllPrices();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return { icon: '↑', color: 'text-green-600', bg: 'bg-green-50', label: t('mandi.latestUpdates') };
      case 'down':
        return { icon: '↓', color: 'text-red-600', bg: 'bg-red-50', label: t('error.dataUnavailable') };
      case 'same':
        return { icon: '—', color: 'text-gray-600', bg: 'bg-gray-50', label: '' };
      default:
        return null;
    }
  };

  const formatChange = (change?: number) => {
    if (change === undefined || change === null || change === 0) return null;
    const sign = change > 0 ? '+' : '';
    return `${sign}₹${Math.abs(change).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Mobile App Container - Centered on Desktop */}
      <div className="w-full max-w-[430px] mx-auto bg-[#f5f5f5] min-h-screen flex flex-col relative">
        
        <DashboardHeader />

        <main className="flex-1 pb-20">
          {/* Page Title Row */}
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-bold text-gray-900 leading-tight"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('home.whatsAroundMe')}
                </h1>
                <div className="text-[13px] text-gray-500 mt-0.5"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('mandi.todayRates')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-gray-900">{LOCATION.name}</div>
                <div className="text-[11px] text-gray-500">{LOCATION.district}, {LOCATION.state}</div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-4 py-4">

            {/* ── Search Block ── */}
            <div className="mb-5">

              {/* Search row */}
              <form onSubmit={handleSearch}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('mandi.searchPlaceholder')}
                    className="flex-1 px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl
                              shadow-sm focus:outline-none focus:border-[#0b5e2c]
                              text-[14px] text-gray-800 placeholder:text-gray-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || loading}
                    className="px-5 py-3 bg-[#0b5e2c] text-white rounded-2xl text-[13px] font-bold
                              shadow-md hover:bg-[#094d24] active:scale-95 transition-all
                              disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0
                              tracking-wide"
                  >
                    {t('mandi.search')}
                  </button>
                </div>
              </form>

              {/* Crop suggestion chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {ALL_CROPS.slice(0, 8).map((crop) => {
                  const isActive = searchQuery === crop;
                  return (
                    <button
                      key={crop}
                      onClick={() => handleQuickSearch(crop)}
                      disabled={loading}
                      className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold
                                border transition-all active:scale-95
                                disabled:opacity-40 disabled:cursor-not-allowed
                                ${isActive
                                  ? 'bg-[#0b5e2c] text-white border-[#0b5e2c] shadow-sm'
                                  : 'bg-white text-[#0b5e2c] border-[#0b5e2c]/30 hover:bg-[#0b5e2c]/5 hover:border-[#0b5e2c]'
                                }`}
                    >
                      {translateCommodity(crop)}
                    </button>
                  );
                })}
              </div>

              {/* Back link */}
              {isSearching && (
                <button
                  onClick={handleBackToFeed}
                  className="mt-3 inline-flex items-center gap-1 text-[13px] text-[#0b5e2c] font-semibold
                            hover:underline"
                >
                  ← {t('mandi.backToFeed')}
                </button>
              )}
            </div>

            {/* ── Allied Farming Banner ── */}
            <button
              onClick={() => navigate('/around/allied-bazar')}
              className="w-full mb-5 rounded-2xl overflow-hidden shadow-sm
                        active:scale-[0.99] transition-all text-left border border-[#0a5228]"
              style={{ background: 'linear-gradient(135deg, #0b5e2c 0%, #1a8a45 100%)' }}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Clean icon — no blur/glow */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                                bg-white/15">
                  <Store size={24} strokeWidth={1.8} className="text-white" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-[16px] leading-tight mb-0.5"
                       style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t('allied.title')}
                  </div>
                  <div className="text-white/75 text-[12px] leading-snug mb-2"
                       style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t('allied.subtitle')}
                  </div>
                  {/* Category pills */}
                  <div className="flex gap-1.5">
                    {[
                      { e: '🥚', label: t('enterprise.poultry') },
                      { e: '🐟', label: t('enterprise.fisheries') },
                      { e: '🥛', label: t('enterprise.dairy') },
                    ].map(({ e, label }) => (
                      <span key={label}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                   bg-white/15 text-white text-[11px] font-medium">
                        {e} {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <ChevronRight size={20} strokeWidth={2.5} className="text-white/80" />
                </div>
              </div>
            </button>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg p-8">
              <LoadingSpinner message={isSearching ? t('mandi.searching') : t('mandi.loading')} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-[20px]">ℹ️</span>
                <div className="flex-1">
                  <p className="text-amber-900 text-[14px] font-semibold mb-1">{error}</p>
                  <button
                    onClick={isSearching ? handleBackToFeed : fetchAllPrices}
                    className="mt-3 text-[13px] text-amber-900 font-semibold underline hover:text-amber-950"
                  >
                    {isSearching ? '← ' + t('mandi.backToFeed') : t('general.refresh')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* News Feed - Price Cards */}
          {!loading && prices.length > 0 && (
            <div className="space-y-4">
              {/* Live Badge */}
              <div className="flex items-center justify-between">
                <div className="text-[13px] text-gray-600 font-medium">
                  {isSearching 
                    ? t('mandi.searching') 
                    : t('mandi.latestUpdates')}
                </div>
                <div className="flex items-center gap-1 text-[11px] bg-green-50 text-green-700 px-2 py-1 rounded">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {t('mandi.latestUpdates')}
                </div>
              </div>

              {/* Price Feed Cards */}
              {prices.map((price, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200
                            hover:shadow-md transition-shadow"
                >
                  {/* Card Image Header - Using placeholder farmer image */}
                  <div 
                    className="h-[120px] bg-gradient-to-br from-green-600 to-green-800 
                              flex items-center justify-center relative overflow-hidden"
                    style={{
                      backgroundImage: 'url(https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=80)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                    
                    {/* Content on Image */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="text-white font-bold text-[18px] mb-1 drop-shadow-lg">
                            {translateCommodity(price.commodity)}
                            {price.variety && price.variety !== 'Other' && (
                              <span className="text-[13px] font-normal ml-2 opacity-90">
                                ({price.variety})
                              </span>
                            )}
                          </h3>
                          <div className="text-white/90 text-[12px] drop-shadow">
                            📍 {price.state || LOCATION.state}
                            {price.major_states && price.major_states.length > 0 && (
                              <span className="text-[10px] opacity-75 ml-1">
                                • {price.markets_count}+ markets
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-white/80 text-[11px] bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                          {formatDate(price.date)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    {/* Main Price with Trend */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[11px] text-gray-500 uppercase tracking-wide">
                          {t('mandi.todayRates')}
                        </div>
                        {/* Trend Indicator */}
                        {getTrendIcon(price.trend) && (
                          <div 
                            className={`flex items-center gap-1 px-2 py-1 rounded-full ${getTrendIcon(price.trend)!.bg}`}
                          >
                            <span className={`text-[16px] font-bold ${getTrendIcon(price.trend)!.color}`}>
                              {getTrendIcon(price.trend)!.icon}
                            </span>
                            <span className={`text-[11px] font-semibold ${getTrendIcon(price.trend)!.color}`}>
                              {getTrendIcon(price.trend)!.label}
                            </span>
                            {formatChange(price.change) && (
                              <span className={`text-[10px] font-medium ${getTrendIcon(price.trend)!.color}`}>
                                ({formatChange(price.change)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[32px] font-bold text-[#0b5e2c] leading-none">
                          ₹{price.price_per_quintal.toLocaleString()}
                        </span>
                        <span className="text-[14px] text-gray-600">{t('mandi.perQuintal')}</span>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                        <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">
                          {t('mandi.minPrice')}
                        </div>
                        <div className="text-[18px] font-bold text-red-700">
                          ₹{price.min_price.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                        <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">
                          {t('mandi.maxPrice')}
                        </div>
                        <div className="text-[18px] font-bold text-green-700">
                          ₹{price.max_price.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t">
                      <div>
                        {price.season && (
                          <span className="text-gray-700 font-medium">{translateSeason(price.season)}</span>
                        )}
                      </div>
                      <div>
                        {price.state || LOCATION.state}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Source Attribution */}
              <div className="text-center text-[11px] text-gray-500 py-4">
                <div>📊 {t('market.dataSource')}: AGMARKNET</div>
                <div className="mt-1">{t('market.poweredBy')}</div>
              </div>
            </div>
          )}

          {/* No Data */}
          {!loading && prices.length === 0 && !error && (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-gray-400 text-[48px] mb-3">🌾</div>
              <p className="text-gray-600 text-[14px] mb-2">
                {t('mandi.unavailable')}
              </p>
              <p className="text-gray-500 text-[12px]">
                {t('general.noDataDescription')}
              </p>
              <button
                onClick={fetchAllPrices}
                className="mt-4 px-4 py-2 bg-[#0b5e2c] text-white rounded-lg text-[13px] font-semibold"
              >
                {t('general.refresh')}
              </button>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
