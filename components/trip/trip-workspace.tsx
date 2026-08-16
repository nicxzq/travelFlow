'use client';

import Link from 'next/link';
import { AlertTriangle, BookOpenCheck, CalendarDays, ClipboardList, Lock, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getNextEvent, getTripScheduleContext } from '@/lib/domain/trip-schedule';
import type { TripDay, TripEvent, TripWithDaysAndEvents } from '@/lib/domain/trip';
import { DestinationMap } from '@/components/trip/destination-map';
import { NextActionCard } from '@/components/trip/next-action-card';
import { TimelineCard } from '@/components/trip/timeline-card';
import { getDestinationMapPoints, type DestinationMapPoint } from '@/lib/mock/destination-map';
import { getStudyCardForEvent, type StudyCard } from '@/lib/mock/study-cards';
import { getStudyStorageKey, parseStudyProgress, serializeStudyProgress } from '@/lib/study/progress';

type TripWorkspaceProps = {
  trip: TripWithDaysAndEvents;
  readOnly?: boolean;
};

function dateOnly(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function getEventState(event: TripEvent, dayDate?: string): 'active' | 'past' | 'future' {
  const now = new Date();
  const currentDate = dateOnly(now);

  if (dayDate && dayDate > currentDate) return 'future';
  if (dayDate && dayDate < currentDate) return 'past';

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

function sortEventsForNow(events: TripEvent[], dayDate?: string) {
  const currentDate = dateOnly(new Date());
  return events
    .map((event, index) => ({ event, index, state: getEventState(event, dayDate) }))
    .sort((a, b) => {
      if (dayDate === currentDate && a.state !== b.state) {
        if (a.state === 'active') return -1;
        if (b.state === 'active') return 1;
      }
      const aTime = a.event.startTime ?? '99:99';
      const bTime = b.event.startTime ?? '99:99';
      if (aTime !== bTime) return aTime.localeCompare(bTime);
      return a.index - b.index;
    })
    .map(({ event }) => event);
}

function formatPhase(phase: string) {
  if (phase === 'pretrip') return '行前准备';
  if (phase === 'posttrip') return '行后归档';
  return '行中管理';
}

function isStudyCard(card: StudyCard | undefined): card is StudyCard {
  return Boolean(card);
}

function getDisplayNextEvent(day: TripDay, phase: string) {
  if (phase === 'posttrip') return undefined;
  if (phase === 'pretrip' || day.date !== dateOnly(new Date())) return day.events[0];
  return getNextEvent(day);
}

function getNextActionTitle(day: TripDay, phase: string) {
  if (phase === 'posttrip') return '行程已结束';
  if (phase === 'pretrip') return '首站预览';
  if (day.date !== dateOnly(new Date())) return '所选日期首站';
  return '下一站';
}

export function TripWorkspace({ trip, readOnly = false }: TripWorkspaceProps) {
  const [doneTodoIds, setDoneTodoIds] = useState<string[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | undefined>();
  const [eventOverrides, setEventOverrides] = useState<Record<string, Partial<TripEvent>>>({});
  const [deletedEventIds, setDeletedEventIds] = useState<string[]>([]);
  const [completedStudyTaskIds, setCompletedStudyTaskIds] = useState<string[]>([]);
  const [studyAnswers, setStudyAnswers] = useState<Record<string, string>>({});
  const [hasHydratedStudyProgress, setHasHydratedStudyProgress] = useState(false);
  const context = getTripScheduleContext(trip);
  const sortedDays = useMemo(() => [...trip.days].sort((a, b) => a.dayIndex - b.dayIndex), [trip.days]);
  const daysWithOverrides = useMemo(
    () =>
      sortedDays.map((day) => ({
        ...day,
        events: sortEventsForNow(
          day.events
            .filter((event) => !deletedEventIds.includes(event.id))
            .map((event) => ({ ...event, ...eventOverrides[event.id] })),
          day.date,
        ),
      })),
    [deletedEventIds, eventOverrides, sortedDays],
  );
  const sourceVisibleDay = sortedDays.find((day) => day.id === selectedDayId) ?? context.today;
  const visibleDay = daysWithOverrides.find((day) => day.id === sourceVisibleDay.id) ?? sourceVisibleDay;
  const tomorrow = context.tomorrow ? daysWithOverrides.find((day) => day.id === context.tomorrow?.id) : undefined;
  const nextEvent = getDisplayNextEvent(visibleDay, context.phase);
  const mapPoints = getDestinationMapPoints(trip.destination).filter((point) => !point.eventId || !deletedEventIds.includes(point.eventId));
  const activeTodos = (trip.todos ?? [])
    .filter((todo) => !doneTodoIds.includes(todo.id) && todo.status !== 'done')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const pretripTodos = activeTodos.filter((todo) => todo.scope === 'trip' || todo.dayId === sortedDays[0]?.id || todo.dueDate === trip.startDate);
  const completedCount = (trip.todos ?? []).filter((todo) => doneTodoIds.includes(todo.id) || todo.status === 'done').length;
  const visibleStudyCards = visibleDay.events.map(getStudyCardForEvent).filter(isStudyCard);
  const pretripNotices = [
    visibleDay.summary,
    '导航、景区开放和天气以当天官方信息为准，长车程日优先保留还车和高速缓冲。',
  ].filter(Boolean);

  useEffect(() => {
    const storageKey = getStudyStorageKey(trip.id);
    setHasHydratedStudyProgress(false);

    try {
      const result = parseStudyProgress(window.localStorage.getItem(storageKey));
      setCompletedStudyTaskIds(result.state.completedTaskIds);
      setStudyAnswers(result.state.answers);
      if (result.invalid) window.localStorage.removeItem(storageKey);
    } catch {
      setCompletedStudyTaskIds([]);
      setStudyAnswers({});
    } finally {
      setHasHydratedStudyProgress(true);
    }
  }, [trip.id]);

  useEffect(() => {
    if (!hasHydratedStudyProgress) return undefined;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          getStudyStorageKey(trip.id),
          serializeStudyProgress({ completedTaskIds: completedStudyTaskIds, answers: studyAnswers }),
        );
      } catch {
        // Keep the in-memory answers usable when browser storage is unavailable.
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [completedStudyTaskIds, hasHydratedStudyProgress, studyAnswers, trip.id]);

  function toggleTodo(todoId: string) {
    if (readOnly) return;
    setDoneTodoIds((current) => (current.includes(todoId) ? current.filter((id) => id !== todoId) : [...current, todoId]));
  }

  function updateEvent(eventId: string, patch: Partial<TripEvent>) {
    setEventOverrides((current) => ({
      ...current,
      [eventId]: {
        ...current[eventId],
        ...patch,
      },
    }));
  }

  function deleteEvent(eventId: string) {
    setDeletedEventIds((current) => (current.includes(eventId) ? current : [...current, eventId]));
  }

  function selectMapPoint(point: DestinationMapPoint) {
    setSelectedPointId(point.id);
    const day = daysWithOverrides.find((item) => item.dayIndex === point.dayIndex);
    if (day) setSelectedDayId(day.id);
    window.requestAnimationFrame(() => {
      document.getElementById(`day-${point.dayIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function selectDay(dayId: string, dayIndex: number) {
    setSelectedDayId(dayId);
    window.requestAnimationFrame(() => {
      document.getElementById(`day-${dayIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function toggleStudyTask(taskId: string) {
    if (readOnly) return;
    setCompletedStudyTaskIds((current) => (current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]));
  }

  function updateStudyAnswer(taskId: string, value: string) {
    if (readOnly) return;
    const trimmed = value.trim();

    setStudyAnswers((current) => {
      const next = { ...current };
      if (trimmed) next[taskId] = value;
      else delete next[taskId];
      return next;
    });

    if (trimmed) {
      setCompletedStudyTaskIds((current) => (current.includes(taskId) ? current : [...current, taskId]));
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
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

      {context.phase === 'pretrip' ? (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-lg border border-emerald-200 bg-white p-5">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              当前要做
            </h2>
            <div className="mt-3 space-y-2">
              {pretripTodos.length === 0 ? <p className="text-sm text-slate-500">行前待办已完成。</p> : null}
              {pretripTodos.slice(0, 5).map((todo) => (
                <label key={todo.id} className="flex items-start gap-3 rounded-md bg-emerald-50 p-3 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={doneTodoIds.includes(todo.id) || todo.status === 'done'}
                    disabled={readOnly}
                    onChange={() => toggleTodo(todo.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className={doneTodoIds.includes(todo.id) || todo.status === 'done' ? 'text-slate-400 line-through' : ''}>
                    {todo.title}
                  </span>
                </label>
              ))}
            </div>
          </article>

          <aside className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              注意事项
            </p>
            <div className="mt-3 space-y-2">
              {pretripNotices.map((notice) => (
                <p key={notice} className="rounded-md bg-white/70 p-3 text-sm text-amber-950">
                  {notice}
                </p>
              ))}
            </div>
          </aside>
        </section>
      ) : null}

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
              {context.phase === 'pretrip' ? '未成行规划管理' : `Day ${context.today.dayIndex} · ${context.today.date}`}
            </p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-500">待办</p>
            <p className="mt-1 font-semibold">
              {activeTodos.length} 项待关注 · {completedCount} 项已完成
            </p>
          </div>
        </div>
      </section>

      <DestinationMap
        points={mapPoints}
        activeDayIndex={visibleDay.dayIndex}
        selectedPointId={selectedPointId}
        onPointSelect={selectMapPoint}
      />

      {context.phase === 'pretrip' ? null : (
        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <NextActionCard
            event={nextEvent}
            readOnly={readOnly}
            title={getNextActionTitle(visibleDay, context.phase)}
            state={nextEvent ? getEventState(nextEvent, visibleDay.date) : 'future'}
          />

          <aside className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              今日重点
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Day {visibleDay.dayIndex} · {visibleDay.date}
            </h2>
            <p className="mt-2 text-sm text-amber-900">{visibleDay.summary}</p>
          </aside>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        {context.phase === 'pretrip' ? null : (
          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              行程待办
            </h2>
            <div className="mt-3 space-y-2">
              {trip.todos?.length === 0 ? <p className="text-sm text-slate-500">暂无待办。</p> : null}
              {(trip.todos ?? []).map((todo) => (
                <label key={todo.id} className="flex items-start gap-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={doneTodoIds.includes(todo.id) || todo.status === 'done'}
                    disabled={readOnly}
                    onChange={() => toggleTodo(todo.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className={doneTodoIds.includes(todo.id) || todo.status === 'done' ? 'text-slate-400 line-through' : ''}>
                    {todo.title}
                  </span>
                </label>
              ))}
            </div>
          </article>
        )}

        <article className="rounded-lg border border-cyan-200 bg-cyan-50 p-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <BookOpenCheck className="h-5 w-5 text-cyan-700" />
            今日研学
          </h2>
          {visibleStudyCards.length > 0 ? (
            <div className="mt-3 space-y-2">
              {visibleStudyCards.map((card) => (
                <div key={card.id} className="rounded-md bg-white/80 p-3 text-sm">
                  <p className="font-medium text-cyan-950">{card.theme}</p>
                  <p className="mt-1 text-xs text-cyan-800">
                    {card.roleName} · {card.estimatedMinutes} 分钟 · {card.badgeName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-cyan-900">当天景点暂无研学任务。</p>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            明日预告
          </h2>
          {tomorrow ? (
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium">
                  Day {tomorrow.dayIndex} · {tomorrow.date}
                </p>
                <p className="mt-1 text-sm text-slate-600">{tomorrow.summary}</p>
              </div>
              <div className="space-y-2">
                {tomorrow.events.slice(0, 3).map((event) => (
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
        <h2 id={`day-${visibleDay.dayIndex}`} className="scroll-mt-28 text-lg font-semibold">
          Day {visibleDay.dayIndex} · 时间线
        </h2>
        <div className="space-y-3">
          {visibleDay.events.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">当天行程已删除或暂无安排。</p> : null}
          {visibleDay.events.map((event) => (
            <TimelineCard
              key={event.id}
              event={event}
              state={getEventState(event, visibleDay.date)}
              readOnly={readOnly}
              studyCard={getStudyCardForEvent(event)}
              completedStudyTaskIds={completedStudyTaskIds}
              studyAnswers={studyAnswers}
              onChange={updateEvent}
              onDelete={deleteEvent}
              onToggleStudyTask={toggleStudyTask}
              onStudyAnswerChange={updateStudyAnswer}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">完整行程</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {sortedDays.map((day) => (
            <button
              type="button"
              key={day.id}
              onClick={() => selectDay(day.id, day.dayIndex)}
              className={`rounded-md border p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 ${
                visibleDay.id === day.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
              }`}
            >
              <p className="font-medium">
                Day {day.dayIndex} · {day.date}
              </p>
              <p className="mt-1 text-sm text-slate-600">{day.summary}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
