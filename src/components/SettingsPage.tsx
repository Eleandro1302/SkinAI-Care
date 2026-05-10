import React from 'react';
import { motion } from 'motion/react';
import { User, Check, ChevronLeft } from 'lucide-react';
import { useTranslation } from '../i18n';

interface SettingsPageProps {
  skinType: string;
  onSaveSkinType: (type: string) => void;
  onBack: () => void;
}

export function SettingsPage({ skinType, onSaveSkinType, onBack }: SettingsPageProps) {
  const { t } = useTranslation();
  const skinTypes = ['Unknown', 'Oily', 'Dry', 'Combination', 'Sensitive'];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 px-6 pt-8"
    >
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 text-gray-500 hover:text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-semibold text-gray-900">{t('settings.title')}</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-3">
            <User size={20} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{t('settings.mySkinType')}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {t('settings.skinTypeDesc')}
        </p>

        <div className="space-y-3">
          {skinTypes.map((type) => {
            const translatedType = type === 'Unknown' ? t('settings.skinType.Unknown') : 
                                   type === 'Oily' ? t('settings.skinType.Oily') : 
                                   type === 'Dry' ? t('settings.skinType.Dry') : 
                                   type === 'Combination' ? t('settings.skinType.Combination') : 
                                   type === 'Sensitive' ? t('settings.skinType.Sensitive') : type;
            return (
            <button
              key={type}
              onClick={() => onSaveSkinType(type)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                skinType === type
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 hover:border-emerald-200 text-gray-700'
              }`}
            >
              <span className="font-medium">{translatedType}</span>
              {skinType === type && <Check size={20} className="text-emerald-600" />}
            </button>
          )})}
        </div>
      </div>
    </motion.div>
  );
}
