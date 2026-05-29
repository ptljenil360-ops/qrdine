import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

/**
 * Premium Modal component with backdrop blur and smooth sliding animation.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  className = '',
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full h-full rounded-none',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-400/50 dark:bg-slate-900/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`
          relative 
          w-full 
          bg-[var(--color-base-card)] 
          rounded-[12px] 
          shadow-[var(--shadow-modal)] 
          flex 
          flex-col 
          max-h-[90vh] 
          animate-slide-up 
          z-10
          overflow-hidden
          ${sizes[size]} 
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          {title && (
            <h3 id="modal-title" className="text-lg font-bold text-[var(--color-text-primary)]">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary hover:bg-[var(--color-base-bg)] p-1.5 rounded-full transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[var(--color-base-bg)] border-t border-[var(--color-border)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
