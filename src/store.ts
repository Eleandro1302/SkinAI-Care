import { useState, useEffect, useCallback } from 'react';
import { AnalysisResult } from './types';

export function useHistory() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('skinai_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const addResult = useCallback((result: AnalysisResult) => {
    setHistory(prev => {
      const newHistory = [result, ...prev];
      localStorage.setItem('skinai_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const deleteResult = useCallback((id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter((item) => item.id !== id);
      localStorage.setItem('skinai_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  return { history, addResult, deleteResult };
}

export function useSettings() {
  const [skinType, setSkinType] = useState<string>('Unknown');

  useEffect(() => {
    const stored = localStorage.getItem('skinai_skintype');
    if (stored) {
      setSkinType(stored);
    }
  }, []);

  const saveSkinType = (type: string) => {
    setSkinType(type);
    localStorage.setItem('skinai_skintype', type);
  };

  return { skinType, saveSkinType };
}
