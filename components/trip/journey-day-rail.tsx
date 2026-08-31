'use client';

import type { JourneyDay } from '@/lib/domain/journey';

type JourneyDayRailProps = {
  days: JourneyDay[];
  activeDayIndex: number;
  onSelect: (dayIndex: number) => void;
  className?: string;
};

export function JourneyDayRail({ days, activeDayIndex, onSelect, className }: JourneyDayRailProps) {
  return (
    <nav
      aria-label="按天选择"
      className={`flex gap-2 overflow-x-auto rounded-xl border border-white/60 bg-white/92 p-2 shadow-lg backdrop-blur md:flex-col md:overflow-y-auto ${className ?? ''}`}
    >
      {days.map((day) => {
        const active = day.dayIndex === activeDayIndex;
        return (
          <button
            type="button"
            key={day.dayId}
            onClick={() => onSelect(day.dayIndex)}
            aria-current={active ? 'true' : undefined}
            className={`flex min-w-[190px] shrink-0 items-center gap-2.5 rounded-lg border p-2.5 text-left transition md:min-w-0 ${
              active ? 'border-emerald-200 bg-emerald-50' : 'border-transparent hover:bg-slate-50'
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              D{day.dayIndex}
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-slate-500">{day.date}</span>
              <span className="block truncate text-xs font-medium text-slate-900">{day.summary ?? `${day.stopCount} 站`}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
