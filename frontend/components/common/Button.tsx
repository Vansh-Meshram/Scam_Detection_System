'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

const variants = {
  primary: 'text-[#060b18] font-bold',
  secondary: 'text-[var(--foreground)]',
  danger: 'text-white font-bold',
  ghost: 'text-[var(--foreground)]',
};

const bgStyles = {
  primary: {
    background: 'linear-gradient(135deg, #00f0ff, #00b8d4)',
    border: '1px solid rgba(0, 240, 255, 0.5)',
    boxShadow: '0 0 20px rgba(0, 240, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  secondary: {
    background: 'rgba(0, 240, 255, 0.06)',
    border: '1px solid rgba(0, 240, 255, 0.15)',
    boxShadow: 'none',
  },
  danger: {
    background: 'linear-gradient(135deg, #ff073a, #cc0029)',
    border: '1px solid rgba(255, 7, 58, 0.5)',
    boxShadow: '0 0 20px rgba(255, 7, 58, 0.2)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid transparent',
    boxShadow: 'none',
  },
};

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-2.5 text-base rounded-xl',
  lg: 'px-8 py-3.5 text-lg rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-300 cursor-pointer tracking-wider
        focus:outline-none
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      style={{
        ...bgStyles[variant],
        fontFamily: 'var(--font-heading)',
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>SCANNING...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}
