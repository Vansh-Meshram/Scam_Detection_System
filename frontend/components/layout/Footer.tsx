'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t py-8 mt-16" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="font-bold text-gradient">ScamGuard AI</span>
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>v2.0</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <Link href="/analyze" className="hover:text-[#1E88E5] transition-colors">Analyze</Link>
            <Link href="/history" className="hover:text-[#1E88E5] transition-colors">History</Link>
            <Link href="/analytics" className="hover:text-[#1E88E5] transition-colors">Analytics</Link>
          </div>

          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            © 2026 ScamGuard AI. Powered by RoBERTa.
          </p>
        </div>
      </div>
    </footer>
  );
}
