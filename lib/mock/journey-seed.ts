import type { JourneyOverlay } from '@/lib/domain/journey';
import { SHANXI_ACTUAL_TRIP_ID, shanxiActualOverlay } from '@/lib/mock/shanxi-actual';
import { SOUTHWEST_LOOP_TRIP_ID, southwestLoopOverlay } from '@/lib/mock/southwest-loop';

const seeds: Record<string, JourneyOverlay> = {
  [SHANXI_ACTUAL_TRIP_ID]: shanxiActualOverlay,
  [SOUTHWEST_LOOP_TRIP_ID]: southwestLoopOverlay,
};

export function getJourneyOverlaySeed(tripId: string): JourneyOverlay {
  return seeds[tripId] ?? {};
}
