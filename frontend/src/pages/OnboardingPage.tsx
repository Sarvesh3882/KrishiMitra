import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import { ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react';
import type { EnterpriseType } from '../contexts/AuthContext';

// ── Enterprise options with icons ─────────────────────────────────────────
const ENTERPRISES: { id: EnterpriseType; emoji: string; key: string }[] = [
  { id: 'dairy',        emoji: '🥛', key: 'enterprise.dairy'        },
  { id: 'poultry',      emoji: '🐔', key: 'enterprise.poultry'      },
  { id: 'fisheries',    emoji: '🐟', key: 'enterprise.fisheries'    },
  { id: 'goat',         emoji: '🐐', key: 'enterprise.goat'         },
  { id: 'apiculture',   emoji: '🍯', key: 'enterprise.apiculture'   },
  { id: 'mushroom',     emoji: '🍄', key: 'enterprise.mushroom'     },
  { id: 'vermicompost', emoji: '🪱', key: 'enterprise.vermicompost' },
];

// ── Maharashtra districts (most relevant) + others ────────────────────────
const MH_DISTRICTS = [
  'Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara',
  'Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli',
  'Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban',
  'Nagpur','Nanded','Nandurbar','Nashik','Osmanabad','Palghar',
  'Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara',
  'Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal',
];

type Step = 'name' | 'location' | 'enterprise' | 'done';

export function OnboardingPage() {
  const { saveProfile } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep]           = useState<Step>('name');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Form state
  const [fullName, setFullName]           = useState('');
  const [village, setVillage]             = useState('');
  const [district, setDistrict]           = useState('');
  const [state, setState]                 = useState('Maharashtra');
  const [enterprise, setEnterprise]       = useState<EnterpriseType | ''>('');
  const [primaryCrop, setPrimaryCrop]     = useState('');

  const steps: Step[] = ['name', 'location', 'enterprise', 'done'];
  const stepIndex = steps.indexOf(step);
  const progress  = ((stepIndex) / (steps.length - 1)) * 100;

  // ── Navigation helpers ─────────────────────────────────────────────────
  const goNext = () => {
    setError(null);
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    setError(null);
    const prev = steps[stepIndex - 1];
    if (prev) setStep(prev);
  };

  // ── Step validation ────────────────────────────────────────────────────
  const canProceedName     = fullName.trim().length >= 2;
  const canProceedLocation = village.trim().length >= 1 && district.length > 0;
  const canProceedEnt      = enterprise !== '';

  // ── Final save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await saveProfile({
      full_name:       fullName.trim(),
      village:         village.trim(),
      district,
      state,
      enterprise_type: enterprise || undefined,
      primary_crop:    primaryCrop.trim() || undefined,
      preferred_language: language as 'en' | 'hi' | 'mr',
    });
    setLoading(false);
    if (err) { setError(err); return; }
    setStep('done');
  };

  // ── DONE screen: auto-redirect after 2s ──────────────────────────────
  if (step === 'done') {
    setTimeout(() => navigate('/', { replace: true }), 2000);
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <div className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col
                        items-center justify-center bg-white px-6">
          <div className="w-20 h-20 rounded-full bg-[#0b5e2c] flex items-center
                          justify-center mb-6 shadow-lg">
            <Check size={40} strokeWidth={3} className="text-white" />
          </div>
          <h1 className="text-[24px] font-bold text-gray-900 mb-2 text-center"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t('auth.profileSaved')}
          </h1>
          <p className="text-[14px] text-gray-500 text-center"
             style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t('auth.welcomeToApp')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col bg-white">

        {/* ── Top bar ── */}
        <div className="bg-[#0b5e2c] px-6 pt-12 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="KrishiMitra" className="w-8 h-8 object-contain" />
              <span className="text-[18px] font-bold text-white">KrishiMitra</span>
            </div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="text-white/60 text-[12px] hover:text-white/90 transition-colors"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              {t('auth.skipForNow')}
            </button>
          </div>

          <h1 className="text-[20px] font-bold text-white mb-1"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t('auth.setupProfile')}
          </h1>
          <p className="text-white/70 text-[13px] mb-5"
             style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t('auth.setupSubtitle')}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {['auth.stepName','auth.stepLocation','auth.stepEnterprise'].map((k, i) => (
              <span key={k} className={`text-[10px] transition-colors ${
                i <= stepIndex - 1 ? 'text-white font-semibold' : 'text-white/50'
              }`}
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t(k as any)}
              </span>
            ))}
          </div>
        </div>

        {/* ── Form body ── */}
        <div className="flex-1 px-6 pt-8 pb-6 space-y-6">

          {/* STEP: Name */}
          {step === 'name' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[20px] font-bold text-gray-900 mb-1"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.whatsYourName')}
                </h2>
                <p className="text-[13px] text-gray-500"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.nameHint')}
                </p>
              </div>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('profile.fullName')}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl
                           text-[16px] text-gray-900 focus:outline-none focus:border-[#0b5e2c]
                           transition-colors placeholder:text-gray-300"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                autoFocus
              />
            </div>
          )}

          {/* STEP: Location */}
          {step === 'location' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[20px] font-bold text-gray-900 mb-1"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.whereAreYou')}
                </h2>
                <p className="text-[13px] text-gray-500"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.locationHint')}
                </p>
              </div>

              {/* Village */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('profile.village')}
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder={t('profile.village')}
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl
                             text-[15px] text-gray-900 focus:outline-none focus:border-[#0b5e2c]
                             transition-colors placeholder:text-gray-300"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  autoFocus
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('profile.district')}
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl
                             text-[15px] text-gray-900 focus:outline-none focus:border-[#0b5e2c]
                             transition-colors appearance-none"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                >
                  <option value="">{t('profile.selectDistrict')}</option>
                  {MH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* State — pre-filled Maharashtra, editable */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('profile.state')}
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl
                             text-[15px] text-gray-900 focus:outline-none focus:border-[#0b5e2c]
                             transition-colors"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                />
              </div>
            </div>
          )}

          {/* STEP: Enterprise */}
          {step === 'enterprise' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[20px] font-bold text-gray-900 mb-1"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.whatDoYouFarm')}
                </h2>
                <p className="text-[13px] text-gray-500"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.enterpriseHint')}
                </p>
              </div>

              {/* Enterprise grid */}
              <div className="grid grid-cols-2 gap-3">
                {ENTERPRISES.map(({ id, emoji, key }) => {
                  const selected = enterprise === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEnterprise(id)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2
                                 transition-all active:scale-[0.98] text-left
                                 ${selected
                                   ? 'border-[#0b5e2c] bg-[#f0faf2]'
                                   : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                 }`}
                    >
                      <span className="text-[24px] flex-shrink-0">{emoji}</span>
                      <span className={`text-[13px] font-semibold leading-snug
                                       ${selected ? 'text-[#0b5e2c]' : 'text-gray-700'}`}
                            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                        {t(key as any)}
                      </span>
                      {selected && (
                        <Check size={16} strokeWidth={2.5} className="text-[#0b5e2c] ml-auto flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Primary crop (optional) */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('profile.primaryCrop')} <span className="normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={primaryCrop}
                  onChange={(e) => setPrimaryCrop(e.target.value)}
                  placeholder="e.g. Onion, Cotton, Wheat"
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl
                             text-[15px] text-gray-900 focus:outline-none focus:border-[#0b5e2c]
                             transition-colors placeholder:text-gray-300"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 px-4 py-3 rounded-xl"
               style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {error}
            </p>
          )}
        </div>

        {/* ── Bottom nav ── */}
        <div className="px-6 pb-8 flex gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="w-14 py-4 bg-gray-100 text-gray-600 rounded-2xl
                         flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
          )}

          <button
            type="button"
            disabled={
              loading ||
              (step === 'name'       && !canProceedName)     ||
              (step === 'location'   && !canProceedLocation) ||
              (step === 'enterprise' && !canProceedEnt)
            }
            onClick={step === 'enterprise' ? handleSave : goNext}
            className="flex-1 py-4 bg-[#0b5e2c] text-white rounded-2xl text-[16px] font-bold
                       flex items-center justify-center gap-2 shadow-md
                       hover:bg-[#094d24] active:scale-[0.99] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : step === 'enterprise' ? (
              <><span>{t('auth.saveAndStart')}</span><Check size={20} strokeWidth={2.5} /></>
            ) : (
              <><span>{t('general.next')}</span><ChevronRight size={20} strokeWidth={2.5} /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
