import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import { Phone, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

type Step = 'phone' | 'otp';

export function SignInPage() {
  const { sendOtp, verifyOtp } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep]         = useState<Step>('phone');
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Refs for OTP digit boxes
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError(t('auth.phoneInvalid'));
      return;
    }
    setLoading(true);
    const { error: err } = await sendOtp(phone);
    setLoading(false);
    if (err) { setError(err); return; }
    setStep('otp');
    setResendTimer(30);
    // Focus first OTP box
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // ── OTP input handlers ────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Accept paste of full 6-digit code
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      const arr = value.split('');
      setOtp(arr);
      otpRefs.current[5]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = otp.join('');
    if (token.length !== 6) { setError(t('auth.otpInvalid')); return; }
    setLoading(true);
    const { error: err, isNewUser } = await verifyOtp(phone, token);
    setLoading(false);
    if (err) { setError(err); return; }
    // New farmer → onboarding; returning farmer → home
    navigate(isNewUser ? '/onboarding' : '/', { replace: true });
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setLoading(true);
    const { error: err } = await sendOtp(phone);
    setLoading(false);
    if (err) { setError(err); return; }
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)} ${d.slice(5)}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col bg-white">

        {/* ── Top brand bar ── */}
        <div className="bg-[#0b5e2c] px-6 pt-14 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="KrishiMitra" className="w-10 h-10 object-contain" />
            <span className="text-[24px] font-bold text-white tracking-tight">KrishiMitra</span>
          </div>
          <h1 className="text-[22px] font-bold text-white leading-snug mb-1"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t('auth.welcome')}
          </h1>
          <p className="text-white/70 text-[14px]"
             style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t('auth.welcomeSubtitle')}
          </p>
        </div>

        {/* ── Form card ── */}
        <div className="flex-1 px-6 pt-8 pb-10">

          {/* ── STEP 1: Phone number ── */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  {t('auth.step1of2')}
                </p>
                <h2 className="text-[20px] font-bold text-gray-900 mb-1"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.enterPhone')}
                </h2>
                <p className="text-[13px] text-gray-500 mb-6"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.phoneHint')}
                </p>

                {/* Phone input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-[15px]">🇮🇳</span>
                    <span className="text-[14px] font-semibold text-gray-600">+91</span>
                    <div className="w-px h-5 bg-gray-200 ml-1" />
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formatPhone(phone)}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="w-full pl-[88px] pr-4 py-4 bg-gray-50 border-2 border-gray-100
                               rounded-2xl text-[18px] font-semibold tracking-widest text-gray-900
                               focus:outline-none focus:border-[#0b5e2c] transition-colors
                               placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-[13px] text-red-600 bg-red-50 px-4 py-3 rounded-xl"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length !== 10}
                className="w-full py-4 bg-[#0b5e2c] text-white rounded-2xl text-[16px] font-bold
                           flex items-center justify-center gap-2 shadow-md
                           hover:bg-[#094d24] active:scale-[0.99] transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
              >
                {loading
                  ? <Loader2 size={20} className="animate-spin" />
                  : <><span>{t('auth.sendOtp')}</span><ChevronRight size={20} strokeWidth={2.5} /></>
                }
              </button>

              {/* Skip / guest access */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/', { replace: true })}
                  className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                >
                  {t('auth.skipForNow')}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: OTP verification ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setError(null); setOtp(['','','','','','']); }}
                  className="flex items-center gap-1 text-[13px] text-[#0b5e2c] font-semibold mb-5"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                  {t('general.back')}
                </button>

                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  {t('auth.step2of2')}
                </p>
                <h2 className="text-[20px] font-bold text-gray-900 mb-1"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.enterOtp')}
                </h2>
                <p className="text-[13px] text-gray-500 mb-6"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('auth.otpSentTo')} <span className="font-semibold text-gray-700">+91 {formatPhone(phone)}</span>
                </p>

                {/* 6 OTP digit boxes */}
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-full aspect-square text-center text-[22px] font-bold
                                 bg-gray-50 border-2 rounded-2xl
                                 focus:outline-none transition-colors
                                 ${digit
                                   ? 'border-[#0b5e2c] bg-[#f0faf2] text-[#0b5e2c]'
                                   : 'border-gray-100 text-gray-900 focus:border-[#0b5e2c]'
                                 }`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-[13px] text-red-600 bg-red-50 px-4 py-3 rounded-xl"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-4 bg-[#0b5e2c] text-white rounded-2xl text-[16px] font-bold
                           flex items-center justify-center gap-2 shadow-md
                           hover:bg-[#094d24] active:scale-[0.99] transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
              >
                {loading
                  ? <Loader2 size={20} className="animate-spin" />
                  : <><span>{t('auth.verifyOtp')}</span><ChevronRight size={20} strokeWidth={2.5} /></>
                }
              </button>

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-[13px] text-gray-400"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t('auth.resendIn')} {resendTimer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[13px] text-[#0b5e2c] font-semibold hover:underline"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  >
                    {t('auth.resendOtp')}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-8 text-center">
          <p className="text-[11px] text-gray-300 leading-relaxed"
             style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t('auth.otpDisclaimer')}
          </p>
        </div>

      </div>
    </div>
  );
}
