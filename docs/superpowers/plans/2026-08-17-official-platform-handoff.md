# Official Platform Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe one-tap handoffs from the nearby decision card to Amap, Meituan, Dianping, and Ctrip without handling personal platform credentials.

**Architecture:** A focused pure module builds scenario-specific Chinese search keywords and allowlisted official URLs. The client component renders the scenario selector, exposes the generated keyword, attempts a clipboard copy, and opens the official platform; Amap additionally receives coordinates through its documented URI API.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Node test runner, Lucide icons.

## Global Constraints

- Never collect, store, forward, or simulate a third-party password, Cookie, Session, or personal account login.
- Use only documented or stable official HTTPS endpoints; do not invent private URL schemes.
- Location remains opt-in and ephemeral.
- Do not claim that TravelFlow has read platform ratings, prices, availability, or review text.
- Amap uses `https://uri.amap.com/search` with `callnative=1`; other platforms use keyword copy plus official HTTPS entry.

---

## File Structure

- Create `lib/platform-search.ts`: types, keyword templates, platform metadata, official URL builders.
- Create `lib/platform-search.test.mjs`: pure behavior tests for scenarios, encoding, coordinates, and official-domain allowlist.
- Modify `components/trip/nearby-decision-card.tsx`: scenario selector, visible keyword, platform actions, clipboard fallback, status feedback, privacy copy.
- Modify `package.json`: include platform tests in the existing test command.
- Modify `scripts/validate-scaffold.mjs`: require the new helper and trust-boundary UI copy.
- Modify `MEMORY.md`: record the durable account and integration boundary.

### Task 1: Platform Search Model

**Files:**
- Create: `lib/platform-search.ts`
- Create: `lib/platform-search.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `SearchScenario`, `SearchPlatform`, `PlatformSearchInput`, `buildPlatformKeyword(input)`, `buildPlatformLaunch(input)`.
- `buildPlatformLaunch` returns `{ platform, label, keyword, url, directSearch }`.

- [ ] **Step 1: Write failing pure-function tests**

Cover these exact assertions:

```js
assert.match(buildPlatformKeyword({ scenario: 'food', placeName: '平遥古城', availableHours: 4 }), /平遥古城/);
assert.match(buildPlatformKeyword({ scenario: 'food', placeName: '平遥古城', availableHours: 4 }), /当地特色/);
assert.equal(new URL(amap.url).hostname, 'uri.amap.com');
assert.equal(new URL(amap.url).searchParams.get('center'), '112.18,37.2');
assert.equal(new URL(amap.url).searchParams.get('callnative'), '1');
assert.equal(new URL(meituan.url).hostname, 'www.meituan.com');
assert.equal(new URL(dianping.url).hostname, 'www.dianping.com');
assert.equal(new URL(ctrip.url).hostname, 'm.ctrip.com');
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test lib/platform-search.test.mjs`

Expected: FAIL because `lib/platform-search.ts` does not exist.

- [ ] **Step 3: Implement minimal typed builders**

Use scenario templates:

```ts
const scenarioTerms = {
  attraction: (hours: number) => `附近 ${hours}小时 亲子 少走路 景点`,
  food: () => '附近 当地特色 适合家庭 性价比 餐厅',
  hotel: () => '附近 家庭房 停车方便 性价比 酒店',
} satisfies Record<SearchScenario, (hours: number) => string>;
```

Build Amap with `URL` and `URLSearchParams`, set `keyword`, `view=list`, `src=travelflow`, `callnative=1`, and optional `center=${lng},${lat}`. Use only these fallbacks for other platforms: `https://www.meituan.com/`, `https://www.dianping.com/`, and `https://m.ctrip.com/webapp/hotels/`.

