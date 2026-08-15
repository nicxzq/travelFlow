# TravelFlow 云端行程协作设计

| 项目 | 内容 |
| --- | --- |
| 日期 | 2026-08-15 |
| 状态 | 已决策 |
| 范围 | 无显式登录阶段的云端保存、只读分享与链接协作 |

## 1. 结论

TravelFlow 必须把 Supabase 中的行程作为唯一事实源。浏览器本地状态只负责即时交互，不再承担正式保存。

每趟行程有三类访问能力：

1. 主理人：由 Supabase 匿名 Auth 身份识别，可以管理行程、撤销和重建链接、删除内容。
2. 协作者：通过可编辑协作链接获得行程级 `editor` 权限，可以新增、修改、跨日期移动和标记取消，但不能删除。
3. 查看者：通过现有只读分享链接获得 `viewer` 权限，只能查看。

只读链接与协作链接都可转发给多人重复使用，直到主理人撤销。以后增加正式登录时，把匿名身份绑定到邮箱或 OAuth 身份，不迁移行程所有权模型。

## 2. 为什么这样设计

当前问题不是少调用一次保存函数，而是系统没有一份同行共同读取的云端数据。`TripWorkspace` 的修改仅存在于 React state，刷新即丢失；分享页又重新读取静态 seed/mock，自然永远看不到修改。

可选方案及取舍：

- 纯能力 token：实现快，但主理人凭证完全依赖一段本地 token，清浏览器后无法识别所有者，未来接账号需要重构。
- Supabase 匿名身份 + 能力链接：主理人拥有稳定的 `auth.uid()`，同行通过链接兑换行程级短期会话；RLS、Realtime 和未来身份升级使用同一个授权模型。
- token 与账号双轨并行：RLS 同时维护两套身份判断，复杂且容易出现越权，不采用。

采用第二种。它增加的主要工作只有匿名登录和访问会话兑换，却避免未来推倒权限系统。

## 3. 身份与恢复

### 3.1 主理人

首次创建云端行程前，客户端静默调用 Supabase Anonymous Sign-In。`trips.owner_id` 保存该匿名用户的 `auth.uid()`。

匿名会话由 Supabase SDK 持久化和刷新。创建完成后提示主理人：

- 保存当前行程入口；
- 可选绑定邮箱，用 Magic Link 把匿名身份升级为可找回身份。

未绑定邮箱且清除浏览器数据时，主理人权限无法安全找回。这是无显式登录阶段的明确边界，不提供人工猜测身份、安全问题或管理员代领。

### 3.2 同行

同行打开链接时，如果浏览器没有 Supabase 会话，静默创建匿名用户。链接 token 经服务端验证后，创建一条绑定该 `auth.uid()` 的 `trip_access_sessions`。

用户不需要看到“注册/登录”，但每台设备都有独立身份，便于 RLS、撤销和冲突记录。

## 4. 链接模型

每趟行程默认生成两条链接：

- `/invite/{viewerToken}`：只读分享链接；
- `/invite/{editorToken}`：可编辑协作链接。

原始 token 使用至少 256 bit 的加密安全随机数。数据库只保存 SHA-256 hash，不保存明文。

邀请路由完成以下动作：

1. 从 path 读取原始 token；
2. 使用服务端专用 Supabase client 查询 token hash；
3. 校验角色、过期时间和 `revoked_at`；
4. 为当前匿名用户创建或更新访问会话；
5. `302` 跳转到不含 token 的 `/trip/{tripId}`；
6. 响应使用 `Cache-Control: no-store`。

path token 的首次请求可能进入平台访问日志，这是已知取舍。降低风险的措施是高熵 token、数据库只存 hash、兑换后立即跳转、邀请路由禁用缓存、主理人可随时撤销重建。不得把 token 写入业务日志、分析事件或错误上报。

同一链接可被多人重复兑换。撤销时更新原 `share_tokens.revoked_at`，再新建 token 行；不覆盖旧 token。

## 5. 数据模型

### 5.1 `trips`

新增或确认：

- `owner_id uuid references auth.users(id) not null`
- `updated_at timestamptz not null`
- `updated_by uuid references auth.users(id)`
- `deleted_at timestamptz null`

### 5.2 `days`

新增或确认：

- `trip_id`
- `date`
- `day_index`
- `updated_at`
- `updated_by uuid references auth.users(id)`

增加 `unique (id, trip_id)`，供 events 使用复合外键约束归属。

### 5.3 `events`

新增或确认：

- `trip_id`
- `day_id`
- `status`: `planned | active | done | skipped | changed | cancelled`
- `sort_order`
- `updated_at`
- `updated_by uuid references auth.users(id)`
- `deleted_at timestamptz null`

跨日期移动通过同时更新 `day_id` 与 `sort_order` 完成。数据库使用复合外键 `(day_id, trip_id) references days(id, trip_id)`，保证事件不能被移动到另一趟行程；Server Action 同时做用户友好的前置校验。

增加 `unique (id, trip_id)`，供 todos 使用复合外键约束归属。

