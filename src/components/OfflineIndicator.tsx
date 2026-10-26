import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showRestoredToast, setShowRestoredToast] = useState<boolean>(false);
  const [hasBeenOffline, setHasBeenOffline] = useState<boolean>(false);

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
      setShowRestoredToast(false);
    } else if (hasBeenOffline) {
      setShowRestoredToast(true);
      const timer = setTimeout(() => {
        setShowRestoredToast(false);
        setHasBeenOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  // If online and no restored toast, render nothing
  if (isOnline && !showRestoredToast) {
    return null;
  }

  // Toast when restored
  if (isOnline && showRestoredToast) {
    return (
      <div className="fixed bottom-16 sm:bottom-6 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 px-3.5 py-2 text-xs font-semibold text-emerald-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>Back Online — Local data synchronized.</span>
      </div>
    );
  }

  // Active offline banner
  return (
    <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:right-auto z-50 flex items-center justify-between sm:justify-start gap-2.5 rounded-xl bg-amber-950/90 border border-amber-500/40 px-3.5 py-2 text-xs font-semibold text-amber-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <WifiOff className="w-4 h-4 text-amber-400" />
        <span>Offline Mode Active &bull; Logs &amp; Profile saved safely locally</span>
      </div>
    </div>
  );
};
