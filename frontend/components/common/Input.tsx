'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold mb-2 tracking-wider uppercase"
            style={{ color: '#00f0ff', fontFamily: 'var(--font-heading)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg opacity-50">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`input-base ${icon ? 'pl-10' : ''} ${error ? 'border-[#ff073a] focus:shadow-[0_0_20px_rgba(255,7,58,0.15)]' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm flex items-center gap-1" style={{ color: '#ff073a' }}>
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
