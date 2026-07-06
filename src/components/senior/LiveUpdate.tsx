'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Silently refreshes the current route at a specified interval.
 * This effectively makes Server Components "live" without complex state.
 */
export function LiveUpdate({ interval = 30000 }: { interval?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval]);

  // This component handles logic only, no UI to render
  return null;
}
