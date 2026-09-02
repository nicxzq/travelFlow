import type { LatLng, TransportMode } from '@/lib/domain/journey';
import { greatCircleArc } from '@/lib/journey/arc';
import { densifyPath, haversineMeters } from '@/lib/journey/geo';

export type SegmentRequest = {
  key: string;
  from: LatLng;
  to: LatLng;
  mode: TransportMode;
};

export type SegmentResult = {
  key: string;
  path: LatLng[];
  precise: boolean;
};

type OsrmResponse = {
  routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> } }>;
};

const PROVIDERS = ['https://router.project-osrm.org', 'https://routing.openstreetmap.de/routed-car'];
const REQUEST_TIMEOUT_MS = 6_000;
const DEFAULT_CONCURRENCY = 3;
const COINCIDENT_METERS = 1;
const FLIGHT_ARC_STEPS = 96;

const cacheKey = (request: SegmentRequest, provider: string) => `journey-route:${request.key}:${provider}`;

const canUseStorage = () => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

function readCache(request: SegmentRequest, provider: string): LatLng[] | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(cacheKey(request, provider));
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const path = parsed.filter(
      (point): point is LatLng =>
        typeof point === 'object' &&
        point !== null &&
        typeof (point as LatLng).lat === 'number' &&
        typeof (point as LatLng).lng === 'number',
    );

    return path.length > 1 ? path : null;
  } catch {
    return null;
  }
}

function writeCache(request: SegmentRequest, provider: string, path: LatLng[]) {
  if (!canUseStorage()) return;

  try {
    window.sessionStorage.setItem(cacheKey(request, provider), JSON.stringify(path));
  } catch {
    // Quota exhausted or storage blocked: routing stays functional without the cache.
  }
}

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, timeoutMs);

  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    },
  };
}

async function fetchFromProvider(request: SegmentRequest, provider: string, signal?: AbortSignal): Promise<LatLng[]> {
  const cached = readCache(request, provider);
  if (cached) return cached;

  const url = `${provider}/route/v1/driving/${request.from.lng},${request.from.lat};${request.to.lng},${request.to.lat}?overview=full&geometries=geojson&steps=false`;
  const timeout = withTimeout(signal, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: timeout.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`route http ${response.status}`);

    const data = (await response.json()) as OsrmResponse;
    const coordinates = data.routes?.[0]?.geometry?.coordinates;
    if (!coordinates?.length) throw new Error('route geometry missing');

    const path = coordinates.map(([lng, lat]) => ({ lat, lng }));
    writeCache(request, provider, path);
    return path;
  } finally {
    timeout.dispose();
  }
}

/** Deterministic geometry: shown before OSRM answers, and kept whenever it cannot. */
function schematicSegment(request: SegmentRequest): SegmentResult {
  if (haversineMeters(request.from, request.to) <= COINCIDENT_METERS) {
    return { key: request.key, path: [request.from], precise: false };
  }

  const path =
    request.mode === 'flight'
      ? greatCircleArc(request.from, request.to, FLIGHT_ARC_STEPS)
      : densifyPath([request.from, request.to]);

  return { key: request.key, path, precise: false };
}

async function resolveSegment(request: SegmentRequest, signal?: AbortSignal): Promise<SegmentResult> {
  const schematic = schematicSegment(request);
  if (request.mode !== 'drive' || schematic.path.length < 2) return schematic;

  for (const provider of PROVIDERS) {
    if (signal?.aborted) break;

    try {
      const path = await fetchFromProvider(request, provider, signal);
      return { key: request.key, path, precise: true };
    } catch {
      continue;
    }
  }

  return schematic;
}

export async function fetchRouteSegments(
  requests: SegmentRequest[],
  options: { signal?: AbortSignal; concurrency?: number } = {},
): Promise<SegmentResult[]> {
  const results: SegmentResult[] = requests.map(schematicSegment);
  if (requests.length === 0) return results;

  const concurrency = Math.max(1, Math.min(options.concurrency ?? DEFAULT_CONCURRENCY, requests.length));
  let cursor = 0;

  async function worker() {
    while (cursor < requests.length) {
      const index = cursor;
      cursor += 1;

      try {
        results[index] = await resolveSegment(requests[index], options.signal);
      } catch {
        results[index] = schematicSegment(requests[index]);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  return results;
}
