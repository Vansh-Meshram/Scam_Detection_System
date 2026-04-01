'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'cyan' | 'green' | 'red' | 'magenta' | 'blue' | 'yellow' | null;
}

const glowColors = {
  cyan: { border: 'rgba(0, 240, 255, 0.2)', shadow: 'rgba(0, 240, 255, 0.1)' },
  blue: { border: 'rgba(0, 240, 255, 0.2)', shadow: 'rgba(0, 240, 255, 0.1)' },
  green: { border: 'rgba(57, 255, 20, 0.2)', shadow: 'rgba(57, 255, 20, 0.1)' },
  red: { border: 'rgba(255, 7, 58, 0.2)', shadow: 'rgba(255, 7, 58, 0.1)' },
  magenta: { border: 'rgba(255, 0, 229, 0.2)', shadow: 'rgba(255, 0, 229, 0.1)' },
  yellow: { border: 'rgba(255, 230, 0, 0.2)', shadow: 'rgba(255, 230, 0, 0.1)' },
};

export default function Card({ children, className = '', hover = true, glow = null }: CardProps) {
  const colors = glow ? glowColors[glow] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={`p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 ${className}`}
      style={{
        background: 'rgba(10, 17, 40, 0.7)',
        border: `1px solid ${colors?.border || 'rgba(0, 240, 255, 0.08)'}`,
        boxShadow: colors
          ? `0 0 25px ${colors.shadow}, inset 0 1px 0 rgba(0, 240, 255, 0.05)`
          : '0 0 20px rgba(0, 240, 255, 0.03), inset 0 1px 0 rgba(0, 240, 255, 0.05)',
      }}
    >
      {children}
    </motion.div>
  );
}
