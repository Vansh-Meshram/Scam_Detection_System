'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number; // 0.0 - 1.0
  size?: number;
}

export default function RiskGauge({ score, size = 220 }: RiskGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const percentage = Math.round(score * 100);

  useEffect(() => {
    let start = 0;
    const end = percentage;
    const duration = 1500;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [percentage]);

  const getRiskInfo = () => {
    if (score <= 0.3)
      return { label: 'SAFE', color: '#10B981', bgColor: 'rgba(16,185,129,0.1)', icon: '✅', message: 'No immediate threats detected' };
    if (score <= 0.6)
      return { label: 'SUSPICIOUS', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)', icon: '⚠️', message: 'Proceed with caution' };
    return { label: 'CRITICAL RISK', color: '#EF4444', bgColor: 'rgba(239,68,68,0.1)', icon: '🚨', message: 'This is likely a SCAM' };
  };

  const risk = getRiskInfo();
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox="0 0 200 200"
        >
          {/* Background track */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="12"
          />

          {/* Animated progress */}
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={risk.color}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
              filter: `drop-shadow(0 0 10px ${risk.color}60)`,
            }}
          />
        </svg>

        {/* Center number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <span className="text-5xl font-bold tabular-nums" style={{ color: risk.color }}>
              {displayScore}%
            </span>
          </motion.div>
          <span className="text-sm font-bold mt-1 tracking-wider" style={{ color: risk.color }}>
            {risk.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${displayScore}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #10B981, #F59E0B, ${risk.color})` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>Safe</span>
          <span>Critical</span>
        </div>
      </div>

      {/* Alert badge */}
      {score > 0.5 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className={`px-5 py-2.5 rounded-full border flex items-center gap-2 ${score > 0.7 ? 'pulse-danger' : ''}`}
          style={{
            background: risk.bgColor,
            borderColor: `${risk.color}40`,
          }}
        >
          <span className="text-lg">{risk.icon}</span>
          <span className="font-semibold text-sm" style={{ color: risk.color }}>
            HIGH CONFIDENCE: {risk.message}
          </span>
        </motion.div>
      )}
    </div>
  );
}
