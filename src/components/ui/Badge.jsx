import React from 'react';

/**
 * Status and Plan Badge component.
 */
export default function Badge({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-[999px] text-xs font-semibold uppercase tracking-wider';
  
  const variants = {
    // Order / Table Status
    pending: 'bg-orange-100 text-orange-800 border border-orange-200',
    preparing: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    done: 'bg-green-100 text-green-800 border border-green-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    
    // Other Statuses
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    
    // Plans
    trial: 'bg-orange-100 text-accent border border-orange-200',
    pro: 'bg-[var(--color-base-card)] text-[var(--color-text-primary)] border border-slate-400 dark:border-slate-600 font-bold',
  };

  const badgeClass = `${baseStyle} ${variants[variant]} ${className}`;

  return (
    <span className={badgeClass} {...props}>
      {children}
    </span>
  );
}
