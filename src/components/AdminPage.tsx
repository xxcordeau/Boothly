import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Frame, BarChart3, FileText, LayoutGrid, CreditCard, Database, Menu, ChevronRight } from 'lucide-react';
import { FrameManagementPage } from './admin/FrameManagementPage';
import { StatisticsPage } from './admin/StatisticsPage';
import { LogsPage } from './admin/LogsPage';
import { TemplateManagementPage } from './admin/TemplateManagementPage';
import { NayaxSettingsPage } from './admin/NayaxSettingsPage';
import { useTranslation } from '../hooks/useTranslation';
import { checkSupabaseSyncStatus } from '../utils/supabaseSync';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';

interface AdminPageProps {
  onExit: () => void;
}

type AdminPageType = 'templates' | 'frames' | 'statistics' | 'logs' | 'nayax';

export const AdminPage = ({ onExit }: AdminPageProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [syncStatus, setSyncStatus] = useState({ allSynced: false, templateSettings: false, frames: false });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getCurrentPage = (): AdminPageType => {
    const path = location.pathname;
    if (path.includes('/statistics')) return 'statistics';
    if (path.includes('/frames')) return 'frames';
    if (path.includes('/nayax')) return 'nayax';
    if (path.includes('/logs')) return 'logs';
    return 'templates';
  };

  const currentPage = getCurrentPage();

  useEffect(() => {
    checkSupabaseSyncStatus().then(setSyncStatus);
  }, [currentPage]);

  const menuItems = [
    { id: 'templates' as AdminPageType, label: t.admin.templates, icon: LayoutGrid },
    { id: 'frames' as AdminPageType, label: t.admin.frames, icon: Frame },
    { id: 'nayax' as AdminPageType, label: 'Nayax', icon: CreditCard },
    { id: 'statistics' as AdminPageType, label: t.admin.overview, icon: BarChart3 },
    { id: 'logs' as AdminPageType, label: t.admin.logs, icon: FileText },
  ];

  const handleNavigate = (itemId: AdminPageType) => {
    if (itemId === 'templates') {
      navigate('/admin');
    } else {
      navigate(`/admin/${itemId}`);
    }
    setMobileMenuOpen(false);
  };

  const SidebarNavigation = () => (
    <>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-stone-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-stone-900 text-sm font-bold leading-tight">{t.admin.title}</h2>
            <p className="text-stone-400 text-xs font-medium">{t.admin.subtitle}</p>
          </div>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-xl">
          <Database className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <span className="text-stone-500 text-xs font-medium">Supabase</span>
          <div className={`flex items-center gap-1 ml-auto ${syncStatus.allSynced ? 'text-emerald-600' : 'text-amber-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${syncStatus.allSynced ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`} />
            <span className="text-xs font-semibold">{syncStatus.allSynced ? '동기화됨' : '로딩중'}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">메뉴</p>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Exit Button */}
      <div className="p-4 border-t border-stone-100 flex-shrink-0">
        <button
          onClick={onExit}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          {t.admin.backToMain}
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-[#F3F3F3] flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-60 bg-white border-r border-stone-200 flex-col flex-shrink-0">
        <SidebarNavigation />
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col bg-white">
          <SheetHeader className="sr-only">
            <SheetTitle>{t.admin.title}</SheetTitle>
            <SheetDescription>{t.admin.subtitle}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            <SidebarNavigation />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center">
              <LayoutGrid className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-stone-900 text-sm font-bold">{t.admin.title}</h1>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {currentPage === 'templates' && <TemplateManagementPage />}
            {currentPage === 'frames' && <FrameManagementPage />}
            {currentPage === 'nayax' && <NayaxSettingsPage />}
            {currentPage === 'statistics' && <StatisticsPage />}
            {currentPage === 'logs' && <LogsPage />}
          </div>
        </div>
      </div>
    </div>
  );
};
