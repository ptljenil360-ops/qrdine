import React from 'react';

/**
 * Premium Card component utilizing the 60-30-10 tokens, glassmorphism, and neumorphism.
 */
export default function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  variant = 'default', // 'default', 'glass', 'neumorphic'
  ...props
}) {
  const isClickable = typeof onClick === 'function';
  
  const variants = {
    default: 'bg-[var(--color-base-card)] border border-[var(--color-border)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
    glass: 'glass-card',
    neumorphic: 'neumorphic-card border-none',
  };

  const cardClass = `
    rounded-[16px]
    p-5
    transition-all duration-300
    ${variants[variant]}
    ${hoverable || isClickable ? 'hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-1 cursor-pointer' : ''}
    ${className}
  `;

  return (
    <div
      className={cardClass}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}
