import { useParams, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { alliedGuides } from '../data/mockCommunityData';
import { useTranslation } from '../i18n/useTranslation';
import { ChevronLeft } from 'lucide-react';

export function AlliedGuideDetailsPage() {
  const { guideId } = useParams<{ guideId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const guide = alliedGuides.find((g) => g.id === guideId);

  if (!guide) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <div className="w-full max-w-[430px] mx-auto bg-[#f5f5f5] min-h-screen flex flex-col">
          <DashboardHeader />
          <div className="px-4 py-6 text-center">
            <p className="text-gray-500 mb-4"
               style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {t('guide.notFound')}
            </p>
            <button onClick={() => navigate('/community')}
              className="text-[#0b5e2c] font-semibold flex items-center gap-1 mx-auto">
              <ChevronLeft size={16} /> {t('guide.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reusable section card
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h3 className="text-[14px] font-bold text-gray-900 mb-2.5"
          style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
        {title}
      </h3>
      {children}
    </div>
  );

  const BulletList = ({ items, numbered = false }: { items: string[]; numbered?: boolean }) => (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
          <span className="text-[#0b5e2c] font-bold mt-0.5 flex-shrink-0">
            {numbered ? `${i + 1}.` : '•'}
          </span>
          <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{item}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div className="w-full max-w-[430px] mx-auto bg-[#f5f5f5] min-h-screen flex flex-col relative">
        <DashboardHeader />

        <main className="flex-1 pb-8">
          {/* Back */}
          <div className="px-4 py-3 bg-white border-b border-gray-100">
            <button onClick={() => navigate('/community')}
              className="text-[#0b5e2c] font-semibold flex items-center gap-1 text-[14px]"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              <ChevronLeft size={16} strokeWidth={2.5} />
              {t('guide.back')}
            </button>
          </div>

          {/* Image */}
          <div className="relative w-full bg-gray-200" style={{ aspectRatio: '16/9' }}>
            <img src={guide.image} alt={guide.title}
              className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute bottom-4 left-4 bg-white rounded-full p-3 shadow-lg">
              <span className="text-[36px]">{guide.icon}</span>
            </div>
          </div>

          <div className="px-4 mt-4 space-y-4">

            {/* Title + overview */}
            <div>
              <h1 className="text-[22px] font-bold text-gray-900 mb-2 leading-snug"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {guide.title}
              </h1>
              <p className="text-[13px] text-gray-500 leading-relaxed"
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {guide.overview}
              </p>
            </div>

            {/* Getting started heading */}
            <h2 className="text-[17px] font-bold text-gray-900"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              🚀 {t('guide.gettingStarted')}
            </h2>

            <Section title={t('guide.requirements')}>
              <BulletList items={guide.gettingStarted.requirements} />
            </Section>

            <Section title={t('guide.setup')}>
              <BulletList items={guide.gettingStarted.setup} numbered />
            </Section>

            <Section title={t('guide.equipment')}>
              <BulletList items={guide.gettingStarted.equipment} />
            </Section>

            <Section title={t('guide.beginnerSteps')}>
              <BulletList items={guide.gettingStarted.beginnerSteps} numbered />
            </Section>

            {/* Market */}
            <h2 className="text-[17px] font-bold text-gray-900"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              💰 {t('guide.marketAndPrice')}
            </h2>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              {guide.market.hasMandiIntegration && (
                <div className="mb-3 p-3 bg-[#f0faf2] rounded-xl">
                  <p className="text-[12px] text-[#1b5e20] font-medium"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    ✓ {t('guide.mandiIntegration')}
                  </p>
                </div>
              )}
              <h3 className="text-[14px] font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                🛒 {t('guide.whereToSell')}
              </h3>
              <BulletList items={guide.market.sellingInfo} />
            </div>

            {/* Government support */}
            <h2 className="text-[17px] font-bold text-gray-900"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              🏛️ {t('guide.govSupport')}
            </h2>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              {guide.government.schemesAvailable ? (
                <>
                  <p className="text-[13px] text-gray-500 mb-3"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t('guide.schemesAvailable')}
                  </p>
                  <BulletList items={guide.government.info} />
                  <button
                    onClick={() => navigate('/help')}
                    className="mt-4 w-full bg-[#0b5e2c] text-white py-2.5 rounded-xl
                               font-semibold text-[14px] hover:bg-[#094d24] transition-colors"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  >
                    {t('guide.viewPrograms')} →
                  </button>
                </>
              ) : (
                <p className="text-[13px] text-gray-500"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('guide.contactLocal')}
                </p>
              )}
            </div>

            {/* Training */}
            <h2 className="text-[17px] font-bold text-gray-900"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              📍 {t('guide.trainingPrograms')}
            </h2>

            <div className="bg-[#f0faf2] border border-[#c8e6c9] rounded-2xl p-4">
              <p className="text-[13px] text-[#1b5e20] mb-3"
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('guide.upcomingTraining')}
              </p>
              <button
                onClick={() => navigate('/community')}
                className="text-[13px] text-[#0b5e2c] font-semibold"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
              >
                {t('guide.viewPrograms')} →
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
