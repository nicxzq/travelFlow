import type { TripDay, TripEvent, TripWithDaysAndEvents } from '@/lib/domain/trip';
import { getActiveTripChanges, type TripChange, type TripExecutionState } from './model.ts';

export type ScheduleConflict = {
  dayId: string;
  earlierEventId: string;
  laterEventId: string;
};

export type ExecutionReviewCounts = {
  update: number;
  cancel: number;
  move: number;
  postpone: number;
  swap: number;
  actualComplete: number;
};

export type ExecutionReviewRow = {
  eventId: string;
  title: string;
  initialDayId: string;
  currentDayId: string;
  initialStartTime?: string;
  currentStartTime?: string;
  cancelled: boolean;
  actualAt?: string;
  changed: boolean;
};

export type ExecutionReview = {
  initialCount: number;
  currentActiveCount: number;
  counts: ExecutionReviewCounts;
  cancelledEventIds: string[];
  completedEventIds: string[];
  rows: ExecutionReviewRow[];
};

type EventLocation = {
  day: TripDay;
  event: TripEvent;
  index: number;
};

function cloneTrip(trip: TripWithDaysAndEvents): TripWithDaysAndEvents {
  return JSON.parse(JSON.stringify(trip)) as TripWithDaysAndEvents;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function timeToMinutes(value?: string) {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return undefined;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 1439) return undefined;
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function durationMinutes(event: TripEvent) {
  const start = timeToMinutes(event.startTime);
  const end = timeToMinutes(event.endTime);
  if (start === undefined || end === undefined || end < start) return undefined;
  return end - start;
}

function endTimeFrom(startTime: string | undefined, duration: number | undefined) {
  const start = timeToMinutes(startTime);
  if (start === undefined || duration === undefined) return undefined;
  return minutesToTime(start + duration);
}

function findEvent(trip: TripWithDaysAndEvents, eventId: string): EventLocation | undefined {
  for (const day of trip.days) {
    const index = day.events.findIndex((event) => event.id === eventId);
    if (index >= 0) return { day, event: day.events[index], index };
  }
  return undefined;
}

function applyUpdate(trip: TripWithDaysAndEvents, change: TripChange) {
  const location = findEvent(trip, change.eventId);
  const patch = change.payload.patch;
  if (!location || !isRecord(patch)) return;

  const safePatch = { ...patch } as Partial<TripEvent>;
  delete safePatch.id;
  delete safePatch.tripId;
  delete safePatch.dayId;
  Object.assign(location.event, safePatch);
}

function applyMove(trip: TripWithDaysAndEvents, change: TripChange) {
  const location = findEvent(trip, change.eventId);
  const targetDayId = change.payload.targetDayId;
  const targetDay = typeof targetDayId === 'string' ? trip.days.find((day) => day.id === targetDayId) : undefined;
  if (!location || !targetDay) return;

  location.day.events.splice(location.index, 1);
  location.event.dayId = targetDay.id;
  targetDay.events.push(location.event);
}

function shiftEvent(event: TripEvent, minutes: number) {
  const start = timeToMinutes(event.startTime);
  if (start === undefined) return;
  const shiftedStart = minutesToTime(start + minutes);
  if (!shiftedStart) {
    event.startTime = undefined;
    event.endTime = undefined;
    return;
  }

  const end = timeToMinutes(event.endTime);
  event.startTime = shiftedStart;
  event.endTime = end === undefined ? undefined : minutesToTime(end + minutes);
}

function applyPostpone(trip: TripWithDaysAndEvents, change: TripChange) {
  const location = findEvent(trip, change.eventId);
  const minutes = change.payload.minutes;
  if (!location || typeof minutes !== 'number' || !Number.isInteger(minutes)) return;

  const targetStart = timeToMinutes(location.event.startTime);
  for (const event of location.day.events) {
    const eventStart = timeToMinutes(event.startTime);
    const isAffected =
      event.id === location.event.id ||
      (targetStart !== undefined && eventStart !== undefined && eventStart >= targetStart);
    if (isAffected) shiftEvent(event, minutes);
  }
}

function applySwap(trip: TripWithDaysAndEvents, change: TripChange) {
  const first = findEvent(trip, change.eventId);
  const otherEventId = change.payload.otherEventId;
  const second = typeof otherEventId === 'string' ? findEvent(trip, otherEventId) : undefined;
  if (!first || !second || first.event.id === second.event.id) return;

  const firstDuration = durationMinutes(first.event);
  const secondDuration = durationMinutes(second.event);
  const firstStart = first.event.startTime;
  const secondStart = second.event.startTime;
  const movedFirst: TripEvent = {
    ...first.event,
    dayId: second.day.id,
    startTime: secondStart,
    endTime: endTimeFrom(secondStart, firstDuration),
  };
  const movedSecond: TripEvent = {
    ...second.event,
    dayId: first.day.id,
    startTime: firstStart,
    endTime: endTimeFrom(firstStart, secondDuration),
  };

  if (first.day.id === second.day.id) {
    first.day.events[first.index] = movedSecond;
    first.day.events[second.index] = movedFirst;
    return;
  }

  first.day.events[first.index] = movedSecond;
  second.day.events[second.index] = movedFirst;
}

function applyChange(trip: TripWithDaysAndEvents, change: TripChange) {
  if (change.type === 'update') {
    applyUpdate(trip, change);
    return;
  }
  if (change.type === 'move') {
    applyMove(trip, change);
    return;
  }
  if (change.type === 'postpone') {
    applyPostpone(trip, change);
    return;
  }
  if (change.type === 'swap') {
    applySwap(trip, change);
    return;
  }

  const location = findEvent(trip, change.eventId);
  if (!location) return;
  if (change.type === 'cancel') {
    location.event.status = 'cancelled';
  } else if (change.type === 'actual-complete' && typeof change.payload.actualAt === 'string') {
    location.event.actualAt = change.payload.actualAt;
    location.event.actualStatus = 'completed';
  }
}

export function foldTripExecution(state: TripExecutionState) {
  const current = cloneTrip(state.initialSnapshot);
  for (const change of getActiveTripChanges(state.changes)) {
    if (change.tripId === current.id) applyChange(current, change);
  }
  current.days.forEach((day) => day.events.forEach((event, index) => (event.sortOrder = index)));
  return current;
}

export function getScheduleConflicts(trip: TripWithDaysAndEvents) {
  const conflicts: ScheduleConflict[] = [];
  for (const day of trip.days) {
    const timedEvents = day.events
      .filter((event) => event.status !== 'cancelled' && timeToMinutes(event.startTime) !== undefined)
      .map((event, index) => ({ event, index }))
      .sort((a, b) => {
        const difference = (timeToMinutes(a.event.startTime) ?? 0) - (timeToMinutes(b.event.startTime) ?? 0);
        return difference || a.index - b.index;
      })
      .map(({ event }) => event);

    for (let index = 1; index < timedEvents.length; index += 1) {
      const earlier = timedEvents[index - 1];
      const later = timedEvents[index];
      const earlierEnd = timeToMinutes(earlier.endTime);
      const laterStart = timeToMinutes(later.startTime);
      if (earlierEnd !== undefined && laterStart !== undefined && earlierEnd > laterStart) {
        conflicts.push({ dayId: day.id, earlierEventId: earlier.id, laterEventId: later.id });
      }
    }
  }
  return conflicts;
}

export function getExecutionReview(state: TripExecutionState): ExecutionReview {
  const current = foldTripExecution(state);
  const activeChanges = getActiveTripChanges(state.changes);
  const counts: ExecutionReviewCounts = { update: 0, cancel: 0, move: 0, postpone: 0, swap: 0, actualComplete: 0 };

  for (const change of activeChanges) {
    if (change.type === 'actual-complete') counts.actualComplete += 1;
    else if (change.type !== 'undo') counts[change.type] += 1;
  }

  const initialEvents = state.initialSnapshot.days.flatMap((day) => day.events);
  const currentEvents = current.days.flatMap((day) => day.events);
  const currentById = new Map(currentEvents.map((event) => [event.id, event]));
  const rows = initialEvents.map((initialEvent) => {
    const currentEvent = currentById.get(initialEvent.id) ?? initialEvent;
    const changed =
      currentEvent.dayId !== initialEvent.dayId ||
      currentEvent.startTime !== initialEvent.startTime ||
      currentEvent.endTime !== initialEvent.endTime ||
      currentEvent.title !== initialEvent.title ||
      currentEvent.status === 'cancelled' ||
      currentEvent.actualStatus === 'completed';
    return {
      eventId: initialEvent.id,
      title: currentEvent.title,
      initialDayId: initialEvent.dayId,
      currentDayId: currentEvent.dayId,
      initialStartTime: initialEvent.startTime,
      currentStartTime: currentEvent.startTime,
      cancelled: currentEvent.status === 'cancelled',
      actualAt: currentEvent.actualAt,
      changed,
    };
  });

  return {
    initialCount: initialEvents.length,
    currentActiveCount: currentEvents.filter((event) => event.status !== 'cancelled').length,
    counts,
    cancelledEventIds: currentEvents.filter((event) => event.status === 'cancelled').map((event) => event.id),
    completedEventIds: currentEvents.filter((event) => event.actualStatus === 'completed').map((event) => event.id),
    rows,
  };
}
