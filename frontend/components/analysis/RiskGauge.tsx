'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number;
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
      return { label: 'CLEAR', color: '#39ff14', message: 'No threats detected in neural scan' };
    if (score <= 0.6)
      return { label: 'CAUTION', color: '#ffe600', message: 'Anomalous signals detected' };
    return { label: 'CRITICAL', color: '#ff073a', message: 'HIGH THREAT — scam signature confirmed' };
  };

  const risk = getRiskInfo();
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
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
            stroke="rgba(0, 240, 255, 0.06)"
            strokeWidth="10"
          />

          {/* Animated progress */}
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={risk.color}
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
              filter: `drop-shadow(0 0 15px ${risk.color}80)`,
            }}
          />
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <span className="text-5xl font-black tabular-nums"
              style={{ color: risk.color, fontFamily: 'var(--font-heading)', textShadow: `0 0 30px ${risk.color}60` }}
            >
              {displayScore}%
            </span>
          </motion.div>
          <span className="text-xs font-bold mt-1 tracking-[0.3em]"
            style={{ color: risk.color, fontFamily: 'var(--font-heading)' }}
          >
            {risk.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0, 240, 255, 0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${displayScore}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, #39ff14, #ffe600, ${risk.color})`,
              boxShadow: `0 0 10px ${risk.color}60`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] tracking-wider uppercase" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
          <span>SAFE</span>
          <span>CRITICAL</span>
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
            background: `${risk.color}10`,
            borderColor: `${risk.color}40`,
          }}
        >
          <span className="text-lg">⚠</span>
          <span className="font-bold text-xs tracking-wider uppercase"
            style={{ color: risk.color, fontFamily: 'var(--font-heading)' }}
          >
            {risk.message}
          </span>
        </motion.div>
      )}
    </div>
  );
}
