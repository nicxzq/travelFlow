import type { JourneyStop, LatLng } from '@/lib/domain/journey';
import type { TransportMode } from '@/lib/domain/trip';
import { haversineMeters } from '@/lib/journey/geo';

/**
 * Leg mode is derived from great-circle distance rather than from a province
 * lookup. Province bounding boxes and centroids both place Yunqiushan
 * (35.7538, 111.0192) in Shaanxi, which would draw an aeroplane across a 95 km
 * intra-Shanxi drive. A distance band can mislabel a short cross-province hop,
 * but it never produces a route that looks absurd on the map.
 *
 * Titles are deliberately not consulted: a stop named 返程航班 carries the
 * departure airport's coordinates, so matching on it would turn the 5 km
 * transfer *to* that airport into a flight.
 */
export const WALK_MAX_KM = 1.2;
export const DRIVE_MAX_KM = 320;
export const RAIL_MAX_KM = 700;

/** Matches JourneyStop.mode. Named to fail loudly if that field is ever renamed. */
type LegEnd = LatLng & Pick<JourneyStop, 'mode'>;

export function resolveLegMode(from: LatLng, to: LegEnd): TransportMode {
  if (to.mode) return to.mode;

  const kilometres = haversineMeters(from, to) / 1000;
  if (kilometres <= WALK_MAX_KM) return 'walk';
  if (kilometres <= DRIVE_MAX_KM) return 'drive';
  if (kilometres <= RAIL_MAX_KM) return 'rail';
  return 'flight';
}
