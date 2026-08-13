# TravelFlow Supabase 同步设计文档

| 文档类型 | 版本 | 日期 | 状态 |
| --- | --- | --- | --- |
| Technical Design | v0.1 | 2026-08-13 | Draft |

## 1. 目标

把当前 localStorage + 静态 seed 的 P0 版本升级为云端同步版本：

1. 用户登录后可在多设备查看和管理自己的行程。
2. 同行者通过分享链接查看同一份只读行程。
3. 行中可上传文字、照片和后续语音记录。
4. 行后可生成游记、归档并保留可分享回顾页。
5. 保留无高德 Key 的外部导航降级方案，地图 SDK 作为后续增强。

## 2. 当前基线

已有：

- `profiles`
- `trips`
- `days`
- `events`
- `memories`
- Supabase client factory
- `TripWithDaysAndEvents`、`TripTodo`、`navigationUrl`
- `/trip` 行程管理页
- `/trip/[id]` 行程总览与当日导引
- `/trip/[id]/share` 同行只读页

缺口：

- 真实 CRUD 尚未接入。
- `todos`、`trip_members`、`share_tokens`、`trip_archives` 尚未建表。
- Row Level Security 尚未启用。
- Storage bucket 和上传策略尚未设计落地。
- localStorage 记录没有迁移到云端的流程。

## 3. 当前 Supabase 约束

设计依据：

- Supabase 要求 exposed schema 中的表启用 Row Level Security；用 SQL 创建表时需要手动启用 RLS。
- 2026 年 Supabase changelog 提到新表可能不会自动暴露到 Data API，需要显式 `GRANT` 给 `anon` / `authenticated`。
- Storage 默认不允许无策略上传；私有 bucket 下载需要用户 JWT 或 signed URL。
- 不要在前端暴露 `service_role` 或 secret key。
- 不要用 `user_metadata` 做授权判断；权限应存在业务表或 `app_metadata`。

参考：

- <https://supabase.com/docs/guides/database/postgres/row-level-security>
- <https://supabase.com/docs/guides/storage>
- <https://supabase.com/docs/guides/storage/security/access-control>
- <https://supabase.com/changelog?types=breaking-change>

## 4. 数据模型

### 4.1 trips

保留现有表，建议扩展：

```sql
alter table public.trips
  add column if not exists cover_url text,
  add column if not exists visibility text check (visibility in ('private', 'shared', 'archived')) default 'private',
  add column if not exists updated_at timestamptz default now();
```

### 4.2 days

保留现有表，建议扩展：

```sql
alter table public.days
  add column if not exists theme text,
  add column if not exists weather_note text,
  add column if not exists updated_at timestamptz default now();
```

### 4.3 events

保留现有表，建议扩展：

```sql
alter table public.events
  add column if not exists status text check (status in ('planned', 'active', 'done', 'skipped', 'changed')) default 'planned',
  add column if not exists sort_order int default 0,
  add column if not exists navigation_url text,
  add column if not exists source text,
  add column if not exists reservation_info text,
  add column if not exists cost_note text,
  add column if not exists weather_note text,
  add column if not exists updated_at timestamptz default now();
```

### 4.4 todos

```sql
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
```

### 4.5 trip_members

```sql
create table if not exists public.trip_members (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'editor', 'viewer')) not null,
  created_at timestamptz default now(),
  unique (trip_id, user_id)
);
```

### 4.6 share_tokens

只存 token hash，不存明文 token。

```sql
create table if not exists public.share_tokens (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  token_hash text not null unique,
  role text check (role in ('viewer', 'contributor')) default 'viewer',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
```

### 4.7 trip_archives

```sql
create table if not exists public.trip_archives (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  markdown text,
  archive_json jsonb not null default '{}'::jsonb,
  generated_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);
```

## 5. Storage 设计

Bucket：

- `trip-memories`
- 私有 bucket。
- 文件路径：`{trip_id}/{day_id}/{event_id}/{memory_id}.{ext}`。
- 客户端上传前压缩图片。
- P1 使用 Supabase Storage SDK 上传。
- P2 可改为服务端签名上传，支持更细的大小、类型、频控和审核。

