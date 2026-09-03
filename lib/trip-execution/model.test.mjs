import test from 'node:test';
import assert from 'node:assert/strict';
import {
  archiveTripExecution,
  createTripChange,
  getActiveTripChanges,
  getLegacyTripExecutionStorageKey,
  getTripExecutionStorageKey,
  hasArchivedTripExecution,
  parseTripExecution,
  serializeTripExecution,
  unarchiveTripExecution,
} from './model.ts';

const trip = {
  id: 'trip-a',
  userId: 'user-a',
  title: '山西亲子行',
  destination: '平遥',
  status: 'active',
  days: [],
};

test('initializes a defensive snapshot for missing storage', () => {
  const result = parseTripExecution(null, trip);

  assert.equal(result.invalid, false);
  assert.notEqual(result.state.initialSnapshot, trip);
  assert.deepEqual(result.state.initialSnapshot, trip);
});

test('rejects a payload for another trip without replacing the fallback', () => {
  const raw = JSON.stringify({
    version: 1,
    initialSnapshot: { ...trip, id: 'trip-b' },
    changes: [],
    updatedAt: new Date().toISOString(),
  });
  const result = parseTripExecution(raw, trip);

  assert.equal(result.invalid, true);
  assert.deepEqual(result.state.initialSnapshot, trip);
});

test('undo suppresses only its referenced business change', () => {
  const cancel = createTripChange({ tripId: 'trip-a', type: 'cancel', eventId: 'event-1', payload: {} });
  const update = createTripChange({
    tripId: 'trip-a',
    type: 'update',
    eventId: 'event-1',
    payload: { patch: { title: '新标题' } },
  });
  const undo = createTripChange({
    tripId: 'trip-a',
    type: 'undo',
    eventId: 'event-1',
    payload: {},
    undoOf: cancel.id,
  });

  assert.deepEqual(getActiveTripChanges([cancel, update, undo]).map((change) => change.id), [update.id]);
});

test('repeated undo walks backward through remaining business changes', () => {
  const first = createTripChange({ tripId: 'trip-a', type: 'cancel', eventId: 'event-1', payload: {} });
  const second = createTripChange({ tripId: 'trip-a', type: 'move', eventId: 'event-2', payload: { targetDayId: 'day-2' } });
  const undoSecond = createTripChange({ tripId: 'trip-a', type: 'undo', eventId: 'event-2', payload: {}, undoOf: second.id });
  const undoFirst = createTripChange({ tripId: 'trip-a', type: 'undo', eventId: 'event-1', payload: {}, undoOf: first.id });

  assert.deepEqual(getActiveTripChanges([first, second, undoSecond]).map((change) => change.id), [first.id]);
  assert.deepEqual(getActiveTripChanges([first, second, undoSecond, undoFirst]), []);
});

test('serializes a versioned payload and scopes storage by trip and viewer', () => {
  const state = parseTripExecution(null, trip).state;

  assert.equal(JSON.parse(serializeTripExecution(state)).version, 2);
  assert.equal(getTripExecutionStorageKey('trip-a', 'user-a'), 'travelflow:execution:u:user-a:trip-a');
  assert.equal(getTripExecutionStorageKey('trip-a'), 'travelflow:execution:anon:trip-a');
  assert.equal(getTripExecutionStorageKey('trip-a', null), 'travelflow:execution:anon:trip-a');
  assert.equal(getLegacyTripExecutionStorageKey('trip-a'), 'travelflow:execution:trip-a');
});

test('two viewers of the same trip never share a storage key', () => {
  assert.notEqual(getTripExecutionStorageKey('trip-a', 'user-a'), getTripExecutionStorageKey('trip-a', 'user-b'));
  assert.notEqual(getTripExecutionStorageKey('trip-a', 'user-a'), getTripExecutionStorageKey('trip-a', null));
  // A user id shaped like a trip id must not collide with the legacy key.
  assert.notEqual(getTripExecutionStorageKey('trip-a', 'user-a'), getLegacyTripExecutionStorageKey('user-a:trip-a'));
});

test('detects an archive without needing the trip snapshot', () => {
  const plain = parseTripExecution(null, trip).state;
  const archived = archiveTripExecution(plain, trip);

  assert.equal(hasArchivedTripExecution(serializeTripExecution(archived)), true);
  assert.equal(hasArchivedTripExecution(serializeTripExecution(plain)), false);
  assert.equal(hasArchivedTripExecution(null), false);
  assert.equal(hasArchivedTripExecution('not json'), false);
  assert.equal(hasArchivedTripExecution(JSON.stringify({ version: 1, archive: {} })), false);
});

