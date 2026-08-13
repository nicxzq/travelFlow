import { Navigation, Sparkles } from 'lucide-react';
import type { TripEvent } from '@/lib/domain/trip';

type NextActionCardProps = {
  event: TripEvent;
  readOnly?: boolean;
  title?: string;
};

export function NextActionCard({ event, readOnly = false, title = 'Next Action' }: NextActionCardProps) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
        <Sparkles className="h-4 w-4" />
        {title}
      </p>
      <h2 className="mt-2 text-xl font-semibold">{event.title}</h2>
      <p className="mt-1 text-sm text-slate-600">建议时间：{event.startTime ?? '待定'}，地点：{event.locationName ?? '待定'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {event.navigationUrl ? (
          <a
            href={event.navigationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Navigation className="h-4 w-4" />
            外部导航
          </a>
        ) : null}
        {readOnly ? <span className="rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-800">只读同步</span> : null}
      </div>
    </section>
  );
}
