import type { TripWithDaysAndEvents } from '@/lib/domain/trip';

export type TripChangeType = 'update' | 'cancel' | 'move' | 'postpone' | 'swap' | 'actual-complete' | 'undo';

export type TripChange = {
  id: string;
  tripId: string;
  type: TripChangeType;
  eventId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  undoOf?: string;
};

export type TripChangeCounts = Record<Exclude<TripChangeType, 'undo'>, number>;

export type TripArchive = {
  archivedAt: string;
  finalSnapshot: TripWithDaysAndEvents;
  activeChangeCount: number;
  /** Frozen with the snapshot: live counts would drift as editing continues. */
  counts: TripChangeCounts;
};

export type TripExecutionState = {
  /** The plan as first captured. Never rebased, so the review always has a baseline. */
  originalPlan: TripWithDaysAndEvents;
  /** The fold base. Rebased onto the seed whenever planRevision moves. */
  initialSnapshot: TripWithDaysAndEvents;
  changes: TripChange[];
  archive?: TripArchive;
};

export type TripExecutionParseResult = {
  state: TripExecutionState;
  invalid: boolean;
  rebased: boolean;
  baselineStale: boolean;
  discardedChangeCount: number;
};

type StoredTripExecutionV2 = TripExecutionState & {
  version: 2;
  updatedAt: string;
};

const CHANGE_TYPES = new Set<TripChangeType>(['update', 'cancel', 'move', 'postpone', 'swap', 'actual-complete', 'undo']);
const COUNTED_CHANGE_TYPES = ['update', 'cancel', 'move', 'postpone', 'swap', 'actual-complete'] as const;

export function countTripChanges(changes: TripChange[]): TripChangeCounts {
  const counts = Object.fromEntries(COUNTED_CHANGE_TYPES.map((type) => [type, 0])) as TripChangeCounts;
  getActiveTripChanges(changes).forEach((change) => {
    if (change.type !== 'undo') counts[change.type] += 1;
  });

  return counts;
}

function cloneTrip(trip: TripWithDaysAndEvents): TripWithDaysAndEvents {
  return JSON.parse(JSON.stringify(trip)) as TripWithDaysAndEvents;
}

