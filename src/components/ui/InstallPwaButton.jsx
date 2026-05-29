import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function InstallPwaButton({ className = '' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable) return null;

  return (
    <button
      onClick={handleInstallClick}
      className={`inline-flex items-center gap-2 bg-[#F97316] text-[#FFFFFF] text-[13px] font-[600] px-[14px] py-[8px] rounded-[6px] hover:bg-[#EA580C] transition-colors ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>Install App</span>
    </button>
  );
}
