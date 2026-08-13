# TravelFlow 晋东南到晋南自驾环线工作台 Spec

| 文档类型 | 版本 | 日期 | 状态 |
| --- | --- | --- | --- |
| Feature Spec | v0.1 | 2026-08-13 | Draft |

## 1. 背景与目标

按当前日期 2026-08-13 计算，本次真实出行是 2026-08-15 至 2026-08-20 的 6 天 5 晚亲子自驾环线。路线为长沙往返长治机场，当地租车自驾，串联长治、黄崖洞、井底村、洪洞、临汾、壶口瀑布、云丘山、运城、鹳雀楼与蒲津渡。目标是在现有 TravelFlow MVP 上，优先支持这次真实出行的使用闭环：

1. 行前：导入/整理已有初版行程，生成每天景点、交通、住宿、餐饮、待办与风险提示。
2. 行中：手机首屏展示今天与明天安排、下一站、待办、导航入口、文字/图片记录上传。
3. 同行同步：提供一个免登录只读共享网站，让同行者随时查看统一信息。
4. 行后：基于每天事件和记录生成游记草稿、照片索引、归档包。
5. 演进：后续接入登录、权限、协作编辑、Supabase 云端同步和地图 API。

## 2. 当前项目基线

项目已具备：

- Next.js 14 App Router、TypeScript、Tailwind、Supabase SDK。
- 路由：`/`、`/new`、`/trip/[id]`、`/trip/[id]/share`。
- AI 生成：`/api/ai/generate` 使用 OpenAI 兼容 Chat Completions 流式输出，并解析为 `GeneratedItinerary`。
- 本地行程管理：`components/new-trip/generate-form.tsx` 支持 localStorage 保存/加载/删除。
- 行程详情：`/trip/[id]` 当前读取 `mockTrip`，只展示第一天时间线。
- 数据库草案：`trips`、`days`、`events`、`memories`，但未启用真实 Supabase CRUD/RLS。

关键缺口：

- 没有真实云端行程读写，同行同步只能靠部署后的静态/公开 JSON 或 Supabase。
- 分享页仍是占位。
- 没有行中上传组件、图片存储、待办模型、游记模型。
- 当前 `GeneratedItinerary` 与数据库 `TripWithDaysAndEvents` 模型未打通。
- 无高德 Key 时不能嵌入 JS 地图、POI 搜索、路线规划和实时路况。

## 3. 外部约束与最佳实践

### 3.1 无高德 API Key 的地图策略

短期不接 JS 地图，不做内嵌地图、路线规划、距离估算和实时交通。采用三层降级：

1. P0：事件卡片生成外部导航链接。使用高德 URI API 或普通 Web 搜索链接打开地图 App/H5。高德官方 URI API 支持通过 URL 调用 H5 地图、POI 标点、公交/驾车查询，并可直接调起高德地图 App。参考：<https://lbs.amap.com/api/uri-api>
2. P0：地点数据以用户初版行程、AI 输出、人工补充为准，允许手动编辑经纬度/地址/导航 URL。
3. P1：抽象 `MapProvider`，后续有高德 Key 后再接 JS API 2.0。高德开放平台列出 JS API、URI API、Web 服务 API 等能力，Web 服务 API 通常需要申请 Key。参考：<https://lbs.amap.com/api>

### 3.2 云端同步与安全

同行共享优先做“公开只读链接”，不要一开始做多人登录协作。原因是这次旅行时间近，免登录共享更稳。

后续登录管理使用 Supabase Auth + RLS。Supabase 官方文档强调：用 SQL Editor 创建表时需要自行启用 RLS，并只授予各角色必要权限。参考：<https://supabase.com/docs/guides/database/postgres/row-level-security>

图片/语音记录使用 Supabase Storage。官方 Storage 文档支持 signed URLs、resumable uploads 等模式。参考：<https://supabase.com/docs/guides/storage>

### 3.3 本次目的地与路线信息

长治官方信息显示当地有山水、古建、红色研学和乡村旅游资源。长治市政府公开资料曾推荐八泉峡、太行水乡、振兴小镇、通天峡等线路；长治市政府 2026 年报道确认壶关太行山大峡谷八泉峡景区为国家 5A 级景区。参考：

- <https://changzhi.gov.cn/xxgkml/zfxxgkml/szfgzbm/srmzfbgt/czsrmzf/zbwj/202206/t20220610_2568299.shtml>
- <https://www.changzhi.gov.cn/ztzl/cjwmwz/wmdt/202604/t20260426_3160793.shtml>

实际开放时间、门票、天气、交通管制必须出发前二次核验，不应硬编码进产品。

本次初版行程单位于 `document/晋东南到晋南自驾环线｜完整行程单.md`。P0 实现以人工校准后的 seed 数据为准，避免为了赶出行窗口引入脆弱的 Markdown 表格解析器。

## 3.4 本次行程摘要