function emptyExecutionState(trip: TripWithDaysAndEvents): TripExecutionState {
  return {
    originalPlan: cloneTrip(trip),
    initialSnapshot: cloneTrip(trip),
    changes: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTripSnapshot(value: unknown, tripId: string): value is TripWithDaysAndEvents {
  return (
    isRecord(value) &&
    value.id === tripId &&
    typeof value.title === 'string' &&
    Array.isArray(value.days) &&
    // Shape-check the days: the reducer flatMaps day.events, so a day without one
    // would surface as a crash while rendering rather than as invalid storage.
    value.days.every((day) => isRecord(day) && typeof day.id === 'string' && Array.isArray(day.events))
  );
}

function isTripChange(value: unknown, tripId: string): value is TripChange {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== 'string' ||
    value.tripId !== tripId ||
    typeof value.type !== 'string' ||
    !CHANGE_TYPES.has(value.type as TripChangeType) ||
    typeof value.eventId !== 'string' ||
    typeof value.createdAt !== 'string' ||
    !isRecord(value.payload)
  ) {
    return false;
  }

  return value.type === 'undo' ? typeof value.undoOf === 'string' : value.undoOf === undefined;
}

function isTripChangeCounts(value: unknown): value is TripChangeCounts {
  return (
    isRecord(value) &&
    COUNTED_CHANGE_TYPES.every((type) => Number.isInteger(value[type]) && (value[type] as number) >= 0)
  );
}

function isTripArchive(value: unknown, tripId: string): value is TripArchive {
  return (
    isRecord(value) &&
    typeof value.archivedAt === 'string' &&
    isTripSnapshot(value.finalSnapshot, tripId) &&
    Number.isInteger(value.activeChangeCount) &&
    (value.activeChangeCount as number) >= 0 &&
    isTripChangeCounts(value.counts)
  );
}

function cloneChange(change: TripChange): TripChange {
  return { ...change, payload: { ...change.payload } };
}

function cloneArchive(archive: TripArchive): TripArchive {
  return { ...archive, finalSnapshot: cloneTrip(archive.finalSnapshot) };
}

export function getTripExecutionStorageKey(tripId: string) {
  return `travelflow:execution:${tripId}`;
}

export function parseTripExecution(raw: string | null, fallbackTrip: TripWithDaysAndEvents): TripExecutionParseResult {
  const fallback = emptyExecutionState(fallbackTrip);
  const clean = { invalid: false, rebased: false, baselineStale: false, discardedChangeCount: 0 };
  if (!raw) return { state: fallback, ...clean };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !isRecord(parsed) ||
      (parsed.version !== 1 && parsed.version !== 2) ||
      !isTripSnapshot(parsed.initialSnapshot, fallbackTrip.id) ||
      !Array.isArray(parsed.changes) ||
      !parsed.changes.every((change) => isTripChange(change, fallbackTrip.id))
    ) {
      return { state: fallback, ...clean, invalid: true };
    }

    // Captured before the rebase branch: a v1 payload has no originalPlan, so its
    // initialSnapshot is the only surviving record of what was originally planned.
    // A v2 payload missing one was not written by this app; adopting its possibly
    // already-rebased snapshot would silently pass off the new seed as the baseline.
    const originalPlan = isTripSnapshot(parsed.originalPlan, fallbackTrip.id)
      ? cloneTrip(parsed.originalPlan)
      : parsed.version === 2
        ? null
        : cloneTrip(parsed.initialSnapshot);
    if (!originalPlan) return { state: fallback, ...clean, invalid: true };

    // A malformed archive is derived metadata; it is dropped rather than taking the
    // append-only change log down with it.
    const storedArchive = parsed.version === 2 ? parsed.archive : undefined;
    const archive = isTripArchive(storedArchive, fallbackTrip.id) ? { archive: cloneArchive(storedArchive) } : {};

    if (parsed.initialSnapshot.planRevision !== fallbackTrip.planRevision) {
      const eventIds = new Set(fallbackTrip.days.flatMap((day) => day.events.map((event) => event.id)));
      const dayIds = new Set(fallbackTrip.days.map((day) => day.id));
      const businessChanges = parsed.changes.filter((change) => {
        if (change.type === 'undo' || !eventIds.has(change.eventId)) return false;
        if (change.type === 'move') {
          return typeof change.payload.targetDayId === 'string' && dayIds.has(change.payload.targetDayId);
        }
        if (change.type === 'swap') {
          return typeof change.payload.otherEventId === 'string' && eventIds.has(change.payload.otherEventId);
        }
        return true;
      });
      const retainedBusinessIds = new Set(businessChanges.map((change) => change.id));
      const retainedChangeIds = new Set([
        ...retainedBusinessIds,
        ...parsed.changes
          .filter((change) => change.type === 'undo' && change.undoOf && retainedBusinessIds.has(change.undoOf))
          .map((change) => change.id),
      ]);
      const retainedChanges = parsed.changes.filter((change) => retainedChangeIds.has(change.id));
      const state: TripExecutionState = {
        originalPlan,
        initialSnapshot: cloneTrip(fallbackTrip),
        changes: retainedChanges.map(cloneChange),
        ...archive,
      };

      return {
        state,
        invalid: false,
        rebased: true,
        baselineStale: isBaselineStale(state),
        discardedChangeCount: parsed.changes.length - retainedChanges.length,
      };
    }

    const state: TripExecutionState = {
      originalPlan,
      initialSnapshot: cloneTrip(parsed.initialSnapshot),
      changes: parsed.changes.map(cloneChange),
      ...archive,
    };

    return { state, invalid: false, rebased: false, baselineStale: isBaselineStale(state), discardedChangeCount: 0 };
  } catch {
    return { state: fallback, ...clean, invalid: true };
  }
}

export function isBaselineStale(state: TripExecutionState) {
  return state.originalPlan.planRevision !== state.initialSnapshot.planRevision;
}

export function serializeTripExecution(state: TripExecutionState) {
  const payload: StoredTripExecutionV2 = {
    version: 2,
    originalPlan: state.originalPlan,
    initialSnapshot: state.initialSnapshot,
    changes: state.changes,
    ...(state.archive ? { archive: state.archive } : {}),
    updatedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload);
}

/**
 * Takes the folded trip as an argument rather than folding here: the reducer
 * imports this module, so calling it back would close an import cycle.
 */
export function archiveTripExecution(
  state: TripExecutionState,
  foldedTrip: TripWithDaysAndEvents,
): TripExecutionState {
  return {
    ...state,
    archive: {
      archivedAt: new Date().toISOString(),
      finalSnapshot: cloneTrip(foldedTrip),
      activeChangeCount: getActiveTripChanges(state.changes).length,
      counts: countTripChanges(state.changes),
    },
  };
}

export function unarchiveTripExecution(state: TripExecutionState): TripExecutionState {
  return { ...state, archive: undefined };
}

type CreateTripChangeInput = Omit<TripChange, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: string;
};

export function createTripChange(input: CreateTripChangeInput): TripChange {
  const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    ...input,
    id: input.id ?? randomId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    payload: { ...input.payload },
  };
}

export function getActiveTripChanges(changes: TripChange[]) {
  const undoneIds = new Set(
    changes.filter((change) => change.type === 'undo' && change.undoOf).map((change) => change.undoOf as string),
  );

  return changes.filter((change) => change.type !== 'undo' && !undoneIds.has(change.id));
}
