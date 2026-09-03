# 2026-09-03 行程页重排、地图交互改造与归档用户化

三项需求一次性交付：页面信息层级重排（R1）、目的地地图交互从「滚动跳转」改为「就地详情面板」（R2）、行后归档绑定登录用户（R3）。

## 需求前提的两处纠正

多模型分析阶段推翻了原始需求里的两个前提，实施按纠正后的事实进行：

1. **「复盘只能看某一天」不成立。** `reducer.ts` 的 `getExecutionReview` 本来就 `baseline.days.flatMap(...)` 跨全部天数生成 rows。真实缺陷只有 `trip-review-card.tsx` 的 `.slice(0, 10)` UI 截断。
2. **今日聚焦在当前种子数据下永不显示。** 今天 2026-09-03，`shanxi-loop` 结束于 08-20、`shanxi-actual` 结束于 08-21，`phase` 恒为 `posttrip`，`visibleDay.date` 永远等不到今天。这是数据事实，不是缺陷；要实机验证 R1 必须改种子日期或造一条跨今天的行程。

## R1 页面重排

区块顺序：警告 → 行前区块 → **今日聚焦**（可折叠）→ 行程总览 → 目的地地图 → 每日行程 → 行程待办 → 当日时间线 → 已取消 → **行程执行复盘**。

- 今日聚焦仅在 `isTodaySelected` 为真时渲染，内含下一站、今日重点、今日待办（`context.todayTodos`）、今日研学、明日预告。
- `todayDate` 用挂载后一次性 effect 取得，**不在 render 期计算**：服务端与浏览器跨午夜会把文本 mismatch 升级成整棵子树 hydration mismatch。也**不加定时器**——`displayDays → mapTrip → track → trackSignature` 会重置播放并重建 Leaflet 图层。
- trip 级「行程待办」保留为独立区块。它渲染全部 todos、本就不按天过滤，塞进「今日」聚焦语义错误，且选中非今天的日期时会整个消失。
- 行前区块（当前要做／注意事项）保持原位。它与今日聚焦互斥：pretrip 意味着今天早于首日。
- 复盘门禁 `phase !== 'pretrip'` → `phase === 'posttrip'`，并移到页尾。截断改为 `max-h-[26rem]` 滚动容器；`baselineStale` 时默认折叠进 `<details>`，避免把改版误读成执行偏差。

## R2 地图交互：选定 Option B（地图下方详情面板）

Codex 与独立 Claude 子代理各自独立给出同一答案。**决定性理由是语义冲突，不是审美**：

- `TripChangeType` 没有 reorder，`CHANGE_TYPES` 会把未知类型判为 `invalid: true` → `executionStorageHealthy = false` → 整个本地持久化停摆。
- 唯一能表达「往上挪」的现成类型是 `swap`，而 `applySwap` **交换两个事件的开始时间并按时长重算结束时间** → 拖一下顺序会静默改写时钟并级联进 `getScheduleConflicts`。
- 事件 `sortOrder` 全仓无人读（只有 todos 在读），顺序纯由 `startTime` 决定。支持重排 = 新增 change type + 校验 + fold 规则 + rebase 保留规则 + 让 `sortOrder` 在两处排序点压过 `startTime`。这是 schema 项目，不是交互微调。
- `trackSignature` 对 stop 顺序敏感，重排会重置播放、重建图层、重拉全部路线。

实现：`selectJourneyStop` 去掉 `scrollIntoView`，并**去掉 `setSelectedDayId`**——它会连带改 `visibleDay`，进而让今日聚焦整块消失。跳转日期改为详情面板里显式的「跳到当天」。面板作为 `stopDetail` ReactNode 由 workspace 传入，地图组件因此不依赖研学与执行变更。

## R3 归档绑定登录用户

