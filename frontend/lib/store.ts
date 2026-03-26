import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScanHistoryItem, PredictResponse } from '@/types/api';

interface AppState {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;

  // Analysis
  currentAnalysis: PredictResponse | null;
  currentInput: { text: string; url: string };
  setCurrentAnalysis: (analysis: PredictResponse | null) => void;
  setCurrentInput: (input: { text: string; url: string }) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;

  // History
  scanHistory: ScanHistoryItem[];
  addToHistory: (item: Omit<ScanHistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;

  // Feedback
  feedbackCount: number;
  incrementFeedback: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      isDarkMode: false,
      toggleDarkMode: () =>
        set((state) => {
          const newMode = !state.isDarkMode;
          if (typeof window !== 'undefined') {
            document.documentElement.classList.toggle('dark', newMode);
          }
          return { isDarkMode: newMode };
        }),
      setDarkMode: (value: boolean) => {
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', value);
        }
        set({ isDarkMode: value });
      },

      // Analysis
      currentAnalysis: null,
      currentInput: { text: '', url: '' },
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      setCurrentInput: (input) => set({ currentInput: input }),
      isAnalyzing: false,
      setIsAnalyzing: (value) => set({ isAnalyzing: value }),

      // History
      scanHistory: [],
      addToHistory: (item) =>
        set((state) => ({
          scanHistory: [
            {
              ...item,
              id: Date.now().toString(36) + Math.random().toString(36).substr(2),
              timestamp: new Date().toISOString(),
            },
            ...state.scanHistory,
          ].slice(0, 100),
        })),
      clearHistory: () => set({ scanHistory: [] }),

      // Feedback
      feedbackCount: 0,
      incrementFeedback: () =>
        set((state) => ({ feedbackCount: state.feedbackCount + 1 })),
    }),
    {
      name: 'scamguard-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        scanHistory: state.scanHistory,
        feedbackCount: state.feedbackCount,
      }),
    }
  )
);
