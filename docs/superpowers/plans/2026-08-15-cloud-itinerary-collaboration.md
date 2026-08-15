# Cloud Itinerary Collaboration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every itinerary change in Supabase and let owners, link editors, and link viewers safely see the same current trip without an explicit login screen.

**Architecture:** Supabase Anonymous Auth supplies a stable `auth.uid()` for every browser. Owners are identified by `trips.owner_id`; reusable viewer/editor invitation tokens are exchanged server-side for private trip access sessions. Public trip tables use RLS through a hardened private authorization function, and Supabase Postgres Changes provides live updates under the same authorization model.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5.8, Supabase Auth/Postgres/Realtime, `@supabase/supabase-js` 2.49.1, `@supabase/ssr` 0.6.1, Vitest 3.2.4, Testing Library React 16.3.0.

## Global Constraints

- Keep the existing viewer URL read-only and add a separate editor invitation URL.
- Editors may create, edit, move, and mark events cancelled; only owners may delete or manage links.
- A viewer/editor link is reusable by multiple people until revoked.
- Store only SHA-256 token hashes; never expose raw tokens or the service-role key to the browser.
- Put token and access-session tables in a non-exposed `private` schema.
- All client-visible reads, writes, and Realtime subscriptions use the current user's JWT and RLS.
- `service_role` is server-only and limited to invitation exchange, link lifecycle, and scheduled purge.
- Fixed access heartbeat interval: 30 seconds; revoke fallback deadline: 35 seconds.
- Do not add `trip_members`, CRDT/OT, offline mutation queues, presence UI, or media sync in this plan.
- Pin every added npm dependency exactly and commit `package-lock.json`.

---

## File Structure

- `lib/supabase/browser.ts`: singleton browser client and anonymous-session bootstrap.
- `lib/supabase/server.ts`: cookie-aware user-scoped server client.
- `lib/supabase/admin.ts`: server-only service-role client.
- `middleware.ts`: refresh Supabase Auth cookies before Server Components run.
- `lib/trips/access.ts`: access roles, mutation result types, and permission helpers.
- `lib/trips/repository.ts`: user-scoped Supabase reads and writes; no UI logic.
- `lib/trips/mappers.ts`: database rows to `TripWithDaysAndEvents` mapping.
- `lib/trips/local-import.ts`: generated/local itinerary to cloud insert payload.
- `app/invite/[token]/route.ts`: validate reusable invitation and redirect to a clean trip URL.
- `app/actions/cloud-trip-actions.ts`: authorized owner/editor mutations and conflict responses.
- `app/actions/share-actions.ts`: owner-only viewer/editor link lifecycle and heartbeat.
- `components/trip/use-trip-sync.ts`: optimistic state, Realtime subscription, rollback, and reconnect refresh.
- `components/trip/trip-share-panel.tsx`: copy/revoke/regenerate viewer and editor links.
- `components/trip/access-status.tsx`: saving, offline, conflict, and revoked states.
- `tests/unit`: pure helper and mapper tests.
- `tests/components`: role-sensitive UI and sync-hook tests.
- `tests/integration`: Supabase RLS, invitation, conflict, and Realtime acceptance tests.

### Task 1: Add Reproducible Test and Supabase SSR Foundations

**Files:**
- Modify: `package.json`
- Create: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `vitest.integration.config.ts`
- Create: `tests/setup.ts`
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create: `middleware.ts`
- Create: `supabase/config.toml`
- Create: `tests/unit/supabase-config.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `getSupabaseBrowserClient(): SupabaseClient<Database>`
- Produces: `ensureAnonymousSession(): Promise<User>`
- Produces: `createUserScopedServerClient(): Promise<SupabaseClient<Database>>`
- Produces: `ensureAnonymousSessionServer(): Promise<User>`
- Produces: `createAdminClient(): SupabaseClient<Database>`; importable only from server modules.

- [ ] **Step 1: Install pinned dependencies and create the lockfile**

Run:

```bash
npm install --save-exact @supabase/supabase-js@2.49.1 @supabase/ssr@0.6.1
npm install --save-dev --save-exact vitest@3.2.4 jsdom@26.1.0 @testing-library/react@16.3.0 @testing-library/jest-dom@6.6.3 supabase@2.81.3
```

Expected: `package-lock.json` is created and all listed versions are exact, without `^` or `~`.

- [ ] **Step 2: Add failing configuration tests**

Create `tests/unit/supabase-config.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