test('rebases a revised seed while retaining only reference-safe changes', () => {
  const oldTrip = {
    ...trip,
    planRevision: 1,
    days: [
      { id: 'day-1', tripId: 'trip-a', dayIndex: 1, events: [{ id: 'event-day-1', dayId: 'day-1', tripId: 'trip-a', title: 'Day 1', category: 'spot' }] },
      { id: 'day-2', tripId: 'trip-a', dayIndex: 2, events: [{ id: 'old-day-2', dayId: 'day-2', tripId: 'trip-a', title: 'Old Day 2', category: 'spot' }] },
    ],
  };
  const revisedTrip = {
    ...trip,
    planRevision: 2,
    days: [
      { id: 'day-1', tripId: 'trip-a', dayIndex: 1, events: [{ id: 'event-day-1', dayId: 'day-1', tripId: 'trip-a', title: 'Day 1', category: 'spot' }] },
      { id: 'day-2', tripId: 'trip-a', dayIndex: 2, events: [{ id: 'pingyao-day-2', dayId: 'day-2', tripId: 'trip-a', title: 'Pingyao', category: 'spot' }] },
    ],
  };
  const keepDay1 = createTripChange({ id: 'keep-day-1', tripId: 'trip-a', type: 'update', eventId: 'event-day-1', payload: { patch: { title: '真实 Day 1' } } });
  const dropOld = createTripChange({ id: 'drop-old', tripId: 'trip-a', type: 'cancel', eventId: 'old-day-2', payload: {} });
  const dropSwap = createTripChange({ id: 'drop-swap', tripId: 'trip-a', type: 'swap', eventId: 'event-day-1', payload: { otherEventId: 'old-day-2' } });
  const dropUndo = createTripChange({ id: 'drop-undo', tripId: 'trip-a', type: 'undo', eventId: 'old-day-2', payload: {}, undoOf: dropOld.id });
  const raw = serializeTripExecution({ originalPlan: oldTrip, initialSnapshot: oldTrip, changes: [keepDay1, dropOld, dropSwap, dropUndo] });

  const result = parseTripExecution(raw, revisedTrip);

  assert.equal(result.rebased, true);
  assert.equal(result.invalid, false);
  assert.deepEqual(result.state.initialSnapshot, revisedTrip);
  assert.deepEqual(result.state.changes.map((change) => change.id), ['keep-day-1']);
  assert.equal(result.discardedChangeCount, 3);

  const secondParse = parseTripExecution(serializeTripExecution(result.state), revisedTrip);
  assert.equal(secondParse.rebased, false);
  assert.equal(secondParse.discardedChangeCount, 0);
  assert.deepEqual(secondParse.state.changes.map((change) => change.id), ['keep-day-1']);
});

test('rebases an untouched stale snapshot without reporting discarded changes', () => {
  const oldTrip = { ...trip, planRevision: 1 };
  const revisedTrip = { ...trip, planRevision: 2, destination: '平遥 / 临汾' };
  const raw = serializeTripExecution({ originalPlan: oldTrip, initialSnapshot: oldTrip, changes: [] });

  const result = parseTripExecution(raw, revisedTrip);

  assert.equal(result.rebased, true);
  assert.equal(result.discardedChangeCount, 0);
  assert.deepEqual(result.state.initialSnapshot, revisedTrip);
});

test('migrates a v1 payload by adopting its snapshot as the original plan', () => {
  const stored = { ...trip, planRevision: 1, title: '最初的计划' };
  const raw = JSON.stringify({ version: 1, initialSnapshot: stored, changes: [], updatedAt: '2026-08-20T00:00:00.000Z' });

  const result = parseTripExecution(raw, stored);

  assert.equal(result.invalid, false);
  assert.deepEqual(result.state.originalPlan, stored);
  assert.deepEqual(result.state.initialSnapshot, stored);
  assert.equal(result.baselineStale, false);
  assert.equal(result.state.archive, undefined);
});

test('a rebase replaces the fold base but never the original plan', () => {
  const oldTrip = { ...trip, planRevision: 1, title: '最初的计划' };
  const revisedTrip = { ...trip, planRevision: 2, title: '改版后的计划' };
  const raw = serializeTripExecution({ originalPlan: oldTrip, initialSnapshot: oldTrip, changes: [] });

  const result = parseTripExecution(raw, revisedTrip);

  assert.equal(result.rebased, true);
  assert.equal(result.baselineStale, true);
  assert.deepEqual(result.state.originalPlan, oldTrip);
  assert.deepEqual(result.state.initialSnapshot, revisedTrip);
});

test('archiving freezes a detached final snapshot and unarchiving drops it', () => {
  const state = parseTripExecution(null, trip).state;
  const folded = { ...trip, title: '实走版本' };
  const archived = archiveTripExecution(state, folded);

  assert.equal(state.archive, undefined);
  assert.equal(archived.archive.finalSnapshot.title, '实走版本');
  assert.notEqual(archived.archive.finalSnapshot, folded);
  assert.equal(archived.archive.activeChangeCount, 0);
  assert.equal(unarchiveTripExecution(archived).archive, undefined);
});

test('a round trip through storage preserves the archive', () => {
  const archived = archiveTripExecution(parseTripExecution(null, trip).state, trip);

  const result = parseTripExecution(serializeTripExecution(archived), trip);

  assert.equal(result.invalid, false);
  assert.equal(result.state.archive.archivedAt, archived.archive.archivedAt);
  assert.deepEqual(result.state.archive.finalSnapshot, trip);
});

test('drops a malformed archive without taking the change log down with it', () => {
  const keep = createTripChange({ id: 'keep', tripId: 'trip-a', type: 'cancel', eventId: 'e1', payload: {} });
  const raw = JSON.stringify({
    version: 2,
    originalPlan: trip,
    initialSnapshot: trip,
    changes: [keep],
    archive: { archivedAt: '2026-08-20T00:00:00.000Z', finalSnapshot: trip },
    updatedAt: '2026-08-20T00:00:00.000Z',
  });

  const result = parseTripExecution(raw, trip);

  assert.equal(result.invalid, false);
  assert.equal(result.state.archive, undefined);
  assert.deepEqual(result.state.changes.map((change) => change.id), ['keep']);
});

test('rejects a v2 payload with no original plan rather than adopting the fold base', () => {
  const raw = JSON.stringify({ version: 2, initialSnapshot: trip, changes: [], updatedAt: '2026-08-20T00:00:00.000Z' });

  assert.equal(parseTripExecution(raw, trip).invalid, true);
});

test('rejects a snapshot whose days cannot be folded', () => {
  const raw = JSON.stringify({
    version: 2,
    originalPlan: trip,
    initialSnapshot: { ...trip, days: [{ id: 'day-1' }] },
    changes: [],
    updatedAt: '2026-08-20T00:00:00.000Z',
  });

  assert.equal(parseTripExecution(raw, trip).invalid, true);
});
