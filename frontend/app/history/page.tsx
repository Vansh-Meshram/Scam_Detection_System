'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import Card from '@/components/common/Card';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';

export default function HistoryPage() {
  const { scanHistory, clearHistory } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'scam' | 'safe'>('all');

  const filteredHistory = scanHistory.filter((item) => {
    if (filter === 'scam') return item.isScam;
    if (filter === 'safe') return !item.isScam;
    return true;
  });

  const filters = [
    { key: 'all' as const, label: 'ALL SCANS', count: scanHistory.length },
    { key: 'scam' as const, label: 'THREATS', count: scanHistory.filter((h) => h.isScam).length },
    { key: 'safe' as const, label: 'CLEAR', count: scanHistory.filter((h) => !h.isScam).length },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider mb-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <span className="neon-text-cyan">SCAN</span>{' '}
                <span style={{ color: 'var(--foreground)' }}>LOGS</span>
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {scanHistory.length} total scans recorded
              </p>
            </div>
            {scanHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs font-bold tracking-wider px-4 py-2 rounded-xl transition-all"
                style={{
                  color: '#ff073a',
                  border: '1px solid rgba(255, 7, 58, 0.2)',
                  background: 'rgba(255, 7, 58, 0.05)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                ✕ PURGE LOGS
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-4 py-2 rounded-xl text-[10px] font-bold tracking-[0.15em] transition-all duration-300"
                style={{
                  background: filter === f.key ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  border: filter === f.key ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(0, 240, 255, 0.06)',
                  color: filter === f.key ? '#00f0ff' : 'var(--muted-foreground)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Scan List */}
          {filteredHistory.length === 0 ? (
            <Card className="text-center py-16">
              <div className="text-4xl mb-4">⟐</div>
              <h3 className="text-sm font-bold mb-2 tracking-wider"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--foreground)' }}
              >
                {scanHistory.length === 0 ? 'NO SCANS RECORDED' : 'NO MATCHING RESULTS'}
              </h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {scanHistory.length === 0
                  ? 'Run your first neural scan to populate the logs'
                  : 'Try changing the filter to see other results'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-2xl transition-all duration-300"
                  style={{
                    background: 'rgba(10, 17, 40, 0.7)',
                    border: `1px solid ${item.isScam ? 'rgba(255,7,58,0.15)' : 'rgba(57,255,20,0.15)'}`,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="text-[10px] font-bold px-3 py-1 rounded-full tracking-[0.15em]"
                          style={{
                            background: item.isScam ? 'rgba(255,7,58,0.1)' : 'rgba(57,255,20,0.1)',
                            color: item.isScam ? '#ff073a' : '#39ff14',
                            border: `1px solid ${item.isScam ? 'rgba(255,7,58,0.2)' : 'rgba(57,255,20,0.2)'}`,
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {item.isScam ? 'THREAT' : 'CLEAR'}
                        </span>
                        <span className="font-bold text-sm tabular-nums"
                          style={{
                            color: item.isScam ? '#ff073a' : '#39ff14',
                            fontFamily: 'var(--font-heading)',
                            textShadow: `0 0 15px ${item.isScam ? 'rgba(255,7,58,0.3)' : 'rgba(57,255,20,0.3)'}`,
                          }}
                        >
                          {Math.round(item.riskScore * 100)}%
                        </span>
                      </div>
                      <p className="text-sm truncate mb-1" style={{ color: 'var(--foreground)' }}>
                        {item.url || item.text}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {item.explanation}
                      </p>
                    </div>
                    <div className="text-xs whitespace-nowrap tabular-nums"
                      style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}
                    >
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
