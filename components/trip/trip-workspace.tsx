'use client';

import Link from 'next/link';
import { AlertTriangle, BookOpenCheck, CalendarDays, ClipboardList, Lock, RotateCcw, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getNextEvent, getTripScheduleContext } from '@/lib/domain/trip-schedule';
import type { TripDay, TripEvent, TripWithDaysAndEvents } from '@/lib/domain/trip';
import { DestinationMap } from '@/components/trip/destination-map';
import { NextActionCard } from '@/components/trip/next-action-card';
import { NearbyDecisionCard } from '@/components/trip/nearby-decision-card';
import { TimelineCard } from '@/components/trip/timeline-card';
import { TripReviewCard } from '@/components/trip/trip-review-card';
import type { JourneyStop } from '@/lib/domain/journey';
import { getDestinationMapPoints } from '@/lib/mock/destination-map';
import { getJourneyOverlaySeed } from '@/lib/mock/journey-seed';
import { getStudyCardForEvent, type StudyCard } from '@/lib/mock/study-cards';
import { getStudyStorageKey, parseStudyProgress, serializeStudyProgress } from '@/lib/study/progress';
import {
  createTripChange,
  getActiveTripChanges,
  getTripExecutionStorageKey,
  parseTripExecution,
  serializeTripExecution,
  type TripChange,
  type TripChangeType,
  type TripExecutionState,
} from '@/lib/trip-execution/model';
import { foldTripExecution, getExecutionReview, getScheduleConflicts } from '@/lib/trip-execution/reducer';

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
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [executionState, setExecutionState] = useState<TripExecutionState>(() => parseTripExecution(null, trip).state);
  const [hydratedExecutionTripId, setHydratedExecutionTripId] = useState<string | null>(null);
  const [executionStorageHealthy, setExecutionStorageHealthy] = useState(true);
  const [executionWarning, setExecutionWarning] = useState<string | null>(null);
  const [completedStudyTaskIds, setCompletedStudyTaskIds] = useState<string[]>([]);
  const [studyAnswers, setStudyAnswers] = useState<Record<string, string>>({});
  const [hydratedStudyTripId, setHydratedStudyTripId] = useState<string | null>(null);
  const executionMatchesTrip = executionState.initialSnapshot.id === trip.id;
  const currentTrip = useMemo(
    () => (executionMatchesTrip ? foldTripExecution(executionState) : trip),
    [executionMatchesTrip, executionState, trip],
  );
  const context = getTripScheduleContext(currentTrip);
  const sortedDays = useMemo(() => [...currentTrip.days].sort((a, b) => a.dayIndex - b.dayIndex), [currentTrip.days]);
  const displayDays = useMemo(
    () =>
      sortedDays.map((day) => ({
        ...day,
        events: sortEventsForNow(day.events, day.date),
      })),
    [sortedDays],
  );
  const sourceVisibleDay = sortedDays.find((day) => day.id === selectedDayId) ?? context.today;
  const visibleDay = displayDays.find((day) => day.id === sourceVisibleDay.id) ?? sourceVisibleDay;
  const activeVisibleEvents = visibleDay.events.filter((event) => event.status !== 'cancelled');
  const cancelledVisibleEvents = visibleDay.events.filter((event) => event.status === 'cancelled');
  const tomorrow = context.tomorrow ? displayDays.find((day) => day.id === context.tomorrow?.id) : undefined;
  const nextEvent = getDisplayNextEvent({ ...visibleDay, events: activeVisibleEvents }, context.phase);
  const cancelledEventIds = new Set(currentTrip.days.flatMap((day) => day.events.filter((event) => event.status === 'cancelled').map((event) => event.id)));
  const mapPoints = getDestinationMapPoints(currentTrip.destination).filter((point) => !point.eventId || !cancelledEventIds.has(point.eventId));
  const mapTrip = useMemo(
    () => ({
      ...currentTrip,
      days: displayDays.map((day) => ({ ...day, events: day.events.filter((event) => event.status !== 'cancelled') })),
    }),
    [currentTrip, displayDays],
  );
  const overlaySeed = useMemo(() => getJourneyOverlaySeed(trip.id), [trip.id]);
  const activeTodos = (currentTrip.todos ?? [])
    .filter((todo) => !doneTodoIds.includes(todo.id) && todo.status !== 'done')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const pretripTodos = activeTodos.filter(
    (todo) => todo.scope === 'trip' || todo.dayId === sortedDays[0]?.id || todo.dueDate === currentTrip.startDate,
  );
  const completedCount = (currentTrip.todos ?? []).filter((todo) => doneTodoIds.includes(todo.id) || todo.status === 'done').length;
  const visibleStudyCards = activeVisibleEvents.map(getStudyCardForEvent).filter(isStudyCard);
  const scheduleConflicts = useMemo(() => getScheduleConflicts(currentTrip), [currentTrip]);
  const executionReview = useMemo(
    () => getExecutionReview(executionMatchesTrip ? executionState : parseTripExecution(null, trip).state),
    [executionMatchesTrip, executionState, trip],
  );
  const activeExecutionChanges = useMemo(
    () => (executionMatchesTrip ? getActiveTripChanges(executionState.changes) : []),
    [executionMatchesTrip, executionState.changes],
  );
  const visibleDayPosition = sortedDays.findIndex((day) => day.id === visibleDay.id);
  const visibleNextDayId = visibleDayPosition >= 0 ? sortedDays[visibleDayPosition + 1]?.id : undefined;
  const pretripNotices = [
    visibleDay.summary,
    '导航、景区开放和天气以当天官方信息为准，长车程日优先保留还车和高速缓冲。',
  ].filter(Boolean);

  useEffect(() => {
    const storageKey = getTripExecutionStorageKey(trip.id);
    setHydratedExecutionTripId(null);
    setExecutionState(parseTripExecution(null, trip).state);
    setExecutionWarning(null);

    try {
      const result = parseTripExecution(window.localStorage.getItem(storageKey), trip);
      setExecutionState(result.state);
      setExecutionStorageHealthy(!result.invalid);
      if (result.invalid) {
        setExecutionWarning('本地行程变更记录已损坏，当前暂用原计划展示；为避免覆盖，已暂停本地保存。');
      } else if (result.rebased && result.discardedChangeCount > 0) {
        setExecutionWarning(
          `基础行程已更新为平遥安排；保留了仍有效的修改，移除了 ${result.discardedChangeCount} 条已失效的旧地点修改。`,
        );
      }
    } catch {
      setExecutionStorageHealthy(false);
      setExecutionWarning('浏览器暂时无法读取本地行程记录，本次修改刷新后可能丢失。');
    } finally {
      setHydratedExecutionTripId(trip.id);
    }
  }, [trip]);

  useEffect(() => {
    if (
      hydratedExecutionTripId !== trip.id ||
      executionState.initialSnapshot.id !== trip.id ||
      !executionStorageHealthy
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(getTripExecutionStorageKey(trip.id), serializeTripExecution(executionState));
      } catch {
        setExecutionStorageHealthy(false);
        setExecutionWarning('浏览器无法保存最新行程变更，本次修改刷新后可能丢失。');
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [executionState, executionStorageHealthy, hydratedExecutionTripId, trip.id]);

  useEffect(() => {
    const storageKey = getStudyStorageKey(trip.id);
    setHydratedStudyTripId(null);

    try {
      const result = parseStudyProgress(window.localStorage.getItem(storageKey));
      setCompletedStudyTaskIds(result.state.completedTaskIds);
      setStudyAnswers(result.state.answers);
      if (result.invalid) window.localStorage.removeItem(storageKey);
    } catch {
      setCompletedStudyTaskIds([]);
      setStudyAnswers({});
    } finally {
      setHydratedStudyTripId(trip.id);
    }
  }, [trip.id]);

  useEffect(() => {
    if (hydratedStudyTripId !== trip.id) return undefined;

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
  }, [completedStudyTaskIds, hydratedStudyTripId, studyAnswers, trip.id]);

  function toggleTodo(todoId: string) {
    if (readOnly) return;
    setDoneTodoIds((current) => (current.includes(todoId) ? current.filter((id) => id !== todoId) : [...current, todoId]));
  }

  function appendExecutionChange(change: TripChange) {
    if (readOnly || change.tripId !== trip.id) return;
    setExecutionState((current) =>
      current.initialSnapshot.id === trip.id ? { ...current, changes: [...current.changes, change] } : current,
    );
  }

  function makeChange(type: TripChangeType, eventId: string, payload: Record<string, unknown>, undoOf?: string) {
    return createTripChange({ tripId: trip.id, type, eventId, payload, undoOf });
  }

  function updateEvent(eventId: string, patch: Partial<TripEvent>) {
    appendExecutionChange(makeChange('update', eventId, { patch }));
  }

  function postponeEvent(eventId: string, minutes: number) {
    appendExecutionChange(makeChange('postpone', eventId, { minutes }));
  }

  function moveEvent(eventId: string, targetDayId: string) {
    if (currentTrip.days.some((day) => day.id === targetDayId)) {
      appendExecutionChange(makeChange('move', eventId, { targetDayId }));
      setSelectedDayId(targetDayId);
    }
  }

  function swapEvents(eventId: string, otherEventId: string) {
    appendExecutionChange(makeChange('swap', eventId, { otherEventId }));
  }

  function cancelEvent(eventId: string) {
    appendExecutionChange(makeChange('cancel', eventId, {}));
  }

  function undoEventChange(eventId: string, type: TripChangeType) {
    const change = [...activeExecutionChanges]
      .reverse()
      .find((candidate) => candidate.eventId === eventId && candidate.type === type);
    if (change) appendExecutionChange(makeChange('undo', eventId, {}, change.id));
  }

  function restoreEvent(eventId: string) {
    undoEventChange(eventId, 'cancel');
  }

  function toggleActualComplete(eventId: string) {
    const event = currentTrip.days.flatMap((day) => day.events).find((candidate) => candidate.id === eventId);
    if (event?.actualStatus === 'completed') {
      undoEventChange(eventId, 'actual-complete');
    } else {
      appendExecutionChange(makeChange('actual-complete', eventId, { actualAt: new Date().toISOString() }));
    }
  }

  function undoLatestChange() {
    const latest = activeExecutionChanges.at(-1);
    if (latest) appendExecutionChange(makeChange('undo', latest.eventId, {}, latest.id));
  }

  function selectJourneyStop(stop: JourneyStop) {
    setSelectedEventId(stop.eventId);
    setSelectedDayId(stop.dayId);
    window.requestAnimationFrame(() => {
      document.getElementById(`day-${stop.dayIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <h1 className="text-3xl font-semibold tracking-tight">{currentTrip.title}</h1>
          <p className="mt-2 text-slate-600">
            {currentTrip.destination} · {currentTrip.startDate} ~ {currentTrip.endDate}
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

      {executionWarning && hydratedExecutionTripId === trip.id ? (
        <section role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          {executionWarning}
        </section>
      ) : null}

      {!readOnly && activeExecutionChanges.length > 0 ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div>
            <p className="text-sm font-medium text-blue-950">已记录 {activeExecutionChanges.length} 次有效调整</p>
            <p className="mt-1 text-xs text-blue-800">初始计划保持不变，当前安排由变更记录计算。</p>
          </div>
          <button
            type="button"
            onClick={undoLatestChange}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <RotateCcw className="h-4 w-4" />
            撤销最近修改
          </button>
        </section>
      ) : null}

      {scheduleConflicts.length > 0 ? (
        <section role="status" className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-950">
          当前有 {scheduleConflicts.length} 处时间重叠，请检查受影响日期；系统不会自动压缩游玩时间。
        </section>
      ) : null}

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
            <p className="mt-1 font-semibold">{currentTrip.days.length} 天</p>
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
        trip={mapTrip}
        overlaySeed={overlaySeed}
        activeDayIndex={visibleDay.dayIndex}
        selectedEventId={selectedEventId}
        readOnly={readOnly}
        onStopSelect={selectJourneyStop}
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

      {context.phase === 'intrip' ? <NearbyDecisionCard trip={currentTrip} currentEvent={nextEvent} mapPoints={mapPoints} /> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {context.phase === 'pretrip' ? null : (
          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              行程待办
            </h2>
            <div className="mt-3 space-y-2">
              {currentTrip.todos?.length === 0 ? <p className="text-sm text-slate-500">暂无待办。</p> : null}
              {(currentTrip.todos ?? []).map((todo) => (
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
                {tomorrow.events.filter((event) => event.status !== 'cancelled').slice(0, 3).map((event) => (
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
          {activeVisibleEvents.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">当天暂无有效安排。</p> : null}
          {activeVisibleEvents.map((event, index) => (
            <TimelineCard
              key={event.id}
              event={event}
              state={getEventState(event, visibleDay.date)}
              readOnly={readOnly}
              studyCard={getStudyCardForEvent(event)}
              completedStudyTaskIds={completedStudyTaskIds}
              studyAnswers={studyAnswers}
              availableDays={sortedDays}
              nextDayId={visibleNextDayId}
              nextEventId={activeVisibleEvents[index + 1]?.id}
              onChange={updateEvent}
              onPostpone={postponeEvent}
              onMove={moveEvent}
              onSwap={swapEvents}
              onCancel={cancelEvent}
              onRestore={restoreEvent}
              onToggleActualComplete={toggleActualComplete}
              onToggleStudyTask={toggleStudyTask}
              onStudyAnswerChange={updateStudyAnswer}
            />
          ))}
        </div>
      </section>

      {cancelledVisibleEvents.length > 0 ? (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <h2 className="font-semibold text-slate-800">已取消</h2>
            <p className="mt-1 text-xs text-slate-500">取消记录仍会保留，用于撤销和旅行复盘，不等于永久删除。</p>
          </div>
          {cancelledVisibleEvents.map((event) => (
            <TimelineCard
              key={event.id}
              event={event}
              state="past"
              readOnly={readOnly}
              availableDays={sortedDays}
              onRestore={restoreEvent}
            />
          ))}
        </section>
      ) : null}

      {context.phase === 'pretrip' ? null : <TripReviewCard trip={currentTrip} review={executionReview} />}

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
