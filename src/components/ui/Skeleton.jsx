import React from 'react';

/**
 * Premium Skeleton loading placeholder with pulse animations.
 */
export default function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-[8px]',
  };

  const skeletonClass = `bg-slate-200 animate-skeleton ${variants[variant]} ${className}`;

  return <div className={skeletonClass} aria-hidden="true" />;
}
