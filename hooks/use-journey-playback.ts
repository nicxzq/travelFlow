'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JourneyTrack, LatLng } from '@/lib/domain/journey';
import { buildJourneySegments } from '@/lib/domain/journey';
import { densifyPath, interpolateAlong, partialPath, pathMetrics, type PathMetrics } from '@/lib/journey/geo';
import { segmentDurationMs } from '@/lib/journey/pacing';
import { fetchRouteSegments, type SegmentRequest } from '@/lib/journey/route-service';

export type PlaybackStatus = 'idle' | 'loadingRoute' | 'playing' | 'paused' | 'finished';

export type PlaybackHandlers = {
  onFrame: (position: LatLng, traveled: LatLng[], segmentIndex: number) => void;
  onArrive: (stopIndex: number) => void;
  onSegmentsChange: (paths: LatLng[][]) => void;
};

type ResolvedSegment = {
  fromStopIndex: number;
  toStopIndex: number;
  dayIndex: number;
  path: LatLng[];
  metrics: PathMetrics;
  startMeters: number;
  metersPerMs: number;
  precise: boolean;
};

/** Trips are long; 1x is a review speed, not the one people watch at. */
export const DEFAULT_SPEED = 3;
const MAX_FRAME_DELTA_MS = 64;
const STATE_SYNC_INTERVAL_MS = 100;
const ARRIVAL_PAUSE_MS = 900;

