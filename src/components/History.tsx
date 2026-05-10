import React from 'react';
import { Activity, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AnalysisResult } from '../types';
import { useTranslation } from '../i18n';

interface HistoryProps {
  history: AnalysisResult[];
  onDelete: (id: string) => void;
  onViewResult: (result: AnalysisResult) => void;
}

export function History({ history, onDelete, onViewResult }: HistoryProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 px-6 pt-8"
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('history.title')}</h2>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Activity size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('history.noHistory')}</h3>
          <p className="text-gray-500 text-sm">
            {t('history.noHistoryDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((scan) => (
            <div
              key={scan.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 flex items-center">
                <img
                  src={scan.imageUrl}
                  alt="Scan"
                  className="w-16 h-16 rounded-xl object-cover bg-gray-100 cursor-pointer shrink-0"
                  onClick={() => onViewResult(scan)}
                />
                <div
                  className="ml-4 flex-1 cursor-pointer min-w-0"
                  onClick={() => onViewResult(scan)}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {new Date(scan.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {scan.conditions.join(', ')}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        scan.riskLevel === 'Low'
                          ? 'bg-green-100 text-green-700'
                          : scan.riskLevel === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {t('history.risk')}: {scan.riskLevel === 'Low' ? t('result.risk.Low') : scan.riskLevel === 'Medium' ? t('result.risk.Medium') : t('result.risk.High')}
                    </span>
                  </div>
                </div>
                <div className="ml-2 flex flex-col items-end space-y-2">
                  <button
                    onClick={() => onViewResult(scan)}
                    className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(scan.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
