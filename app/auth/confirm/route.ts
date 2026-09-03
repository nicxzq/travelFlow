import { redirect } from 'next/navigation';
import { consumeConfirmation, readCredentials, readLinkError } from '@/lib/auth/confirm-link';
import { getCurrentUser } from '@/lib/auth/current-user';
import { safeNext } from '@/lib/auth/safe-next';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const linkError = readLinkError(searchParams);

  if (linkError) {
    redirect(`/login?notice=${linkError}`);
  }

  const credentials = readCredentials(searchParams);

  if (!credentials) {
    redirect('/login?notice=confirm_invalid');
  }

  // 这是个无认证 GET，且 token_hash 按设计不绑定任何本地状态——攻击者可以拿自己账号的
  // 确认链接投给受害者，让对方在毫无察觉的情况下被切换到攻击者账号，之后录入的行程
  // 全落进攻击者可读的账号里。已登录时不静默置换，先落到确认页要一次显式操作。
  if (await getCurrentUser()) {
    redirect(`/auth/confirm/switch?${searchParams}`);
  }

  const outcome = await consumeConfirmation(credentials);

  if (!outcome.ok) {
    redirect(`/login?notice=${outcome.notice}`);
  }

  redirect(safeNext(searchParams.get('next')));
}
