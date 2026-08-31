import type { LatLng } from '@/lib/domain/journey';

export type PathMetrics = {
  cumulative: number[];
  total: number;
};

const EARTH_RADIUS_METERS = 6_371_000;
const DEFAULT_STEP_METERS = 2_200;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function densifyPath(path: LatLng[], stepMeters = DEFAULT_STEP_METERS): LatLng[] {
  if (path.length <= 1) return [...path];

  const step = stepMeters > 0 ? stepMeters : DEFAULT_STEP_METERS;
  const result: LatLng[] = [path[0]];

  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1];
    const to = path[index];
    const inserts = Math.max(0, Math.ceil(haversineMeters(from, to) / step) - 1);

    for (let insert = 1; insert <= inserts; insert += 1) {
      const ratio = insert / (inserts + 1);
      result.push({
        lat: from.lat + (to.lat - from.lat) * ratio,
        lng: from.lng + (to.lng - from.lng) * ratio,
      });
    }

    result.push(to);
  }

  return result;
}

export function pathMetrics(path: LatLng[]): PathMetrics {
  const cumulative: number[] = [];
  let total = 0;

  for (let index = 0; index < path.length; index += 1) {
    if (index > 0) total += haversineMeters(path[index - 1], path[index]);
    cumulative.push(total);
  }

  return { cumulative, total };
}

function locateSegment(metrics: PathMetrics, distanceMeters: number) {
  for (let index = 1; index < metrics.cumulative.length; index += 1) {
    const start = metrics.cumulative[index - 1];
    const end = metrics.cumulative[index];
    if (end >= distanceMeters && end > start) {
      return { index, ratio: (distanceMeters - start) / (end - start) };
    }
  }

  return null;
}

export function interpolateAlong(path: LatLng[], metrics: PathMetrics, distanceMeters: number): LatLng | null {
  if (path.length === 0) return null;
  if (path.length === 1 || distanceMeters <= 0 || metrics.total <= 0) return path[0];
  if (distanceMeters >= metrics.total) return path[path.length - 1];

  const found = locateSegment(metrics, distanceMeters);
  if (!found) return path[path.length - 1];

  const from = path[found.index - 1];
  const to = path[found.index];

  return {
    lat: from.lat + (to.lat - from.lat) * found.ratio,
    lng: from.lng + (to.lng - from.lng) * found.ratio,
  };
}

export function partialPath(path: LatLng[], metrics: PathMetrics, distanceMeters: number): LatLng[] {
  if (path.length === 0) return [];
  if (path.length === 1 || distanceMeters <= 0 || metrics.total <= 0) return [path[0]];
  if (distanceMeters >= metrics.total) return [...path];

  const found = locateSegment(metrics, distanceMeters);
  if (!found) return [...path];

  const head = path.slice(0, found.index);
  const tip = interpolateAlong(path, metrics, distanceMeters);

  return tip ? [...head, tip] : head;
}