| 日期 | 行程 | 关键风险 |
| --- | --- | --- |
| 2026-08-15 | 长沙飞长治，取车，黄崖洞 | 航班、租车、学生免票材料、峡谷温差 |
| 2026-08-16 | 黄崖洞，经花壶线、神龙湾挂壁公路，到井底村 | 临崖窄路、雨雾、民宿条件、孩子玩水装备 |
| 2026-08-17 | 井底村，太行音乐公路，长治休整，洪洞大槐树 | 长车程、临汾高温、景区人流 |
| 2026-08-18 | 临汾，壶口瀑布，云丘山 | 全程最高降雨风险、壶口临时关闭、水雾防水 |
| 2026-08-19 | 云丘山，运城，解州关帝庙，七彩盐湖 | 午后高温、闭园时间、日落云量 |
| 2026-08-20 | 运城，鹳雀楼，蒲津渡，长治机场，还车返程 | 240km 返程车程、高速拥堵、还车缓冲 |

## 4. 用户场景

### 4.1 行前规划

- 作为组织者，我可以粘贴已有初版计划，系统解析为 7 天行程。
- 我可以按天补充住宿、交通、餐厅、门票预约、证件、装备、费用。
- 我可以看到每天是否过满、是否缺住宿/交通/门票/导航信息。
- 我可以生成“明天提醒”，提前一天确认天气、车票、门票、装备和集合时间。

### 4.2 行中管理

- 手机打开 `/trip/[id]` 后，首屏显示今天日期、下一站、下一站导航、今天待办、明天预告。
- 每个事件可标记完成、跳过、改期。
- 每个事件可快速添加文字、图片、语音占位记录。
- 弱网时至少能看到最近一次加载的行程缓存。

### 4.3 同行共享

- 组织者生成 `/trip/[id]/share?token=...`。
- 同行者免登录查看完整行程、今天/明天安排、集合点、导航链接、待办状态。
- P0 共享页只读；P1 可支持同行上传照片到公共相册；P2 支持登录后协作编辑。

### 4.4 行后游记与归档

- 行程结束后，系统按天聚合事件、照片、文字备注。
- AI 生成游记草稿，保留可编辑 JSON/Markdown。
- 归档内容包括：最终行程、每日记录、图片索引、费用/待办总结、分享页快照。

## 5. 功能优先级

### P0：出发前必须完成

1. 长治行程导入与数据落地
   - 新增“导入已有计划”入口。
   - 支持粘贴 Markdown/纯文本/JSON。
   - P0 先将本次行程手动整理为 `shanxiLoopTrip` seed。
   - 解析或手动整理为 `TripWithDaysAndEvents`。
   - 暂不强依赖 Supabase：可以先保存到 localStorage，并提供导出 JSON。

2. 今天/明天工作台
   - `/trip/[id]` 不再固定展示第一天。
   - 根据日期选择当天；如果未到出行日，展示 D-1/D-0 准备面板。
   - 首屏包含：下一站、今天安排、今天待办、明天预告、关键提醒。

3. 无 Key 导航
   - 为事件增加 `navigationUrl` 或由 `geo/locationName` 生成。
   - 移动端点击打开高德 URI/H5；无坐标时退化为高德/百度 Web 搜索。
   - 明确提示导航以外部地图结果为准。

4. 公共只读分享
   - `/trip/[id]/share` 读取同一份行程数据。
   - P0 可采用公开 trip id + share token。
   - 页面隐藏编辑、上传、删除功能。

5. 行程准备清单
   - 新增 trip-level 和 day-level todos。
   - 支持完成状态、本地持久化、明天自动汇总。

### P1：旅途中增强

1. Supabase 真实读写
   - 将 localStorage 行程同步到 Supabase。
   - 增加 `share_tokens`、`todos`、`trip_members`。
   - 启用 RLS。

2. 行中记录
   - 每个事件支持文字记录。
   - 图片上传接 Supabase Storage；先支持压缩后的单图/多图。
   - 记录自动关联 `event_id` 和 `trip_id`。

3. 状态管理
   - 事件状态：planned、active、done、skipped、changed。
   - 待办状态：open、done、blocked。

4. 弱网体验
   - 最近行程缓存到 localStorage。
   - 上传失败进入 pending 队列，恢复网络后重试。

### P2：行后与长期产品化

1. 游记生成
   - 输入：最终行程、事件状态、memories、图片 captions、用户补充。
   - 输出：Markdown 游记、按天摘要、朋友圈短文、小红书风格草稿可选。

2. 归档
   - trip 状态改为 completed。
   - 生成 archive JSON。
   - 分享页增加“回顾模式”。

3. 登录与权限
   - Supabase Auth。
   - Owner、Editor、Viewer 三类角色。
   - 后台管理：成员、分享链接、归档、删除。

4. 地图 Provider
   - 有高德 Key 后接 JS API 地图视图。
   - 路线规划、POI 校验、地图 marker、轨迹线作为增强能力。

## 6. 数据模型增量

保留现有 `trips/days/events/memories`，建议新增或扩展：

