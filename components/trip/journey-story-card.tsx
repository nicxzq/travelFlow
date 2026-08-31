'use client';

import { ChevronLeft, ChevronRight, Navigation } from 'lucide-react';
import type { JourneyStop } from '@/lib/domain/journey';
import { StopImage } from '@/components/trip/stop-image';

type JourneyStoryCardProps = {
  stop: JourneyStop;
  index: number;
  total: number;
  date?: string;
  traveling?: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

export function JourneyStoryCard({
  stop,
  index,
  total,
  date,
  traveling = false,
  onPrev,
  onNext,
  className,
}: JourneyStoryCardProps) {
  return (
    <article
      // `invisible` (visibility:hidden) also removes the inner controls from the tab
      // order and from hit-testing, which `opacity-0` alone would not.
      className={`overflow-hidden rounded-xl border border-white/60 bg-white/95 shadow-lg backdrop-blur transition-opacity duration-300 ${
        traveling ? 'invisible opacity-0' : 'visible opacity-100'
      } ${className ?? ''}`}
      aria-hidden={traveling}
    >
      <StopImage
        src={stop.imageUrl}
        alt={stop.title}
        badge={`DAY ${stop.dayIndex} · ${String(stop.order + 1).padStart(2, '0')}`}
        className="h-40 md:h-48"
      />

      <div className="space-y-2 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
          {date ?? ''} {stop.time ? `· ${stop.time}` : ''}
        </p>
        <h3 className="text-lg font-semibold leading-snug text-slate-900">{stop.title}</h3>

        {stop.story ? <p className="max-h-40 overflow-auto text-sm leading-relaxed text-slate-700">{stop.story}</p> : null}

        {stop.tags.length ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {stop.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={index <= 0}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            上一站
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={index >= total - 1}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            下一站
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {stop.navigationUrl ? (
          <a
            href={stop.navigationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
          >
            <Navigation className="h-3.5 w-3.5" />
            打开导航
          </a>
        ) : null}
      </div>
    </article>
  );
}
