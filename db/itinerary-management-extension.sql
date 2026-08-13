-- TravelFlow itinerary management extension.
-- Execute after db/schema.sql when enabling Supabase persistence for todos and map points.

alter table public.events
  add column if not exists status text check (status in ('planned', 'active', 'done', 'skipped', 'changed')) default 'planned',
  add column if not exists sort_order int default 0,
  add column if not exists navigation_url text,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  day_id uuid references public.days(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  scope text check (scope in ('trip', 'day', 'event')) not null,
  title text not null,
  due_date date,
  status text check (status in ('open', 'done', 'blocked')) default 'open',
  sort_order int default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.destination_map_points (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  day_id uuid references public.days(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  name text not null,
  city text not null,
  kind text check (kind in ('airport', 'spot', 'hotel', 'food', 'route')) not null,
  geo_point geography(point),
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists todos_trip_id_idx on public.todos(trip_id);
create index if not exists todos_day_id_idx on public.todos(day_id);
create index if not exists destination_map_points_trip_id_idx on public.destination_map_points(trip_id);

alter table public.todos enable row level security;
alter table public.destination_map_points enable row level security;

grant select, insert, update, delete on public.todos to authenticated;
grant select, insert, update, delete on public.destination_map_points to authenticated;

create policy "todos read by trip owner"
  on public.todos for select
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = todos.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "todos write by trip owner"
  on public.todos for all
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = todos.trip_id
        and trips.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.trips
      where trips.id = todos.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "map points read by trip owner"
  on public.destination_map_points for select
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = destination_map_points.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "map points write by trip owner"
  on public.destination_map_points for all
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = destination_map_points.trip_id
        and trips.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.trips
      where trips.id = destination_map_points.trip_id
        and trips.user_id = (select auth.uid())
    )
  );