- [ ] **Step 4: Run the focused tests**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test lib/platform-search.test.mjs`

Expected: all platform-search tests PASS.

- [ ] **Step 5: Add the test to package scripts and commit**

Set `test:execution` to run both `lib/trip-execution/*.test.mjs` and `lib/platform-search.test.mjs`.

```bash
git add lib/platform-search.ts lib/platform-search.test.mjs package.json
git commit -m "feat: add official platform search links"
```

### Task 2: Nearby Decision Platform Actions

**Files:**
- Modify: `components/trip/nearby-decision-card.tsx`
- Modify: `scripts/validate-scaffold.mjs`

**Interfaces:**
- Consumes: `buildPlatformKeyword` and `buildPlatformLaunch` from `@/lib/platform-search`.
- Produces: four visible official-platform actions and an `aria-live` action status.

- [ ] **Step 1: Add scaffold assertions before UI code**

Require `lib/platform-search.ts` and these UI snippets:

```js
{ file: 'components/trip/nearby-decision-card.tsx', snippet: '登录只在官方平台内完成', message: 'Platform credential boundary is missing' },
{ file: 'components/trip/nearby-decision-card.tsx', snippet: 'buildPlatformLaunch', message: 'Official platform handoff is missing' },
```

- [ ] **Step 2: Run scaffold validation and verify failure**

Run: `node scripts/validate-scaffold.mjs`

Expected: FAIL on the missing trust-boundary snippet.

- [ ] **Step 3: Implement scenario and platform actions**

Add a three-option scenario selector (`attraction`, `food`, `hotel`), a read-only visible keyword field, and actions for `amap`, `meituan`, `dianping`, and `ctrip`. On click, call `navigator.clipboard.writeText(keyword)` without blocking navigation, open `launch.url` with `window.open(..., '_blank', 'noopener,noreferrer')`, and show either a copied or manual-copy status. Keep the keyword field selectable as fallback.

- [ ] **Step 4: Add explicit trust copy**

Render:

```tsx
<p>TravelFlow 不接触平台账号、密码或 Cookie；登录只在官方平台内完成。</p>
<p>当前未读取平台评分、价格或实时余量，请在跳转后的官方页面核验。</p>
```

- [ ] **Step 5: Run focused and static validation**

Run: `npm run test:execution && npm run lint && npm run typecheck`

Expected: tests PASS, ESLint clean, TypeScript exits 0.

- [ ] **Step 6: Commit**

```bash
git add components/trip/nearby-decision-card.tsx scripts/validate-scaffold.mjs
git commit -m "feat: add nearby platform handoffs"
```

### Task 3: End-to-End Acceptance and Durable Memory

**Files:**
- Modify: `MEMORY.md`

**Interfaces:**
- Consumes the completed nearby decision UI.
- Produces verified browser behavior and a recorded architecture boundary.

- [ ] **Step 1: Run the full validation suite**

Run: `npm test && npm run lint && npm run typecheck && npm run build`

Expected: all tests PASS, lint clean, typecheck exits 0, Next.js production build succeeds.

- [ ] **Step 2: Verify in a real browser**

Start the dev server and confirm:

1. “附近决策助手” shows three search scenarios and four platform actions.
2. Changing from half-day attraction to food changes the keyword to include “当地特色”.
3. Amap action targets `uri.amap.com/search`, includes the encoded keyword, and includes `callnative=1`.
4. Meituan, Dianping, and Ctrip actions target only their official HTTPS hosts.
5. The action status explains copy/open behavior and the trust copy is visible.

- [ ] **Step 3: Request final Claude review**

Give Claude the diff and ask specifically for credential leakage, undocumented scheme, popup/clipboard, coordinate-order, and misleading-data issues. Fix any P0/P1 issue, then rerun Step 1.

- [ ] **Step 4: Record the durable boundary**

Append to `MEMORY.md` that personal platform accounts are never proxied; official OAuth/API requires verified authorization; until then use generated keywords plus official HTTPS/URI handoff, with login remaining inside the official platform.

- [ ] **Step 5: Commit**

```bash
git add MEMORY.md
git commit -m "docs: record platform handoff boundary"
```
