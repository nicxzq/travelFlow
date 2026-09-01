'use client';

import { Layers, MapPin, Maximize2, Minimize2, Pencil, Play, Route } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useExpandedOverlay } from '@/hooks/use-expanded-overlay';
import { useJourneyOverlay } from '@/hooks/use-journey-overlay';
import { useJourneyPlayback } from '@/hooks/use-journey-playback';
import { buildJourneyTrack, type JourneyOverlay, type JourneyStop, type LatLng } from '@/lib/domain/journey';
import type { TripWithDaysAndEvents } from '@/lib/domain/trip';
import type { BaseLayerId, JourneyMapController } from '@/components/trip/journey-map-canvas';
import { JourneyDayRail } from '@/components/trip/journey-day-rail';
import { JourneyPlayerBar } from '@/components/trip/journey-player-bar';
import { JourneyStopEditor } from '@/components/trip/journey-stop-editor';
import { JourneyStoryCard } from '@/components/trip/journey-story-card';

const JourneyMapCanvas = dynamic(
  () => import('@/components/trip/journey-map-canvas').then((module) => module.JourneyMapCanvas),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-slate-100" />,
  },
);

type DestinationMapProps = {
  trip: TripWithDaysAndEvents;
  overlaySeed?: JourneyOverlay;
  activeDayIndex?: number;
  selectedEventId?: string;
  readOnly?: boolean;
  onStopSelect?: (stop: JourneyStop) => void;
};

const ACTION_BUTTON = 'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition';