describe('Supabase client boundaries', () => {
  it('never reads the service role from a NEXT_PUBLIC variable', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY', 'forbidden');
    const source = await import('node:fs/promises').then((fs) => fs.readFile('lib/supabase/admin.ts', 'utf8'));
    expect(source).not.toContain('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
    expect(source).toContain("import 'server-only'");
  });
});
```

Add scripts to `package.json`:

```json
"test:scaffold": "node scripts/validate-scaffold.mjs",
"test:unit": "vitest run",
"test:integration": "vitest run --config vitest.integration.config.ts",
"test": "npm run test:scaffold && npm run test:unit"
```

Configure `vitest.config.ts` with jsdom, `tests/setup.ts`, and `exclude: ['tests/integration/**', 'node_modules/**']`. Configure `vitest.integration.config.ts` with Node environment, `include: ['tests/integration/**/*.test.ts']`, and `testTimeout: 45000`.

- [ ] **Step 3: Run the test and verify failure**

Run: `npm run test:unit -- tests/unit/supabase-config.test.ts`

Expected: FAIL because `lib/supabase/admin.ts` does not exist.

- [ ] **Step 4: Implement the three client boundaries**

`lib/supabase/admin.ts` must start with:

```ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin environment is not configured.');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
```

`lib/supabase/browser.ts` exports a singleton client and:

```ts
export async function ensureAnonymousSession() {
  const client = getSupabaseBrowserClient();
  const { data: sessionData } = await client.auth.getSession();
  if (sessionData.session?.user) return sessionData.session.user;
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) throw new Error('无法建立匿名行程身份。');
  return data.user;
}
```

Use `createBrowserClient` and `createServerClient` from `@supabase/ssr`; the server client must read and write cookies through `next/headers` and must not import the admin client. Add `ensureAnonymousSessionServer()` beside it: call `auth.getUser()`, fall back to `auth.signInAnonymously()`, and rely on the Route Handler cookie adapter to emit the returned session cookies.

Create `middleware.ts` using a request/response cookie adapter, call `auth.getUser()` on each matched application request, and copy every refreshed cookie to both the forwarded request and returned response. Exclude `_next/static`, `_next/image`, favicon, and static image extensions in `config.matcher`.

Initialize local Supabase and enable anonymous sign-in:

```bash
npx supabase init
```

Set this exact value in `supabase/config.toml`:

```toml
[auth]
enable_anonymous_sign_ins = true
```

Add only the variable name to `.env.example`:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run test:unit -- tests/unit/supabase-config.test.ts
npm run typecheck
```

Expected: PASS; TypeScript exits 0.

Commit:

```bash
git add package.json package-lock.json vitest.config.ts vitest.integration.config.ts tests/setup.ts tests/unit/supabase-config.test.ts lib/supabase middleware.ts supabase/config.toml .env.example
git commit -m "test: add Supabase SSR foundations"
```

### Task 2: Create the Cloud Collaboration Schema and RLS Contract

**Files:**
- Create with CLI: `supabase/migrations/*_cloud_itinerary_collaboration.sql`
- Create: `supabase/tests/cloud_itinerary_collaboration.sql`
- Modify: `db/schema.sql`
- Modify after migration: `types/supabase.ts`
- Modify: `lib/domain/trip.ts`

