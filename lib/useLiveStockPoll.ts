'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_INTERVAL_MS = 20_000;

/** Polls stock on an interval and when the tab becomes visible again. */
export function useLiveStockPoll(
  onRefresh: () => void | Promise<void>,
  intervalMs = DEFAULT_INTERVAL_MS,
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const tick = () => {
      void onRefreshRef.current();
    };

    const id = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
}
