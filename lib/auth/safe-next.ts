/**
 * 只接受站内单斜杠相对路径。`//host` 会被浏览器当作协议相对 URL，放行即开放重定向。
 */
export function safeNext(value: string | null | undefined) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/trip';
}
