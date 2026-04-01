'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t py-8 mt-16" style={{ borderColor: 'rgba(0, 240, 255, 0.06)', background: 'rgba(6, 11, 24, 0.8)' }}>
      <div className="neon-line mb-8" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⟁</span>
            <span className="font-bold text-gradient-cyber" style={{ fontFamily: 'var(--font-heading)' }}>SCAMGUARD</span>
            <span className="text-xs tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>v3.0</span>
          </div>

          <div className="flex items-center gap-6 text-xs tracking-wider uppercase" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
            <Link href="/analyze" className="hover:text-[#00f0ff] transition-colors">Scan</Link>
            <Link href="/history" className="hover:text-[#00f0ff] transition-colors">Logs</Link>
            <Link href="/analytics" className="hover:text-[#00f0ff] transition-colors">Data</Link>
          </div>

          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            © 2026 ScamGuard AI · Powered by DistilBERT × URLNet
          </p>
        </div>
      </div>
    </footer>
  );
}
