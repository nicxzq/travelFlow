# Study Task Answers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-task reference content and locally persisted child answers to every study challenge.

**Architecture:** Static study tasks gain stable ids and required reference text. `TripWorkspace` owns a versioned, trip-scoped study-progress state and persists it to localStorage with a guarded 400ms debounce. `TimelineCard` remains controlled and renders role-aware answer inputs plus an independent accessible disclosure for each task.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5.8, browser localStorage, existing scaffold validation.

## Global Constraints

- Every task has a stable explicit id and non-empty `referenceAnswer`.
- quiz labels use “参考答案”; observe/reflection labels use “参考思路”.
- Reference content is collapsed by default and independently expandable per task.
- Child answers are stored under `travelflow:study:${tripId}` using schema version 1.
- Persist after 400ms; invalid storage silently resets without crashing.
- A non-empty answer marks a task complete, but manual uncheck never clears its answer.
- Viewer mode cannot edit answers or completion; it may expand reference content.
- Do not add Supabase study tables or cross-device synchronization in this change.

---

### Task 1: Stabilize Study Tasks and Add Reference Content

**Files:**
- Modify: `lib/mock/study-cards.ts`
- Modify: `scripts/validate-scaffold.mjs`

**Interfaces:**
- Produces: `StudyTask { id, type, prompt, referenceAnswer }`.
- Produces: globally unique task ids consumed as React keys and persistence keys.

- [ ] **Step 1: Add failing structural validation**

Extend `scripts/validate-scaffold.mjs` to read `lib/mock/study-cards.ts` and fail unless the source contains the new required fields:

```js
assertIncludes('lib/mock/study-cards.ts', 'id: string;', 'Study tasks need stable ids');
assertIncludes('lib/mock/study-cards.ts', 'referenceAnswer: string;', 'Study tasks need reference content');
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test`

Expected: FAIL with stable-id/reference-content validation messages.

- [ ] **Step 3: Add stable ids and Claude-reviewed reference text**

Change the task type to:

```ts
export type StudyTask = {
  id: string;
  type: StudyTaskType;
  prompt: string;
  referenceAnswer: string;
};
```

Use semantic ids such as `huangyadong-observe-terrain`, `huangyadong-quiz-location`, and `huangyadong-reflection-history`. Every existing task receives a concise prompt-aligned reference. For open observation/reflection tasks, phrase it as a possible line of thought rather than a unique correct answer. For 蒲津渡, state only that the heavy iron oxen anchored the floating bridge; do not assert an unverified orientation.

- [ ] **Step 4: Verify and commit**

Run:

```bash
npm test
npm run typecheck
```

Expected: validation and TypeScript pass.

Commit:

```bash
git add lib/mock/study-cards.ts scripts/validate-scaffold.mjs
git commit -m "feat: add study task reference answers"
```

### Task 2: Add Versioned Local Study Progress

**Files:**
- Create: `lib/study/progress.ts`
- Modify: `components/trip/trip-workspace.tsx`
- Modify: `components/trip/timeline-card.tsx`
- Modify: `scripts/validate-scaffold.mjs`

**Interfaces:**
- Produces: `StudyProgressState { completedTaskIds: string[]; answers: Record<string, string> }`.
- Produces: `getStudyStorageKey(tripId: string): string`.
- Produces: `parseStudyProgress(raw: string | null): StudyProgressState`.
- `TripWorkspace` passes `studyAnswers` and `onStudyAnswerChange` to each `TimelineCard`.

- [ ] **Step 1: Add failing scaffold assertions**

```js
assertIncludes('lib/study/progress.ts', "version: 1", 'Study progress needs a versioned payload');
assertIncludes('lib/study/progress.ts', 'travelflow:study:', 'Study progress needs a trip-scoped key');
assertIncludes('components/trip/trip-workspace.tsx', '400', 'Study progress needs a 400ms persistence debounce');
```

- [ ] **Step 2: Verify failure**

Run: `npm test`

Expected: FAIL because `lib/study/progress.ts` does not exist.

- [ ] **Step 3: Implement safe parsing and serialization**

`lib/study/progress.ts` exports:

