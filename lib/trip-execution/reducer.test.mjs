import test from 'node:test';
import assert from 'node:assert/strict';
import { createTripChange } from './model.ts';
import { foldTripExecution, getExecutionReview, getScheduleConflicts } from './reducer.ts';

const baseTrip = {
  id: 'trip-a',
  userId: 'user-a',
  title: '山西亲子行',
  destination: '山西',
  status: 'active',
  days: [
    {
      id: 'day-1',
      tripId: 'trip-a',
      dayIndex: 1,
      date: '2026-08-17',
      events: [
        { id: 'e1', dayId: 'day-1', tripId: 'trip-a', title: '古城', category: 'spot', startTime: '09:00', endTime: '10:00' },
        { id: 'e2', dayId: 'day-1', tripId: 'trip-a', title: '午餐', category: 'food', startTime: '11:00', endTime: '12:00' },
        { id: 'late', dayId: 'day-1', tripId: 'trip-a', title: '夜游', category: 'spot', startTime: '23:30', endTime: '23:50' },
      ],
    },
    {
      id: 'day-2',
      tripId: 'trip-a',
      dayIndex: 2,
      date: '2026-08-18',
      events: [
        { id: 'e3', dayId: 'day-2', tripId: 'trip-a', title: '大院', category: 'spot', startTime: '09:00', endTime: '10:30' },
      ],
    },
  ],
};

function change(type, eventId, payload = {}) {
  return createTripChange({ tripId: 'trip-a', type, eventId, payload });
}

function stateWith(...changes) {
  return { initialSnapshot: baseTrip, changes };
}

function find(trip, eventId) {
  return trip.days.flatMap((day) => day.events).find((event) => event.id === eventId);
}

test('moves an event to the target day without mutating the snapshot', () => {
  const current = foldTripExecution(stateWith(change('move', 'e1', { targetDayId: 'day-2' })));

  assert.deepEqual(current.days[0].events.map((event) => event.id), ['e2', 'late']);
  assert.deepEqual(current.days[1].events.map((event) => event.id), ['e3', 'e1']);
  assert.deepEqual(baseTrip.days[0].events.map((event) => event.id), ['e1', 'e2', 'late']);
});

test('postpones the selected event and later same-day events only', () => {
  const current = foldTripExecution(stateWith(change('postpone', 'e1', { minutes: 30 })));

  assert.equal(find(current, 'e1').startTime, '09:30');
  assert.equal(find(current, 'e2').startTime, '11:30');
  assert.equal(find(current, 'e3').startTime, '09:00');
});

test('clears overflowing times instead of creating 24:xx', () => {
  const current = foldTripExecution(stateWith(change('postpone', 'late', { minutes: 60 })));

  assert.equal(find(current, 'late').startTime, undefined);
  assert.equal(find(current, 'late').endTime, undefined);
});

test('swaps day and start slots while each event keeps its duration', () => {
  const current = foldTripExecution(stateWith(change('swap', 'e1', { otherEventId: 'e3' })));

  assert.equal(find(current, 'e1').dayId, 'day-2');
  assert.equal(find(current, 'e1').startTime, '09:00');
  assert.equal(find(current, 'e1').endTime, '10:00');
  assert.equal(find(current, 'e3').dayId, 'day-1');
  assert.equal(find(current, 'e3').endTime, '10:30');
});

test('cancel and actual completion stay independent and reviewable', () => {
  const state = stateWith(
    change('cancel', 'e1'),
    change('actual-complete', 'e2', { actualAt: '2026-08-17T04:00:00.000Z' }),
  );
  const current = foldTripExecution(state);
  const review = getExecutionReview(state);

  assert.equal(find(current, 'e1').status, 'cancelled');
  assert.equal(find(current, 'e2').actualStatus, 'completed');
  assert.deepEqual(review.counts, { update: 0, cancel: 1, move: 0, postpone: 0, swap: 0, actualComplete: 1 });
});

test('undo recomputes the trip and removes derived conflicts', () => {
  const move = change('move', 'e2', { targetDayId: 'day-2' });
  const update = change('update', 'e2', { patch: { startTime: '09:15', endTime: '10:15' } });
  const conflicting = stateWith(move, update);
  const undoUpdate = createTripChange({ tripId: 'trip-a', type: 'undo', eventId: 'e2', payload: {}, undoOf: update.id });

  assert.equal(getScheduleConflicts(foldTripExecution(conflicting)).length, 1);
  assert.equal(getScheduleConflicts(foldTripExecution(stateWith(move, update, undoUpdate))).length, 0);
});
