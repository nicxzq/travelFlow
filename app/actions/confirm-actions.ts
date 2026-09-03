'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { consumeConfirmation, readCredentials } from '@/lib/auth/confirm-link';
import { safeNext } from '@/lib/auth/safe-next';

/**
 * 确认链接的消费必须发生在 Server Action 或 Route Handler 里：只有这两处能真正写下
 * 会话 cookie。Server Component 的写入会被 lib/supabase/server.ts 的 catch 吞掉，
 * 用户看起来确认成功，实际没有会话。
 */
export async function confirmAccountSwitch(formData: FormData) {
  const params = new URLSearchParams(String(formData.get('link') ?? ''));
  const credentials = readCredentials(params);

  if (!credentials) {
    redirect('/login?notice=confirm_invalid');
  }

  const outcome = await consumeConfirmation(credentials);

  if (!outcome.ok) {
    redirect(`/login?notice=${outcome.notice}`);
  }

  revalidatePath('/', 'layout');
  // redirect 依靠抛出控制流信号生效，绝不能放进 try 块。
  redirect(safeNext(params.get('next')));
}
