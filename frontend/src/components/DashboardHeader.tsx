import { Globe } from 'lucide-react';

export function DashboardHeader() {

  const handleLanguageSelection = () => {
    // Clear the language from localStorage to show language selection page
    localStorage.removeItem('language');
    // Reload to trigger language selection
    window.location.reload();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="px-4 py-4 flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2.5">
          <img 
            src="/logo.png" 
            alt="KrishiMitra" 
            className="w-9 h-9 object-contain"
          />
          <span className="text-[20px] font-bold text-[#0b5e2c] tracking-tight">
            KrishiMitra
          </span>
        </div>
        
        {/* Language Selection Button */}
        <button
          onClick={handleLanguageSelection}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg 
                    bg-[#0b5e2c] text-white text-[13px] font-semibold
                    hover:bg-[#094d24] active:scale-95 transition-all"
          style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
        >
          <Globe size={17} strokeWidth={2.5} />
          <span>मराठी</span>
        </button>
      </div>
    </header>
  );
}
