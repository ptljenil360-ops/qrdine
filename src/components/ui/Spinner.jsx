import React from 'react';

/**
 * Loading Spinner using the global spinning animation defined in index.css.
 */
export default function Spinner({ size = 'md', color = 'primary', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colors = {
    primary: 'border-accent/20 border-t-accent',
    white: 'border-white/20 border-t-white',
    dark: 'border-slate-200 border-t-slate-800',
  };

  const spinnerClass = `rounded-full animate-spin ${sizes[size]} ${colors[color]} ${className}`;

  return <div className={spinnerClass} role="status" aria-label="loading" />;
}
