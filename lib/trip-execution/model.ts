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

export type TripExecutionState = {
  initialSnapshot: TripWithDaysAndEvents;
  changes: TripChange[];
};

export type TripExecutionParseResult = {
  state: TripExecutionState;
  invalid: boolean;
  rebased: boolean;
  discardedChangeCount: number;
};

type StoredTripExecutionV1 = TripExecutionState & {
  version: 1;
  updatedAt: string;
};

const CHANGE_TYPES = new Set<TripChangeType>(['update', 'cancel', 'move', 'postpone', 'swap', 'actual-complete', 'undo']);

function cloneTrip(trip: TripWithDaysAndEvents): TripWithDaysAndEvents {
  return JSON.parse(JSON.stringify(trip)) as TripWithDaysAndEvents;
}

function emptyExecutionState(trip: TripWithDaysAndEvents): TripExecutionState {
  return {
    initialSnapshot: cloneTrip(trip),
    changes: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTripSnapshot(value: unknown, tripId: string): value is TripWithDaysAndEvents {
  return isRecord(value) && value.id === tripId && typeof value.title === 'string' && Array.isArray(value.days);
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

export function getTripExecutionStorageKey(tripId: string) {
  return `travelflow:execution:${tripId}`;
}

export function parseTripExecution(raw: string | null, fallbackTrip: TripWithDaysAndEvents): TripExecutionParseResult {
  const fallback = emptyExecutionState(fallbackTrip);
  if (!raw) return { state: fallback, invalid: false, rebased: false, discardedChangeCount: 0 };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      !isTripSnapshot(parsed.initialSnapshot, fallbackTrip.id) ||
      !Array.isArray(parsed.changes) ||
      !parsed.changes.every((change) => isTripChange(change, fallbackTrip.id))
    ) {
      return { state: fallback, invalid: true, rebased: false, discardedChangeCount: 0 };
    }

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

      return {
        state: {
          initialSnapshot: cloneTrip(fallbackTrip),
          changes: retainedChanges.map((change) => ({ ...change, payload: { ...change.payload } })),
        },
        invalid: false,
        rebased: true,
        discardedChangeCount: parsed.changes.length - retainedChanges.length,
      };
    }

    return {
      state: {
        initialSnapshot: cloneTrip(parsed.initialSnapshot),
        changes: parsed.changes.map((change) => ({ ...change, payload: { ...change.payload } })),
      },
      invalid: false,
      rebased: false,
      discardedChangeCount: 0,
    };
  } catch {
    return { state: fallback, invalid: true, rebased: false, discardedChangeCount: 0 };
  }
}

export function serializeTripExecution(state: TripExecutionState) {
  const payload: StoredTripExecutionV1 = {
    version: 1,
    initialSnapshot: state.initialSnapshot,
    changes: state.changes,
    updatedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload);
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
