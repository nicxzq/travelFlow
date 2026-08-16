# Adaptive Trip Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a refresh-safe local trip execution layer with quick rescheduling, manual actual-completion records, trustworthy nearby fallbacks, and a deterministic plan-vs-actual review.

**Architecture:** Persist one immutable trip snapshot plus an append-only change journal under a trip-scoped localStorage key. Pure reducer functions fold active changes into the current trip, while focused React components dispatch typed changes and render nearby candidates or review facts. The journal shapes are deliberately compatible with a later Supabase table, but this plan does not implement cloud sync or third-party commercial data.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5.8, browser localStorage/Geolocation/Clipboard/Web Share APIs, Node 26 built-in TypeScript stripping and test runner.

## Global Constraints

- `initialSnapshot` is immutable after first storage initialization.
- `changes` are append-only; undo appends an `undo` record with `undoOf`.
- The browser storage key is exactly `travelflow:execution:${tripId}` and payload version is `1`.
- Local UI offers “标记取消”, never local permanent deletion; explain that cancelled data remains for undo and review.
- Location is requested only after a user click and is not persisted.
- Without formal platform authorization, never display invented Meituan, Dianping, or Ctrip ratings, prices, or availability.
- No new npm dependency is required.

---

## File Structure

- `lib/trip-execution/model.ts`: journal types, safe parsing, serialization, IDs, active-change selection.
- `lib/trip-execution/reducer.ts`: pure fold, move/postpone/swap algorithms, stats and conflict detection.
- `lib/trip-execution/model.test.mjs`: Node tests for parsing, immutability, undo, and trip isolation.
- `lib/trip-execution/reducer.test.mjs`: Node tests for every mutation algorithm and review facts.
- `components/trip/event-quick-actions.tsx`: explicit mobile-accessible action menu and target-day selection.
- `components/trip/nearby-decision-card.tsx`: opt-in geolocation, local candidate ranking, contextual prompt export.
- `components/trip/trip-review-card.tsx`: deterministic plan-vs-actual summary and AI-context export.
- `components/trip/trip-workspace.tsx`: execution hydration/persistence and dispatch orchestration.
- `components/trip/timeline-card.tsx`: render status and connect quick actions.
- `lib/domain/trip.ts`: add execution-only event fields and `cancelled` status.
- `package.json`: run Node behavior tests before scaffold validation.
- `scripts/validate-scaffold.mjs`: assert required execution files and user-facing guardrail copy.
- `document/行程管理与地图增强设计.md`: document delivered local behavior and deferred integrations.

---

### Task 1: Typed append-only execution journal

**Files:**
- Create: `lib/trip-execution/model.ts`
- Create: `lib/trip-execution/model.test.mjs`
- Modify: `lib/domain/trip.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `TripWithDaysAndEvents`, `TripEvent` from `lib/domain/trip.ts`.
- Produces: `TripChange`, `TripExecutionState`, `parseTripExecution(raw, fallbackTrip)`, `serializeTripExecution(state)`, `getTripExecutionStorageKey(tripId)`, `createTripChange(input)`, `getActiveTripChanges(changes)`.

- [ ] **Step 1: Write failing journal tests**

Create `lib/trip-execution/model.test.mjs` with Node `test` cases proving:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTripChange,
  getActiveTripChanges,
  getTripExecutionStorageKey,
  parseTripExecution,
  serializeTripExecution,
} from './model.ts';

const trip = { id: 'trip-a', userId: 'u', title: 'A', destination: '平遥', status: 'active', days: [] };

test('initializes a defensive snapshot for missing storage', () => {
  const result = parseTripExecution(null, trip);
  assert.equal(result.invalid, false);
  assert.notEqual(result.state.initialSnapshot, trip);
  assert.deepEqual(result.state.initialSnapshot, trip);
});

test('rejects a payload for another trip without overwriting fallback', () => {
  const raw = JSON.stringify({ version: 1, initialSnapshot: { ...trip, id: 'trip-b' }, changes: [], updatedAt: new Date().toISOString() });
  assert.equal(parseTripExecution(raw, trip).invalid, true);
});

test('undo suppresses only its referenced change', () => {
  const cancel = createTripChange({ tripId: 'trip-a', type: 'cancel', eventId: 'e1', payload: {} });
  const update = createTripChange({ tripId: 'trip-a', type: 'update', eventId: 'e1', payload: { patch: { title: 'B' } } });
  const undo = createTripChange({ tripId: 'trip-a', type: 'undo', eventId: 'e1', payload: {}, undoOf: cancel.id });
  assert.deepEqual(getActiveTripChanges([cancel, update, undo]).map((change) => change.id), [update.id]);
});

test('serializes a versioned payload and scopes storage by trip', () => {
  const state = parseTripExecution(null, trip).state;
  assert.equal(JSON.parse(serializeTripExecution(state)).version, 1);
  assert.equal(getTripExecutionStorageKey('trip-a'), 'travelflow:execution:trip-a');
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test lib/trip-execution/model.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `model.ts`.

- [ ] **Step 3: Implement journal types and safe parsing**

Add execution fields without changing planned fields:

```ts
export type EventStatus = 'planned' | 'active' | 'done' | 'skipped' | 'changed' | 'cancelled';

