import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTripChange,
  getActiveTripChanges,
  getTripExecutionStorageKey,
  parseTripExecution,
  serializeTripExecution,
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

test('serializes a versioned payload and scopes storage by trip', () => {
  const state = parseTripExecution(null, trip).state;

  assert.equal(JSON.parse(serializeTripExecution(state)).version, 1);
  assert.equal(getTripExecutionStorageKey('trip-a'), 'travelflow:execution:trip-a');
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
  const raw = serializeTripExecution({ initialSnapshot: oldTrip, changes: [keepDay1, dropOld, dropSwap, dropUndo] });

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
  const raw = serializeTripExecution({ initialSnapshot: oldTrip, changes: [] });

  const result = parseTripExecution(raw, revisedTrip);

  assert.equal(result.rebased, true);
  assert.equal(result.discardedChangeCount, 0);
  assert.deepEqual(result.state.initialSnapshot, revisedTrip);
});
