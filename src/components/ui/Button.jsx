import React from 'react';
import Spinner from './Spinner';

/**
 * Premium Button component built using the QRDine design system tokens.
 * Features variants, loading state with a spinner, and flexible sizing.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon = null,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  // Styles aligned with design tokens in index.css
  const baseStyle = 'group inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-accent hover:bg-accent-dark text-white shadow-sm hover:shadow-md focus-visible:ring-accent',
    secondary: 'bg-[var(--color-base-bg)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus-visible:ring-slate-500',
    outline: 'border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-base-bg)] focus-visible:ring-accent',
    danger: 'bg-error hover:bg-red-600 text-white shadow-sm hover:shadow-md focus-visible:ring-error',
    gradient: 'gradient-accent text-white shadow-md hover:shadow-lg hover:brightness-110 focus-visible:ring-accent', // New vibrant gradient CTA
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md min-h-[36px]',
    md: 'px-4 py-2 text-base rounded-[12px] min-h-[44px]', // 44px min touch target, softer radius
    lg: 'px-6 py-3 text-lg rounded-[12px] min-h-[48px]',
  };

  const buttonClass = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className="mr-2" />
      ) : Icon ? (
        <span className="inline-flex mr-2 items-center justify-center group-hover:animate-bounce-subtle">
          <Icon className="w-4 h-4" />
        </span>
      ) : null}
      {children}
    </button>
  );
}