export function useJourneyPlayback(track: JourneyTrack, handlers: PlaybackHandlers) {
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const routeTokenRef = useRef(0);

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [dayIndex, setDayIndex] = useState(track.days[0]?.dayIndex ?? 1);
  const [stopIndex, setStopIndex] = useState(0);
  const [traveledMeters, setTraveledMeters] = useState(0);
  const [precise, setPrecise] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [routeRevision, setRouteRevision] = useState(0);

  const routePathsRef = useRef(new Map<string, { path: LatLng[]; precise: boolean }>());
  const distanceRef = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const baseSegments = useMemo(() => buildJourneySegments(track), [track]);
  const segmentModes = useMemo(() => baseSegments.map((segment) => segment.mode), [baseSegments]);

  /** Changes whenever the stop composition changes, not just when the trip changes. */
  const trackSignature = useMemo(
    () => `${track.tripId}::${track.stops.map((stop) => `${stop.eventId}@${stop.lat},${stop.lng}`).join('|')}`,
    [track.stops, track.tripId],
  );

  const segments = useMemo<ResolvedSegment[]>(() => {
    let startMeters = 0;

    return baseSegments.map((segment) => {
      const resolved = routePathsRef.current.get(segment.key);
      const path = resolved?.path ?? densifyPath([segment.from, segment.to]);
      const metrics = pathMetrics(path);
      const durationMs = segmentDurationMs(metrics.total, segment.mode);
      const item: ResolvedSegment = {
        fromStopIndex: segment.fromIndex,
        toStopIndex: segment.toIndex,
        dayIndex: track.stops[segment.toIndex]?.dayIndex ?? 1,
        path,
        metrics,
        startMeters,
        metersPerMs: durationMs > 0 ? metrics.total / durationMs : 0,
        precise: resolved?.precise ?? false,
      };
      startMeters += metrics.total;
      return item;
    });
    // routeRevision invalidates the memo once resolved routes land in the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseSegments, routeRevision, track.stops]);

  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const totalMeters = segments.length
    ? segments[segments.length - 1].startMeters + segments[segments.length - 1].metrics.total
    : 0;
  const totalMetersRef = useRef(totalMeters);
  totalMetersRef.current = totalMeters;

  const stopOffset = useCallback((index: number) => {
    const list = segmentsRef.current;
    if (list.length === 0) return 0;
    if (index <= 0) return 0;
    if (index >= list.length) return totalMetersRef.current;
    return list[index - 1].startMeters + list[index - 1].metrics.total;
  }, []);

  const cancelFrames = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;
  }, []);

  const locate = useCallback((distance: number) => {
    const list = segmentsRef.current;
    if (list.length === 0) return null;

    const clamped = Math.min(Math.max(distance, 0), totalMetersRef.current);
    let index = list.findIndex((segment) => clamped < segment.startMeters + segment.metrics.total);
    if (index === -1) index = list.length - 1;

    const segment = list[index];
    return {
      segment,
      segmentIndex: index,
      offset: Math.min(Math.max(clamped - segment.startMeters, 0), segment.metrics.total),
      distance: clamped,
    };
  }, []);

  const emitFrame = useCallback(
    (distance: number, syncState: boolean) => {
      const found = locate(distance);
      if (!found) return;

      const position = interpolateAlong(found.segment.path, found.segment.metrics, found.offset);
      if (!position) return;

      distanceRef.current = found.distance;
      handlersRef.current.onFrame(
        position,
        partialPath(found.segment.path, found.segment.metrics, found.offset),
        found.segmentIndex,
      );

      if (!syncState) return;

      setTraveledMeters(found.distance);
      setDayIndex((current) => (current === found.segment.dayIndex ? current : found.segment.dayIndex));
      setPrecise((current) => (current === found.segment.precise ? current : found.segment.precise));

      const nextStop = found.offset >= found.segment.metrics.total ? found.segment.toStopIndex : found.segment.fromStopIndex;
      setStopIndex((current) => (current === nextStop ? current : nextStop));
    },
    [locate],
  );

  const pause = useCallback(() => {
    runIdRef.current += 1;
    cancelFrames();
    setStatus((current) => (current === 'finished' || current === 'idle' ? current : 'paused'));
  }, [cancelFrames]);

  const loadRoutes = useCallback(async () => {
    const token = routeTokenRef.current + 1;
    routeTokenRef.current = token;
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    const requests: SegmentRequest[] = baseSegments.map((segment) => ({
      key: segment.key,
      from: segment.from,
      to: segment.to,
      mode: segment.mode,
    }));

    const results = await fetchRouteSegments(requests, { signal: controller.signal, concurrency: 3 });
    if (token !== routeTokenRef.current) return;

    results.forEach((result) => routePathsRef.current.set(result.key, { path: result.path, precise: result.precise }));
    setRouteRevision((revision) => revision + 1);
    handlersRef.current.onSegmentsChange(results.map((result) => result.path));
  }, [baseSegments]);

  const play = useCallback(async () => {
    if (segmentsRef.current.length === 0) return;

    const token = runIdRef.current + 1;
    runIdRef.current = token;
    cancelFrames();

    if (distanceRef.current >= totalMetersRef.current) {
      distanceRef.current = 0;
      emitFrame(0, true);
    }

    if (routePathsRef.current.size === 0) {
      setStatus('loadingRoute');
      await loadRoutes();
      if (token !== runIdRef.current) return;
    }

    setStatus('playing');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      segmentsRef.current.forEach((segment) => {
        emitFrame(segment.startMeters + segment.metrics.total, true);
        handlersRef.current.onArrive(segment.toStopIndex);
      });
      setStatus('finished');
      return;
    }

    let previousTimestamp = performance.now();
    let lastSync = 0;
    let cursor = locate(distanceRef.current)?.segmentIndex ?? 0;

    const step = (timestamp: number) => {
      if (token !== runIdRef.current) return;

      const list = segmentsRef.current;
      const total = totalMetersRef.current;
      const delta = Math.min(timestamp - previousTimestamp, MAX_FRAME_DELTA_MS);
      previousTimestamp = timestamp;

      const current = list[cursor];
      const boundary = current ? current.startMeters + current.metrics.total : total;
      // A sub-metre leg gets no duration budget, so it is stepped over rather than
      // advanced through; otherwise a zero rate would spin the loop forever.
      const advanced =
        current && current.metersPerMs === 0
          ? boundary
          : distanceRef.current + delta * (current?.metersPerMs ?? 0) * speedRef.current;

      // Stop exactly on the stop rather than sliding past it, so the arrival pause
      // and the story card land on the right place.
      if (current && advanced >= boundary && cursor < list.length - 1) {
        emitFrame(boundary, true);
        lastSync = timestamp;

        // Advance one segment only. A following zero-length segment (two stops
        // sharing coordinates) trips this branch again on the next frame and gets
        // its own arrival, instead of being silently skipped.
        cursor += 1;
        handlersRef.current.onArrive(current.toStopIndex);
        timerRef.current = window.setTimeout(() => {
          if (token !== runIdRef.current) return;
          previousTimestamp = performance.now();
          rafRef.current = requestAnimationFrame(step);
        }, ARRIVAL_PAUSE_MS / Math.max(0.5, speedRef.current));
        return;
      }

      const next = Math.min(total, advanced);
      const syncState = timestamp - lastSync >= STATE_SYNC_INTERVAL_MS || next >= total;

      emitFrame(next, syncState);
      if (syncState) lastSync = timestamp;

      if (next >= total) {
        handlersRef.current.onArrive(track.stops.length - 1);
        setStatus('finished');
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [cancelFrames, emitFrame, loadRoutes, locate, track.stops.length]);

  const seekToStop = useCallback(
    (index: number) => {
      pause();
      emitFrame(stopOffset(index), true);
      setStopIndex(index);
    },
    [emitFrame, pause, stopOffset],
  );

  const seekToRatio = useCallback(
    (ratio: number) => {
      pause();
      emitFrame(totalMetersRef.current * Math.min(Math.max(ratio, 0), 1), true);
    },
    [emitFrame, pause],
  );

  const selectDay = useCallback(
    (index: number) => {
      const day = track.days.find((item) => item.dayIndex === index);
      if (!day) return;
      seekToStop(day.firstStopIndex);
      setDayIndex(index);
    },
    [seekToStop, track.days],
  );

  const reset = useCallback(() => {
    pause();
    setStatus('idle');
    emitFrame(0, true);
  }, [emitFrame, pause]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') pause();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [pause]);

  useEffect(
    () => () => {
      runIdRef.current += 1;
      routeTokenRef.current += 1;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    runIdRef.current += 1;
    routeTokenRef.current += 1;
    abortRef.current?.abort();
    routePathsRef.current.clear();
    distanceRef.current = 0;
    setRouteRevision((revision) => revision + 1);
    setStatus('idle');
    setStopIndex(0);
    setTraveledMeters(0);
    setPrecise(false);
  }, [trackSignature]);

  return {
    status,
    dayIndex,
    stopIndex,
    traveledMeters,
    totalMeters,
    precise,
    speed,
    segmentModes,
    play,
    pause,
    seekToStop,
    seekToRatio,
    selectDay,
    setSpeed,
    reset,
  };
}
