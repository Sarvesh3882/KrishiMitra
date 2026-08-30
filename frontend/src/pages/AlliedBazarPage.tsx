import { useState, useMemo } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { useTranslation } from '../i18n/useTranslation';
import { ChevronRight } from 'lucide-react';
import {
  DEMO_ALLIED_PRODUCTS,
  ALLIED_CATEGORIES,
  QUICK_FILTERS,
  filterProducts,
  getPopularProducts,
  type AlliedProduct
} from '../data/alliedDemoData';

const LOCATION = { name: 'Kopergaon', district: 'Ahmednagar', state: 'Maharashtra' };

const categoryGradient: Record<string, string> = {
  milk:       'from-blue-600  to-blue-800',
  egg:        'from-amber-500 to-amber-700',
  poultry:    'from-orange-500 to-orange-700',
  meat:       'from-red-600   to-red-800',
  fish:       'from-cyan-600  to-cyan-800',
  beekeeping: 'from-yellow-500 to-yellow-700',
};

// ── Product Card — defined OUTSIDE parent so it gets stable identity ──
function ProductCard({
  product,
  t,
  language,
}: {
  product: AlliedProduct;
  t: (key: any) => string;
  language: string;
}) {
  const displayName =
    (language === 'hi' && product.nameTranslations?.hi) ||
    (language === 'mr' && product.nameTranslations?.mr) ||
    product.name;
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const getTrendInfo = (trend?: 'up' | 'down' | 'same') => {
    if (trend === 'up')   return { icon: '↑', color: 'text-green-600', bg: 'bg-green-50' };
    if (trend === 'down') return { icon: '↓', color: 'text-red-600',   bg: 'bg-red-50'   };
    if (trend === 'same') return { icon: '—', color: 'text-gray-500',  bg: 'bg-gray-50'  };
    return null;
  };

  const formatChange = (change?: number) => {
    if (!change) return null;
    return `${change > 0 ? '+' : ''}₹${Math.abs(change).toLocaleString()}`;
  };

  const trend = getTrendInfo(product.trend);
  const change = formatChange(product.change);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Colour header */}
      <div className={`h-[110px] bg-gradient-to-br ${categoryGradient[product.category] ?? 'from-green-600 to-green-800'} relative overflow-hidden`}>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[72px] opacity-20 select-none">
          {product.icon}
        </span>
        <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-white font-bold text-[17px] leading-tight drop-shadow">
                {displayName}
              </h3>
              <div className="text-white/80 text-[11px] mt-0.5 flex items-center gap-1">
                <span>{ALLIED_CATEGORIES[product.category]?.icon}</span>
                <span>{ALLIED_CATEGORIES[product.category]?.name}</span>
              </div>
            </div>
            <span className="text-white/70 text-[11px] tabular-nums">
              {formatDate(product.lastUpdated)}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Experimental badge */}
        <div className="mb-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg w-fit">
          <span className="text-[11px]">⚠️</span>
          <span className="text-[11px] text-amber-800 font-medium">{t('allied.experimental')}</span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
              {t('mandi.todayRates')}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold text-[#0b5e2c] leading-none">
                ₹{product.price.toLocaleString()}
              </span>
              <span className="text-[13px] text-gray-500">{t('mandi.perQuintal')}</span>
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl ${trend.bg}`}>
              <span className={`text-[15px] font-bold ${trend.color}`}>{trend.icon}</span>
              {change && <span className={`text-[11px] font-semibold ${trend.color}`}>{change}</span>}
            </div>
          )}
        </div>

        {/* Min / Max */}
        {product.minPrice && product.maxPrice && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{t('mandi.minPrice')}</div>
              <div className="text-[17px] font-bold text-red-600">₹{product.minPrice.toLocaleString()}</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{t('mandi.maxPrice')}</div>
              <div className="text-[17px] font-bold text-green-600">₹{product.maxPrice.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-[12px] text-gray-500 leading-relaxed mb-3">{product.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-400">
          <span>📍 {product.region}</span>
          {product.popularIn.includes('Kopargaon') && (
            <span className="bg-[#e8f5e9] text-[#0b5e2c] px-2 py-0.5 rounded-full text-[10px] font-semibold">
              {t('allied.popular')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

  export function AlliedBazarPage() {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredProducts = useMemo(
    () => filterProducts(DEMO_ALLIED_PRODUCTS, searchQuery, activeFilter),
    [searchQuery, activeFilter]
  );
  const popularProducts = useMemo(() => getPopularProducts(DEMO_ALLIED_PRODUCTS), []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); };

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
                  {t('allied.title')}
                </h1>
                <div className="text-[13px] text-gray-500 mt-0.5"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('allied.subtitle')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-gray-900">{LOCATION.name}</div>
                <div className="text-[11px] text-gray-500">{LOCATION.district}, {LOCATION.state}</div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4">

            {/* ── Search ── */}
            <div className="mb-5">
              <form onSubmit={handleSearch}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('allied.searchPlaceholder')}
                    className="flex-1 px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl
                              shadow-sm focus:outline-none focus:border-[#0b5e2c]
                              text-[14px] text-gray-800 placeholder:text-gray-400 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-3 bg-gray-100 text-gray-500 rounded-2xl text-[13px]
                                font-semibold hover:bg-gray-200 transition-all flex-shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </form>

              {/* Filter chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {QUICK_FILTERS.map((f) => {
                  const isActive = activeFilter === f.id;
                  // Map filter id → translation key
                  const labelMap: Record<string, string> = {
                    all:        t('allied.allProducts'),
                    dairy:      t('enterprise.dairy'),
                    poultry:    t('enterprise.poultry'),
                    fish:       t('enterprise.fisheries'),
                    goat:       t('enterprise.goat'),
                    beekeeping: t('enterprise.apiculture'),
                  };
                  const label = labelMap[f.id] ?? f.label;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border
                                transition-all active:scale-95
                                ${isActive
                                  ? 'bg-[#0b5e2c] text-white border-[#0b5e2c] shadow-sm'
                                  : 'bg-white text-[#0b5e2c] border-[#0b5e2c]/30 hover:bg-[#0b5e2c]/5 hover:border-[#0b5e2c]'
                                }`}
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                    >
                      {f.icon} {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Popular section ── */}
            {!searchQuery && activeFilter === 'all' && popularProducts.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[16px] font-bold text-gray-900">
                    {t('allied.popular')}
                  </h2>
                </div>
                <p className="text-[12px] text-gray-500 mb-3">
                  {t('allied.commonActivities')} {LOCATION.name}
                </p>
                <div className="space-y-3">
                  {popularProducts.map((p) => <ProductCard key={p.id} product={p} t={t} language={language} />)}
                </div>
                <div className="my-5 border-t border-gray-200" />
              </div>
            )}

            {/* ── All products ── */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold text-gray-700">
                  {searchQuery
                    ? `"${searchQuery}"`
                    : activeFilter !== 'all'
                      ? QUICK_FILTERS.find((f) => f.id === activeFilter)?.label
                      : t('allied.allProducts')}
                </span>
                <span className="text-[11px] text-gray-400">
                  {filteredProducts.length} {t('allied.productCount')}
                </span>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="space-y-3">
                  {filteredProducts.map((p) => <ProductCard key={p.id} product={p} t={t} language={language} />)}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                  <p className="text-gray-500 text-[14px] mb-4">{t('mandi.noResults')}</p>
                  <button
                    onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                    className="px-5 py-2.5 bg-[#0b5e2c] text-white rounded-xl text-[13px] font-semibold"
                  >
                    {t('allied.clearFilters')}
                  </button>
                </div>
              )}
            </div>

            {/* ── Category grid ── */}
            {!searchQuery && activeFilter === 'all' && (
              <div className="mt-2 mb-4">
                <h3 className="text-[14px] font-bold text-gray-900 mb-3">
                  {t('allied.categories')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(ALLIED_CATEGORIES)
                    .sort((a, b) => a[1].priority - b[1].priority)
                    .map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => setActiveFilter(key)}
                        className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm
                                  hover:border-[#0b5e2c] hover:shadow-md active:scale-[0.98]
                                  transition-all text-left flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#f0faf2] flex items-center
                                        justify-center text-[22px] flex-shrink-0">
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                            {cat.name}
                          </div>
                          <div className="text-[10px] text-gray-500 leading-snug mt-0.5 line-clamp-2">
                            {cat.description}
                          </div>
                        </div>
                        <ChevronRight size={14} strokeWidth={2.5} className="text-gray-300 flex-shrink-0 ml-auto" />
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-[11px] text-gray-400 py-4 border-t border-gray-200 mt-4">
              {t('allied.experimentalText')} •{' '}
              <a href="https://enam.gov.in" target="_blank" rel="noopener noreferrer"
                 className="text-[#0b5e2c] font-semibold underline">
                e-NAM
              </a>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
