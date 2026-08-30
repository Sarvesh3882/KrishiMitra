import { useParams, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { mockEvents } from '../data/mockCommunityData';
import { useTranslation } from '../i18n/useTranslation';
import { ChevronLeft } from 'lucide-react';

export function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const event = mockEvents.find((e) => e.id === eventId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months: Record<string, string[]> = {
      en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      hi: ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'],
      mr: ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'],
    };
    const lang = language in months ? language : 'en';
    return `${date.getDate()} ${months[lang][date.getMonth()]} ${date.getFullYear()}`;
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <div className="w-full max-w-[430px] mx-auto bg-[#f5f5f5] min-h-screen flex flex-col">
          <DashboardHeader />
          <div className="px-4 py-6 text-center">
            <p className="text-gray-500 mb-4" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {t('event.notFound')}
            </p>
            <button onClick={() => navigate('/community')}
              className="text-[#0b5e2c] font-semibold flex items-center gap-1 mx-auto">
              <ChevronLeft size={16} /> {t('event.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              {t('event.back')}
            </button>
          </div>

          {/* Image */}
          <div className="relative w-full bg-gray-200" style={{ aspectRatio: '16/9' }}>
            <img src={event.image} alt={event.title}
              className="w-full h-full object-cover" loading="lazy" />
            {event.isPlaceholder && (
              <div className="absolute top-3 right-3 bg-[#f5820a] text-white text-[10px]
                              px-2 py-1 rounded-full font-semibold shadow">
                {t('community.sampleBadge')}
              </div>
            )}
          </div>

          <div className="px-4 mt-4 space-y-5">

            {/* Title + meta */}
            <div>
              <h1 className="text-[22px] font-bold text-gray-900 mb-3 leading-snug"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {event.title}
              </h1>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[13px] text-gray-600">
                  <span>📅</span>
                  <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {formatDate(event.date)} · {event.time}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-600">
                  <span>📍</span>
                  <span>{event.location.name}, {event.location.district}
                    {event.location.distance && ` · ${event.location.distance} km`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-600">
                  <span>🏛️</span>
                  <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t('community.organizer')}: {event.organizer}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h2 className="text-[15px] font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t('event.details')}
              </h2>
              <p className="text-[13px] text-gray-600 leading-relaxed"
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {event.description}
              </p>
            </div>

            {/* What you'll learn */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h2 className="text-[15px] font-bold text-gray-900 mb-3"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                📚 {t('event.whatYouLearn')}
              </h2>
              <ul className="space-y-2">
                {event.details.whatYouLearn.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                    <span className="text-[#0b5e2c] mt-0.5 font-bold">✓</span>
                    <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Who can attend */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h2 className="text-[15px] font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                👥 {t('event.whoCanAttend')}
              </h2>
              <p className="text-[13px] text-gray-600"
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {event.details.whoCanParticipate}
              </p>
            </div>

            {/* Registration */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h2 className="text-[15px] font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                📝 {t('event.registration')}
              </h2>
              <p className="text-[13px] text-gray-600 mb-3"
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {event.details.registrationInfo}
              </p>
              {event.details.contact && (
                <button
                  onClick={() => { window.location.href = `tel:${event.details.contact}`; }}
                  className="w-full bg-[#0b5e2c] text-white py-3 rounded-xl font-semibold
                             text-[14px] hover:bg-[#094d24] transition-colors active:scale-[0.98]"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                >
                  📞 {t('event.contact')}
                </button>
              )}
            </div>

            {/* Disclaimer */}
            {event.isPlaceholder && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                <p className="text-[12px] text-orange-800 leading-relaxed"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  <span className="font-semibold">{t('event.note')}: </span>
                  {t('event.disclaimer')}
                </p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
