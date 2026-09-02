'use client';

import { Loader2, Pause, Play, RotateCcw } from 'lucide-react';
import { DEFAULT_SPEED, type PlaybackStatus } from '@/hooks/use-journey-playback';

type JourneyPlayerBarProps = {
  status: PlaybackStatus;
  dayIndex: number;
  stopLabel: string;
  traveledMeters: number;
  totalMeters: number;
  precise: boolean;
  speed: number;
  onToggle: () => void;
  onReset: () => void;
  onSeek: (ratio: number) => void;
  onSpeedChange: (speed: number) => void;
};

const SPEEDS = [0.5, 1, 2, DEFAULT_SPEED, 5, 8];

export function JourneyPlayerBar({
  status,
  dayIndex,
  stopLabel,
  traveledMeters,
  totalMeters,
  precise,
  speed,
  onToggle,
  onReset,
  onSeek,
  onSpeedChange,
}: JourneyPlayerBarProps) {
  const ratio = totalMeters > 0 ? traveledMeters / totalMeters : 0;
  const playing = status === 'playing';
  const loading = status === 'loadingRoute';

  return (
    <div className="w-full rounded-xl bg-slate-900/92 p-3 text-white shadow-xl backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={loading}
          aria-label={playing ? '暂停轨迹播放' : '播放轨迹'}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3 text-[11px] text-slate-300">
            <span className="truncate">
              第 {dayIndex} 天 · {stopLabel}
            </span>
            <span className="shrink-0">
              {loading ? '正在获取公路路线…' : `${precise ? '公路路线' : '示意路线'} · ${Math.round(traveledMeters / 1000)} / ${Math.round(totalMeters / 1000)} km`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(ratio * 1000)}
            onChange={(event) => onSeek(Number(event.target.value) / 1000)}
            aria-label="行程进度"
            className="mt-1.5 w-full accent-emerald-500"
          />
        </div>

        <button
          type="button"
          onClick={onReset}
          aria-label="回到起点"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <select
          value={speed}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          aria-label="播放速度"
          className="hidden shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 sm:block"
        >
          {SPEEDS.map((value) => (
            <option key={value} value={value}>
              {value}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
