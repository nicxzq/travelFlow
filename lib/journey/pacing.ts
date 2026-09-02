import type { TransportMode } from '@/lib/domain/journey';

/**
 * Playback time is budgeted per leg, not spread evenly over distance. Pure
 * distance-proportional pacing gave the two 895 km flights 74% of the animation
 * while a 0.52 km city hop got a single frame; per-mode weights alone cannot fix
 * that, because the 0.52 km hop and a 195 km transfer are both `drive`.
 */
export const MS_PER_KM: Record<TransportMode, number> = {
  walk: 260,
  drive: 90,
  rail: 26,
  flight: 13,
};

export const MIN_SEGMENT_MS = 650;
export const MAX_SEGMENT_MS = 9_000;
export const COINCIDENT_METERS = 1;

export function segmentDurationMs(meters: number, mode: TransportMode): number {
  if (meters <= COINCIDENT_METERS) return 0;

  return Math.min(Math.max((meters / 1000) * MS_PER_KM[mode], MIN_SEGMENT_MS), MAX_SEGMENT_MS);
}
