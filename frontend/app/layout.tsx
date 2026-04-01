import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ScamGuard AI — Cybersecurity Neural Scan Engine',
  description: 'Hyper-optimized DistilBERT + URLNet Co-Attention neural network for real-time phishing and scam detection.',
  keywords: ['scam detection', 'phishing', 'AI', 'cybersecurity', 'DistilBERT', 'URLNet', 'neural network'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {/* Cyberpunk grid background */}
          <div className="cyber-grid" />
          <div className="scanline" />
          <Header />
          <main className="relative z-10 min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
