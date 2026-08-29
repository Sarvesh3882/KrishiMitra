import { useState, useEffect } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { schemeApi, type Scheme } from '../services/schemeApi';
import { Tractor, Droplets, Sun, Home, Sprout, Phone, ChevronRight, CheckCircle, FileText, Users, AlertCircle } from 'lucide-react';

interface SubsidyCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categorySchemes, setCategorySchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(false);

  const subsidyCategories: SubsidyCategory[] = [
    {
      id: 'equipment',
      icon: 'Tractor',
      title: 'कृषि उपकरण',
      description: 'ट्रैक्टर, यंत्र और उपकरणों पर सब्सिडी',
    },
    {
      id: 'irrigation',
      icon: 'Droplets',
      title: 'ड्रिप सिंचाई',
      description: 'ड्रिप और स्प्रिंकलर सिंचाई पर सहायता',
    },
    {
      id: 'solar',
      icon: 'Sun',
      title: 'सोलर कृषि',
      description: 'सोलर पंप और सोलर उपकरण',
    },
    {
      id: 'polyhouse',
      icon: 'Home',
      title: 'पॉलीहाउस',
      description: 'संरक्षित खेती के लिए सब्सिडी',
    },
    {
      id: 'allied',
      icon: 'Sprout',
      title: 'सहायक खेती',
      description: 'मधुमक्खी, मशरूम, बकरी, मुर्गी पालन',
    },
    {
      id: 'modern',
      icon: 'Sprout',
      title: 'आधुनिक खेती',
      description: 'नई तकनीक और आधुनिक कृषि',
    },
  ];

  const getIconComponent = (iconName: string) => {
    const iconProps = { size: 28, strokeWidth: 2 };
    switch (iconName) {
      case 'Tractor': return <Tractor {...iconProps} />;
      case 'Droplets': return <Droplets {...iconProps} />;
      case 'Sun': return <Sun {...iconProps} />;
      case 'Home': return <Home {...iconProps} />;
      case 'Sprout': return <Sprout {...iconProps} />;
      default: return <Sprout {...iconProps} />;
    }
  };

  // Fetch schemes when category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetchCategorySchemes(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategorySchemes = async (category: string) => {
    setLoading(true);
    try {
      const schemes = await schemeApi.getSchemesByCategory(category);
      setCategorySchemes(schemes);
    } catch (error) {
      console.error('Error fetching schemes:', error);
      setCategorySchemes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSchemeClick = (scheme: Scheme) => {
    setSelectedScheme(scheme);
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setCategorySchemes([]);
    setSelectedScheme(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Mobile App Container */}
      <div className="w-full max-w-[430px] mx-auto bg-[#f8f9fa] min-h-screen flex flex-col">
        
        <DashboardHeader />

        <main className="flex-1 pb-24">
          
          {/* Page Title Section */}
          <div className="px-4 pt-5 pb-4">
            <h1 className="text-[27px] font-bold text-gray-900 leading-[1.25] mb-1.5"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              मदद
            </h1>
            <p className="text-[14px] text-gray-600 leading-[1.4]"
               style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              सरकारी सहायता, सब्सिडी और योजनाओं की जानकारी
            </p>
          </div>

          {/* Subsidy Schemes Section */}
          <div className="px-4 mb-5">
            <h2 className="text-[20px] font-bold text-gray-900 leading-[1.3] mb-4"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              सब्सिडी योजनाएं
            </h2>

            {/* Subsidy Categories Grid - 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              {subsidyCategories.slice(0, 4).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="bg-white rounded-xl border border-gray-200 p-4
                           hover:border-[#0b5e2c] hover:shadow-sm transition-all
                           active:scale-[0.98] flex flex-col items-start h-full"
                >
                  {/* Icon Container */}
                  <div className="w-12 h-12 bg-[#0b5e2c]/10 rounded-xl flex items-center justify-center mb-3 text-[#0b5e2c]">
                    {getIconComponent(category.icon)}
                  </div>
                  
                  {/* Text Content */}
                  <h3 className="text-[16px] font-bold text-gray-900 leading-[1.3] mb-1"
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {category.title}
                  </h3>
                  <p className="text-[12px] text-gray-600 leading-[1.4]"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {category.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Assistance Promotional Card */}
          <div className="px-4 mb-5">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tractor size={24} strokeWidth={2} className="text-green-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-[17px] font-bold text-green-900 leading-[1.3] mb-1"
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    कृषि उपकरण चाहिए?
                  </h2>
                  <p className="text-[13px] text-green-800 leading-[1.4]"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    ट्रैक्टर, हार्वेस्टर और अन्य उपकरणों पर सरकारी सहायता पाएं
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory('equipment')}
                className="w-full bg-[#0b5e2c] text-white py-3 rounded-lg font-semibold text-[14px]
                         hover:bg-[#0d7436] transition-colors active:scale-[0.98] 
                         flex items-center justify-center gap-2"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
              >
                <span>सब्सिडी की जानकारी देखें</span>
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Modern Farming Section */}
          <div className="px-4 mb-5">
            <h2 className="text-[20px] font-bold text-gray-900 leading-[1.3] mb-4"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              आधुनिक खेती
            </h2>
            <button
              onClick={() => setSelectedCategory('modern')}
              className="w-full bg-white rounded-xl border border-gray-200 p-4
                       hover:border-[#0b5e2c] hover:shadow-sm transition-all
                       active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sprout size={24} strokeWidth={2} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-gray-900 leading-[1.3] mb-1"
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    आधुनिक कृषि तकनीक पर सहायता
                  </h3>
                  <p className="text-[13px] text-gray-600 leading-[1.4]"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    नई तकनीक अपनाने के लिए सरकारी सहायता
                  </p>
                </div>
                <ChevronRight size={20} strokeWidth={2.5} className="text-[#0b5e2c] flex-shrink-0" />
              </div>
            </button>
          </div>

          {/* Allied Farming Support Section */}
          <div className="px-4 mb-5">
            <h2 className="text-[20px] font-bold text-gray-900 leading-[1.3] mb-4"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              सहायक कृषि सहायता
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedCategory('allied')}
                className="w-full bg-white rounded-xl border border-gray-200 p-4
                         hover:border-[#0b5e2c] hover:shadow-sm transition-all
                         active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sprout size={22} strokeWidth={2} className="text-yellow-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-gray-900 leading-[1.3] mb-0.5"
                        style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      मधुमक्खी पालन सहायता
                    </h3>
                    <p className="text-[12px] text-gray-600 leading-[1.4]"
                       style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      बॉक्स, उपकरण और प्रशिक्षण पर सब्सिडी
                    </p>
                  </div>
                  <ChevronRight size={20} strokeWidth={2} className="text-[#0b5e2c] flex-shrink-0" />
                </div>
              </button>

              <button
                onClick={() => setSelectedCategory('allied')}
                className="w-full bg-white rounded-xl border border-gray-200 p-4
                         hover:border-[#0b5e2c] hover:shadow-sm transition-all
                         active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sprout size={22} strokeWidth={2} className="text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-gray-900 leading-[1.3] mb-0.5"
                        style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      मशरूम खेती सहायता
                    </h3>
                    <p className="text-[12px] text-gray-600 leading-[1.4]"
                       style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      यूनिट स्थापना और प्रशिक्षण पर सहायता
                    </p>
                  </div>
                  <ChevronRight size={20} strokeWidth={2} className="text-[#0b5e2c] flex-shrink-0" />
                </div>
              </button>

              <button
                onClick={() => setSelectedCategory('allied')}
                className="w-full bg-white rounded-xl border border-gray-200 p-4
                         hover:border-[#0b5e2c] hover:shadow-sm transition-all
                         active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sprout size={22} strokeWidth={2} className="text-orange-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-gray-900 leading-[1.3] mb-0.5"
                        style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      बकरी / मुर्गी पालन
                    </h3>
                    <p className="text-[12px] text-gray-600 leading-[1.4]"
                       style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      पशु, शेड और आहार पर सरकारी सहायता
                    </p>
                  </div>
                  <ChevronRight size={20} strokeWidth={2} className="text-[#0b5e2c] flex-shrink-0" />
                </div>
              </button>
            </div>
          </div>

          {/* Government Schemes Section */}
          <div className="px-4 mb-5">
            <h2 className="text-[20px] font-bold text-gray-900 leading-[1.3] mb-4"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              सरकारी योजनाएं
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-[13px] text-gray-600 leading-[1.4] mb-4"
                 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                महाराष्ट्र और केंद्र सरकार की किसान योजनाएं
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-[13px] text-gray-700 leading-[1.4]"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  <CheckCircle size={18} strokeWidth={2} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>पीएम-किसान सम्मान निधि</span>
                </div>
                <div className="flex items-start gap-2.5 text-[13px] text-gray-700 leading-[1.4]"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  <CheckCircle size={18} strokeWidth={2} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>फसल बीमा योजना</span>
                </div>
                <div className="flex items-start gap-2.5 text-[13px] text-gray-700 leading-[1.4]"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  <CheckCircle size={18} strokeWidth={2} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>मृदा स्वास्थ्य कार्ड योजना</span>
                </div>
                <div className="flex items-start gap-2.5 text-[13px] text-gray-700 leading-[1.4]"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  <CheckCircle size={18} strokeWidth={2} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>महा DBT किसान योजना</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory('direct_benefit')}
                className="mt-4 w-full bg-[#0b5e2c] text-white py-3 rounded-lg font-semibold text-[14px]
                         hover:bg-[#0d7436] transition-colors active:scale-[0.98] 
                         flex items-center justify-center gap-2"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
              >
                <span>सभी योजनाएं देखें</span>
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Human Help Section */}
          <div className="px-4 mb-5">
            <h2 className="text-[20px] font-bold text-gray-900 leading-[1.3] mb-4"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              किसान से बात करें
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone size={24} strokeWidth={2} className="text-blue-700" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-blue-900 leading-[1.3] mb-0.5"
                      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    किसान कॉल सेंटर
                  </h3>
                  <p className="text-[12px] text-blue-800 leading-[1.4]"
                     style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    कृषि संबंधी सहायता • मुफ्त सेवा
                  </p>
                </div>
              </div>
              <a
                href="tel:1800-180-1551"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-lg 
                         text-[15px] font-semibold hover:bg-blue-700 transition-colors
                         active:scale-[0.98] no-underline"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
              >
                <Phone size={20} strokeWidth={2} />
                <span>1800-180-1551 पर कॉल करें</span>
              </a>
            </div>
          </div>

          {/* Info Note */}
          <div className="px-4 mb-5">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} strokeWidth={2} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-orange-900 leading-[1.5]"
                   style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  <strong>ध्यान दें:</strong> योजनाओं की जानकारी सरकारी स्रोतों से प्राप्त की गई है। 
                  आवेदन से पहले आधिकारिक वेबसाइट से जानकारी की पुष्टि करें।
                </p>
              </div>
            </div>
          </div>
        </main>

      </div>

      {/* Category Schemes Modal */}
      {selectedCategory && !selectedScheme && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={closeModal}
        >
          <div
            className="bg-white w-full max-w-[420px] rounded-t-2xl min-h-[80vh] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-[18px] font-bold text-[#0b5e2c]">
                {subsidyCategories.find(c => c.id === selectedCategory)?.title}
              </h2>
              <button
                onClick={closeModal}
                className="text-[32px] text-gray-400 hover:text-gray-600 leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {loading && (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-2"></div>
                  <p className="text-[13px] text-gray-600">योजनाएं लोड हो रही हैं...</p>
                </div>
              )}

              {!loading && categorySchemes.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-4">
                    <AlertCircle size={20} strokeWidth={2} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-yellow-900 leading-relaxed">
                      <strong>जानकारी:</strong> इस श्रेणी के लिए योजना जानकारी जल्द ही उपलब्ध होगी।
                      अधिक जानकारी के लिए किसान कॉल सेंटर से संपर्क करें।
                    </p>
                  </div>
                  <a
                    href="tel:1800-180-1551"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#0b5e2c] text-white rounded-lg 
                             text-[14px] font-semibold hover:bg-[#0d7436] transition-colors active:scale-[0.98]"
                  >
                    <Phone size={18} strokeWidth={2} />
                    <span>1800-180-1551 पर कॉल करें</span>
                  </a>
                </div>
              )}

              {!loading && categorySchemes.length > 0 && (
                <div className="space-y-3">
                  {categorySchemes.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => handleSchemeClick(scheme)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left
                               hover:border-[#0b5e2c] hover:shadow-lg transition-all"
                    >
                      <h3 className="text-[15px] font-bold text-gray-900 mb-2">
                        {scheme.name}
                      </h3>
                      <p className="text-[12px] text-gray-600 mb-3">
                        {scheme.description}
                      </p>
                      {scheme.subsidy && (
                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 mb-2">
                          <span className="text-[11px] text-green-900 font-semibold">
                            {scheme.subsidy}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>{scheme.state}</span>
                        <span className="text-[#0b5e2c] font-semibold flex items-center gap-1">
                          <span>विवरण देखें</span>
                          <ChevronRight size={14} strokeWidth={2.5} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={closeModal}
        >
          <div
            className="bg-white w-full max-w-[420px] rounded-t-2xl min-h-[85vh] max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
              <h2 className="text-[16px] font-bold text-[#0b5e2c] leading-tight pr-4">
                {selectedScheme.name}
              </h2>
              <button
                onClick={closeModal}
                className="text-[32px] text-gray-400 hover:text-gray-600 leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Description */}
              <div>
                <p className="text-[13px] text-gray-700">
                  {selectedScheme.description}
                </p>
              </div>

              {/* Benefit */}
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={20} strokeWidth={2} className="text-green-600" />
                  <span>क्या सहायता मिलेगी?</span>
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-[14px] text-green-900 font-semibold leading-relaxed">
                    {selectedScheme.benefit}
                  </p>
                  {selectedScheme.subsidy && (
                    <p className="text-[13px] text-green-800 mt-2">
                      {selectedScheme.subsidy}
                    </p>
                  )}
                </div>
              </div>

              {/* Eligibility */}
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={20} strokeWidth={2} className="text-blue-600" />
                  <span>कौन पात्र है?</span>
                </h3>
                <ul className="space-y-2">
                  {selectedScheme.eligibility.map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-[13px] text-gray-700">
                      <CheckCircle size={18} strokeWidth={2} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Documents */}
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={20} strokeWidth={2} className="text-orange-600" />
                  <span>जरूरी दस्तावेज</span>
                </h3>
                <ul className="space-y-2">
                  {selectedScheme.documents.map((doc, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-[13px] text-gray-700">
                      <FileText size={16} strokeWidth={2} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Application Process */}
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={20} strokeWidth={2} className="text-purple-600" />
                  <span>आवेदन कैसे करें?</span>
                </h3>
                <ol className="space-y-2.5">
                  {selectedScheme.applicationProcess.map((step, index) => (
                    <li key={index} className="flex items-start gap-3 text-[13px] text-gray-700">
                      <span className="w-6 h-6 rounded-full bg-[#0b5e2c] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="flex-1 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Deadline */}
              {selectedScheme.deadline && (
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-2 flex items-center gap-2">
                    📅 अंतिम तारीख
                  </h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-[13px] text-orange-900">
                      {selectedScheme.deadline}
                    </p>
                  </div>
                </div>
              )}

              {/* Source */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-[13px] font-bold text-gray-900 mb-2">
                  🔗 स्रोत:
                </h3>
                <p className="text-[12px] text-gray-600 mb-1">
                  {selectedScheme.source}
                </p>
                <p className="text-[11px] text-gray-500">
                  अंतिम अपडेट: {selectedScheme.lastUpdated}
                </p>
              </div>

              {/* Application Buttons */}
              {selectedScheme.applicationUrl && (
                <div className="pt-4 space-y-3">
                  <a
                    href={selectedScheme.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#0b5e2c] text-white rounded-xl 
                             text-[15px] font-semibold hover:bg-[#0d7436] transition-colors
                             active:scale-[0.98]"
                  >
                    <span>आवेदन करें</span>
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </a>
                  {selectedScheme.statusCheckUrl && (
                    <a
                      href={selectedScheme.statusCheckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-[#0b5e2c] text-[#0b5e2c] rounded-xl 
                               text-[14px] font-semibold hover:bg-green-50 transition-colors
                               active:scale-[0.98]"
                    >
                      <span>आवेदन स्थिति देखें</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
