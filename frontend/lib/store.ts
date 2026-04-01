import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PredictResponse } from '@/types/api';

export interface ScanHistoryItem {
  id: string;
  text: string;
  url: string;
  riskScore: number;
  isScam: boolean;
  explanation: string;
  timestamp: string;
}

interface AppState {
  // Theme (always dark for cyberpunk)
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
  addScanResult: (item: ScanHistoryItem) => void;
  clearHistory: () => void;

  // Feedback
  feedbackCount: number;
  incrementFeedback: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme — always dark for cyberpunk
      isDarkMode: true,
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
      addScanResult: (item) =>
        set((state) => ({
          scanHistory: [item, ...state.scanHistory].slice(0, 100),
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
