/**
 * 跳转登录页时只传递码，不传文案。若把文案本身放进查询串，任何人都能构造
 * `/login?message=<任意话术>` 做钓鱼，而页面会原样展示。
 */
export const AUTH_NOTICES = {
  confirm_invalid: '确认链接无效，请重新登录。',
  confirm_expired: '确认链接已失效，请重新注册或登录。',
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
