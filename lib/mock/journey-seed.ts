import type { JourneyOverlay } from '@/lib/domain/journey';
import { SHANXI_ACTUAL_TRIP_ID, shanxiActualOverlay } from '@/lib/mock/shanxi-actual';

const seeds: Record<string, JourneyOverlay> = {
  [SHANXI_ACTUAL_TRIP_ID]: shanxiActualOverlay,
};

export function getJourneyOverlaySeed(tripId: string): JourneyOverlay {
  return seeds[tripId] ?? {};
}
