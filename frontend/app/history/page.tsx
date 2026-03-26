'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import Sidebar from '@/components/layout/Sidebar';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

export default function HistoryPage() {
  const { scanHistory, clearHistory } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'scam' | 'safe'>('all');
  const [search, setSearch] = useState('');

  const filtered = scanHistory.filter((item) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'scam' && item.is_scam) ||
      (filter === 'safe' && !item.is_scam);
    const matchesSearch =
      !search ||
      item.text.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      <Sidebar />

      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--foreground)' }}>
                Scan History
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {scanHistory.length} total scans
              </p>
            </div>
            {scanHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                🗑️ Clear All
              </Button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
            <input
              type="text"
              placeholder="Search scans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-10"
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
            {(['all', 'scam', 'safe'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  filter === f ? 'bg-[#1E88E5] text-white shadow-md' : ''
                }`}
                style={filter !== f ? { color: 'var(--muted-foreground)' } : undefined}
              >
                {f === 'scam' ? '🚨 Scam' : f === 'safe' ? '✅ Safe' : '📋 All'}
              </button>
            ))}
          </div>
        </div>

        {/* History Grid */}
        {filtered.length === 0 ? (
          <Card hover={false}>
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                {scanHistory.length === 0 ? 'No scans yet' : 'No matching results'}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {scanHistory.length === 0
                  ? 'Analyze a message to see it appear here'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((item, index) => {
                const pct = Math.round(item.risk_score * 100);
                const riskColor = item.is_scam ? '#EF4444' : item.risk_score > 0.3 ? '#F59E0B' : '#10B981';
                const riskLabel = item.is_scam ? 'SCAM' : item.risk_score > 0.3 ? 'SUSPICIOUS' : 'SAFE';

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-base p-5 flex flex-col"
                  >
                    {/* Risk Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: riskColor }}>
                        {item.is_scam ? '🚨' : '✅'} {pct}% {riskLabel}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm mb-2 line-clamp-2 flex-1" style={{ color: 'var(--foreground)' }}>
                      {item.text || '(No text content)'}
                    </p>

                    {item.url && (
                      <p className="text-xs truncate mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        🔗 {item.url}
                      </p>
                    )}

                    {/* Score bar */}
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: riskColor }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
