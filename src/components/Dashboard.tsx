import React from 'react';
import { Camera, Activity, ShieldAlert, ChevronRight, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { AnalysisResult } from '../types';
import { useTranslation } from '../i18n';

interface DashboardProps {
  onNavigate: (page: string) => void;
  recentScans: AnalysisResult[];
  isOffline?: boolean;
}

export function Dashboard({ onNavigate, recentScans, isOffline = false }: DashboardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-24"
    >
      <header className="pt-10 pb-8 px-6 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 text-white rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        
        <button
          onClick={() => onNavigate('settings')}
          className="absolute top-8 right-6 text-emerald-50 hover:text-white transition-colors z-20 bg-white/10 p-2 rounded-full backdrop-blur-sm cursor-pointer"
        >
          <Settings size={22} />
        </button>
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-bold tracking-tight">{t('app.title')}</h1>
          <p className="text-emerald-100 mt-1.5 text-sm font-medium opacity-90">{t('app.subtitle')}</p>
        </div>
      </header>

      <div className="px-6 mt-8">
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-50/50 p-6 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mb-5 text-emerald-600 shadow-inner rotate-3 group-hover:rotate-6 transition-transform relative z-10">
            <Camera size={32} />
          </div>
          <h2 className="text-xl font-display font-semibold text-gray-900 mb-2 relative z-10">{t('dashboard.newScan')}</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-[250px] relative z-10">
            {t('dashboard.newScanDesc')}
          </p>
          <button
            onClick={() => {
              if (!isOffline) onNavigate('scan');
            }}
            disabled={isOffline}
            className={`w-full py-3.5 rounded-2xl font-medium transition-all shadow-md relative z-10 ${
              isOffline 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-900 hover:bg-black text-white hover:shadow-xl hover:-translate-y-0.5 cursor-pointer'
            }`}
          >
            {isOffline ? t('dashboard.offlineMode') : t('dashboard.startScan')}
          </button>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-display font-semibold text-gray-900">{t('dashboard.recentScans')}</h3>
            {recentScans.length > 0 && (
              <button
                onClick={() => onNavigate('history')}
                className="text-emerald-600 text-sm font-semibold flex items-center hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-full"
              >
                {t('dashboard.seeAll')} <ChevronRight size={16} className="ml-0.5" />
              </button>
            )}
          </div>

          {recentScans.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm border-dashed">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="text-gray-400" size={20} />
              </div>
              <p className="text-gray-500 text-sm font-medium">{t('dashboard.noScans')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentScans.slice(0, 3).map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => onNavigate('history')}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all group"
                >
                  <img
                    src={scan.imageUrl}
                    alt="Scan"
                    className="w-14 h-14 rounded-xl object-cover bg-gray-100 shrink-0"
                  />
                  <div className="ml-4 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {new Date(scan.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {scan.conditions.join(', ')}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0">
                    <span
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                        scan.riskLevel === 'Low'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : scan.riskLevel === 'Medium'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}
                    >
                      {t(`result.risk.${scan.riskLevel}` as any)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 mb-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl p-5 border border-blue-100/50 flex items-start shadow-sm">
          <div className="bg-white p-2 rounded-full shadow-sm mr-4 shrink-0">
            <ShieldAlert className="text-blue-500" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1.5">{t('dashboard.medicalDisclaimer')}</h4>
            <p className="text-xs text-blue-800/80 leading-relaxed font-medium">
              {t('dashboard.medicalDisclaimerDesc')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