**Interfaces:**
- Produces: `private.can_access_trip(target_trip_id uuid, required_role text): boolean`
- Produces: `public.redeem_share_token(p_raw_token text, p_auth_user_id uuid)`; EXECUTE only for `service_role`.
- Produces: `public.rotate_share_token(p_trip_id uuid, p_role text, p_token_hash text, p_owner_user_id uuid)`; EXECUTE only for `service_role`.
- Produces: `public.check_trip_access(p_trip_id uuid)`; EXECUTE only for `authenticated`.
- Produces: `public.move_event(p_event_id uuid, p_day_id uuid, p_sort_order integer, p_expected_updated_at timestamptz)`; `SECURITY INVOKER`.
- Produces: public tables `todos`; extended `trips`, `days`, `events`.
- Produces: private tables `share_tokens`, `trip_access_sessions`.
- Produces: `EventStatus` including `cancelled`.

- [ ] **Step 1: Create the migration through the CLI**

Run:

```bash
npx supabase --help
npx supabase migration new cloud_itinerary_collaboration
```

Expected: CLI prints the exact generated migration path ending in `_cloud_itinerary_collaboration.sql`. Use that path for every following migration edit; do not hand-invent a timestamp.

- [ ] **Step 2: Write failing SQL authorization tests**

Create `supabase/tests/cloud_itinerary_collaboration.sql` as one transaction with fixed fixture UUIDs. Insert six `auth.users`, one trip, active editor/viewer tokens, revoked/expired tokens, and their access sessions before switching to `authenticated`. Use this complete assertion shape:

```sql
begin;
select plan(13);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       id::text || '@test.invalid', '', now(), now()
from unnest(array[
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000006'::uuid
]) as fixture(id);

insert into public.trips (id, owner_id, title, destination, status)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '测试行程', '长治', 'planning');

insert into private.share_tokens (id, trip_id, token_hash, role, created_by, expires_at, revoked_at)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'editor-hash', 'editor', '00000000-0000-0000-0000-000000000001', now() + interval '1 day', null),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'viewer-hash', 'viewer', '00000000-0000-0000-0000-000000000001', now() + interval '1 day', null),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'revoked-hash', 'viewer', '00000000-0000-0000-0000-000000000001', now() + interval '1 day', now()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'expired-hash', 'viewer', '00000000-0000-0000-0000-000000000001', now() - interval '1 day', null);

insert into private.trip_access_sessions (share_token_id, trip_id, auth_user_id, role)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'editor'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'viewer'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'viewer'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'viewer');

select has_table('public', 'todos');
select has_table('private', 'share_tokens');
select has_table('private', 'trip_access_sessions');
select has_function('private', 'can_access_trip', array['uuid', 'text']);
select policies_are('public', 'events', array[
  'events_owner_delete', 'events_trip_read', 'events_trip_insert', 'events_trip_update'
]);
select policies_are('public', 'todos', array[
  'todos_owner_delete', 'todos_trip_read', 'todos_trip_insert', 'todos_trip_update'
]);

select results_eq(
  $$ select count(*)::integer from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public'
       and tablename in ('days', 'events', 'todos') $$,
  array[3],
  'all mutable trip tables are published to Realtime'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select ok(private.can_access_trip('10000000-0000-0000-0000-000000000001', 'viewer'), 'owner can view');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select ok(private.can_access_trip('10000000-0000-0000-0000-000000000001', 'editor'), 'editor can edit');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select ok(private.can_access_trip('10000000-0000-0000-0000-000000000001', 'viewer'), 'viewer can view');
select isnt(private.can_access_trip('10000000-0000-0000-0000-000000000001', 'editor'), true, 'viewer cannot edit');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select isnt(private.can_access_trip('10000000-0000-0000-0000-000000000001', 'viewer'), true, 'revoked token cannot view');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
select isnt(private.can_access_trip('10000000-0000-0000-0000-000000000001', 'viewer'), true, 'expired token cannot view');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select isnt(private.can_access_trip('10000000-0000-0000-0000-000000000001', 'viewer'), true, 'non-member cannot view');
select * from finish();
rollback;
```