- 键形 `travelflow:execution:u:{userId}:{tripId}` / `travelflow:execution:anon:{tripId}`。`u:`/`anon:` 前缀防止 userId 长得像 tripId 时撞键，也保证不和 legacy 键碰撞——让迁移是决策而非意外。
- **读写两个 effect 共用同一个 `executionKey`**。若只给读加 userId、写不加，userId prop 变化而组件未卸载时，A 的内存态会在下一个 400ms tick 写进别人的键。
- legacy 键 `travelflow:execution:{tripId}`：登录且非只读时认领一次并删除，匿名完全不读。**解析失败时绝不删除**——那会摧毁唯一一份读不出来的数据。localStorage 无法证明旧状态属于哪个账号，所以这是「本浏览器第一个登录用户认领」，不是所有权事实（代码注释已写明）。
- 分享页固定 `userId={null}`：只读页展示的是别人的行程，用访客自己的 id 去 scope 会把访客自己的归档串进来。
- 持久化 effect 补 `!readOnly`：此前点一次分享链接就会实体化一个存储键。
- `trip-library` 的「已归档 · 成行轨迹」从硬编码 JSX 改为状态驱动。**只改存储键不会让它消失**——它原本与任何归档状态都无关联。

## 双路审计发现与处置

Phase 5 由 Codex 与一个独立 Claude 子代理同时审计。两边结论有交叉否证：

**已修复**

- **（High）`MapStopDetail` 缺 `key`。** 切换站点时 React 保留 `EventQuickActions` 的 `isConfirmingCancel` / `targetDayId`：站点 A 点到「确认标记取消」后改点站点 B，**一次点击就取消 B**，两步确认被击穿。加 `key={selectedMapEvent.id}` 强制重挂载。Codex 未发现此项。
- **陈旧 stop 快照。** `selectedJourneyStop` 存的是点击瞬间的 `JourneyStop`，move/swap 后 `time`/`tags`/`kind` 与实时事件不一致。改为只存 `selectedStopEventId`，全部字段从实时事件派生，整类问题消除。
- **`nextEventId` 取自未排序的兄弟事件。** 改用 `displayDays`，「与下一项交换」现在与用户实际看到的顺序一致。
- **取消站点后 `activeStopIndex` 越界。** track 收缩后索引可能指向末尾之外，导致 `activeStop` 为 undefined、故事卡空白。加钳制 effect。
- legacy 迁移补 `readOnly` 防御；`selectedEventId` 与 `selectedStopEventId` 一并清理。
- 无障碍：`aria-controls` 原先指向折叠时已卸载的节点（ARIA IDREF 必须可解析），改为常驻 + `hidden`；详情面板加 `role="region"` + `aria-label`；列表行加 `aria-controls`；复盘滚动容器加 `tabIndex`/`role`/`aria-label`。

**判定为误报**

- Codex 报「legacy 认领存在跨用户路径」为 High。子代理逐帧追了 effect 执行顺序，独立确认不可达：hydration 必在 persist 之前运行并完成认领，A 拿到 scoped 键的那一刻 legacy 键已被删除。子代理同时确认不存在跨用户写入、无 hydration mismatch、复盘两分支互斥且穷尽。

**已知遗留，未在本轮处理**

- `getCurrentUser` 在 Supabase 不可达时记日志后仍返回 null，登录用户会被静默降级为匿名，看起来像数据丢失（实际可恢复）。这是既有设计，改动需产品决策。**本机连不上 `*.supabase.co`，因此本地每次渲染都会落到这个路径。**
- 400ms 防抖在「归档后立刻离开页面」时会丢写，导致归档卡不出现。既有设计，且 `400` 是 scaffold 断言值。
- `getStudyStorageKey`、journey overlay 键、`travelflow_local_itinerary_list_v1` 同样没有用户维度，共享设备的泄露是半修状态。刻意本轮不做，避免发明第二套键命名约定。
- 复盘移到 posttrip 后，**行程进行中无法归档**（归档按钮只存在于 `TripReviewCard` 内）。这是「所有行程结束才出现」的直接后果。

## 验证

`tsc --noEmit` / `next lint` / `validate-scaffold.mjs` / `next build` 全绿；单元测试 31 通过（新增 3 条：键分片、跨用户不撞键、归档探测）。种子数据均为 posttrip，今日聚焦无法实机验证。
