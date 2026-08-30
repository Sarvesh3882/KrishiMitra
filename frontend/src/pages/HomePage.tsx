import { DashboardHeader } from '../components/DashboardHeader';
import { UpdatesPosterCarousel } from '../components/UpdatesPosterCarousel';
import { usePosterData } from '../hooks/usePosterData';
import { useNavigate } from 'react-router-dom';
import { ShoppingBasket, CloudRain, Users, HelpCircle, Mic, ChevronRight, Home, MessageCircle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export function HomePage() {
  const { posters, loading } = usePosterData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Mobile App Container - Centered on Desktop */}
      <div className="w-full max-w-[430px] mx-auto bg-[#f5f5f5] min-h-screen flex flex-col relative">
        
        <DashboardHeader />

        {/* Main Content with Bottom Padding for Nav */}
        <main className="flex-1 pb-20">
          
          {/* Greeting Section */}
          <div className="px-4 pt-6 pb-5">
            <h1 className="text-[26px] font-bold text-gray-900 leading-[1.25] mb-1.5" 
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {t('home.greeting')}
            </h1>
            <p className="text-[14px] text-gray-600 leading-[1.4]" 
               style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {t('home.greetingSubtitle')}
            </p>
          </div>

          {/* AI Voice Card */}
          <div className="px-4 mb-6">
            <button
              onClick={() => navigate('/ai')}
              className="w-full bg-[#0b5e2c] rounded-2xl p-6 
                       hover:shadow-lg active:scale-[0.99] transition-all shadow-md"
            >
              {/* Top Row: Icon + Content + Arrow */}
              <div className="flex items-center justify-between gap-4 mb-5">
                {/* Left: Mic Icon - Better aligned */}
                <div className="w-14 h-14 bg-white/25 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mic size={28} strokeWidth={2.5} className="text-white" />
                </div>

                {/* Center: Content */}
                <div className="flex-1 text-left">
                  <h2 className="text-[19px] font-bold text-white leading-[1.2] mb-0.5" 
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t('home.askKrishiMitra')}
                  </h2>
                  <p className="text-[13px] text-white/85 leading-[1.3]" 
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t('home.askKrishiMitraDesc')}
                  </p>
                </div>

                {/* Right: Arrow Button - Better aligned */}
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <ChevronRight size={24} strokeWidth={3} className="text-[#0b5e2c]" />
                </div>
              </div>

              {/* Bottom: Voice Button */}
              <div className="flex justify-center pt-2">
                <div className="bg-white rounded-full px-6 py-2.5 inline-flex items-center">
                  <span className="text-[13px] font-semibold text-[#0b5e2c]" 
                        style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t('ask.listen')}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Section Header: आपल्यासाठी (For You) */}
          {!loading && posters.length > 0 && (
            <>
              <div className="px-4 mb-3 flex items-center justify-between">
                <h3 className="text-[18px] font-bold text-gray-900" 
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('home.forYou')}
                </h3>
                <button
                  onClick={() => navigate('/community')}
                  className="text-[12px] font-semibold text-[#0b5e2c] flex items-center gap-0.5
                           hover:underline active:scale-95 transition-all"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                >
                  {t('home.seeAll')}
                  <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Updates Poster Carousel */}
              <div className="mb-6">
                <UpdatesPosterCarousel posters={posters} />
              </div>
            </>
          )}

          {/* Section Title: मुख्य सेवा (Main Services) */}
          <div className="px-4 mb-3">
            <h3 className="text-[18px] font-bold text-gray-900" 
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {t('home.mainServices')}
            </h3>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            {/* बाजार */}
            <button
              onClick={() => navigate('/bazaar')}
              className="bg-white rounded-2xl border border-gray-200 p-5
                       hover:border-[#0b5e2c] hover:shadow-sm transition-all
                       active:scale-[0.98] flex flex-col items-center text-center h-full"
            >
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <ShoppingBasket size={32} strokeWidth={2} className="text-[#0b5e2c]" />
              </div>
              <h4 className="text-[16px] font-bold text-gray-900 leading-[1.3] mb-1" 
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('bazaar.title')}
              </h4>
              <p className="text-[12px] text-gray-600 leading-[1.35]" 
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('mandi.todayRates')}
              </p>
            </button>

            {/* हवामान */}
            <button
              onClick={() => navigate('/weather')}
              className="bg-white rounded-2xl border border-gray-200 p-5
                       hover:border-[#0b5e2c] hover:shadow-sm transition-all
                       active:scale-[0.98] flex flex-col items-center text-center h-full"
            >
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <CloudRain size={32} strokeWidth={2} className="text-[#0b5e2c]" />
              </div>
              <h4 className="text-[16px] font-bold text-gray-900 leading-[1.3] mb-1" 
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('weather.title')}
              </h4>
              <p className="text-[12px] text-gray-600 leading-[1.35]" 
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('weather.rainWhenQuestion')}
              </p>
            </button>

            {/* जुड़ा */}
            <button
              onClick={() => navigate('/community')}
              className="bg-white rounded-2xl border border-gray-200 p-5
                       hover:border-[#0b5e2c] hover:shadow-sm transition-all
                       active:scale-[0.98] flex flex-col items-center text-center h-full"
            >
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <Users size={32} strokeWidth={2} className="text-[#0b5e2c]" />
              </div>
              <h4 className="text-[16px] font-bold text-gray-900 leading-[1.3] mb-1" 
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('community.title')}
              </h4>
              <p className="text-[12px] text-gray-600 leading-[1.35]" 
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('community.communityDescription')}
              </p>
            </button>

            {/* मदत */}
            <button
              onClick={() => navigate('/help')}
              className="bg-white rounded-2xl border border-gray-200 p-5
                       hover:border-[#0b5e2c] hover:shadow-sm transition-all
                       active:scale-[0.98] flex flex-col items-center text-center h-full"
            >
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <HelpCircle size={32} strokeWidth={2} className="text-[#0b5e2c]" />
              </div>
              <h4 className="text-[16px] font-bold text-gray-900 leading-[1.3] mb-1" 
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('help.title')}
              </h4>
              <p className="text-[12px] text-gray-600 leading-[1.35]" 
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('schemes.title')}
              </p>
            </button>
          </div>
        </main>

        {/* Bottom Navigation - Fixed */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 
                      max-w-[430px] mx-auto" 
             style={{ boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)' }}>
          <div className="grid grid-cols-5 h-16">
            {/* होम */}
            <button
              onClick={() => navigate('/')}
              className="flex flex-col items-center justify-center gap-1 
                       bg-[#e6f7f0] text-[#0b5e2c] active:bg-[#d1f0e3] transition-colors"
            >
              <Home size={22} strokeWidth={2.5} />
              <span className="text-[11px] font-semibold leading-none" 
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('nav.home')}
              </span>
            </button>

            {/* बाजार */}
            <button
              onClick={() => navigate('/bazaar')}
              className="flex flex-col items-center justify-center gap-1 
                       text-gray-600 hover:text-gray-900 active:bg-gray-50 transition-colors"
            >
              <ShoppingBasket size={22} strokeWidth={2} />
              <span className="text-[11px] font-medium leading-none" 
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('nav.bazaar')}
              </span>
            </button>

            {/* बात करें */}
            <button
              onClick={() => navigate('/ai')}
              className="flex flex-col items-center justify-center gap-1 
                       text-gray-600 hover:text-gray-900 active:bg-gray-50 transition-colors"
            >
              <MessageCircle size={22} strokeWidth={2} />
              <span className="text-[11px] font-medium leading-none" 
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('ask.title')}
              </span>
            </button>

            {/* जुड़ा */}
            <button
              onClick={() => navigate('/community')}
              className="flex flex-col items-center justify-center gap-1 
                       text-gray-600 hover:text-gray-900 active:bg-gray-50 transition-colors"
            >
              <Users size={22} strokeWidth={2} />
              <span className="text-[11px] font-medium leading-none" 
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('community.title')}
              </span>
            </button>

            {/* मदत */}
            <button
              onClick={() => navigate('/help')}
              className="flex flex-col items-center justify-center gap-1 
                       text-gray-600 hover:text-gray-900 active:bg-gray-50 transition-colors"
            >
              <HelpCircle size={22} strokeWidth={2} />
              <span className="text-[11px] font-medium leading-none" 
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('help.title')}
              </span>
            </button>
          </div>
        </nav>

      </div>
    </div>
  );
}
