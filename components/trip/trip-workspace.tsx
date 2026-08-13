import Link from 'next/link';
import { AlertTriangle, CalendarDays, CheckCircle2, Lock, Share2 } from 'lucide-react';
import { getNextEvent, getTripScheduleContext } from '@/lib/domain/trip-schedule';
import type { TripEvent, TripWithDaysAndEvents } from '@/lib/domain/trip';
import { NextActionCard } from '@/components/trip/next-action-card';
import { TimelineCard } from '@/components/trip/timeline-card';

type TripWorkspaceProps = {
  trip: TripWithDaysAndEvents;
  readOnly?: boolean;
};

function getEventState(event: TripEvent): 'active' | 'past' | 'future' {
  const now = new Date();
  const current = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);

  if (event.startTime && event.endTime && current >= event.startTime && current <= event.endTime) {
    return 'active';
  }

  if (event.endTime && current > event.endTime) {
    return 'past';
  }

  return 'future';
}

function formatPhase(phase: string) {
  if (phase === 'pretrip') return '行前准备';
  if (phase === 'posttrip') return '行后归档';
  return '行中管理';
}

export function TripWorkspace({ trip, readOnly = false }: TripWorkspaceProps) {
  const context = getTripScheduleContext(trip);
  const nextEvent = getNextEvent(context.today);

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-md bg-slate-900 px-2 py-1 text-white">{formatPhase(context.phase)}</span>
          {readOnly ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1">
              <Lock className="h-3.5 w-3.5" />
              同行只读同步
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1">
              <Share2 className="h-3.5 w-3.5" />
              可分享给同行
            </span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{trip.title}</h1>
          <p className="mt-2 text-slate-600">
            {trip.destination} · {trip.startDate} ~ {trip.endDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/trip" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            返回行程管理
          </Link>
          {!readOnly ? (
            <Link
              href={`/trip/${trip.id}/share`}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              <Share2 className="h-4 w-4" />
              同行分享
            </Link>
          ) : null}
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">行程总览</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-500">天数</p>
            <p className="mt-1 font-semibold">{trip.days.length} 天</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-500">当前导引</p>
            <p className="mt-1 font-semibold">
              Day {context.today.dayIndex} · {context.today.date}
            </p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-500">待办</p>
            <p className="mt-1 font-semibold">{context.todayTodos.length + context.upcomingTodos.length} 项待关注</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <NextActionCard event={nextEvent} readOnly={readOnly} />

        <aside className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            今日重点
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            Day {context.today.dayIndex} · {context.today.date}
          </h2>
          <p className="mt-2 text-sm text-amber-900">{context.today.summary}</p>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            今日待办
          </h2>
          <div className="mt-3 space-y-2">
            {context.todayTodos.length === 0 ? <p className="text-sm text-slate-500">今天暂无待办。</p> : null}
            {context.todayTodos.map((todo) => (
              <div key={todo.id} className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                {todo.title}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            明日预告
          </h2>
          {context.tomorrow ? (
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium">
                  Day {context.tomorrow.dayIndex} · {context.tomorrow.date}
                </p>
                <p className="mt-1 text-sm text-slate-600">{context.tomorrow.summary}</p>
              </div>
              <div className="space-y-2">
                {context.tomorrow.events.slice(0, 3).map((event) => (
                  <div key={event.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <span className="font-medium">{event.startTime ?? '--:--'}</span> · {event.title}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">没有下一天安排。</p>
          )}
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Day {context.today.dayIndex} · 时间线
        </h2>
        <div className="space-y-3">
          {context.today.events.map((event) => (
            <TimelineCard key={event.id} event={event} state={getEventState(event)} readOnly={readOnly} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">完整行程</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {trip.days.map((day) => (
            <article key={day.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-medium">
                Day {day.dayIndex} · {day.date}
              </p>
              <p className="mt-1 text-sm text-slate-600">{day.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
