'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'blue' | 'green' | 'red' | 'yellow' | null;
}

export default function Card({ children, className = '', hover = true, glow = null }: CardProps) {
  const glowClass = glow ? {
    blue: 'shadow-[0_0_20px_rgba(30,136,229,0.15)]',
    green: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    red: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    yellow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  }[glow] : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={`card-base p-6 ${glowClass} ${className}`}
    >
      {children}
    </motion.div>
  );
}
