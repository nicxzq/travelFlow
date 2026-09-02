import type { TripDay, TripEvent, TripWithDaysAndEvents } from '@/lib/domain/trip';
import {
  countTripChanges,
  getActiveTripChanges,
  isBaselineStale,
  type TripChange,
  type TripExecutionState,
} from './model.ts';

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
  deviationMinutes?: number;
  changed: boolean;
  missing: boolean;
};

export type ExecutionReview = {
  archived: boolean;
  archivedAt?: string;
  baselineStale: boolean;
  changesAfterArchive: number;
  initialCount: number;
  currentActiveCount: number;
  counts: ExecutionReviewCounts;
  cancelledEventIds: string[];
  completedEventIds: string[];
  addedEventIds: string[];
  rows: ExecutionReviewRow[];
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type RecommendationPromptInput = {
  placeName: string;
  availableHours: number;
  tripTitle: string;
  coordinates?: GeoPoint;
  remainingEvents?: string[];
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
  // Plan side is the untouched original; actual side is the frozen archive once
  // one exists, so a later seed revision can no longer rewrite either end.
  const baseline = state.originalPlan;
  const archive = state.archive;
  const current = archive?.finalSnapshot ?? foldTripExecution(state);
  const activeChanges = getActiveTripChanges(state.changes);
  // Counts must come from the same instant as `current`, or an archived review
  // reports a cancellation its own frozen rows cannot show.
  const raw = archive?.counts ?? countTripChanges(state.changes);
  const counts: ExecutionReviewCounts = {
    update: raw.update,
    cancel: raw.cancel,
    move: raw.move,
    postpone: raw.postpone,
    swap: raw.swap,
    actualComplete: raw['actual-complete'],
  };

  const initialEvents = baseline.days.flatMap((day) => day.events);
  const initialDayDates = new Map(baseline.days.map((day) => [day.id, day.date]));
  const currentEvents = current.days.flatMap((day) => day.events);
  const currentById = new Map(currentEvents.map((event) => [event.id, event]));
  const baselineIds = new Set(initialEvents.map((event) => event.id));
  const rows = initialEvents.map((initialEvent) => {
    // An event absent from the actual trip is a real deviation. Falling back to
    // the baseline event here would report it as unchanged.
    const currentEvent = currentById.get(initialEvent.id);
    const actual = currentEvent ?? initialEvent;
    const missing = currentEvent === undefined;
    const changed =
      missing ||
      actual.dayId !== initialEvent.dayId ||
      actual.startTime !== initialEvent.startTime ||
      actual.endTime !== initialEvent.endTime ||
      actual.title !== initialEvent.title ||
      actual.status === 'cancelled' ||
      actual.actualStatus === 'completed';
    const initialDate = initialDayDates.get(initialEvent.dayId);
    const plannedAt =
      initialDate && initialEvent.startTime ? new Date(`${initialDate}T${initialEvent.startTime}:00+08:00`).getTime() : Number.NaN;
    const actualAt = actual.actualAt ? new Date(actual.actualAt).getTime() : Number.NaN;
    const deviationMinutes =
      Number.isFinite(plannedAt) && Number.isFinite(actualAt) ? Math.round((actualAt - plannedAt) / 60000) : undefined;
    return {
      eventId: initialEvent.id,
      title: actual.title,
      initialDayId: initialEvent.dayId,
      currentDayId: actual.dayId,
      initialStartTime: initialEvent.startTime,
      currentStartTime: actual.startTime,
      cancelled: actual.status === 'cancelled',
      actualAt: actual.actualAt,
      deviationMinutes,
      changed,
      missing,
    };
  });

  return {
    archived: Boolean(archive),
    archivedAt: archive?.archivedAt,
    baselineStale: isBaselineStale(state),
    changesAfterArchive: archive ? Math.max(activeChanges.length - archive.activeChangeCount, 0) : 0,
    initialCount: initialEvents.length,
    currentActiveCount: currentEvents.filter((event) => event.status !== 'cancelled').length,
    counts,
    cancelledEventIds: currentEvents.filter((event) => event.status === 'cancelled').map((event) => event.id),
    completedEventIds: currentEvents.filter((event) => event.actualStatus === 'completed').map((event) => event.id),
    addedEventIds: currentEvents.filter((event) => !baselineIds.has(event.id)).map((event) => event.id),
    rows,
  };
}

export function distanceInKilometers(from: GeoPoint, to: GeoPoint) {
  const earthRadius = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

export function buildRecommendationPrompt(input: RecommendationPromptInput) {
  const coordinateLine = input.coordinates
    ? `当前位置坐标：${input.coordinates.lat.toFixed(5)}, ${input.coordinates.lng.toFixed(5)}。`
    : '没有提供精确坐标，请以当前地点名称为中心检索。';
  const remainingLine = input.remainingEvents?.length
    ? `当前行程尚有：${input.remainingEvents.join('、')}。请避免推荐明显重复的地点。`
    : '当前没有可用的剩余行程清单。';

  return [
    `我正在执行“${input.tripTitle}”，目前在${input.placeName}附近，可用时间约 ${input.availableHours} 小时。`,
    coordinateLine,
    remainingLine,
    '请分别推荐：适合半天的附近景点、性价比餐厅、适合家庭入住的酒店。',
    '请综合可合法访问的地图、官方页面和平台公开结果，并标注每条建议的距离、适合时长、营业状态、价格区间与推荐理由。',
    '请标注来源和更新时间；无法核验的字段写“待核验”，不要虚构评分或价格。',
  ].join('\n');
}