```ts
export type StudyProgressState = {
  completedTaskIds: string[];
  answers: Record<string, string>;
};

export const EMPTY_STUDY_PROGRESS: StudyProgressState = {
  completedTaskIds: [],
  answers: {},
};

export function getStudyStorageKey(tripId: string) {
  return `travelflow:study:${tripId}`;
}
```

`parseStudyProgress` catches JSON errors, requires `version === 1`, string-only arrays/answer values, and returns fresh empty arrays/objects on failure. `serializeStudyProgress` adds `version: 1` and `updatedAt`.

- [ ] **Step 4: Hydrate and persist from TripWorkspace**

Add `studyAnswers` and `hasHydratedStudyProgress`. On mount, read once inside `try/catch`; remove malformed data. A second effect writes only after hydration, with `window.setTimeout(..., 400)` and cleanup.

Implement:

```ts
function updateStudyAnswer(taskId: string, value: string) {
  const trimmed = value.trim();
  setStudyAnswers((current) => {
    const next = { ...current };
    if (trimmed) next[taskId] = value;
    else delete next[taskId];
    return next;
  });
  if (trimmed) {
    setCompletedStudyTaskIds((current) => (current.includes(taskId) ? current : [...current, taskId]));
  }
}
```

Do not clear answers in `toggleStudyTask`.

Add the optional `studyAnswers` and `onStudyAnswerChange` fields to `TimelineCardProps` so the controlled state contract compiles; Task 3 renders them.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add lib/study/progress.ts components/trip/trip-workspace.tsx components/trip/timeline-card.tsx scripts/validate-scaffold.mjs
git commit -m "feat: persist local study progress"
```

### Task 3: Render Child Answers and Accessible Reference Disclosures

**Files:**
- Modify: `components/trip/timeline-card.tsx`
- Modify: `components/trip/trip-workspace.tsx`
- Modify: `document/研学打卡闯关功能 Spec.md`
- Modify: `MEMORY.md`

**Interfaces:**
- `TimelineCard` consumes `studyAnswers?: Record<string, string>`.
- `TimelineCard` consumes `onStudyAnswerChange?: (taskId: string, answer: string) => void`.

- [ ] **Step 1: Render a controlled answer area per task**

Add a failing negative structural assertion first:

```js
function assertNotIncludes(file, snippet, message) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  if (content.includes(snippet)) failures.push(`${message}: ${file}`);
}

assertNotIncludes('components/trip/timeline-card.tsx', '${studyCard.id}-${index}', 'Study tasks must not use array indexes as ids');
```

Run `npm test` and expect this assertion to fail before changing the component.

Then replace the label-only task loop with a task article keyed by `task.id`. Editable mode renders:

```tsx
<textarea
  aria-label={`${task.prompt} 的孩子答案`}
  rows={task.type === 'reflection' ? 3 : 2}
  value={studyAnswers[task.id] ?? ''}
  onChange={(event) => onStudyAnswerChange?.(task.id, event.target.value)}
  placeholder="写下孩子自己的观察或回答"
/>
```

Read-only mode renders the saved text or `还没有作答` and never renders an editable textarea.

- [ ] **Step 2: Add an independent reference disclosure**

Track `openReferenceTaskIds` in `TimelineCard`. For each task derive:

```ts
const referenceLabel = task.type === 'quiz' ? '参考答案' : '参考思路';
const referenceId = `${task.id}-reference`;
```

The button uses `aria-expanded`, `aria-controls`, and toggles only that task. The region uses the stable id, `role="region"`, and `aria-label={`${task.prompt} 的${referenceLabel}`}`. Do not disable this button in read-only mode.

- [ ] **Step 3: Update documentation and durable memory**

Update the existing study Spec to state that MVP now supports stable task ids, per-task reference content, local child answers, versioned storage, and read-only rendering. Record only the durable product decision in `MEMORY.md`, not every reference answer.

- [ ] **Step 4: Run acceptance checks**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all commands exit 0. Manually verify one editable trip and `/trip/[id]/share`: references start collapsed; answers survive refresh; viewer cannot edit but can expand references.

- [ ] **Step 5: Commit**

```bash
git add lib/mock/study-cards.ts lib/study/progress.ts components/trip scripts/validate-scaffold.mjs document/研学打卡闯关功能\ Spec.md MEMORY.md
git commit -m "feat: record child study answers"
```
