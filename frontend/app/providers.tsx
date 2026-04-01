'use client';

import { useEffect, ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
  const { isDarkMode } = useAppStore();

  useEffect(() => {
    // Always enforce dark mode for cyberpunk theme
    document.documentElement.classList.add('dark');
  }, [isDarkMode]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(10, 17, 40, 0.95)',
            color: '#e0e8ff',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, Rajdhani, sans-serif',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)',
          },
          success: {
            iconTheme: { primary: '#39ff14', secondary: '#060b18' },
          },
          error: {
            iconTheme: { primary: '#ff073a', secondary: '#060b18' },
          },
        }}
      />
    </>
  );
}
