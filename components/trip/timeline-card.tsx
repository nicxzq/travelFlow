import { Clock3, Navigation } from 'lucide-react';
import type { TripEvent } from '@/lib/domain/trip';

type TimelineCardProps = {
  event: TripEvent;
  state: 'active' | 'past' | 'future';
  readOnly?: boolean;
};

export function TimelineCard({ event, state, readOnly = false }: TimelineCardProps) {
  const style =
    state === 'active'
      ? 'border-emerald-300 bg-emerald-50'
      : state === 'past'
        ? 'border-slate-200 bg-slate-100 opacity-70'
        : 'border-slate-200 bg-white';

  return (
    <article className={`rounded-xl border p-4 shadow-sm transition ${style}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{event.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{event.description ?? '暂无描述'}</p>
        </div>
        <span className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white">{event.category}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <Clock3 className="h-4 w-4" />
        <span>
          {event.startTime ?? '--:--'} - {event.endTime ?? '--:--'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {event.navigationUrl ? (
          <a
            href={event.navigationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Navigation className="h-4 w-4" />
            导航前往
          </a>
        ) : null}
        {readOnly ? <span className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500">只读</span> : null}
        {state === 'active' ? (
          <span className="rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">进行中</span>
        ) : null}
      </div>
    </article>
  );
}