- [ ] **Step 3: Run the SQL tests and verify failure**

Run:

```bash
npx supabase start
npx supabase db reset
npx supabase test db supabase/tests/cloud_itinerary_collaboration.sql
```

Expected: FAIL because the migration objects and policies do not yet exist.

- [ ] **Step 4: Implement schema, constraints, and hardened authorization**

The generated migration must include:

```sql
create schema if not exists private;
revoke all on schema private from public, anon;

create or replace function private.can_access_trip(target_trip_id uuid, required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trips t
    where t.id = target_trip_id and t.owner_id = (select auth.uid()) and t.deleted_at is null
  ) or exists (
    select 1
    from private.trip_access_sessions s
    join private.share_tokens token on token.id = s.share_token_id
    where s.trip_id = target_trip_id
      and s.auth_user_id = (select auth.uid())
      and token.revoked_at is null
      and (token.expires_at is null or token.expires_at > now())
      and (required_role = 'viewer' or s.role = 'editor')
  );
$$;

revoke all on function private.can_access_trip(uuid, text) from public;
grant usage on schema private to authenticated;
grant execute on function private.can_access_trip(uuid, text) to authenticated;
```

Add `unique (id, trip_id)` to days/events and composite foreign keys from events/todos. Add separate SELECT/INSERT/UPDATE/DELETE policies; editor policies never allow DELETE. Every UPDATE policy includes both `USING` and `WITH CHECK`.

Add public RPC boundaries for private data. Every `SECURITY DEFINER` function sets `search_path = ''`, uses fully qualified names, revokes EXECUTE from `PUBLIC`, and grants only the stated role. `redeem_share_token` accepts the already verified user id and is callable only by `service_role`; `check_trip_access` reads `auth.uid()` and is callable only by `authenticated`.

`public.redeem_share_token` hashes `p_raw_token` with `extensions.digest`, validates active/unexpired token state, upserts `(share_token_id, auth_user_id)`, and returns only `trip_id` and `role`. `public.rotate_share_token` verifies `public.trips.owner_id = p_owner_user_id`, revokes the prior active token for that role, inserts the new hash, and returns its id. Revoke EXECUTE on both from `PUBLIC`, `anon`, and `authenticated`; grant only to `service_role`.

Add the concrete atomic move function:

```sql
create or replace function public.move_event(
  p_event_id uuid,
  p_day_id uuid,
  p_sort_order integer,
  p_expected_updated_at timestamptz
) returns public.events
language plpgsql
security invoker
set search_path = ''
as $$
declare
  moved public.events;
begin
  update public.events
  set day_id = p_day_id,
      sort_order = p_sort_order,
      updated_at = now(),
      updated_by = (select auth.uid())
  where id = p_event_id
    and updated_at = p_expected_updated_at
  returning * into moved;
  return moved;
end;
$$;
```

The composite foreign key enforces same-trip movement, and a null returned row is a conflict.

Publish live tables:

```sql
alter publication supabase_realtime add table public.days, public.events, public.todos;
```

Mirror the final public DDL and comments into `db/schema.sql` so the scaffold check and migration reference cannot drift.

- [ ] **Step 5: Generate types and verify database security**

Run:

```bash
npx supabase db reset
npx supabase test db supabase/tests/cloud_itinerary_collaboration.sql
npx supabase db advisors
npx supabase gen types typescript --local > types/supabase.ts
npm run typecheck
```

Expected: 13 pgTAP tests PASS; advisors report no security errors; TypeScript exits 0.

Update `lib/domain/trip.ts` so `EventStatus` includes `'cancelled'` and mutable domain records expose `updatedAt` and `updatedBy`.

- [ ] **Step 6: Commit**

```bash
git add supabase db/schema.sql types/supabase.ts lib/domain/trip.ts
git commit -m "feat: add cloud collaboration schema and RLS"
```

