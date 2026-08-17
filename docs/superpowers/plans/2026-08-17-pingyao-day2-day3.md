# Pingyao Day 2 / Day 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old Day 2 / Day 3 route with an afternoon arrival and full Pingyao Ancient City day, including child study challenges and safe migration of existing browser changes.

**Architecture:** The seeded trip receives an explicit `planRevision`. The execution parser rebases a stale stored snapshot onto the new seed while preserving only changes whose event and cross-event references remain valid. Trip, map, todo, and study-card fixtures are then updated together with new stable event/task IDs.

**Tech Stack:** TypeScript, React 18, Next.js 14, Node test runner, localStorage execution journal.

## Global Constraints

- Day 2 arrives at Pingyao in the afternoon and remains low intensity.
- Day 3 spends the daytime in Pingyao and reaches Linfen that evening so Day 4 still starts from Linfen at 07:00.
- Use at most one study card on Day 2 and two study cards on Day 3.
- Reference answers remain folded by default and guide observation without pretending to know what the child saw.
- Preserve valid local execution changes; discard only changes whose event or cross-event target no longer exists.
- Do not claim live opening hours, traffic, ticket, hotel, or performance availability.

---

### Task 1: Revision-Aware Execution Migration

**Files:**
- Modify: `lib/domain/trip.ts`
- Modify: `lib/trip-execution/model.ts`
- Modify: `lib/trip-execution/model.test.mjs`
- Modify: `components/trip/trip-workspace.tsx`

**Interfaces:**
- `TripWithDaysAndEvents.planRevision?: number` identifies a revised seed plan.
- `TripExecutionParseResult` additionally returns `rebased: boolean` and `discardedChangeCount: number`.
- `parseTripExecution(raw, fallbackTrip)` keeps the same call signature.

- [ ] **Step 1: Write failing migration tests**

Add tests for:

```js
assert.equal(result.rebased, true);
assert.deepEqual(result.state.initialSnapshot, revisedTrip);
assert.deepEqual(result.state.changes.map((change) => change.id), ['keep-day-1']);
assert.equal(result.discardedChangeCount, 3);
```

