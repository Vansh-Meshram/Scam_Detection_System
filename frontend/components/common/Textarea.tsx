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
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {label}
              </label>
            )}
            {showCount && maxLength && (
              <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                {currentLength.toLocaleString()} / {maxLength.toLocaleString()}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          maxLength={maxLength}
          value={value}
          className={`input-base resize-none ${error ? 'border-[#EF4444] focus:ring-[#EF4444]' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[#EF4444] flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
