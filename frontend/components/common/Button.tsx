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
  primary: 'bg-[#1E88E5] text-white hover:bg-[#1976D2] shadow-lg hover:shadow-xl focus:ring-[#1E88E5]',
  secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:brightness-95 focus:ring-gray-400',
  danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] focus:ring-[#EF4444]',
  ghost: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)] focus:ring-gray-400',
};

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-md',
  md: 'px-6 py-2.5 text-base rounded-lg',
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
        transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Analyzing...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}
