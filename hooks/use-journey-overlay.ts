'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JourneyOverlay } from '@/lib/domain/journey';
import { mergeOverlay } from '@/lib/domain/journey';
import { clearOverlay, readOverlay, writeOverlay } from '@/lib/journey/journey-store';

/**
 * Seed data renders on the server; the locally edited overlay is merged only after
 * hydration so the first client render still matches the server markup.
 */
export function useJourneyOverlay(tripId: string, seed: JourneyOverlay) {
  const [stored, setStored] = useState<JourneyOverlay>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStored(readOverlay(tripId));
    setError(null);
  }, [tripId]);

  const save = useCallback(
    (next: JourneyOverlay) => {
      const result = writeOverlay(tripId, next);
      setStored(next);
      setError(result.ok ? null : result.reason);
      return result.ok;
    },
    [tripId],
  );

  const reset = useCallback(() => {
    clearOverlay(tripId);
    setStored({});
    setError(null);
  }, [tripId]);

  // Must stay referentially stable: it feeds buildJourneyTrack, and a fresh object
  // every render would rebuild the whole map layer stack on every playback tick.
  const overlay = useMemo(() => mergeOverlay(seed, stored), [seed, stored]);

  return {
    overlay,
    stored,
    error,
    save,
    reset,
  };
}
