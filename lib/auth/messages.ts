/**
 * 跳转登录页时只传递码，不传文案。若把文案本身放进查询串，任何人都能构造
 * `/login?message=<任意话术>` 做钓鱼，而页面会原样展示。
 */
export const AUTH_NOTICES = {
  confirm_invalid: '确认链接无效，请重新登录。',
  confirm_expired: '确认链接已失效，请重新注册或登录。',
  // 走到这里时邮箱其实已经确认过了（Supabase 在 /auth/v1/verify 那步就完成了验证，
  // 失败根本不会转发回来），只是本浏览器换不出会话。所以绝不能提示「重新注册」——
  // 对一个已确认的邮箱重新注册是死路。
  confirm_needs_login: '邮箱已确认，但这个浏览器无法自动登录，请手动登录。',
  confirm_failed: '确认时发生错误，请重试；若已收到确认邮件可直接登录。',
  callback_invalid: '授权链接无效，请重新登录。',
  callback_expired: '授权已失效，请重新登录。',
} as const;

export type AuthNoticeCode = keyof typeof AUTH_NOTICES;

/**
 * 必须用 hasOwn 而非 `in`：`in` 会命中原型链，`?notice=constructor` 会取到
 * Object 构造函数，作为 prop 传给客户端组件时 RSC 序列化直接抛错，登录页 500。
 */
export function resolveAuthNotice(code: string | undefined) {
  return code && Object.hasOwn(AUTH_NOTICES, code) ? AUTH_NOTICES[code as AuthNoticeCode] : undefined;
}