协作者的“删除”实际是 `status = 'cancelled'`；界面文案必须写“标记取消”。主理人删除设置 `deleted_at`，所有正常查询立即隐藏；7 天后由定时清理任务物理删除。删除确认框明确显示“立即从行程隐藏，7 天后永久删除”。

### 5.4 `todos`

- `id`
- `trip_id`
- `day_id null`
- `event_id null`
- `scope`: `trip | day | event`
- `title`
- `due_date null`
- `status`: `open | done | blocked`
- `sort_order`
- `updated_at`
- `updated_by uuid references auth.users(id)`

`day_id` 和 `event_id` 必须属于同一个 `trip_id`，通过复合外键保证。todos 与 events 使用同一 owner/editor/viewer 权限矩阵。

### 5.5 `private.share_tokens`

- `id`
- `trip_id`
- `token_hash unique`
- `role`: `viewer | editor`
- `created_by`
- `expires_at`
- `revoked_at`
- `created_at`

### 5.6 `private.trip_access_sessions`

- `id`
- `share_token_id`
- `trip_id`
- `auth_user_id`
- `role`
- `redeemed_at`
- `last_seen_at`
- unique `(share_token_id, auth_user_id)`

两张访问凭证表放在不暴露给 Data API 的 `private` schema。`share_tokens` 与 `trip_access_sessions` 是一对多。角色在兑换时复制，但授权判断仍联查原 token 的撤销和过期状态。

MVP 不创建 `trip_members`。在没有正式成员账号之前，它不会增加有效能力；后续登录协作成员上线时再新增。

## 6. 权限边界

所有 exposed schema 表启用 RLS，并只授予所需 Data API 权限。访问凭证表放在 `private` schema，不向客户端授予 SELECT，也不暴露 token hash。

业务表每次读写都满足以下条件之一：

- `trips.owner_id = auth.uid()`；或
- `private.can_access_trip(trip_id, required_role)` 判断当前 `auth.uid()` 存在有效访问会话，且原分享 token 未撤销、未过期。

`private.can_access_trip` 是唯一允许的 `SECURITY DEFINER` 授权函数：

- 位于非 exposed 的 `private` schema；
- 函数内部显式读取并校验 `auth.uid()`；
- `search_path` 设为空并使用完全限定表名；
- 撤销默认 `PUBLIC EXECUTE`，仅授予 `authenticated`；
- 返回 boolean，不返回访问表内容；
- migration 后运行 Supabase database advisors。

这样业务表 RLS 不需要直接联查受自身 RLS 限制的凭证表，也不会把 token hash 暴露给浏览器。

权限矩阵：

| 操作 | 主理人 | editor | viewer |
| --- | --- | --- | --- |
| 查看 | 是 | 是 | 是 |
| 新增/修改/移动 | 是 | 是 | 否 |
| 标记取消 | 是 | 是 | 否 |
| 删除 | 是 | 否 | 否 |
| 撤销/重建链接 | 是 | 否 | 否 |

`INSERT`、`UPDATE`、`DELETE` 分开写 policy；`UPDATE` 同时包含 `USING` 与 `WITH CHECK`。editor 的 policy 不授予 `DELETE`。events 与 todos 的 `WITH CHECK` 还必须验证复合外键归属，数据库约束作为最终防线。

`service_role` 只存在于服务端，并仅用于邀请 token 兑换、链接重建和必要的定时清理。正常页面读取、写入和 Realtime 订阅都使用当前用户会话，不能用 service role 绕过 RLS。

private schema 不暴露给 Supabase Data API，因此服务端不能直接用 `supabase-js` 查询 private 表。邀请兑换与链接轮换通过 public schema 中受限的 `SECURITY DEFINER` RPC 完成：函数固定空 `search_path`、使用完全限定表名、撤销 `PUBLIC/anon/authenticated` 的默认执行权，仅授予 `service_role`。服务端先用用户会话验证当前身份，再调用对应 RPC。

## 7. 保存与实时同步

### 7.1 初始读取

页面从 Supabase 读取 trip、days、events 和 todos。静态 seed 只作为迁移输入，不再作为已云端化行程的运行时 fallback，避免同一个 URL 有两个事实源。

### 7.2 写入

客户端先做乐观更新，再调用使用当前用户会话的 Server Action。成功后用数据库返回值替换本地草稿；失败则回滚并显示明确提示。

写入必须返回 `updated_at`。更新时携带客户端读取到的旧 `updated_at` 作为前置条件：

- 条件匹配：更新成功；
- 条件不匹配：返回最新数据库版本，并提示“该行程刚被同行更新，请查看最新内容后重试”。

MVP 不做字段级自动合并、OT 或 CRDT。

### 7.3 Realtime

客户端按 `trip_id` 订阅 days、events 和 todos 的 Postgres Changes。由于主理人和同行都有自己的 `auth.uid()`，且业务表 RLS 可调用 `private.can_access_trip`，Realtime 能正确过滤并推送数据。

