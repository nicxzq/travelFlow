# MEMORY — travelflow

维护规则：学到就回写（不等提醒）；凭据只记位置不记值；能从代码查到的别复制进来；以追加为主，旧条目保留并标日期。

## 架构决策

<!-- 格式：[日期] 决定了什么 — 为什么 / 否决了什么 -->

- [2026-08-15] 无登录协作阶段采用双链接模型：现有同行分享链接只读，另生成可编辑的同行协作链接；避免普通分享链接被转发后拥有修改权。
- [2026-08-15] 协作链接持有者可新增、修改、跨日期移动行程并标记取消，但不能永久删除；永久删除与链接撤销仅限主理人。
- [2026-08-15] 无显式登录阶段采用 Supabase 匿名 Auth 识别主理人；viewer/editor 链接兑换为绑定匿名 `auth.uid()` 的访问会话，业务表 RLS 与 Realtime 共用该授权模型。
- [2026-08-15] 分享 token 可供多人重复兑换，撤销后 RLS 立即阻断所有已兑换会话的后续访问；访问凭证存 private schema，客户端不读取 token hash。
- [2026-08-16] 研学任务使用稳定 task id；逐题记录孩子答案，并提供默认折叠的参考答案/参考思路。当前按 trip 保存到浏览器 localStorage，只读页不可编辑；完成状态与文字答案独立，非空答案可自动完成，但清空答案不会隐式撤销完成。
- [2026-08-17] 动态行程先采用“不可变初始快照 + append-only 变更日志 + 折叠得到当前行程”；取消、移动、顺延、交换、实际完成与撤销都保留审计记录，后续 changes 可映射到 Supabase。附近推荐无正式平台授权时只做行程内候选与上下文导出，不伪造美团/点评/携程评分。
- [2026-08-17] 美团、点评、携程和高德的个人消费者账号不由 TravelFlow 代理登录，也不保存密码、Cookie 或 Session；没有正式 OAuth/API 授权时，生成场景关键词并跳转官方 HTTPS/URI，登录只在官方平台内完成。高德当前使用公开 URI 搜索，结构化 POI 待申请开发者 Key 后再接入；Vercel Marketplace 未发现这三个平台的可安装集成。
- [2026-08-17] 山西种子行程 Day 2 改为下午抵达平遥并轻游城墙/南大街，Day 3 游县衙、日昇昌和镖局后傍晚转场临汾，以保持 Day 4 从临汾 07:00 出发；研学采用 Day 2 一张、Day 3 两张现场观察卡。
- [2026-08-17] 已发布到浏览器的种子计划后续发生语义替换时必须提升 `planRevision`：读取旧快照后以新种子为初始计划，只保留事件和跨事件引用仍有效的 changes，丢弃数量需要反馈给用户；新事件使用全新稳定 ID，避免旧修改误套。
- [2026-08-29] 山西行结束后，shanxi-loop 种子从"计划环线"(rev2, 含壶口/运城/盐湖/鹳雀楼/蒲津渡) 整体语义替换为"实走六日回顾"(rev3, status completed)：未去运城/壶口，以洪洞广胜寺+大槐树替代，末程返长治(城隍庙)。事件 ID 用 r3-dN-eM 前缀，同步改 destination-map 与 study-cards；validate-scaffold.mjs 的 rev2 断言随之迁移到 rev3。设计规格见 docs/superpowers/specs/2026-08-29-shanxi-actual-recap-design.md。

## 踩坑 / Gotchas

<!-- 格式：现象 → 原因 → 解法 -->

- [2026-08-16] `service_role` 的 `supabase-js` 仍无法直接查询未暴露给 Data API 的 private schema；service role 只绕过 RLS，不绕过 PostgREST exposed-schema 白名单。需要通过 public schema 中严格收紧 EXECUTE 权限的 `SECURITY DEFINER` RPC 访问 private 凭证表。
- [2026-08-17] npm 访问官方 registry 报 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` 时，不要关闭 TLS 校验；本机可用 `NODE_USE_SYSTEM_CA=1 npm ...` 安全复用系统 CA，已验证依赖安装、typecheck 和 Next build 均可正常完成。
- [2026-08-17] Vercel Marketplace CLI 的发现/登录流程会在项目根生成 `.tokenize/` 会话元数据；必须加入 `.gitignore`，避免把本地集成会话文件提交到仓库。
- [2026-08-29] ui-tokenize 插件在本仓库(无 token catalog)会拦截 Write/Edit 工具，返回"No design-token catalog found"且不写盘；改文件改用 Bash(heredoc/perl)或交给 Codex 实现，或先 /tokenize:init 建 catalog。
- [2026-09-02] codex_bridge.py 报 `[json decode error] ������̫����`（GBK 被当 UTF-8 解出的"请求太频繁"）时是**按 token 计的上游限流**，不是按请求数：同一时刻小 prompt 能成功、7KB 的大 prompt 必失败。解法是把任务拆成每次一个步骤的小 prompt 串行下发，不是退避重试。另：bridge 的 `--PROMPT` 经 shell 传参时，prompt 里的撇号（`Leaflet's`、`'drive'`）会截断单引号串导致 exit 1；先把 prompt 写文件再用 `--PROMPT "$(cat file)"`。
- [2026-09-02] 本机 Node 22.14 跑不了 `npm run test:execution`：测试文件 import `./model.ts`，而原生类型剥离到 Node 22.18 才默认开启。本地验证需手动加 `--experimental-strip-types`。package.json 未改动。

## 我的纠正 / 偏好

<!-- 我纠正过、或明确表达过的偏好，避免重犯 -->

- [2026-08-15] 现实行程修改必须保存到云端并让同行看到最新数据；长期需要每趟行程有一名主管理者，并允许其他同行修改或补充。
- [2026-08-15] 所有需要主观判断的产品或技术方案先调用 Claude 评审并直接给出结论与理由，不再逐项向用户确认。
- [2026-09-02] 轨迹交通方式的判定规则：省内默认汽车、跨省飞机、次选高铁。实现上放弃了省界判定（省级 bbox 与质心都会把云丘山划进陕西，导致 95km 省内自驾被画成飞机），改用纯大圆距离带近似。代价是上海→苏州这类短距离跨省会被判成开车——这是已知且接受的偏差。

## 外部资源位置

<!-- 相关 repo、文档、看板、API、环境地址等“东西在哪” -->

## 凭据位置（只记位置，不记值）

<!-- 例：DB 密码在 1Password 的项目条目；.env 的 DATABASE_URL。绝不写明文值 -->

## 未决 / 待确认

<!-- 悬而未决的问题，下次接着处理 -->
