import React, { useState } from 'react';
import { HelpCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Premium Input field conforming to accessibility, SEO unique ID,
 * and visual standards from the QRDine UI Brief.
 */
const Input = React.forwardRef(({
  label,
  id,
  type = 'text',
  error,
  tooltip,
  className = '',
  required = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col w-full relative ${className}`}>
      {label && (
        <div className="flex items-center gap-1.5 mb-[6px]">
          <label htmlFor={id} className="text-[13px] font-medium text-[#696969] dark:text-[#94A3B8]">
            {label}
            {required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
          
          {tooltip && (
            <div className="relative inline-flex items-center">
              <button
                type="button"
                className="text-[#696969] dark:text-[#94A3B8] hover:text-[#1C1C1C] dark:hover:text-[#F1F5F9] transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                aria-label="Information help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--color-base-card)] text-[var(--color-text-primary)] border border-slate-300 dark:border-slate-700 text-xs rounded shadow-lg z-50 pointer-events-none">
                  {tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-300 dark:border-t-slate-700" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={inputType}
          className={`
            w-full
            h-[48px]
            px-[16px]
            text-[14px]
            text-[#1C1C1C] dark:text-[#F1F5F9]
            placeholder-[#AAAAAA] dark:placeholder-[#64748B]
            bg-[#FFFFFF] dark:bg-[#0F172A]
            border
            border-[#E8E8E8] dark:border-[rgba(255,255,255,0.12)]
            rounded-[8px]
            transition-all duration-200
            focus:outline-none
            focus:border-[#F97316]
            ${error ? 'border-[#EF4444] focus:border-[#EF4444]' : ''}
            ${isPassword ? 'pr-[44px]' : ''}
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 w-[44px] flex items-center justify-center text-[#696969] dark:text-[#94A3B8] hover:text-[#1C1C1C] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <span className="text-[13px] font-medium text-[#EF4444] mt-0.5 animate-slide-down">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
