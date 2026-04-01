'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCount?: boolean;
  maxLength?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, showCount = false, maxLength, value, className = '', ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {(label || (showCount && maxLength)) && (
          <div className="flex justify-between items-center mb-2">
            {label && (
              <label className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: '#00f0ff', fontFamily: 'var(--font-heading)' }}
              >
                {label}
              </label>
            )}
            {showCount && maxLength && (
              <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
                {currentLength.toLocaleString()} / {maxLength.toLocaleString()}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          maxLength={maxLength}
          value={value}
          className={`input-base resize-none ${error ? 'border-[#ff073a]' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm flex items-center gap-1" style={{ color: '#ff073a' }}>
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
