import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, Camera, Activity, Linkedin, WifiOff } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { History } from './components/History';
import { ResultCard } from './components/ResultCard';
import { SettingsPage } from './components/SettingsPage';
import { useHistory, useSettings } from './store';
import { AnalysisResult } from './types';
import { motion } from 'motion/react';
import { useTranslation } from './i18n';

export default function App() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState('home');
  const { history, addResult, deleteResult } = useHistory();
  const { skinType, saveSkinType } = useSettings();
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
    setSelectedResult(null);
  }, []);

  const handleSaveResult = useCallback((result: AnalysisResult) => {
    addResult(result);
    // Stay on scanner page to show result
  }, [addResult]);

  const scannerComponent = useMemo(() => (
    <Scanner userSkinType={skinType} onSaveResult={handleSaveResult} onBack={() => handleNavigate('home')} />
  ), [skinType, handleSaveResult, handleNavigate]);

  const renderPage = () => {
    if (selectedResult) {
      return (
        <motion.div
          key="result-detail"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="pb-24 px-6 pt-8"
        >
          <button
            onClick={() => setSelectedResult(null)}
            className="mb-6 text-emerald-600 font-medium flex items-center"
          >
            &larr; {t('app.backToHistory')}
          </button>
          <ResultCard result={selectedResult} />
        </motion.div>
      );
    }

    switch (currentPage) {
      case 'home':
        return <Dashboard onNavigate={handleNavigate} recentScans={history} isOffline={isOffline} />;
      case 'scan':
        return scannerComponent;
      case 'history':
        return (
          <History
            history={history}
            onDelete={deleteResult}
            onViewResult={setSelectedResult}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            skinType={skinType}
            onSaveSkinType={saveSkinType}
            onBack={() => handleNavigate('home')}
          />
        );
      default:
        return <Dashboard onNavigate={handleNavigate} recentScans={history} isOffline={isOffline} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex justify-center">
      <div className="w-full max-w-md bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        {isOffline && (
          <div className="bg-amber-500 text-white text-xs font-medium py-1.5 px-4 flex items-center justify-center z-50">
            <WifiOff size={14} className="mr-2" />
            {t('app.offlineMessage')}
          </div>
        )}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {renderPage()}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-emerald-900/5 rounded-3xl px-6 py-3 flex justify-between items-center pb-safe z-50">
          <NavItem
            icon={<Home size={24} />}
            label={t('app.nav.home')}
            isActive={currentPage === 'home' && !selectedResult}
            onClick={() => handleNavigate('home')}
          />
          <div className="relative -top-8">
            <button
              onClick={() => {
                if (!isOffline) handleNavigate('scan');
              }}
              disabled={isOffline}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all border-4 border-gray-50 ${
                isOffline 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-xl shadow-emerald-500/30 hover:scale-105 hover:shadow-emerald-500/40 active:scale-95'
              }`}
            >
              <Camera size={28} />
            </button>
          </div>
          <NavItem
            icon={<Activity size={24} />}
            label={t('app.nav.history')}
            isActive={currentPage === 'history' || !!selectedResult}
            onClick={() => handleNavigate('history')}
          />
        </nav>

        {/* Global Footer */}
        <div className="absolute bottom-2 w-full text-center z-40 pb-safe">
          <p className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1">
            {t('app.developedBy')}{' '}
            <a 
              href="https://www.linkedin.com/in/eleandro-mangrich" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors font-semibold flex items-center gap-1"
            >
              Eleandro Mangrich
              <Linkedin size={10} />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors ${
        isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
