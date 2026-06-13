import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';

export default function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Setup periodic update checks if needed
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const [autoUpdate, setAutoUpdate] = useState(() => {
    return localStorage.getItem('autoUpdatePwa') === 'true';
  });

  // Listen to storage changes for autoUpdate in case it's changed in another tab
  useEffect(() => {
    const handleStorage = () => {
      setAutoUpdate(localStorage.getItem('autoUpdatePwa') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (needRefresh && autoUpdate) {
      updateServiceWorker(true);
    }
  }, [needRefresh, autoUpdate, updateServiceWorker]);

  if (!needRefresh || autoUpdate) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[var(--color-base-card)] shadow-[var(--shadow-card)] border border-[#E8E8E8] rounded-[12px] p-4 flex items-center gap-4 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
        <Download className="w-5 h-5 text-[#F97316]" />
      </div>
      <div className="flex-1">
        <h4 className="text-[14px] font-[600] text-[#1C1C1C] mb-1">Update Available</h4>
        <p className="text-[12px] text-[#696969] leading-tight">A new version of RaShoyi is available. Refresh to apply the update.</p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-[#F97316] text-[#FFFFFF] text-[12px] font-[600] px-3 py-1.5 rounded-[6px] hover:bg-[#EA580C] transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-[#696969] text-[12px] font-[500] hover:text-[#1C1C1C] transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