export function DestinationMap({
  trip,
  overlaySeed = {},
  activeDayIndex,
  selectedEventId,
  readOnly = false,
  onStopSelect,
}: DestinationMapProps) {
  const { overlay, stored, error, save, reset } = useJourneyOverlay(trip.id, overlaySeed);
  const track = useMemo(() => buildJourneyTrack(trip, overlay), [overlay, trip]);

  const controllerRef = useRef<JourneyMapController | null>(null);
  const routePathsRef = useRef<LatLng[][]>([]);
  const lastFrameRef = useRef<{ position: LatLng; traveled: LatLng[]; segmentIndex: number } | null>(null);

  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [canvasRevision, setCanvasRevision] = useState(0);
  const [baseLayer, setBaseLayer] = useState<BaseLayerId>('osm');
  const [journeyMode, setJourneyMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const playback = useJourneyPlayback(track, {
    onFrame: useCallback((position: LatLng, traveled: LatLng[], segmentIndex: number) => {
      lastFrameRef.current = { position, traveled, segmentIndex };
      controllerRef.current?.setVehicle(position);
      controllerRef.current?.setProgress(segmentIndex, traveled);
    }, []),
    onArrive: useCallback((stopIndex: number) => setActiveStopIndex(stopIndex), []),
    onSegmentsChange: useCallback((paths: LatLng[][]) => {
      routePathsRef.current = paths;
      controllerRef.current?.setRouteGeometry(paths);
    }, []),
  });

  const { expanded, mounted, open, close } = useExpandedOverlay();
  const activeStop = track.stops[activeStopIndex];
  const activeDay = track.days.find((day) => day.dayIndex === (activeStop?.dayIndex ?? activeDayIndex));

  useEffect(() => {
    if (!selectedEventId) return;
    const index = track.stops.findIndex((stop) => stop.eventId === selectedEventId);
    if (index >= 0) setActiveStopIndex(index);
  }, [selectedEventId, track.stops]);

  // The canvas remounts when the map moves between the page and the overlay, so
  // route geometry and the vehicle are replayed onto the fresh controller. This is
  // keyed on canvasRevision rather than `expanded` alone: the dynamic chunk may not
  // have mounted yet at the moment the overlay opens.
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    controller.setBaseLayer(baseLayer);
    if (routePathsRef.current.length) controller.setRouteGeometry(routePathsRef.current);
    if (lastFrameRef.current) {
      controller.setVehicle(lastFrameRef.current.position);
      controller.setProgress(lastFrameRef.current.segmentIndex, lastFrameRef.current.traveled);
    }
    controller.invalidate();
  }, [baseLayer, canvasRevision, expanded]);

  const selectStop = useCallback(
    (index: number) => {
      setActiveStopIndex(index);
      playback.seekToStop(index);
      const stop = track.stops[index];
      if (stop) onStopSelect?.(stop);
    },
    [onStopSelect, playback, track.stops],
  );

  const togglePlayback = useCallback(() => {
    if (playback.status === 'playing') playback.pause();
    else void playback.play();
  }, [playback]);

  const toggleJourneyMode = useCallback(() => {
    setJourneyMode((current) => {
      if (current) playback.reset();
      else void playback.play();
      return !current;
    });
  }, [playback]);

  if (track.stops.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">目的地地图</h2>
        <p className="mt-2 text-sm text-slate-500">
          当前行程还没有带坐标的站点{track.unresolvedEventIds.length ? `（${track.unresolvedEventIds.length} 个行程点缺少经纬度）` : ''}。
        </p>
      </section>
    );
  }

  const actions = (
    <div className="flex flex-wrap items-center gap-1.5">
      {expanded ? null : (
        <button
          type="button"
          onClick={toggleJourneyMode}
          aria-pressed={journeyMode}
          className={`${ACTION_BUTTON} ${
            journeyMode
              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {journeyMode ? <Route className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {journeyMode ? '退出轨迹' : '轨迹动画'}
        </button>
      )}
      <button
        type="button"
        onClick={() => setBaseLayer((current) => (current === 'osm' ? 'satellite' : 'osm'))}
        className={`${ACTION_BUTTON} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
      >
        <Layers className="h-3.5 w-3.5" />
        {baseLayer === 'osm' ? '卫星图' : '标准图'}
      </button>
      {readOnly ? null : (
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className={`${ACTION_BUTTON} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
        >
          <Pencil className="h-3.5 w-3.5" />
          编辑
        </button>
      )}
      <button
        type="button"
        onClick={(event) => {
          if (expanded) close();
          else {
            setJourneyMode(true);
            open(event.currentTarget);
          }
        }}
        className={`${ACTION_BUTTON} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
      >
        {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        {expanded ? '退出全屏' : '全屏'}
      </button>
    </div>
  );

  const canvas = (
    <JourneyMapCanvas
      stops={track.stops}
      activeStopIndex={activeStopIndex}
      controllerRef={controllerRef}
      onReady={() => setCanvasRevision((revision) => revision + 1)}
      onStopSelect={selectStop}
      className="h-full w-full"
    />
  );

  const player = (
    <JourneyPlayerBar
      status={playback.status}
      dayIndex={activeStop?.dayIndex ?? 1}
      stopLabel={activeStop?.title ?? ''}
      traveledMeters={playback.traveledMeters}
      totalMeters={playback.totalMeters}
      precise={playback.precise}
      speed={playback.speed}
      onToggle={togglePlayback}
      onReset={playback.reset}
      onSeek={playback.seekToRatio}
      onSpeedChange={playback.setSpeed}
    />
  );

  const storyCard = activeStop ? (
    <JourneyStoryCard
      stop={activeStop}
      index={activeStopIndex}
      total={track.stops.length}
      date={activeDay?.date}
      traveling={playback.status === 'playing'}
      onPrev={() => selectStop(Math.max(0, activeStopIndex - 1))}
      onNext={() => selectStop(Math.min(track.stops.length - 1, activeStopIndex + 1))}
    />
  ) : null;

  const editor =
    editorOpen && !readOnly ? (
      <JourneyStopEditor
        track={track}
        overlay={stored}
        storageError={error}
        onSave={save}
        onReset={reset}
        onClose={() => setEditorOpen(false)}
      />
    ) : null;

  if (expanded && mounted) {
    return createPortal(
      <div
        ref={(node) => node?.focus()}
        tabIndex={-1}
        className="fixed inset-0 z-[60] h-[100dvh] w-screen bg-slate-950 outline-none"
        role="dialog"
        aria-modal="true"
        aria-label="行程轨迹全屏播放"
      >
        <div className="absolute inset-0">{canvas}</div>

        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start gap-3 p-4">
          <div className="pointer-events-auto rounded-xl border border-white/60 bg-white/92 px-3.5 py-2.5 shadow-lg backdrop-blur">
            <h2 className="text-sm font-bold">{track.title}</h2>
            <p className="text-[11px] text-slate-500">{track.subtitle}</p>
          </div>
          <div className="pointer-events-auto ml-auto">{actions}</div>
        </header>

        <JourneyDayRail
          days={track.days}
          activeDayIndex={activeStop?.dayIndex ?? 1}
          onSelect={playback.selectDay}
          className="absolute inset-x-3 bottom-28 z-20 max-h-32 md:inset-x-auto md:left-4 md:top-24 md:bottom-32 md:w-[280px] xl:w-[300px]"
        />

        <div className="absolute right-3 top-24 z-20 w-[calc(100%-1.5rem)] max-h-[42vh] overflow-auto md:right-4 md:w-[320px] md:max-h-[calc(100%-14rem)] xl:w-[360px]">
          {storyCard}
        </div>

        <div className="absolute bottom-4 left-1/2 z-30 w-[min(760px,calc(100vw-1.5rem))] -translate-x-1/2 pb-[env(safe-area-inset-bottom)]">
          {player}
        </div>

        {editor}
      </div>,
      document.body,
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 px-5 pt-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-emerald-600" />
            目的地地图
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {track.stops.length} 个点位 · 点击联动行程
            {track.unresolvedEventIds.length ? ` · ${track.unresolvedEventIds.length} 个行程点待补坐标` : ''}
          </p>
        </div>
        {actions}
      </div>

      <div className="mt-4 grid lg:grid-cols-[1.6fr_320px]">
        <div className="relative h-[420px] lg:h-[520px]">{canvas}</div>

        <div className="max-h-[420px] space-y-2 overflow-auto border-t border-slate-200 bg-slate-50 p-4 lg:max-h-[520px] lg:border-l lg:border-t-0">
          {journeyMode
            ? storyCard
            : track.stops.map((stop, index) => (
                <button
                  type="button"
                  key={stop.eventId}
                  onClick={() => selectStop(index)}
                  className={`w-full rounded-md border p-3 text-left text-sm transition hover:border-emerald-300 hover:bg-emerald-50 ${
                    index === activeStopIndex
                      ? 'border-amber-300 bg-amber-50'
                      : stop.dayIndex === activeDayIndex
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  <p className="font-medium text-slate-900">
                    Day {stop.dayIndex} · {stop.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stop.time ? `${stop.time} · ` : ''}
                    {stop.tags.slice(0, 2).join(' · ') || stop.kind}
                  </p>
                </button>
              ))}
        </div>
      </div>

      {journeyMode ? <div className="border-t border-slate-200 bg-slate-50 p-4">{player}</div> : null}

      {editor}
    </section>
  );
}
