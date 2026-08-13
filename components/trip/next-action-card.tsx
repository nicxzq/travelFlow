import { Navigation, Sparkles } from 'lucide-react';
import type { TripEvent } from '@/lib/domain/trip';

type NextActionCardProps = {
  event?: TripEvent;
  readOnly?: boolean;
  title?: string;
  state?: 'active' | 'past' | 'future';
};

const stateLabels = {
  active: '进行中',
  past: '今日已结束',
  future: '即将开始',
};

export function NextActionCard({ event, readOnly = false, title = '下一站', state = 'future' }: NextActionCardProps) {
  if (!event) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
          <Sparkles className="h-4 w-4" />
          {title}
        </p>
        <h2 className="mt-2 text-xl font-semibold">暂无下一站</h2>
        <p className="mt-1 text-sm text-slate-600">当天行程已结束或暂无安排。</p>
      </section>
    );
  }

  return (
    <section className={`rounded-lg border p-5 ${state === 'active' ? 'border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-100' : 'border-emerald-200 bg-emerald-50'}`}>
      <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
        <Sparkles className={`h-4 w-4 ${state === 'active' ? 'animate-pulse' : ''}`} />
        {title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{event.title}</h2>
        <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-medium text-emerald-800">{stateLabels[state]}</span>
      </div>
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