The stale changes must include a deleted event change, a swap referencing a deleted event, and an undo of a discarded change. Add a second parse using `serializeTripExecution(result.state)` and assert `rebased === false` and `discardedChangeCount === 0`.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test lib/trip-execution/model.test.mjs`

Expected: FAIL because `planRevision`, `rebased`, and filtering do not exist.

- [ ] **Step 3: Implement compatibility filtering**

On revision mismatch:

```ts
const eventIds = new Set(fallbackTrip.days.flatMap((day) => day.events.map((event) => event.id)));
const dayIds = new Set(fallbackTrip.days.map((day) => day.id));
```

Keep ordinary changes only when `eventId` exists. A `move` additionally requires an existing string `targetDayId`; a `swap` additionally requires an existing string `otherEventId`. After filtering business changes, retain `undo` only when `undoOf` references a retained change. Use the new seed as `initialSnapshot` and return the discarded count.

- [ ] **Step 4: Surface only material discard feedback**

In `TripWorkspace`, when `result.rebased && result.discardedChangeCount > 0`, set:

```ts
`基础行程已更新为平遥安排；保留了仍有效的修改，移除了 ${result.discardedChangeCount} 条已失效的旧地点修改。`
```

Do not show a migration warning when no change was discarded.

- [ ] **Step 5: Run tests and static checks**

Run: `npm run test:execution && npm run lint && npm run typecheck`

Expected: all tests pass, lint is clean, TypeScript exits 0.

- [ ] **Step 6: Commit**

```bash
git add lib/domain/trip.ts lib/trip-execution/model.ts lib/trip-execution/model.test.mjs components/trip/trip-workspace.tsx
git commit -m "feat: rebase revised trip plans safely"
```

### Task 2: Pingyao Itinerary, Todos, and Map

**Files:**
- Modify: `lib/mock/shanxi-loop.ts`
- Modify: `lib/mock/destination-map.ts`
- Modify: `components/trip/destination-map.tsx`
- Modify: `scripts/validate-scaffold.mjs`

**Interfaces:**
- The seeded trip has `planRevision: 2`.
- New event IDs use indices 11 and above so old Day 2 / Day 3 changes cannot attach to different meanings.
- Map points reference the new event IDs.

- [ ] **Step 1: Add failing scaffold requirements**

Require these snippets:

```js
{ file: 'lib/mock/shanxi-loop.ts', snippet: 'planRevision: 2', message: 'Pingyao seed revision is missing' },
{ file: 'lib/mock/shanxi-loop.ts', snippet: '平遥古城墙', message: 'Pingyao wall itinerary is missing' },
{ file: 'lib/mock/shanxi-loop.ts', snippet: '日昇昌票号', message: 'Rishengchang itinerary is missing' },
{ file: 'lib/mock/shanxi-loop.ts', snippet: '自驾前往临汾', message: 'Day 3 Linfen transfer is missing' },
{ file: 'components/trip/destination-map.tsx', snippet: '山西自驾目的地地图', message: 'Map title must cover the full route' },
```

Forbid old seed snippets in `lib/mock/shanxi-loop.ts`: `神龙湾大峡谷浅滩`, `太行音乐公路`, and `洪洞大槐树`.

- [ ] **Step 2: Run scaffold validation and verify failure**

Run: `node scripts/validate-scaffold.mjs`

Expected: FAIL on missing Pingyao itinerary requirements.

- [ ] **Step 3: Replace Day 2 and Day 3**

Implement the exact event windows from the design spec. Use descriptions that state road time and opening hours must be rechecked on the travel day. Keep Day 4 unchanged.

- [ ] **Step 4: Replace todos and destination points**

Day 2 todos cover the long transfer, service-area rest, parking, walking shoes, and water. Day 3 todo covers official opening-time checks, luggage storage, and departure for Linfen by 16:30. Replace old map points with Pingyao wall, county office, Rishengchang, escort museum, Pingyao stay, and Linfen stay.

- [ ] **Step 5: Generalize the map copy and extent**

Change the heading to “山西自驾目的地地图”, the footer summary to “长治 · 平遥 · 临汾 · 运城”, and extend the OpenStreetMap bounding box north to at least latitude `37.30`.

- [ ] **Step 6: Run scaffold and static checks**

Run: `node scripts/validate-scaffold.mjs && npm run lint && npm run typecheck`

Expected: scaffold passes, lint is clean, TypeScript exits 0.

- [ ] **Step 7: Commit**

```bash
git add lib/mock/shanxi-loop.ts lib/mock/destination-map.ts components/trip/destination-map.tsx scripts/validate-scaffold.mjs
git commit -m "feat: revise Day 2 and Day 3 for Pingyao"
```

### Task 3: Pingyao Study Challenges

**Files:**
- Modify: `lib/mock/study-cards.ts`
- Modify: `scripts/validate-scaffold.mjs`

**Interfaces:**
- Day 2 wall card maps to `day-2-event-15`.
- Day 3 county-office card maps to `day-3-event-12`.
- Day 3 finance-and-escort card maps only to `day-3-event-15`; the task text carries the observation forward into the following escort-museum event without rendering a duplicate card.

- [ ] **Step 1: Add failing content assertions**

Require stable task IDs:

```text
pingyao-wall-observe-defense
pingyao-yamen-observe-inscription
pingyao-finance-observe-draft
```

Forbid obsolete study-card IDs `study-shenlongwan-road`, `study-shenlongwan-canyon`, `study-taihang-music-road`, and `study-hongdong`.

- [ ] **Step 2: Run scaffold validation and verify failure**

Run: `node scripts/validate-scaffold.mjs`

Expected: FAIL on missing Pingyao study IDs.

- [ ] **Step 3: Replace obsolete cards with three Pingyao cards**

Each card contains three tasks: observation, explanation/quiz, and reflection/comparison. Reference answers must include wording such as “以现场说明牌为准” or “答案不唯一” where the result depends on what the child sees.

- [ ] **Step 4: Run full validation**

Run: `npm test && npm run lint && npm run typecheck && npm run build`

Expected: all tests pass, scaffold passes, lint is clean, TypeScript exits 0, production build succeeds.

- [ ] **Step 5: Verify in a real browser**

Confirm Day 2 and Day 3 summaries, event times, map points, one/two study-card limit, collapsed reference answers, and editable child-answer fields. Seed a stale localStorage snapshot and confirm migration removes obsolete changes while keeping a valid Day 1 change.

- [ ] **Step 6: Request final Claude review and commit fixes**

Ask Claude to check route continuity, child workload, reference-answer epistemic wording, stable IDs, and migration safety. Fix any P0/P1 issue and rerun Step 4.

```bash
git add lib/mock/study-cards.ts scripts/validate-scaffold.mjs
git commit -m "feat: add Pingyao study challenges"
```

### Task 4: Durable Project Memory

**Files:**
- Modify: `MEMORY.md`

**Interfaces:**
- Records the user-approved route revision and revision-aware local migration rule.

- [ ] **Step 1: Append the durable decision**

Record that Day 2 now arrives in Pingyao during the afternoon, Day 3 is a full Pingyao study day followed by an evening transfer to Linfen, and future seed-plan replacements require `planRevision` plus reference-safe change rebasing.

- [ ] **Step 2: Commit**

```bash
git add MEMORY.md
git commit -m "docs: record Pingyao route revision"
```