```ts
type EventStatus = 'planned' | 'active' | 'done' | 'skipped' | 'changed';

type TodoScope = 'trip' | 'day' | 'event';

type TodoStatus = 'open' | 'done' | 'blocked';

interface TripTodo {
  id: string;
  tripId: string;
  dayId?: string;
  eventId?: string;
  scope: TodoScope;
  title: string;
  dueDate?: string;
  status: TodoStatus;
  sortOrder: number;
}

interface ShareToken {
  id: string;
  tripId: string;
  tokenHash: string;
  role: 'viewer' | 'contributor';
  expiresAt?: string;
  createdAt: string;
}

interface TripMemory {
  id: string;
  tripId: string;
  eventId?: string;
  dayId?: string;
  type: 'image' | 'text' | 'voice';
  contentUrl?: string;
  textContent?: string;
  localCreatedAt: string;
}
```

`events` 建议扩展字段：

- `status`
- `sort_order`
- `navigation_url`
- `source`
- `reservation_info`
- `cost_note`
- `weather_note`

## 7. 页面与交互

### `/new`

- 增加两个入口：AI 生成、导入已有计划。
- 导入后展示结构化预览，用户确认后保存。
- 保留 JSON 画布，但把它降级为高级编辑入口。

### `/trip/[id]`

首屏结构：

1. Trip header：长治一周、日期范围、状态、分享按钮。
2. Today panel：今天主题、天气提示、下一站。
3. Next action：时间、地点、导航、联系人/票务备注。
4. Todo strip：今天必须完成的 3-5 个事项。
5. Tomorrow preview：下一天景点、集合时间、待办。
6. Timeline：当天完整事件。
7. Memory drawer：给当前事件添加记录。

### `/trip/[id]/share`

- 同步展示今天/明天和完整行程。
- 默认只读。
- 页面顶部固定“更新时间”和“组织者提示”。
- 不暴露内部 token、用户 id、管理入口。

### `/trip/[id]/archive`

- P2 新增。
- 展示每日摘要、精选照片、游记草稿、导出入口。

## 8. AI 能力设计

### 8.1 行前解析 Prompt

输入：

- 用户已有初版计划。
- 出行日期：2026-08-17 至 2026-08-23。
- 目的地：长治。
- 偏好：由用户补充，如亲子/自驾/公共交通/古建/峡谷/轻松/预算。

输出：

- 结构化 `GeneratedItinerary`。
- 缺失信息列表。
- 风险列表：门票预约、景区闭园、天气、交通时间过长、老人儿童体力。

### 8.2 明天提醒 Prompt

每天晚上生成：

- 明天出发时间。
- 明天景点和导航入口。
- 必带物品。
- 门票/预约/身份证/停车。
- 天气风险和备选方案。

### 8.3 行后游记 Prompt

输入：

- 每天事件。
- 完成/跳过状态。
- 用户记录和图片说明。

输出：

- 标准游记 Markdown。
- 每日短摘要。
- 可发布短文草稿。
- 归档 JSON。

## 9. 实施顺序

### Step 1：Spec 与数据适配

- 新增本 spec。
- 定义 `TripTodo`、事件状态、导航 URL。
- 编写 `GeneratedItinerary -> TripWithDaysAndEvents` 转换器。

### Step 2：自驾环线工作台 P0

- `/trip/[id]` 支持按日期选择今天。
- 展示今天/明天/待办。
- 事件卡片加导航链接。

### Step 3：导入已有计划

- `/new` 增加导入模式。
- 支持 JSON 与文本导入。
- 保存到 localStorage 列表。

### Step 4：分享页 P0

- `/trip/[id]/share` 复用行程展示组件。
- 禁用编辑操作。
- 加更新时间和组织者提醒。

### Step 5：Supabase P1

- 真实 CRUD。
- RLS。
- `todos/share_tokens/trip_members` migration。
- Storage 上传。

### Step 6：游记与归档 P2

- `/trip/[id]/archive`。
- AI 生成游记。
- 导出 Markdown/JSON。

## 10. 未决问题

需要用户补充：

1. 你的初版长治行程计划是什么格式，是否可以直接粘贴到 `/new`。
2. 出行方式：自驾、火车到长治后打车/包车，还是公共交通。
3. 同行人数、是否有老人/儿童、每天可接受步行强度。
4. 住宿是否固定一个酒店，还是多地切换。
5. 同行者是否需要上传照片，还是只读查看即可。
6. 是否希望这次旅行先使用 localStorage + 部署公开页，还是立刻接 Supabase 云端。
7. AI 生成游记是否需要特定风格，例如纪实、亲子、攻略、小红书。

## 11. 风险

- 景点开放、门票、天气、交通管制变化快，产品只保存计划，不应承诺实时准确。
- 无高德 Key 时不能做可靠路线规划，只能跳转外部地图。
- 公开分享链接可能泄露行程隐私，P0 必须有 token，P1 必须支持失效。
- 图片上传涉及隐私与存储成本，P1 前只做本地记录或小规模私有 Storage。
- 当前项目没有测试覆盖，进入实现阶段应至少补充转换器和关键日期选择逻辑测试。

## 12. 本轮流程限制

- `mcp__auggie-mcp__codebase-retrieval` 当前未在可用工具中暴露，已改用本地项目文件检索。
- Codex/Gemini bridge 技能已读取并尝试调用；第一次因 PowerShell 参数拆分失败，第二次直接调用在 120 秒内未返回可用结果。本 spec 未使用外部模型输出作为依据。
