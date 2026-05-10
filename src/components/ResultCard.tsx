import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, Stethoscope, ChevronRight, Sun, Moon, Calendar, Droplets, MessageSquare, Send, Loader2, Share2 } from 'lucide-react';
import { AnalysisResult, SkincareStep } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { askFollowUpQuestion } from '../services/geminiService';
import { useTranslation } from '../i18n';
import { jsPDF } from 'jspdf';

interface ResultCardProps {
  result: AnalysisResult;
  onClose?: () => void;
}

export function ResultCard({ result, onClose }: ResultCardProps) {
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState<'analysis' | 'routine' | 'chat'>('analysis');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim() || isAsking) return;
    
    const newHistory = [...chatHistory, { role: 'user' as const, text: question }];
    setChatHistory(newHistory);
    setQuestion('');
    setIsAsking(true);

    try {
      const answer = await askFollowUpQuestion(result.imageUrl, result, question, lang);
      setChatHistory([...newHistory, { role: 'ai', text: answer || t('result.chat.empty') }]);
    } catch (err) {
      setChatHistory([...newHistory, { role: 'ai', text: t('result.chat.error') }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleShare = async () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;
      
      const addSectionTitle = (title: string) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFontSize(16);
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.setFont('helvetica', 'bold');
        doc.text(title, 20, yPos);
        yPos += 8;
      };

      const addText = (text: string, isBold: boolean = false) => {
        if (!text) return;
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        // Split text to fit page width
        const lines = doc.splitTextToSize(text, 170);
        
        if (yPos + (lines.length * 7) > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(lines, 20, yPos);
        yPos += (lines.length * 7) + 2;
      };

      // 1. Header
      doc.setFontSize(22);
      doc.setTextColor(17, 24, 39); // gray-900
      doc.setFont('helvetica', 'bold');
      doc.text(t('app.title') + ' - ' + t('result.analysis'), 20, yPos);
      yPos += 15;

      // 2. Add Image if available
      if (result.imageUrl && result.imageUrl.startsWith('data:image')) {
        try {
          const imgProps = doc.getImageProperties(result.imageUrl);
          const pdfWidth = 60;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          doc.addImage(result.imageUrl, 'JPEG', 20, yPos, pdfWidth, pdfHeight);
          yPos += pdfHeight + 10;
        } catch (e) {
          console.error("Error adding image to PDF", e);
        }
      }

      // 3. Risk Level
      addSectionTitle(t('result.risk'));
      const riskText = result.riskLevel === 'Low' ? t('result.risk.Low') : result.riskLevel === 'Medium' ? t('result.risk.Medium') : result.riskLevel === 'High' ? t('result.risk.High') : result.riskLevel;
      addText(riskText, true);
      yPos += 5;

      // 4. Conditions
      if (result.conditions && result.conditions.length > 0) {
        addSectionTitle(t('result.possibleConditions'));
        result.conditions.forEach(cond => {
          addText(`• ${cond}`);
        });
        yPos += 5;
      }

      // 5. ABCDE Analysis
      if (result.analysis) {
        addSectionTitle(t('result.abcdeAnalysis'));
        addText(`A (Assimetria/Asymmetry): ${result.analysis.asymmetry || 'N/A'}`);
        addText(`B (Bordas/Border): ${result.analysis.border || 'N/A'}`);
        addText(`C (Cor/Color): ${result.analysis.color || 'N/A'}`);
        addText(`D (Diâmetro/Diameter): ${result.analysis.size || 'N/A'}`);
        addText(`E (Evolução/Evolution): ${result.analysis.evolution || 'N/A'}`);
        yPos += 5;
      }

      // 6. Routine
      if (result.skincareRoutine) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(22);
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'bold');
        doc.text(t('result.routine'), 20, yPos);
        yPos += 15;

        addSectionTitle(t('result.inferredSkinType'));
        addText(result.skincareRoutine.skinType || 'N/A', true);
        yPos += 5;

        if (result.skincareRoutine.morning?.length) {
          addSectionTitle(t('result.morningRoutine'));
          result.skincareRoutine.morning.forEach(step => {
            addText(`${step.step}: ${step.productType}`, true);
            addText(step.description);
            yPos += 2;
          });
          yPos += 3;
        }

        if (result.skincareRoutine.evening?.length) {
          addSectionTitle(t('result.eveningRoutine'));
          result.skincareRoutine.evening.forEach(step => {
            addText(`${step.step}: ${step.productType}`, true);
            addText(step.description);
            yPos += 2;
          });
          yPos += 3;
        }
        
        if (result.skincareRoutine.weekly?.length) {
          addSectionTitle(t('result.weeklyCare'));
          result.skincareRoutine.weekly.forEach(step => {
            addText(`${step.step}: ${step.productType}`, true);
            addText(step.description);
            yPos += 2;
          });
        }
      }

      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], 'skinai_analysis.pdf', { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'SkinAI Analysis',
          text: lang === 'pt' ? 'Confira minha análise e rotina gerada pelo SkinAI!' : 'Check out my skin analysis result and routine from SkinAI!',
          files: [file]
        });
      } else {
        // Fallback: download directly
        doc.save('skinai_analysis.pdf');
        
        // Still try to share URL if fallback triggers
        if (navigator.share) {
          await navigator.share({
            title: 'SkinAI Analysis',
            text: lang === 'pt' ? 'Confira minha análise e rotina gerada pelo SkinAI!' : 'Check out my skin analysis result from SkinAI!',
            url: window.location.href,
          });
        }
      }
    } catch (err) {
      console.error('Error sharing / generating PDF:', err);
      // Absolute fallback
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'SkinAI Analysis',
            url: window.location.href,
          });
        } catch (e) {}
      } else {
        try {
          navigator.clipboard.writeText(window.location.href);
          alert('Link copied!');
        } catch (e) {}
      }
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low':
      case 'Baixo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
      case 'Médio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High':
      case 'Alto':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Low':
      case 'Baixo':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'Medium':
      case 'Médio':
        return <AlertTriangle className="text-yellow-600" size={24} />;
      case 'High':
      case 'Alto':
        return <AlertTriangle className="text-red-600" size={24} />;
      default:
        return <Info className="text-gray-600" size={24} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="relative h-48 bg-gray-100">
        <img
          src={result.imageUrl}
          alt="Área da pele analisada"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4">
          <button
            onClick={handleShare}
            className="bg-white/90 backdrop-blur-md p-2 rounded-full text-gray-700 hover:bg-white transition-colors shadow-sm"
            title="Share"
          >
            <Share2 size={20} />
          </button>
        </div>
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1.5 rounded-full font-medium text-sm border flex items-center shadow-sm backdrop-blur-md bg-white/90 ${getRiskColor(result.riskLevel)}`}>
            {getRiskIcon(result.riskLevel)}
            <span className="ml-2">{t('result.risk')} {result.riskLevel === 'Low' ? t('result.risk.Low') : result.riskLevel === 'Medium' ? t('result.risk.Medium') : result.riskLevel === 'High' ? t('result.risk.High') : result.riskLevel}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-100 flex">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            activeTab === 'analysis'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('result.analysis')}
        </button>
        {result.skincareRoutine && (
          <button
            onClick={() => setActiveTab('routine')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'routine'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('result.routine')}
          </button>
        )}
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            activeTab === 'chat'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('result.askAI')}
        </button>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('result.possibleConditions')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(result.conditions || []).map((condition, i) => (
                    <span
                      key={i}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {t('result.abcdeAnalysis')}
                </h3>
                <div className="space-y-3">
                  <AnalysisRow label={t('result.asymmetry')} value={result.analysis?.asymmetry || 'N/A'} />
                  <AnalysisRow label={t('result.border')} value={result.analysis?.border || 'N/A'} />
                  <AnalysisRow label={t('result.color')} value={result.analysis?.color || 'N/A'} />
                  <AnalysisRow label={t('result.diameter')} value={result.analysis?.size || 'N/A'} />
                  <AnalysisRow label={t('result.evolution')} value={result.analysis?.evolution || 'N/A'} />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('result.recommendations')}
                </h3>
                <ul className="space-y-2">
                  {(result.recommendations || []).map((rec, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-700">
                      <ChevronRight className="text-emerald-500 shrink-0 mt-0.5 mr-1" size={16} />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {result.requiresSpecialist && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start">
                  <Stethoscope className="text-red-600 shrink-0 mt-0.5 mr-3" size={20} />
                  <div>
                    <h4 className="text-sm font-medium text-red-900 mb-1">{t('result.specialistTitle')}</h4>
                    <p className="text-xs text-red-700">
                      {t('result.specialistDesc')}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'routine' && (
            <motion.div
              key="routine"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {result.skincareRoutine && (
                <>
                  <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center">
                    <Droplets className="text-blue-500 mr-3 shrink-0" size={24} />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">{t('result.inferredSkinType')}</h4>
                      <p className="text-sm text-blue-700 font-semibold">{result.skincareRoutine.skinType}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <RoutineSection
                      title={t('result.morningRoutine')}
                      icon={<Sun className="text-amber-500" size={20} />}
                      steps={result.skincareRoutine.morning}
                    />
                    <RoutineSection
                      title={t('result.eveningRoutine')}
                      icon={<Moon className="text-indigo-500" size={20} />}
                      steps={result.skincareRoutine.evening}
                    />
                    <RoutineSection
                      title={t('result.weeklyCare')}
                      icon={<Calendar className="text-emerald-500" size={20} />}
                      steps={result.skincareRoutine.weekly}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-[400px]"
            >
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10">
                    <MessageSquare className="mx-auto mb-3 opacity-50" size={32} />
                    <p className="text-sm">{t('result.chatPlaceholder')}</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {isAsking && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-auto">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder={t('result.chatInputPlaceholder')}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={isAsking || !question.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white p-3 rounded-xl transition-colors shrink-0"
                >
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {onClose && (
          <button
            onClick={onClose}
            className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium transition-colors"
          >
            {t('result.closeAnalysis')}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline">
      <span className="text-sm font-medium text-gray-900 w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-600">{value}</span>
    </div>
  );
}

function RoutineSection({ title, icon, steps }: { title: string; icon: React.ReactNode; steps: SkincareStep[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div>
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900 ml-2">{title}</h3>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Step {index + 1}: {step.step}</span>
              <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-700">{step.productType}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
