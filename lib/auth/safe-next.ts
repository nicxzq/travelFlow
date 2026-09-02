/**
 * 只接受站内单斜杠相对路径。
 *
 * 仅排除 `//` 是不够的：URL 解析器对 special scheme 把反斜杠等价于斜杠，
 * 且会先剥离前导控制字符，因此 `/\evil.com`、`/\/evil.com`、`/<TAB>/evil.com`、
 * `/<LF>/evil.com` 都会解析成站外 origin。这里显式排除第二个字符为斜杠或
 * 反斜杠的情形，并禁掉全部反斜杠与 C0 控制字符。
 */
export function safeNext(value: string | null | undefined) {
  return value && /^\/(?![/\\])[^\\\x00-\x1f]*$/.test(value) ? value : '/trip';
}
