import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LanguageSelectionPage } from './pages/LanguageSelectionPage';
import { HomePage } from './pages/HomePage';
import { WhatsAroundMePage } from './pages/WhatsAroundMePage';
import { CommunityPage } from './pages/CommunityPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { AlliedGuideDetailsPage } from './pages/AlliedGuideDetailsPage';
import MarketLinkagePage from './pages/MarketLinkagePage';
import { BazaarPage } from './pages/BazaarPage';
import { WeatherPage } from './pages/WeatherPage';
import { HelpPage } from './pages/HelpPage';
import { AlliedBazarPage } from './pages/AlliedBazarPage';
import { AIChatPage } from './pages/AIChatPage';
import { SignInPage } from './pages/SignInPage';
import { OnboardingPage } from './pages/OnboardingPage';

function AppRouter() {
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lang = localStorage.getItem('language');
    if (!lang) {
      localStorage.setItem('language', 'mr');
      setShowLanguageSelection(false);
    } else {
      setShowLanguageSelection(false);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (showLanguageSelection) {
    return <LanguageSelectionPage />;
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/signin"     element={<SignInPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Main app — all accessible without login (guest mode) */}
      <Route path="/"                              element={<HomePage />} />
      <Route path="/ai"                            element={<AIChatPage />} />
      <Route path="/around"                        element={<WhatsAroundMePage />} />
      <Route path="/around/allied-bazar"           element={<AlliedBazarPage />} />
      <Route path="/community"                     element={<CommunityPage />} />
      <Route path="/community/event/:eventId"      element={<EventDetailsPage />} />
      <Route path="/community/guide/:guideId"      element={<AlliedGuideDetailsPage />} />
      <Route path="/market"                        element={<MarketLinkagePage />} />
      <Route path="/bazaar"                        element={<BazaarPage />} />
      <Route path="/weather"                       element={<WeatherPage />} />
      <Route path="/help"                          element={<HelpPage />} />
      <Route path="*"                              element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRouter />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
