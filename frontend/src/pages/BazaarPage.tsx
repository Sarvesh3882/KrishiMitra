import { Link } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { TrendingUp, ShoppingBag, ChevronRight, Lightbulb } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export function BazaarPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <DashboardHeader />

      <main className="flex-1 pb-20">
        <div className="max-w-[430px] mx-auto px-4 pt-6 pb-6">

          {/* Page Header */}
          <div className="mb-6">
            <h1
              className="text-[26px] font-bold text-gray-900 leading-tight mb-1"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              {t('bazaar.title')}
            </h1>
            <p
              className="text-[14px] text-gray-500 leading-snug"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              {t('bazaar.subtitle')}
            </p>
          </div>

          {/* Option Cards */}
          <div className="space-y-3">

            {/* Option 1: See Prices */}
            <Link to="/around" className="block">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5
                              hover:border-[#0b5e2c] hover:shadow-md transition-all
                              active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-14 h-14 bg-[#e8f5e9] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={26} strokeWidth={2} className="text-[#0b5e2c]" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-[17px] font-bold text-gray-900 mb-0.5 leading-snug"
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                    >
                      {t('bazaar.seePrices')}
                    </h2>
                    <p
                      className="text-[13px] text-gray-500 leading-snug"
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                    >
                      {t('bazaar.seePricesDesc')}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="w-9 h-9 bg-[#f0faf2] rounded-full flex items-center justify-center flex-shrink-0">
                    <ChevronRight size={20} strokeWidth={2.5} className="text-[#0b5e2c]" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Option 2: Sell Produce */}
            <Link to="/market" className="block">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5
                              hover:border-[#0b5e2c] hover:shadow-md transition-all
                              active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-14 h-14 bg-[#fff3e0] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={26} strokeWidth={2} className="text-[#e65100]" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-[17px] font-bold text-gray-900 mb-0.5 leading-snug"
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                    >
                      {t('bazaar.sell')}
                    </h2>
                    <p
                      className="text-[13px] text-gray-500 leading-snug"
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                    >
                      {t('bazaar.sellDesc')}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="w-9 h-9 bg-[#fff8f0] rounded-full flex items-center justify-center flex-shrink-0">
                    <ChevronRight size={20} strokeWidth={2.5} className="text-[#e65100]" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Tip Card */}
          <div className="mt-5 bg-[#f0faf2] border border-[#c8e6c9] rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-[#0b5e2c]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb size={16} strokeWidth={2} className="text-[#0b5e2c]" />
            </div>
            <p
              className="text-[13px] text-[#1b5e20] leading-relaxed"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              <span className="font-semibold">{t('bazaar.tip')}: </span>
              {t('bazaar.tipText')}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
