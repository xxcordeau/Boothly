import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PhotoBoothProvider, usePhotoBoothContext } from './contexts/PhotoBoothContext';
import { AdminPage } from './components/AdminPage';
import { DownloadPage } from './components/DownloadPage';
import { LanguageSelector } from './components/LanguageSelector';
import { SelectionTimer } from './components/SelectionTimer';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Settings, Home, ArrowLeft } from 'lucide-react';
import { initializeDefaultThemes } from './utils/defaultThemes';
import { LanguageContext } from './hooks/useTranslation';
import { Language, translations } from './locales';
import { useIsMobile } from './components/ui/use-mobile';

// Import route components
import { ModeRoute } from './components/routes/ModeRoute';
import { TemplateRoute } from './components/routes/TemplateRoute';
import { ThemeRoute } from './components/routes/ThemeRoute';
import { PrintCountRoute } from './components/routes/PrintCountRoute';
import { PaymentRoute } from './components/routes/PaymentRoute';
import { CameraRoute } from './components/routes/CameraRoute';
import { SelectRoute } from './components/routes/SelectRoute';
import { ResultRoute } from './components/routes/ResultRoute';

// Admin routes
import { StatisticsPage } from './components/admin/StatisticsPage';
import { TemplateManagementPage } from './components/admin/TemplateManagementPage';
import { FrameManagementPage } from './components/admin/FrameManagementPage';
import { NayaxSettingsPage } from './components/admin/NayaxSettingsPage';
import { LogsPage } from './components/admin/LogsPage';

function BackButton({ language }: { language: Language }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show back button on home page or admin root
  if (location.pathname === '/' || location.pathname === '/admin') {
    return null;
  }
  
  // Don't show on download page
  if (location.pathname.startsWith('/download')) {
    return null;
  }
  
  return (
    <Button
      onClick={() => navigate(-1)}
      variant="outline"
      className="gap-2 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 shadow-sm transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden sm:inline">{translations[language].common.back}</span>
    </Button>
  );
}

function Header({ language }: { language: Language }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { selectionTimeRemaining } = usePhotoBoothContext();
  
  const isAdminPage = location.pathname.startsWith('/admin');
  const isDownloadPage = location.pathname.startsWith('/download');
  const isSelectPage = location.pathname === '/select';
  
  if (isDownloadPage || isAdminPage) {
    return null;
  }
  
  return (
    <div className="sticky top-0 left-0 right-0 z-50 py-2 px-3 md:px-4 bg-[#F3F3F3] border-b border-stone-200">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left: Back Button */}
        <div className="flex-1">
          <BackButton language={language} />
        </div>
        
        {/* Center: Timer (only on select page) */}
        <div className="flex-1 flex justify-center">
          {isSelectPage && selectionTimeRemaining !== null && (
            <SelectionTimer timeRemaining={selectionTimeRemaining} />
          )}
        </div>
        
        {/* Right: Language and Admin Toggle */}
        <div className="flex gap-1 md:gap-2 flex-1 justify-end">
          <LanguageSelector />
          <Button
            onClick={() => {
              if (isAdminPage) {
                navigate('/');
              } else {
                navigate('/admin');
              }
            }}
            variant={isAdminPage ? 'default' : 'outline'}
            size={isMobile ? 'sm' : 'default'}
            className={`gap-1 md:gap-2 border shadow-sm transition-colors ${
              isAdminPage
                ? 'bg-stone-800 border-stone-800 text-white hover:bg-stone-900'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            {isAdminPage ? (
              <>
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">{translations[language].admin.backToMain}</span>
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{translations[language].admin.title}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [language, setLanguage] = useState<Language>('ko');
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Initialize default special themes on app start (async)
    initializeDefaultThemes().catch(err => {
      console.error('Failed to initialize default themes:', err);
    });
    
    // Load template settings from Supabase
    import('./utils/templateSettings').then(({ getTemplateSettings }) => {
      getTemplateSettings(); // This will load from Supabase in the background
    });
    
    // Load frames from Supabase
    import('./utils/frameStorage').then(({ getFrames }) => {
      getFrames(); // This will load from Supabase in the background
    });
    
    // Log Supabase sync info
    import('./utils/supabaseSync').then(({ logSupabaseSyncInfo }) => {
      setTimeout(() => logSupabaseSyncInfo(), 1000);
    }).catch(() => {
      // Silently ignore if sync check fails
    });
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('photobooth_language') as Language;
    if (savedLanguage && ['ko', 'en', 'zh', 'fr', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('photobooth_language', lang);
  };

  const languageContextValue = {
    language,
    setLanguage: handleLanguageChange,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={languageContextValue}>
      <PhotoBoothProvider>
        <div className="relative min-h-screen">
          {/* Header - Fixed Position */}
          <Header language={language} />

          {/* Main Content */}
          <Routes>
            {/* PhotoBooth Routes */}
            <Route path="/" element={<ModeRoute />} />
            <Route path="/template" element={<TemplateRoute />} />
            <Route path="/theme" element={<ThemeRoute />} />
            <Route path="/print-count" element={<PrintCountRoute />} />
            <Route path="/payment" element={<PaymentRoute />} />
            <Route path="/camera" element={<CameraRoute />} />
            <Route path="/select" element={<SelectRoute />} />
            <Route path="/result" element={<ResultRoute />} />
            
            {/* Admin Routes - All under AdminPage layout */}
            <Route path="/admin" element={<AdminPage onExit={() => navigate('/')} />} />
            <Route path="/admin/statistics" element={<AdminPage onExit={() => navigate('/')} />} />
            <Route path="/admin/templates" element={<AdminPage onExit={() => navigate('/')} />} />
            <Route path="/admin/frames" element={<AdminPage onExit={() => navigate('/')} />} />
            <Route path="/admin/nayax" element={<AdminPage onExit={() => navigate('/')} />} />
            <Route path="/admin/logs" element={<AdminPage onExit={() => navigate('/')} />} />
            
            {/* Download Route */}
            <Route 
              path="/download/:imageId" 
              element={
                <DownloadPageWrapper onBackToHome={() => navigate('/')} />
              } 
            />
            
            {/* Catch-all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        <Toaster position="top-center" />
      </PhotoBoothProvider>
    </LanguageContext.Provider>
  );
}

function DownloadPageWrapper({ onBackToHome }: { onBackToHome: () => void }) {
  const location = useLocation();
  const imageId = location.pathname.split('/download/')[1] || '';
  
  return <DownloadPage imageId={imageId} onBackToHome={onBackToHome} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
