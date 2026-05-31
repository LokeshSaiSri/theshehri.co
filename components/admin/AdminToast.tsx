'use client';

import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export function AdminToast({
  message,
  variant = 'success',
  onClose,
}: {
  message: string;
  variant?: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg font-mono text-[0.75rem] ${
        variant === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {variant === 'success' ? <Check size={14} /> : <X size={14} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100" aria-label="Dismiss">
        <X size={12} />
      </button>
    </div>
  );
}