### Task 3: Exchange Reusable Invitations for Scoped Access Sessions

**Files:**
- Create: `lib/trips/access.ts`
- Create: `app/invite/[token]/route.ts`
- Create: `app/actions/share-actions.ts`
- Create: `tests/unit/access.test.ts`
- Create: `tests/integration/invite-access.test.ts`

**Interfaces:**
- Produces: `hashShareToken(rawToken: string): Promise<string>`
- Produces: `redeemShareToken(rawToken: string, authUserId: string): Promise<{ tripId: string; role: 'viewer' | 'editor' }>`
- Produces: `checkTripAccess(tripId: string): Promise<{ valid: boolean; role: AccessRole | null }>`
- Produces: `AccessRole = 'owner' | 'editor' | 'viewer'`
- Produces: `MutationResult<T> = { ok: true; data: T } | { ok: false; code: MutationErrorCode; latest?: T }`

- [ ] **Step 1: Write failing unit and integration tests**

Unit test:

```ts
it('hashes the same token deterministically without returning raw input', async () => {
  const first = await hashShareToken('secret-token');
  expect(first).toBe(await hashShareToken('secret-token'));
  expect(first).not.toContain('secret-token');
  expect(first).toMatch(/^[a-f0-9]{64}$/);
});
```

Integration cases: the same editor token can be redeemed by two anonymous users; revoked/expired/unknown tokens return the same 404 response; viewer redemption redirects to `/trip/{id}/share`, editor redemption redirects to `/trip/{id}`, and both responses use `Cache-Control: no-store`.

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:unit -- tests/unit/access.test.ts`

Expected: FAIL because `lib/trips/access.ts` does not exist.

- [ ] **Step 3: Implement token hashing and server-only redemption**

Use Web Crypto SHA-256 for hashing. `redeemShareToken` must first verify the current anonymous user through `createUserScopedServerClient().auth.getUser()`, then call `createAdminClient().rpc('redeem_share_token', { p_raw_token: rawToken, p_auth_user_id: user.id })`. Never call `.from()` or `.schema('private')`: service role bypasses RLS but cannot bypass PostgREST's exposed-schema allowlist.

`app/invite/[token]/route.ts` must:

```ts
export const dynamic = 'force-dynamic';

