import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Reassures the cashier that sales are still being saved when the signal drops. */
export const OfflineBadge: React.FC = () => {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-neutral-900 text-white text-xs font-medium px-4 py-2 shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
      Mode Offline — transaksi tetap tersimpan di perangkat ini
    </div>
  );
};
