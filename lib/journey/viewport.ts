import type { LatLng } from '@/lib/domain/journey';
import { haversineMeters } from '@/lib/journey/geo';

const OUTLIER_FACTOR = 3;
const MIN_RADIUS_KM = 60;
const MIN_RETENTION = 0.6;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/**
 * Framing set for the initial view: the median-anchored core of the trip, with
 * far-flung endpoints dropped so a cross-province journey opens on its
 * destination rather than on a country-scale smudge. Playback still visits every
 * stop — this only decides where the camera starts.
 *
 * The retention floor keeps genuinely two-centred trips intact: this rejects
 * outliers, not bimodality.
 */
export function selectCoreStops<T extends LatLng>(stops: T[]): T[] {
  if (stops.length <= 2) return stops;

  const center = {
    lat: median(stops.map((stop) => stop.lat)),
    lng: median(stops.map((stop) => stop.lng)),
  };
  const distancesKm = stops.map((stop) => haversineMeters(stop, center) / 1000);
  const thresholdKm = Math.max(OUTLIER_FACTOR * median(distancesKm), MIN_RADIUS_KM);
  const core = stops.filter((_, index) => distancesKm[index] <= thresholdKm);

  return core.length < stops.length * MIN_RETENTION ? stops : core;
}
