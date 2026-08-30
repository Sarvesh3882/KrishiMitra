import { useState, useEffect } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslation } from '../i18n/useTranslation';

const LOCATION = {
  name: 'Kopergaon',
  district: 'Ahmednagar',
  state: 'Maharashtra',
  lat: 19.8826,
  lon: 74.4764
};

// Product name translations (display label only — API always gets English name)
const PRODUCT_NAMES: Record<string, Record<string, string>> = {
  en: {
    Onion: 'Onion', Tomato: 'Tomato', Wheat: 'Wheat', Milk: 'Milk',
    Sugarcane: 'Sugarcane', Cotton: 'Cotton', Potato: 'Potato',
    Vegetables: 'Vegetables', Fruits: 'Fruits', Eggs: 'Eggs', Poultry: 'Poultry'
  },
  hi: {
    Onion: 'प्याज', Tomato: 'टमाटर', Wheat: 'गेहूं', Milk: 'दूध',
    Sugarcane: 'गन्ना', Cotton: 'कपास', Potato: 'आलू',
    Vegetables: 'सब्जी', Fruits: 'फल', Eggs: 'अंडे', Poultry: 'मुर्गी'
  },
  mr: {
    Onion: 'कांदा', Tomato: 'टोमॅटो', Wheat: 'गहू', Milk: 'दूध',
    Sugarcane: 'ऊस', Cotton: 'कापूस', Potato: 'बटाटा',
    Vegetables: 'भाज्या', Fruits: 'फळे', Eggs: 'अंडी', Poultry: 'कोंबडी'
  }
};

const POPULAR_PRODUCTS = [
  { name: 'Onion',      emoji: '🧅' },
  { name: 'Tomato',     emoji: '🍅' },
  { name: 'Wheat',      emoji: '🌾' },
  { name: 'Milk',       emoji: '🥛' },
  { name: 'Sugarcane',  emoji: '🍬' },
  { name: 'Cotton',     emoji: '🌿' },
  { name: 'Potato',     emoji: '🥔' },
  { name: 'Vegetables', emoji: '🥬' },
  { name: 'Fruits',     emoji: '🍎' },
  { name: 'Eggs',       emoji: '🥚' },
  { name: 'Poultry',    emoji: '🐔' },
];

const getPlaceImage = (name: string, keywords: string[], index: number = 0): string => {
  const n = name.toLowerCase();
  const k = keywords.join(' ').toLowerCase();
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const v = (hash + index) % 3;

  if (n.includes('milk') || n.includes('dairy') || k.includes('rtsmbt'))
    return ['https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&h=500&fit=crop'][v];

  if (n.includes('vegetable') || n.includes('bhaji') || n.includes('sabzi') || k.includes('mktman'))
    return ['https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&h=500&fit=crop'][v];

  if (n.includes('fruit') || n.includes('phal'))
    return ['https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&h=500&fit=crop'][v];

  if (n.includes('fish') || n.includes('machli'))
    return ['https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1580959375944-b9c8f7a58e10?w=800&h=500&fit=crop'][v];

  if (n.includes('poultry') || n.includes('chicken') || n.includes('egg'))
    return ['https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=800&h=500&fit=crop'][v];

  if (n.includes('market') || n.includes('mandi') || n.includes('bazar'))
    return ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=500&fit=crop',
            'https://images.unsplash.com/photo-1582650228939-91b1686f7f90?w=800&h=500&fit=crop'][v];

  return ['https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=500&fit=crop',
          'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=500&fit=crop',
          'https://images.unsplash.com/photo-1595855759920-86a011b6a394?w=800&h=500&fit=crop'][v];
};

interface SellingPoint {
  name: string;
  type: string;
  address: string;
  distance: string;
  distance_meters: number;
  contact?: string;
  place_id: string;
  source: string;
  keywords?: string[];
}