export interface TripEvent {
  // existing fields stay unchanged
  sortOrder?: number;
  actualAt?: string;
  actualStatus?: 'completed';
}
```

Implement discriminated changes in `model.ts`:

```ts
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
```

`parseTripExecution` must deep-clone `fallbackTrip`, validate version/trip id/change primitives, and return `{ state, invalid }`. `serializeTripExecution` adds `version: 1` and `updatedAt`. `createTripChange` uses `crypto.randomUUID()` when available and a timestamp/random fallback otherwise. `getActiveTripChanges` excludes undo records and all referenced IDs without deleting history.

- [ ] **Step 4: Run focused tests**

Run: `node --test lib/trip-execution/model.test.mjs`

Expected: 4 tests PASS.

- [ ] **Step 5: Wire the focused test command**

Change `package.json` scripts to:

```json
"test:execution": "node --test lib/trip-execution/*.test.mjs",
"test": "npm run test:execution && node scripts/validate-scaffold.mjs"
```

- [ ] **Step 6: Commit**

```bash
git add package.json lib/domain/trip.ts lib/trip-execution/model.ts lib/trip-execution/model.test.mjs
git commit -m "feat: add trip execution journal"
```

---

### Task 2: Pure schedule folding and review facts

**Files:**
- Create: `lib/trip-execution/reducer.ts`
- Create: `lib/trip-execution/reducer.test.mjs`

**Interfaces:**
- Consumes: `TripChange`, `TripExecutionState`, `getActiveTripChanges` from Task 1.
- Produces: `foldTripExecution(state): TripWithDaysAndEvents`, `getExecutionReview(state): ExecutionReview`, `getScheduleConflicts(trip): ScheduleConflict[]`.

- [ ] **Step 1: Write failing reducer tests**

Build a two-day fixture with three timed events and cover these exact assertions:

```js
test('moves an event to the target day without mutating the snapshot', () => {
  const current = foldTripExecution(stateWith(move('e1', 'day-2')));
  assert.deepEqual(current.days[0].events.map((event) => event.id), ['e2']);
  assert.deepEqual(current.days[1].events.map((event) => event.id), ['e3', 'e1']);
  assert.deepEqual(baseTrip.days[0].events.map((event) => event.id), ['e1', 'e2']);
});

test('postpones the selected event and later same-day events only', () => {
  const current = foldTripExecution(stateWith(postpone('e1', 30)));
  assert.equal(find(current, 'e1').startTime, '09:30');
  assert.equal(find(current, 'e2').startTime, '11:30');
  assert.equal(find(current, 'e3').startTime, '09:00');
});

test('clears overflowing times instead of creating 24:xx', () => {
  const current = foldTripExecution(stateWith(postpone('late', 60)));
  assert.equal(find(current, 'late').startTime, undefined);
});

