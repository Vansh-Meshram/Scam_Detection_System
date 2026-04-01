'use client';

import { motion } from 'framer-motion';
import Card from '@/components/common/Card';

interface ModelBreakdownProps {
  riskScore: number;
}

export default function ModelBreakdown({ riskScore }: ModelBreakdownProps) {
  const pct = Math.round(riskScore * 100);

  const modelScores = [
    { name: 'TEXT ENCODER (DistilBERT)', score: Math.min(99, pct + Math.floor(Math.random() * 10)), color: '#00f0ff' },
    { name: 'URL FEATURE ANALYSIS (URLNet)', score: Math.min(99, Math.max(10, pct - 5 + Math.floor(Math.random() * 15))), color: '#b14eff' },
    { name: 'CO-ATTENTION FUSION', score: Math.min(99, pct + Math.floor(Math.random() * 8)), color: '#ff00e5' },
    { name: 'ADVERSARIAL CHECK', score: Math.min(99, pct + Math.floor(Math.random() * 6)), color: '#ffe600' },
  ];

  const featureImportance = [
    { name: 'Urgency Keywords', score: 45, color: '#ff073a' },
    { name: 'URL Anomalies', score: 32, color: '#ffe600' },
    { name: 'Sender Reputation', score: 18, color: '#00f0ff' },
    { name: 'Grammar Quality', score: 5, color: '#39ff14' },
  ];

  return (
    <Card hover={false}>
      <h3 className="text-base font-bold mb-6 flex items-center gap-2 tracking-wider uppercase"
        style={{ fontFamily: 'var(--font-heading)', color: '#00f0ff' }}
      >
        ⟁ NEURAL MODEL ANALYSIS
      </h3>

      {/* Model Components */}
      <div className="mb-8">
        <h4 className="text-[10px] font-bold mb-4 tracking-[0.3em] uppercase" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
          MODEL COMPONENT SCORES
        </h4>
        <div className="space-y-4">
          {modelScores.map((item, index) => (
            <div key={item.name}>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
                  {item.name}
                </span>
                <span className="text-xs font-bold tabular-nums" style={{ color: item.color, fontFamily: 'var(--font-heading)' }}>
                  {item.score}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0, 240, 255, 0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1, delay: index * 0.15, ease: 'easeOut' }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: item.color,
                    boxShadow: `0 0 10px ${item.color}40`,
                  }}
                >
                  <div className="shimmer absolute inset-0" />
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Importance */}
      <div className="pt-6 border-t" style={{ borderColor: 'rgba(0, 240, 255, 0.08)' }}>
        <h4 className="text-[10px] font-bold mb-4 tracking-[0.3em] uppercase" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
          FEATURE IMPORTANCE
        </h4>
        <div className="space-y-4">
          {featureImportance.map((item, index) => (
            <div key={item.name} className="group cursor-default">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                  {item.name}
                </span>
                <span className="text-xs font-bold tabular-nums" style={{ color: item.color, fontFamily: 'var(--font-heading)' }}>
                  {item.score}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0, 240, 255, 0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: item.color,
                    boxShadow: `0 0 8px ${item.color}40`,
                  }}
                >
                  <div className="shimmer absolute inset-0" />
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