export default function MarketLinkagePage() {
  const { t, language } = useTranslation();
  const [productQuery, setProductQuery] = useState('');
  const [searchedProduct, setSearchedProduct] = useState('');
  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translate product display label
  const translateProduct = (name: string) =>
    PRODUCT_NAMES[language]?.[name] ?? PRODUCT_NAMES['en']?.[name] ?? name;

  // Reverse-lookup typed Hindi/Marathi → English for API
  const toEnglishProduct = (input: string): string => {
    const trimmed = input.trim();
    for (const lang of ['hi', 'mr'] as const) {
      const map = PRODUCT_NAMES[lang];
      const entry = Object.entries(map).find(
        ([, local]) => local.toLowerCase() === trimmed.toLowerCase()
      );
      if (entry) return entry[0];
    }
    return trimmed;
  };

  // Translate Mappls place type codes to readable labels
  const translatePlaceType = (type: string): string => {
    if (!type) return '';
    const typeMap: Record<string, Record<string, string>> = {
      en: {
        POI: 'Market', VILLAGE: 'Village', CITY: 'City', LOCALITY: 'Area',
        SUBLOCALITY: 'Area', TEHSIL: 'Tehsil', DISTRICT: 'District',
        STATE: 'State', PINCODE: 'Pincode', MANDI: 'Mandi',
        APMC: 'APMC Market', SHOP: 'Shop', FARM: 'Farm',
      },
      hi: {
        POI: 'बाजार', VILLAGE: 'गांव', CITY: 'शहर', LOCALITY: 'क्षेत्र',
        SUBLOCALITY: 'क्षेत्र', TEHSIL: 'तहसील', DISTRICT: 'जिला',
        STATE: 'राज्य', PINCODE: 'पिनकोड', MANDI: 'मंडी',
        APMC: 'एपीएमसी बाजार', SHOP: 'दुकान', FARM: 'खेत',
      },
      mr: {
        POI: 'बाजार', VILLAGE: 'गाव', CITY: 'शहर', LOCALITY: 'परिसर',
        SUBLOCALITY: 'परिसर', TEHSIL: 'तहसील', DISTRICT: 'जिल्हा',
        STATE: 'राज्य', PINCODE: 'पिनकोड', MANDI: 'बाजारपेठ',
        APMC: 'एपीएमसी बाजार', SHOP: 'दुकान', FARM: 'शेत',
      },
    };
    const upper = type.toUpperCase();
    return typeMap[language]?.[upper] ?? typeMap['en']?.[upper] ?? type;
  };

  const loadDefaultPlaces = async () => {
    setLoading(true);
    setError(null);
    setSearchedProduct('');
    try {
      const params = new URLSearchParams({ product: 'Onion', location: LOCATION.name, radius: '5000' });
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/nearby-selling-points?${params}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setSellingPoints(data.selling_points?.length ? data.selling_points : []);
    } catch {
      setError(t('error.networkError'));
      setSellingPoints([]);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount once
  useEffect(() => { loadDefaultPlaces(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = async (englishProduct: string) => {
    setLoading(true);
    setError(null);
    setSearchedProduct(englishProduct);
    try {
      const params = new URLSearchParams({ product: englishProduct, location: LOCATION.name, radius: '5000' });
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/nearby-selling-points?${params}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      if (data.selling_points?.length) {
        setSellingPoints(data.selling_points);
        setError(null);
      } else {
        setSellingPoints([]);
        setError(t('market.noNearbyLocations'));
      }
    } catch {
      setError(t('error.networkError'));
      setSellingPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!productQuery.trim()) return;
    doSearch(toEnglishProduct(productQuery));
  };

  const handleQuickSearch = (product: string) => {
    setProductQuery(product);
    doSearch(product); // chips always hold English keys
  };

  const handleReset = () => {
    setProductQuery('');
    loadDefaultPlaces();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div className="w-full max-w-[430px] mx-auto bg-[#f5f5f5] min-h-screen flex flex-col relative">

        <DashboardHeader />

        <main className="flex-1 pb-20">

          {/* Page title row */}
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-bold text-gray-900 leading-tight"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('market.sellHeading')}
                </h1>
                <p className="text-[13px] text-gray-500 mt-0.5"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('market.sellDescription')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-gray-900">{LOCATION.name}</div>
                <div className="text-[11px] text-gray-500">{LOCATION.district}, {LOCATION.state}</div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4">

            {/* Search */}
            <div className="mb-5">
              <form onSubmit={handleSearch}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder={t('market.product')}
                    className="flex-1 px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl
                              shadow-sm focus:outline-none focus:border-[#0b5e2c]
                              text-[14px] text-gray-800 placeholder:text-gray-400 transition-colors"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  />
                  <button
                    type="submit"
                    disabled={!productQuery.trim() || loading}
                    className="px-5 py-3 bg-[#0b5e2c] text-white rounded-2xl text-[13px] font-bold
                              shadow-md hover:bg-[#094d24] active:scale-95 transition-all
                              disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 tracking-wide"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  >
                    {t('mandi.search')}
                  </button>
                </div>
              </form>

              {/* Product suggestion chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {POPULAR_PRODUCTS.map(({ name, emoji }) => {
                  const isActive = productQuery === name;
                  return (
                    <button
                      key={name}
                      onClick={() => handleQuickSearch(name)}
                      disabled={loading}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                                text-[12px] font-semibold border transition-all active:scale-95
                                disabled:opacity-40 disabled:cursor-not-allowed
                                ${isActive
                                  ? 'bg-[#0b5e2c] text-white border-[#0b5e2c] shadow-sm'
                                  : 'bg-white text-[#0b5e2c] border-[#0b5e2c]/30 hover:bg-[#0b5e2c]/5 hover:border-[#0b5e2c]'
                                }`}
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                    >
                      <span>{emoji}</span>
                      <span>{translateProduct(name)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Back to all */}
              {searchedProduct && (
                <button
                  onClick={handleReset}
                  className="mt-3 inline-flex items-center gap-1 text-[13px] text-[#0b5e2c]
                            font-semibold hover:underline"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                >
                  ← {t('market.newSearch')}
                </button>
              )}
            </div>

            {/* Results header */}
            {!loading && sellingPoints.length > 0 && (
              <div className="mb-4">
                <h2 className="text-[18px] font-bold text-gray-900 leading-tight"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('market.nearestLocations')}
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {LOCATION.name} — {sellingPoints.length} {t('market.locationsFound')}
                  {searchedProduct && ` · ${translateProduct(searchedProduct)}`}
                </p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <LoadingSpinner message={t('general.loading')} />
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-start gap-2">
                <span className="text-[18px]">⚠️</span>
                <p className="text-red-800 text-[13px] font-medium leading-relaxed"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Selling point cards */}
            {!loading && sellingPoints.length > 0 && (
              <div className="space-y-4 mb-6">
                {sellingPoints.map((point, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    {/* Image */}
                    <div className="relative w-full h-[180px] bg-gray-100 overflow-hidden">
                      <img
                        src={getPlaceImage(point.name, point.keywords || [], idx)}
                        alt={point.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {/* Distance badge */}
                      <div className="absolute top-3 right-3 bg-[#0b5e2c] text-white px-3 py-1
                                      rounded-full text-[12px] font-bold shadow">
                        {point.distance}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="text-[16px] font-bold text-gray-900 mb-1 leading-snug">
                        {point.name}
                      </h3>
                      <p className="text-[13px] text-gray-500 mb-3 leading-relaxed">
                        {point.address}
                      </p>

                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        {point.type && (
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100
                                          rounded-lg text-[11px] font-semibold">
                            {translatePlaceType(point.type)}
                          </span>
                        )}
                        {point.contact && (
                          <span className="text-[12px] text-gray-500 flex items-center gap-1">
                            📞 {point.contact}
                          </span>
                        )}
                      </div>

                      {/* Directions button */}
                      <a
                        href={`https://maps.mappls.com/direction?destination=${point.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5
                                  bg-[#0b5e2c] text-white rounded-xl text-[14px] font-bold
                                  hover:bg-[#094d24] transition-colors no-underline"
                        style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                      >
                        <span>📍</span>
                        <span>{t('market.getDirections')}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && sellingPoints.length === 0 && !error && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <div className="text-[44px] mb-3">📍</div>
                <h3 className="text-[15px] font-bold text-gray-800 mb-2"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('market.noNearbyLocations')}
                </h3>
                <p className="text-[13px] text-gray-500 mb-4"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('general.noDataDescription')}
                </p>
                <button
                  onClick={() => setProductQuery('')}
                  className="px-5 py-2.5 bg-[#0b5e2c] text-white rounded-xl text-[13px] font-semibold"
                >
                  {t('market.newSearch')}
                </button>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