test('swaps day and start slots while each event keeps its duration', () => {
  const current = foldTripExecution(stateWith(swap('e1', 'e3')));
  assert.equal(find(current, 'e1').dayId, 'day-2');
  assert.equal(find(current, 'e1').startTime, '09:00');
  assert.equal(find(current, 'e1').endTime, '10:00');
});

test('cancel and actual completion stay independent and reviewable', () => {
  const current = foldTripExecution(stateWith(cancel('e1'), actualComplete('e2')));
  assert.equal(find(current, 'e1').status, 'cancelled');
  assert.equal(find(current, 'e2').actualStatus, 'completed');
  assert.deepEqual(getExecutionReview(state).counts, { update: 0, cancel: 1, move: 0, postpone: 0, swap: 0, actualComplete: 1 });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test lib/trip-execution/reducer.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `reducer.ts`.

- [ ] **Step 3: Implement the fold without mutating inputs**

Implement helpers:

```ts
function timeToMinutes(value?: string): number | undefined;
function minutesToTime(value: number): string | undefined;
function durationMinutes(event: TripEvent): number | undefined;
function findEvent(trip: TripWithDaysAndEvents, eventId: string): { day: TripDay; event: TripEvent; index: number } | undefined;
```

Node 26 strips erasable TypeScript syntax by default, so the `.mjs` tests can import the `.ts` modules directly without a build step; the test modules must not require Next.js path-alias resolution at runtime.

Apply active changes in chronological array order. `move` removes the event from its current day, rewrites `dayId`, and appends it to the target day. `postpone` shifts the target and all later timed events in the current day; values outside `0..1439` become `undefined`. `swap` exchanges day/index/start slots and recalculates each end time from its original duration, then re-sorts both affected days. `cancel` writes `status: 'cancelled'`; `actual-complete` writes only `actualAt` and `actualStatus`, remains undoable, and does not block later move/postpone/swap operations.

`getExecutionReview` returns active change counts, cancelled event IDs, completed event IDs, and per-day rows containing initial/current/actual facts. `getScheduleConflicts` re-sorts and compares all adjacent timed events across every affected day, not only the two swapped events. Conflict warnings are derived from the folded current trip and never stored, so undo recomputation removes stale warnings automatically.

- [ ] **Step 4: Run both execution test files**

Run: `npm run test:execution`

Expected: all model and reducer tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/trip-execution/reducer.ts lib/trip-execution/reducer.test.mjs
git commit -m "feat: fold adaptive trip changes"
```

---

### Task 3: Hydrate execution state and add quick actions

**Files:**
- Create: `components/trip/event-quick-actions.tsx`
- Modify: `components/trip/trip-workspace.tsx`
- Modify: `components/trip/timeline-card.tsx`

**Interfaces:**
- Consumes: Task 1 journal helpers and Task 2 fold/conflict helpers.
- Produces: `EventQuickActions` and workspace dispatch functions `appendChange`, `undoLatestChange`, `moveEvent`, `postponeEvent`, `swapWithNext`, `cancelEvent`, `completeEvent`.

- [ ] **Step 1: Add scaffold assertions that fail**

Add required snippets for:

```js
{ file: 'components/trip/event-quick-actions.tsx', snippet: '推迟 30 分钟', message: 'Quick postpone action is missing' },
{ file: 'components/trip/event-quick-actions.tsx', snippet: '标记取消', message: 'Safe cancel action is missing' },
{ file: 'components/trip/trip-workspace.tsx', snippet: 'getTripExecutionStorageKey', message: 'Execution storage hydration is missing' },
{ file: 'components/trip/trip-workspace.tsx', snippet: 'undoOf', message: 'Append-only undo is missing' },
```

Run: `npm test`

Expected: scaffold validation FAILS for missing quick-action component.

- [ ] **Step 2: Replace ephemeral overrides with journal state**

In `TripWorkspace`:

1. On `trip.id` change, immediately mark the previous execution state inactive, render from the new `trip` prop, and then hydrate the matching `TripExecutionState` from localStorage. Never render a state whose `executionState.initialSnapshot.id !== trip.id`.
2. Set `currentTrip = foldTripExecution(executionState)` and compute schedule context/days from `currentTrip`.
3. Debounce persistence by 400ms only when `hydratedExecutionTripId === trip.id`.
4. Replace `eventOverrides` and `deletedEventIds` with appended typed changes.
5. Keep all mutation functions no-op when `readOnly`.
6. Render cancelled cards in a separate collapsible “已取消” section instead of filtering them out.
7. Display a non-blocking banner: `取消会保留在变更记录中，用于撤销和旅行复盘。`

The most recent active non-undo change is undoable. Repeated clicks walk backward through remaining active business changes; undo records are never themselves undo targets, so this version has no redo semantics:

```ts
function undoLatestChange() {
  const latest = getActiveTripChanges(executionState.changes).at(-1);
  if (!latest || readOnly) return;
  appendChange(createTripChange({
    tripId: trip.id,
    type: 'undo',
    eventId: latest.eventId,
    payload: {},
    undoOf: latest.id,
  }));
}
```

- [ ] **Step 3: Build the explicit quick-action menu**

`EventQuickActions` receives:

```ts
type EventQuickActionsProps = {
  event: TripEvent;
  days: Array<Pick<TripDay, 'id' | 'dayIndex' | 'date'>>;
  canMoveTomorrow: boolean;
  canSwapNext: boolean;
  onPostpone: (minutes: number) => void;
  onMove: (targetDayId: string) => void;
  onSwapNext: () => void;
  onCancel: () => void;
  onComplete: () => void;
};
```

Use a normal button and conditionally rendered panel with `aria-expanded`, `aria-controls`, and visible labels. Target-day selection is a native `<select>`. Cancel requires one inline confirmation click and includes the retention explanation. Actual completion toggles to “已记录实际完成” when `event.actualStatus === 'completed'`.

- [ ] **Step 4: Connect TimelineCard**

Pass days and callbacks through `TimelineCardProps`, render status pills for `cancelled` and `actualStatus`, and disable normal editing/navigation on cancelled cards. Do not overload the existing trash icon: replace its local wording and behavior with the new explicit cancel action.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: execution behavior tests and scaffold validation PASS.

- [ ] **Step 6: Commit**

```bash
git add components/trip/event-quick-actions.tsx components/trip/trip-workspace.tsx components/trip/timeline-card.tsx scripts/validate-scaffold.mjs
git commit -m "feat: add quick itinerary adjustments"
```

---

### Task 4: Nearby fallback and deterministic trip review

**Files:**
- Create: `components/trip/nearby-decision-card.tsx`
- Create: `components/trip/trip-review-card.tsx`
- Modify: `components/trip/trip-workspace.tsx`
- Modify: `scripts/validate-scaffold.mjs`
- Modify: `document/行程管理与地图增强设计.md`

**Interfaces:**
- Consumes: folded `currentTrip`, `ExecutionReview`, current event and active changes.
- Produces: `NearbyDecisionCard`, `TripReviewCard`, exported pure `distanceInKilometers` and `buildRecommendationPrompt` helpers.

- [ ] **Step 1: Write failing nearby helper tests**

Add to `lib/trip-execution/reducer.test.mjs`:

```js
test('distance ranks a known nearby point before a far point', () => {
  assert.ok(distanceInKilometers({ lat: 37.2, lng: 112.1 }, { lat: 37.21, lng: 112.1 }) < 2);
});

test('recommendation prompt names source limits', () => {
  const prompt = buildRecommendationPrompt({ placeName: '平遥古城', availableHours: 4, tripTitle: '山西亲子行' });
  assert.match(prompt, /平遥古城/);
  assert.match(prompt, /请标注来源和更新时间/);
  assert.match(prompt, /不要虚构评分或价格/);
});
```

Run: `npm run test:execution`

Expected: FAIL because helpers do not exist.

- [ ] **Step 2: Implement nearby helpers and component**

Put pure distance/prompt helpers in `lib/trip-execution/reducer.ts` so Node can test them. `NearbyDecisionCard`:

- requests `navigator.geolocation.getCurrentPosition` only after clicking “使用当前位置”；
- never writes coordinates or coordinate-derived candidate ordering to localStorage or change payloads; this ephemeral helper state is intentionally excluded from deterministic trip review;
- sorts non-cancelled, non-completed events with `geo` and shows at most three as “行程内附近备选”；
- clearly labels distance as straight-line estimate and availability as unverified;
- copies the generated prompt using Clipboard API and falls back to a selected textarea when Clipboard is unavailable;
- uses `navigator.share({ title, text })` only after another explicit click when supported;
- shows a concise permission-denied/timeout message without retry loops.

- [ ] **Step 3: Implement deterministic review component**

`TripReviewCard` receives `review` and shows:

- active schedule count vs initial count;
- cancel/move/postpone/swap/update counts;
- actual completed count;
- per-day changed/cancelled/completed rows;
- a “复制给 AI 深度分析” button whose prompt separates `事实数据` and `请 AI 分析的问题`.

Do not label this template as an AI-generated report. Use “行程执行复盘”; only a later external model response may be labelled AI analysis.

- [ ] **Step 4: Mount both cards and document deferred integrations**

Render `NearbyDecisionCard` beside the next-action area during `intrip`, and render `TripReviewCard` for `intrip` and `posttrip`. Extend the technical design with:

1. local capabilities delivered;
2. 高德 Web Service API key and server Route Handler requirement;
3. Meituan/Dianping/Ctrip require formal partnership access before ratings/prices;
4. Supabase/AI rollout remains unimplemented and references existing design files.

- [ ] **Step 5: Add scaffold guardrails**

Require these snippets:

```js
{ file: 'components/trip/nearby-decision-card.tsx', snippet: '不要虚构评分或价格', message: 'Recommendation trust guardrail is missing' },
{ file: 'components/trip/nearby-decision-card.tsx', snippet: '行程内附近备选', message: 'Local nearby fallback is missing' },
{ file: 'components/trip/trip-review-card.tsx', snippet: '行程执行复盘', message: 'Deterministic trip review is missing' },
```

- [ ] **Step 6: Run full local verification**

Run:

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all behavior/scaffold tests pass, TypeScript reports no errors, Next build completes, and diff check is silent. If dependencies remain unavailable because npm certificate verification fails, record typecheck/build as blocked rather than disabling TLS.

- [ ] **Step 7: Commit**

```bash
git add components/trip/nearby-decision-card.tsx components/trip/trip-review-card.tsx components/trip/trip-workspace.tsx lib/trip-execution/reducer.ts lib/trip-execution/reducer.test.mjs scripts/validate-scaffold.mjs document/行程管理与地图增强设计.md
git commit -m "feat: add nearby decisions and trip review"
```

---

## Deferred Integration Plan

These are concrete gates, not claims of completion:

1. **高德 nearby POI:** obtain a Web Service API key; add a server-only environment variable; build a Route Handler around `/v5/place/around`; normalize category/distance/business-hours/source timestamp; cache briefly; never expose the key client-side.
2. **Meituan/Dianping/Ctrip comparison:** submit enterprise/partner applications and confirm the licensed fields, cache terms, attribution, deep-link rules, and commercial use. Until approved, only export a search prompt or open official entry pages.
3. **Cloud journal sync:** execute `docs/superpowers/plans/2026-08-15-cloud-itinerary-collaboration.md`, then store each `TripChange` as a row protected by the existing owner/editor/viewer RLS design. Resolve concurrent changes with `created_at`, actor identity, and optimistic version checks.
4. **AI review and natural-language mutations:** send the deterministic review JSON through the existing server-side OpenAI-compatible gateway. AI mutation output must validate against a fixed operation schema and show a preview before appending changes.
