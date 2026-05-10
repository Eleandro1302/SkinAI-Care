import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle, Lightbulb, Sun, Maximize, ZapOff } from 'lucide-react';
import { motion } from 'motion/react';
import { analyzeSkinImage } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { ResultCard } from './ResultCard';
import { useTranslation } from '../i18n';

interface ScannerProps {
  userSkinType: string;
  onSaveResult: (result: AnalysisResult) => void;
  onBack: () => void;
}

export function Scanner({ userSkinType, onSaveResult, onBack }: ScannerProps) {
  const { t, lang } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setImage(resizedBase64);
          setError(null);
          setResult(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    if (!navigator.onLine) {
      setError(t('scanner.offlineError'));
      return;
    }
    setIsAnalyzing(true);
    setError(null);

    try {
      // Extract base64 data and mime type
      const [header, base64Data] = image.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      let timeoutId: any;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(t('scanner.timeoutError'))), 90000);
      });

      const analysisPromise = analyzeSkinImage(base64Data, mimeType, userSkinType, lang);
      const analysisData = await Promise.race([analysisPromise, timeoutPromise]) as any;
      
      clearTimeout(timeoutId);

      const newResult: AnalysisResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        imageUrl: image,
        ...analysisData,
      };

      setResult(newResult);
      onSaveResult(newResult);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || t('scanner.generalError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 px-6 pt-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-semibold text-gray-900">{t('scanner.title')}</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      {!image ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <Camera size={40} />
          </div>
          <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">{t('scanner.scanOrUpload')}</h3>
          <p className="text-gray-500 text-sm mb-6">
            {t('scanner.scanDesc')}
          </p>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 mb-8 text-left">
            <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center">
              <Lightbulb size={16} className="mr-2" />
              {t('scanner.tipsTitle')}
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start text-sm text-emerald-700">
                <Sun size={14} className="mr-2 mt-0.5 shrink-0" />
                <span>{t('scanner.tip1')}</span>
              </li>
              <li className="flex items-start text-sm text-emerald-700">
                <Maximize size={14} className="mr-2 mt-0.5 shrink-0" />
                <span>{t('scanner.tip2')}</span>
              </li>
              <li className="flex items-start text-sm text-emerald-700">
                <ZapOff size={14} className="mr-2 mt-0.5 shrink-0" />
                <span>{t('scanner.tip3')}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center shadow-sm"
            >
              <Camera className="mr-2" size={20} />
              {t('scanner.takePhoto')}
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center"
            >
              <Upload className="mr-2" size={20} />
              {t('scanner.uploadPhoto')}
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={cameraInputRef}
            onChange={handleFileChange}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={galleryInputRef}
            onChange={handleFileChange}
          />
        </div>
      ) : !result ? (
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-black">
            <img src={image} alt="Selected" className={`w-full h-auto max-h-[60vh] object-contain transition-opacity duration-300 ${isAnalyzing ? 'opacity-60' : 'opacity-100'}`} />
            
            {isAnalyzing && (
              <>
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_20px_4px_rgba(52,211,113,0.8)] z-10"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md flex items-center text-sm font-medium">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    {t('scanner.analyzing')}
                  </div>
                </div>
              </>
            )}

            {!isAnalyzing && (
              <button
                onClick={() => setImage(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors z-30"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start text-sm border border-red-100">
              <AlertCircle className="shrink-0 mr-2 mt-0.5" size={16} />
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-4 rounded-xl font-medium transition-colors flex items-center justify-center shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                {t('scanner.analyzing')}
              </>
            ) : (
              t('scanner.analyze')
            )}
          </button>
        </div>
      ) : (
        <ResultCard result={result} onClose={() => setResult(null)} />
      )}
    </motion.div>
  );
}