目标是其他已在线设备在 3 秒内看到变化。自己的 Realtime 回响通过 mutation id 或 `updated_by + updated_at` 去重。

### 7.4 撤销传播

RLS 每次联查 `share_tokens.revoked_at`，因此链接撤销后，所有已兑换会话的后续读取、写入和 Realtime 变更立即失效，无需等待 JWT 过期。

已打开页面可能仍显示撤销前已经载入内存的数据；系统无法收回对方已经看过或截图的内容。客户端固定每 30 秒校验访问状态，任何 RLS 拒绝或校验失败都立即取消订阅并跳转到“访问已撤销”页面。

### 7.5 断网

MVP 不做 IndexedDB 离线写队列。断网时：

- 顶部显示“离线，修改尚未保存”；
- 禁止把失败操作显示为已同步；
- Realtime 自动重连后重新拉取当前行程；
- 用户可手动重试失败修改。

## 8. 用户界面

主理人页面增加：

- 云端保存状态：`保存中 / 已同步 / 离线 / 保存失败`；
- “同行分享”面板，分别复制只读链接和协作链接；
- 分别撤销并重建两种链接；
- 删除确认及 7 天永久删除说明；
- 可选绑定邮箱以恢复身份。

协作者页面：

- 显示“协作编辑”身份；
- 可新增、修改、移动、标记取消；
- 不显示永久删除和链接管理；
- 显示实时连接和保存状态。

只读页面：

- 继续复用 TripWorkspace 展示；
- 不渲染任何编辑控件；
- 服务端同样拒绝写请求，不能只依赖隐藏按钮。

## 9. MVP 范围

必须完成：

- 匿名 Auth 主理人身份；
- trips/days/events/todos 云端 CRUD；
- viewer/editor 双链接；
- token 兑换与访问会话；
- RLS 权限矩阵；
- Realtime 同步；
- 乐观更新、冲突提示和失败回滚；
- 链接撤销；
- 本地/seed 行程一次性导入；
- 可选邮箱身份绑定。

本阶段不做：

- 正式成员列表与 `trip_members`；
- 在线头像、光标或 presence；
- OT/CRDT 自动合并；
- 离线写入队列；
- 完整编辑历史和版本回滚；
- 人工身份找回；
- 图片、语音和游记归档同步。

## 10. 错误处理

- token 无效、过期或撤销：返回统一邀请失效页，不泄露 trip 是否存在。
- viewer 尝试写入：返回 403，并保持客户端只读。
- editor 尝试删除：返回 403，不执行降级或隐式转换。
- 冲突：返回 409 与最新记录，不覆盖同行修改。
- 网络失败：回滚乐观状态，保留用户草稿并提供重试。
- Realtime 断开：显示连接状态，重连后全量重新拉取。
- 数据库部分写入：涉及跨 day 移动或整趟导入时使用事务/RPC，避免半完成状态。

## 11. 验收标准

1. 主理人修改“黄崖洞从今天改到明天”后，刷新页面仍保持；在测试 Supabase 项目和稳定网络下连续执行 20 次，另一浏览器的只读页和协作页至少 19 次在 3 秒内显示新日期，且无一次超过 5 秒。
2. 无痕窗口打开 viewer 链接看不到编辑控件；直接调用写接口返回 403。
3. 多个浏览器可使用同一 editor 链接，并分别获得独立匿名访问会话。
4. editor 能新增、修改、跨日移动和标记取消，但 DELETE 返回 403。
5. 主理人删除后内容立即隐藏，并进入 7 天清理期。
6. 撤销 editor 链接后，旧链接不能再兑换；已兑换会话的后续读写立即被 RLS 拒绝。断开 Realtime 撤销通知后，打开的页面仍必须在固定 30 秒心跳加 5 秒容差内退出。
7. 重建链接后，新链接可访问，旧链接仍失效。
8. 两端同时编辑同一事件时，后提交方收到 409 和最新内容，不静默覆盖。
9. 断网保存不会显示“已同步”；恢复网络后重新拉取最新数据。
10. 数据库中不存在明文分享 token，客户端 bundle 中不存在 service role key。
11. RLS 测试覆盖 owner、editor、viewer、已撤销、已过期和非成员六种身份。
12. `npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 全部通过。

## 12. 对现有同步草案的修正

现有 `document/Supabase同步设计文档.md` 需要在实施时同步修订：

- 把“登录后 owner”改为“匿名 Auth owner，可选升级正式身份”；
- P1 必须包含基础 Realtime，因为同行及时看到修改是本需求核心；
- 无正式成员体系时暂不创建 `trip_members`，改用 `trip_access_sessions`；
- share token 不只服务只读页，还要支持 viewer/editor 两种可重复兑换角色；
- Realtime 客户端必须拥有 RLS 可读权限，不能只靠 service-role Server Action 返回数据；
- editor 的取消与 owner 的删除分成 `events.status='cancelled'` 和 `deleted_at`；
- 撤销链接使用 revoke old + insert new，并让 RLS 联查原 token 状态；
- 增加冲突、断网、撤销传播和 token 日志风险的验收测试。
