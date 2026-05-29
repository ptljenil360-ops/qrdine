import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Premium individual Toast notification.
 */
export default function Toast({
  message,
  type = 'info',
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (duration > 0 && typeof onClose === 'function') {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const borderColors = {
    success: 'border-l-4 border-l-success',
    error: 'border-l-4 border-l-error',
    warning: 'border-l-4 border-l-warning',
    info: 'border-l-4 border-l-accent',
  };

  return (
    <div
      className={`
        flex items-start gap-3
        p-4
        bg-white
        shadow-lg
        rounded-r-[8px]
        border border-border
        min-w-[280px] max-w-sm
        animate-slide-down
        pointer-events-auto
        ${borderColors[type]}
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1 text-sm font-medium text-text-primary">
        {message}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-text-muted hover:text-text-secondary p-0.5 rounded-full hover:bg-slate-50 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
