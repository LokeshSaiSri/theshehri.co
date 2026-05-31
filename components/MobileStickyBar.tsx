'use client';

import { type ReactNode } from 'react';

/** Fixed bottom CTA bar for mobile — accounts for home indicator safe area */
export function MobileStickyBar({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 lg:hidden border-t-2 border-ink bg-paper/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${className}`}
    >
      {children}
    </div>
  );
}