await ensureAnonymousSessionServer();
// Redeem token through the public RPC, then:
const destination = role === 'viewer' ? `/trip/${tripId}/share` : `/trip/${tripId}`;
return NextResponse.redirect(new URL(destination, request.url), {
  status: 302,
  headers: { 'Cache-Control': 'no-store' },
});
```

Do not log `params.token`, include it in errors, or send it to analytics.

- [ ] **Step 4: Verify and commit**

Run:

```bash
npm run test:unit -- tests/unit/access.test.ts
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add lib/trips/access.ts app/invite app/actions/share-actions.ts tests/unit/access.test.ts tests/integration/invite-access.test.ts
git commit -m "feat: exchange reusable trip invitations"
```

### Task 4: Replace Mock Reads and Local-Only Writes with a Cloud Repository

**Files:**
- Create: `lib/trips/mappers.ts`
- Create: `lib/trips/repository.ts`
- Create: `lib/trips/local-import.ts`
- Create: `app/actions/cloud-trip-actions.ts`
- Modify: `app/actions/trip-actions.ts`
- Modify: `components/new-trip/generate-form.tsx`
- Create: `tests/unit/trip-mappers.test.ts`
- Create: `tests/integration/cloud-trip-actions.test.ts`

**Interfaces:**
- Produces: `getCloudTrip(tripId: string): Promise<TripWithDaysAndEvents>`
- Produces: `createCloudTrip(input: GeneratedItinerary): Promise<{ tripId: string }>`
- Produces: `updateEvent(input: UpdateEventInput): Promise<MutationResult<TripEvent>>`
- Produces: `moveEvent(input: MoveEventInput): Promise<MutationResult<TripEvent>>`
- Produces: `cancelEvent(eventId: string, expectedUpdatedAt: string): Promise<MutationResult<TripEvent>>`
- Produces: `deleteEventAsOwner(eventId: string): Promise<MutationResult<null>>`

- [ ] **Step 1: Write failing mapper and authorization tests**

Mapper test must prove snake_case rows become camelCase domain objects and cancelled events remain visible with status `cancelled`.

Action tests must cover:

```ts
expect(await viewer.updateEvent(input)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
expect(await editor.deleteEventAsOwner(eventId)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
expect(await editor.cancelEvent(eventId, updatedAt)).toMatchObject({ ok: true });
expect(await staleOwner.updateEvent(staleInput)).toMatchObject({ ok: false, code: 'CONFLICT' });
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:unit -- tests/unit/trip-mappers.test.ts`

Expected: FAIL because the mapper does not exist.

- [ ] **Step 3: Implement repository and conflict contract**

Import the shared mutation contract from `lib/trips/access.ts`:

```ts
export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'OFFLINE'; latest?: T };
```

Every update must include `.eq('updated_at', input.expectedUpdatedAt)` and return `CONFLICT` with the latest row if zero rows changed. `moveEvent` calls `.rpc('move_event', { p_event_id, p_day_id, p_sort_order, p_expected_updated_at })`. Normal actions use the user-scoped server client, not admin.

- [ ] **Step 4: Import local itineraries once**

`local-import.ts` maps `GeneratedItinerary` into trip/day/event insert payloads. `generate-form.tsx` changes “保存到本地” to “保存到云端”, calls `ensureAnonymousSession()`, and retains localStorage only as an unsynced draft until cloud creation succeeds. On success save `cloudTripId` and prevent duplicate imports.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run test:unit -- tests/unit/trip-mappers.test.ts
npm run typecheck
npm run test:scaffold
```

Expected: PASS.

Commit:

```bash
git add lib/trips app/actions components/new-trip/generate-form.tsx tests
git commit -m "feat: persist itinerary changes in Supabase"
```

### Task 5: Add Optimistic State, Realtime Updates, and Conflict Rollback

**Files:**
- Create: `components/trip/use-trip-sync.ts`
- Create: `components/trip/access-status.tsx`
- Modify: `components/trip/trip-workspace.tsx`
- Create: `tests/components/use-trip-sync.test.tsx`

**Interfaces:**
- Produces: `useTripSync({ initialTrip, role }): { trip, syncState, updateEvent, moveEvent, cancelEvent, deleteEvent }`
- `syncState`: `'idle' | 'saving' | 'synced' | 'offline' | 'conflict' | 'revoked' | 'error'`.

- [ ] **Step 1: Write failing hook tests**

Test these observable outcomes:

```ts
expect(result.current.syncState).toBe('saving');
await waitFor(() => expect(result.current.syncState).toBe('synced'));

server.rejectWithConflict(latestEvent);
await waitFor(() => expect(result.current.syncState).toBe('conflict'));
expect(result.current.trip).toContainEvent(latestEvent);

server.rejectOffline();
await waitFor(() => expect(result.current.syncState).toBe('offline'));
expect(result.current.trip).toContainEvent(originalEvent);
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:unit -- tests/components/use-trip-sync.test.tsx`

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement optimistic mutations and Realtime**

Move `eventOverrides` and `deletedEventIds` ownership out of `TripWorkspace` into the hook. Subscribe to days/events/todos with filters by `trip_id`. On reconnect, call `getCloudTrip` before setting `synced`. Deduplicate own echoes with `updatedBy + updatedAt`.

Start a 30,000 ms access heartbeat. If `checkTripAccess` is invalid or any mutation is forbidden after prior access, unsubscribe and set `revoked`.

- [ ] **Step 4: Render status without false success**

`AccessStatus` copy:

```ts
const labels = {
  saving: '保存中…',
  synced: '已同步',
  offline: '离线，修改尚未保存',
  conflict: '同行刚刚更新了这项行程，请查看最新内容后重试',
  revoked: '此访问权限已被主理人撤销',
  error: '保存失败，请重试',
};
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run test:unit -- tests/components/use-trip-sync.test.tsx
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add components/trip/use-trip-sync.ts components/trip/access-status.tsx components/trip/trip-workspace.tsx tests/components/use-trip-sync.test.tsx
git commit -m "feat: sync trip changes in realtime"
```

### Task 6: Enforce Owner, Editor, and Viewer UI Capabilities

**Files:**
- Modify: `app/trip/[id]/page.tsx`
- Modify: `app/trip/[id]/share/page.tsx`
- Modify: `components/trip/trip-workspace.tsx`
- Modify: `components/trip/timeline-card.tsx`
- Create: `tests/components/trip-permissions.test.tsx`

**Interfaces:**
- `TripWorkspace` consumes `role: AccessRole` instead of `readOnly?: boolean`.
- `TimelineCard` consumes explicit capability callbacks; absence means the action is not rendered.

- [ ] **Step 1: Write failing role UI tests**

```tsx
render(<TripWorkspace trip={trip} role="viewer" />);
expect(screen.queryByRole('button', { name: '调整行程' })).not.toBeInTheDocument();

render(<TripWorkspace trip={trip} role="editor" />);
expect(screen.getByRole('button', { name: '标记取消' })).toBeInTheDocument();
expect(screen.queryByRole('button', { name: '永久删除' })).not.toBeInTheDocument();

render(<TripWorkspace trip={trip} role="owner" />);
expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:unit -- tests/components/trip-permissions.test.tsx`

Expected: FAIL because `TripWorkspace` still accepts `readOnly`.

- [ ] **Step 3: Implement capability-based rendering**

Replace boolean read-only branching with:

```ts
const canEdit = role === 'owner' || role === 'editor';
const canDelete = role === 'owner';
const canManageLinks = role === 'owner';
```

Both `app/trip/[id]/page.tsx` and `app/trip/[id]/share/page.tsx` must call `getCloudTrip(params.id)` and `checkTripAccess(params.id)` to obtain the real trip and role. The main route passes the resolved owner/editor role; the `/share` route always renders viewer capabilities after confirming at least viewer access. Remove the runtime seed/mock fallback for cloud ids. Add a test that mocks `lib/mock/shanxi-loop.ts` to throw and proves a cloud trip route still renders successfully.

Editor action copy is “标记取消”; owner delete confirmation says “立即从行程隐藏，7 天后永久删除”. The server remains authoritative even if UI controls are hidden.

- [ ] **Step 4: Verify and commit**

Run:

```bash
npm run test:unit -- tests/components/trip-permissions.test.tsx
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add app/trip components/trip tests/components/trip-permissions.test.tsx
git commit -m "feat: enforce trip collaboration roles in UI"
```

### Task 7: Add Owner Link Management and Recoverable Identity Upgrade

**Files:**
- Create: `components/trip/trip-share-panel.tsx`
- Create: `components/trip/identity-recovery-card.tsx`
- Modify: `app/actions/share-actions.ts`
- Modify: `components/trip/trip-workspace.tsx`
- Create: `tests/components/trip-share-panel.test.tsx`
- Create: `tests/integration/revoke-access.test.ts`

**Interfaces:**
- Produces: `createShareLink(tripId, role): Promise<{ url: string }>`
- Produces: `revokeAndRegenerateShareLink(tripId, role): Promise<{ url: string }>`
- Produces: `bindOwnerEmail(email: string): Promise<{ ok: true } | { ok: false; message: string }>`

- [ ] **Step 1: Write failing owner-only link tests**

Cover: owner can create/revoke viewer independently from editor; editor/viewer receive FORBIDDEN; old URL fails after revoke; new URL works; two existing access sessions lose query/write permission immediately.

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:unit -- tests/components/trip-share-panel.test.tsx`

Expected: FAIL because the share panel does not exist.

- [ ] **Step 3: Implement cryptographic link creation and lifecycle**

Generate 32 random bytes server-side, encode base64url, hash with SHA-256, verify the current user is the trip owner, then call the service-only `rotate_share_token` RPC. Never query private tables directly. The RPC revokes the prior row and inserts the new hash; return the raw token only once in the response URL.

The UI renders separate “复制只读链接” and “复制协作链接” sections, each with its own revoke/regenerate confirmation.

- [ ] **Step 4: Implement optional email binding**

For an anonymous owner, call `supabase.auth.updateUser({ email })` and show Magic Link verification status. Copy must state: “未绑定邮箱且清除浏览器数据后，主理人权限无法找回。” Do not block trip creation if the user skips this step.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run test:unit -- tests/components/trip-share-panel.test.tsx
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add app/actions/share-actions.ts components/trip tests/components/trip-share-panel.test.tsx tests/integration/revoke-access.test.ts
git commit -m "feat: manage trip share links and owner recovery"
```

### Task 8: Prove the Full Collaboration Story and Update Project Documentation

**Files:**
- Create: `tests/integration/realtime-collaboration.test.ts`
- Modify: `scripts/validate-scaffold.mjs`
- Modify: `document/Supabase同步设计文档.md`
- Modify: `document/迭代升级日志.md`
- Modify: `README.md`
- Modify: `MEMORY.md`

**Interfaces:**
- Consumes all prior tasks.
- Produces a single repeatable acceptance command and updated operating documentation.

- [ ] **Step 1: Write the end-to-end integration test**

Use three independent Supabase auth clients: owner, editor, viewer. The test must:

1. Create a trip as owner.
2. Redeem one editor token from two anonymous users and one viewer token.
3. Move “黄崖洞” to tomorrow as editor.
4. Observe the change from owner and viewer subscriptions.
5. Verify at least 19 of 20 updates arrive within 3 seconds and none exceeds 5 seconds.
6. Verify stale `updated_at` returns conflict rather than overwriting.
7. Verify editor DELETE and viewer UPDATE are denied.
8. Revoke the editor token and verify future reads/writes fail immediately.
9. Disable revoke subscription and verify the 30-second heartbeat exits within 35 seconds.

- [ ] **Step 2: Run the complete acceptance suite**

Run:

```bash
npx supabase db reset
npx supabase test db supabase/tests/cloud_itinerary_collaboration.sql
npm run test:unit
npm run test:integration
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0; SQL reports 13 passing tests; Realtime test meets its 19/20 latency criterion.

- [ ] **Step 3: Update documentation with verified boundaries**

Update the existing Supabase design to reflect anonymous owner auth, private access sessions, reusable viewer/editor links, Realtime in MVP, 30-second revoke heartbeat, no offline queue, and no `trip_members` yet.

Document and verify that Anonymous Sign-Ins are enabled in the hosted Supabase Auth settings before production smoke testing; local `supabase/config.toml` does not configure the hosted project.

Update README setup with:

```bash
npm install
npx supabase start
npx supabase db reset
npm test
npm run test:integration
```

Document that production deployment verification is deferred until Vercel CLI is installed and the real Supabase/Vercel projects are linked. Recommend:

```bash
npm i -g vercel
vercel env pull
vercel deploy
vercel logs
```

Do not claim hosted synchronization is complete based only on local tests.

- [ ] **Step 4: Record durable project knowledge and commit**

Append only genuinely learned implementation decisions or gotchas to `MEMORY.md`; do not copy schema details that are already discoverable from code.

Commit:

```bash
git add tests scripts document README.md MEMORY.md
git commit -m "test: verify cloud itinerary collaboration"
```
