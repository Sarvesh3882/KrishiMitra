import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { mockEvents, alliedGuides, farmerCommunities } from '../data/mockCommunityData';
import { MapPin, BookOpen, Users, Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

type TabType = 'events' | 'guides' | 'communities';

export function CommunityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const monthsShort: Record<string, string[]> = {
      en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      hi: ['जन','फर','मार','अप्रै','मई','जून','जुल','अग','सित','अक्टू','नव','दिस'],
      mr: ['जाने','फेब','मार','एप्रि','मे','जून','जुलै','ऑग','सप्टे','ऑक्टो','नोव्ह','डिसें'],
    };
    const monthsFull: Record<string, string[]> = {
      en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      hi: ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'],
      mr: ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'],
    };
    const lang = language in monthsShort ? language : 'en';
    return {
      day: date.getDate(),
      month: monthsShort[lang][date.getMonth()],
      full: `${date.getDate()} ${monthsFull[lang][date.getMonth()]}`,
    };
  };

  const sortedEvents = [...mockEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'events',      label: t('community.upcomingEvents'), icon: <Calendar size={15} strokeWidth={2} /> },
    { id: 'guides',      label: t('community.guides'),         icon: <BookOpen size={15} strokeWidth={2} /> },
    { id: 'communities', label: t('community.communities'),    icon: <Users    size={15} strokeWidth={2} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div className="w-full max-w-[430px] mx-auto bg-[#f5f5f5] min-h-screen flex flex-col relative">

        <DashboardHeader />

        <main className="flex-1 pb-20">

          {/* Page title */}
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {t('community.title')}
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5"
               style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {t('community.training')}, {t('community.guides').toLowerCase()}{' '}
              {t('community.connect').toLowerCase()}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-[12px] font-semibold border-b-2 transition-colors
                           flex items-center justify-center gap-1.5
                           ${activeTab === tab.id
                             ? 'border-[#0b5e2c] text-[#0b5e2c]'
                             : 'border-transparent text-gray-400'}`}
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── Events ── */}
          {activeTab === 'events' && (
            <div className="pt-4">
              <div className="px-4 mb-3">
                <h2 className="text-[16px] font-bold text-gray-900"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('community.upcomingEvents')}
                </h2>
                <p className="text-[12px] text-gray-500 mt-0.5"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('community.upcomingDescription')}
                </p>
              </div>

              <div className="space-y-4 px-4">
                {sortedEvents.map((event) => {
                  const d = formatDate(event.date);
                  return (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/community/event/${event.id}`)}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100
                                 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                    >
                      {/* Image */}
                      <div className="relative w-full bg-gray-200" style={{ aspectRatio: '16/9' }}>
                        <img src={event.image} alt={event.title}
                             className="w-full h-full object-cover" loading="lazy" />
                        {event.isPlaceholder && (
                          <div className="absolute top-2 right-2 bg-[#f5820a] text-white
                                          text-[10px] px-2 py-1 rounded-full font-semibold">
                            {t('community.sampleBadge')}
                          </div>
                        )}
                        {/* Date badge */}
                        <div className="absolute bottom-2 left-2 bg-white rounded-xl px-3 py-1.5 shadow-md">
                          <div className="text-[18px] font-bold text-gray-900 leading-none">{d.day}</div>
                          <div className="text-[10px] text-gray-500 leading-none mt-0.5"
                               style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                            {d.month}
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="text-[15px] font-bold text-gray-900 mb-2 leading-snug"
                            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                          {event.title}
                        </h3>

                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2 text-[12px] text-gray-500">
                            <Calendar size={13} strokeWidth={2} className="text-gray-400 flex-shrink-0" />
                            <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                              {d.full} · {event.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-gray-500">
                            <MapPin size={13} strokeWidth={2} className="text-gray-400 flex-shrink-0" />
                            <span>
                              {event.location.name}
                              {event.location.distance && ` · ${event.location.distance} km`}
                            </span>
                          </div>
                        </div>

                        <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-2 mb-3"
                           style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                          {event.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-[11px] text-gray-400"
                                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                            {t('community.organizer')}: {event.organizer}
                          </span>
                          <span className="text-[12px] text-[#0b5e2c] font-semibold flex items-center gap-1"
                                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                            {t('community.learnMore')}
                            <ChevronRight size={14} strokeWidth={2.5} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Guides ── */}
          {activeTab === 'guides' && (
            <div className="pt-4 px-4">
              <div className="mb-3">
                <h2 className="text-[16px] font-bold text-gray-900"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('community.alliedFarmingGuides')}
                </h2>
                <p className="text-[12px] text-gray-500 mt-0.5"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('community.guideDescription')}
                </p>
              </div>

              <div className="space-y-3">
                {alliedGuides.map((guide) => (
                  <div
                    key={guide.id}
                    onClick={() => navigate(`/community/guide/${guide.id}`)}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden
                               shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="relative h-28 bg-gray-200">
                      <img src={guide.image} alt={guide.title}
                           className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-gray-900 mb-0.5 leading-snug"
                            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                          {guide.title}
                        </h3>
                        <p className="text-[12px] text-gray-500 line-clamp-2 leading-snug"
                           style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                          {guide.overview}
                        </p>
                      </div>
                      <ChevronRight size={18} strokeWidth={2} className="text-[#0b5e2c] flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Communities ── */}
          {activeTab === 'communities' && (
            <div className="pt-4 px-4">
              <div className="mb-3">
                <h2 className="text-[16px] font-bold text-gray-900"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('community.communityTitle')}
                </h2>
                <p className="text-[12px] text-gray-500 mt-0.5"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('community.communityDescription')}
                </p>
              </div>

              <div className="space-y-3">
                {farmerCommunities.map((community) => (
                  <a
                    key={community.id}
                    href={community.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white rounded-2xl border border-gray-100
                               shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-12 h-12 bg-[#e8f5e9] rounded-xl flex items-center
                                      justify-center flex-shrink-0">
                        <Users size={22} strokeWidth={2} className="text-[#0b5e2c]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-gray-900 mb-0.5 leading-tight">
                          {community.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-1">
                          <MapPin size={11} strokeWidth={2} />
                          <span>{community.location}</span>
                        </div>
                        <p className="text-[12px] text-gray-500 line-clamp-1"
                           style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                          {community.description}
                        </p>
                        {community.members && (
                          <p className="text-[11px] text-gray-400 mt-0.5">{community.members}</p>
                        )}
                      </div>
                      <ChevronRight size={18} strokeWidth={2} className="text-[#0b5e2c] flex-shrink-0" />
                    </div>

                    {/* Join button */}
                    <div className="px-4 pb-4">
                      <div className="w-full py-2.5 bg-[#25D366] rounded-xl text-white
                                      text-[13px] font-bold text-center"
                           style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                        {t('community.joinWhatsApp')}
                      </div>
                    </div>

                    {community.isPlaceholder && (
                      <div className="bg-orange-50 border-t border-orange-100 px-4 py-2">
                        <p className="text-[10px] text-orange-700"
                           style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                          {t('community.sampleLink')}
                        </p>
                      </div>
                    )}
                  </a>
                ))}
              </div>

              {/* Tip card */}
              <div className="mt-5 bg-[#f0faf2] border border-[#c8e6c9] rounded-2xl p-4">
                <p className="text-[12px] text-[#1b5e20] leading-relaxed"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  💡 {t('community.tip')}
                </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
