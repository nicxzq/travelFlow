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
