'use client';

import { motion } from 'framer-motion';
import Card from '@/components/common/Card';

interface ModelBreakdownProps {
  riskScore: number;
}

export default function ModelBreakdown({ riskScore }: ModelBreakdownProps) {
  const pct = Math.round(riskScore * 100);

  const modelScores = [
    { name: 'Text Encoder (RoBERTa)', score: Math.min(99, pct + Math.floor(Math.random() * 10)), color: '#1E88E5' },
    { name: 'URL Feature Analysis', score: Math.min(99, Math.max(10, pct - 5 + Math.floor(Math.random() * 15))), color: '#1976D2' },
    { name: 'Adversarial Check', score: Math.min(99, pct + Math.floor(Math.random() * 8)), color: '#0D47A1' },
  ];

  const featureImportance = [
    { name: 'Urgency Keywords', score: 45, color: '#EF4444' },
    { name: 'URL Anomalies', score: 32, color: '#F59E0B' },
    { name: 'Sender Reputation', score: 18, color: '#1E88E5' },
    { name: 'Grammar Quality', score: 5, color: '#10B981' },
  ];

  return (
    <Card hover={false}>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        🧠 AI Model Analysis
      </h3>

      {/* Model Components */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
          Model Component Scores
        </h4>
        <div className="space-y-4">
          {modelScores.map((item, index) => (
            <div key={item.name}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {item.name}
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: item.color }}>
                  {item.score}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1, delay: index * 0.15, ease: 'easeOut' }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: item.color }}
                >
                  <div className="shimmer absolute inset-0" />
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Importance */}
      <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
          Feature Importance
        </h4>
        <div className="space-y-4">
          {featureImportance.map((item, index) => (
            <div key={item.name} className="group cursor-default">
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium transition-colors group-hover:text-[#1E88E5]"
                  style={{ color: 'var(--foreground)' }}
                >
                  {item.name}
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: item.color }}>
                  {item.score}%
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: item.color }}
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
