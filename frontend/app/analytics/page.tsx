'use client';

import { motion } from 'framer-motion';
import Card from '@/components/common/Card';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { useAppStore } from '@/lib/store';

export default function AnalyticsPage() {
  const { scanHistory, feedbackCount } = useAppStore();
  const totalScans = scanHistory.length;
  const threats = scanHistory.filter((s) => s.isScam).length;
  const safe = totalScans - threats;
  const avgRisk = totalScans > 0
    ? scanHistory.reduce((sum, s) => sum + (s.riskScore || 0), 0) / totalScans
    : 0;

  const stats = [
    { label: 'TOTAL SCANS', value: totalScans, color: '#00f0ff' },
    { label: 'THREATS FOUND', value: threats, color: '#ff073a' },
    { label: 'CLEARED', value: safe, color: '#39ff14' },
    { label: 'AVG RISK', value: `${Math.round(avgRisk * 100)}%`, color: '#ffe600' },
  ];

  const threatRate = totalScans > 0 ? Math.round((threats / totalScans) * 100) : 0;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <span className="neon-text-cyan">THREAT</span>{' '}
              <span style={{ color: 'var(--foreground)' }}>ANALYTICS</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Real-time intelligence dashboard
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center py-6">
                  <div className="text-3xl font-black tabular-nums mb-1"
                    style={{
                      color: stat.color,
                      fontFamily: 'var(--font-heading)',
                      textShadow: `0 0 20px ${stat.color}40`,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[9px] font-bold tracking-[0.3em] uppercase"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}
                  >
                    {stat.label}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Threat Distribution */}
            <Card hover={false}>
              <h3 className="text-xs font-bold mb-6 tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-heading)', color: '#00f0ff' }}
              >
                ◈ THREAT DISTRIBUTION
              </h3>
              <div className="flex items-center gap-8">
                {/* Donut Visualization */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,240,255,0.06)" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="#ff073a"
                      strokeWidth="8"
                      strokeDasharray={`${threatRate * 2.51} ${251.3 - threatRate * 2.51}`}
                      initial={{ strokeDashoffset: 251.3 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 1.5 }}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(255,7,58,0.4))' }}
                    />
                    <motion.circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="#39ff14"
                      strokeWidth="8"
                      strokeDasharray={`${(100 - threatRate) * 2.51} ${251.3 - (100 - threatRate) * 2.51}`}
                      strokeDashoffset={-threatRate * 2.51}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(57,255,20,0.4))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black tabular-nums" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
                      {threatRate}%
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: '#ff073a', boxShadow: '0 0 8px rgba(255,7,58,0.4)' }} />
                    <span className="text-xs" style={{ color: 'var(--foreground)' }}>Threats: {threats}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: '#39ff14', boxShadow: '0 0 8px rgba(57,255,20,0.4)' }} />
                    <span className="text-xs" style={{ color: 'var(--foreground)' }}>Clear: {safe}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Risk Distribution */}
            <Card hover={false}>
              <h3 className="text-xs font-bold mb-6 tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-heading)', color: '#00f0ff' }}
              >
                ⟐ RISK LEVEL BREAKDOWN
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'CRITICAL (70-100%)', count: scanHistory.filter(s => s.riskScore > 0.7).length, color: '#ff073a' },
                  { label: 'SUSPICIOUS (30-70%)', count: scanHistory.filter(s => s.riskScore > 0.3 && s.riskScore <= 0.7).length, color: '#ffe600' },
                  { label: 'SAFE (0-30%)', count: scanHistory.filter(s => s.riskScore <= 0.3).length, color: '#39ff14' },
                ].map((level) => {
                  const pct = totalScans > 0 ? Math.round((level.count / totalScans) * 100) : 0;
                  return (
                    <div key={level.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
                          {level.label}
                        </span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: level.color, fontFamily: 'var(--font-heading)' }}>
                          {level.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,240,255,0.06)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1 }}
                          className="h-full rounded-full"
                          style={{ background: level.color, boxShadow: `0 0 8px ${level.color}40` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* System Info */}
          <Card hover={false}>
            <h3 className="text-xs font-bold mb-4 tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-heading)', color: '#00f0ff' }}
            >
              ⟁ SYSTEM INTELLIGENCE
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] mb-1 uppercase" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
                  ARCHITECTURE
                </div>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>DistilBERT × URLNet × Co-Attention</p>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] mb-1 uppercase" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
                  FEEDBACK COLLECTED
                </div>
                <p className="text-sm font-bold" style={{ color: '#00f0ff', fontFamily: 'var(--font-heading)' }}>{feedbackCount} samples</p>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] mb-1 uppercase" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
                  ENGINE STATUS
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse" />
                  <span className="text-sm font-bold" style={{ color: '#39ff14', fontFamily: 'var(--font-heading)' }}>OPERATIONAL</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Footer />
      </div>
    </div>
  );
}