访问策略：

- owner/editor/contributor 可以上传。
- trip member 可以读取。
- 分享页读取图片优先使用短期 signed URL。
- 不直接公开 bucket，避免行程隐私泄露。

## 6. Row Level Security 策略

所有 public 表启用 Row Level Security。

```sql
alter table public.trips enable row level security;
alter table public.days enable row level security;
alter table public.events enable row level security;
alter table public.memories enable row level security;
alter table public.todos enable row level security;
alter table public.trip_members enable row level security;
alter table public.share_tokens enable row level security;
alter table public.trip_archives enable row level security;
```

核心判断：

- owner/editor 可以管理 trip、days、events、todos、memories。
- viewer 只能读。
- share token 只走 server-side 校验，不让 anon 直接扫表。
- update policy 同时写 `USING` 和 `WITH CHECK`。
- 不用 `auth.role()`，policy 使用 `to authenticated` 并加 ownership/member predicate。

建议创建 helper view/function 时避免 `SECURITY DEFINER`。如果确实需要，放到非 exposed schema，并显式校验 `auth.uid()`。

## 7. 同步流程

### 7.1 登录后迁移本地记录

1. 用户登录。
2. 前端读取 localStorage 的 `travelflow_local_itinerary_list_v1`。
3. 用户确认“同步到云端”。
4. Server Action 创建 trip、days、events、todos。
5. 成功后写入 `trip_members(owner)`。
6. localStorage 标记 `cloudTripId`，避免重复导入。

### 7.2 行程读取

1. `/trip` 读取当前用户参与的 trips。
2. 合并静态 seed、云端行程和本地未同步记录。
3. `/trip/[id]` 优先查 Supabase；查不到再 fallback 到 seed。

### 7.3 分享页读取

1. URL 格式：`/trip/[id]/share?token=...`。
2. Server Action hash token。
3. 校验 token 未过期、未撤销、trip_id 匹配。
4. 返回只读 `TripWithDaysAndEvents`。
5. 不把 token hash 或成员表暴露给客户端。

### 7.4 行中上传

1. 用户选择事件。
2. 客户端压缩图片。
3. 写入 Storage。
4. 写入 `memories` 记录。
5. 失败时保留本地 pending 队列，恢复网络后重试。

## 8. Next.js 接入方式

建议新增：

- `lib/supabase/server.ts`
- `app/actions/cloud-trip-actions.ts`
- `app/actions/share-actions.ts`
- `app/actions/memory-actions.ts`

读写边界：

- Server Components 负责初始读取。
- Server Actions 负责创建、更新、删除。
- Client Components 只做交互和乐观 UI。
- 不在客户端使用 service key。

## 9. 迁移顺序

1. 新增迁移 SQL：todos、trip_members、share_tokens、trip_archives 和扩展字段。
2. 显式 `GRANT` Data API 权限给 `authenticated`，分享校验不直接开放 anon 表访问。
3. 启用 Row Level Security。
4. 写 owner/editor/viewer policies。
5. 创建 `trip-memories` 私有 bucket 和 Storage policies。
6. 实现 seed/localStorage 到 Supabase 的导入 Action。
7. `/trip` 改为读取云端 + 本地 fallback。
8. `/trip/[id]/share` 接 token 校验。
9. 上传和游记归档进入 P1/P2。

## 10. 验证计划

- SQL migration 本地执行。
- RLS 冒烟测试：owner 能读写，非成员读不到，viewer 不能写。
- 分享 token 测试：有效可读、过期不可读、撤销不可读、错误 trip id 不可读。
- Storage 测试：owner 上传成功，非成员上传失败，signed URL 可读且过期失效。
- Next.js 验证：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## 11. 不做事项

- P1 不实现多人实时协同编辑。
- P1 不接高德 JS API。
- P1 不把 Storage bucket 设为 public。
- P1 不用自有服务器保存 service key；如需后端任务，优先 Vercel Server Actions / Route Handlers，复杂异步任务再放自有服务器。
