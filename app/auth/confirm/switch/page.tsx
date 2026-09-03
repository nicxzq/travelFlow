import { ShieldAlert } from 'lucide-react';
import { redirect } from 'next/navigation';
import { confirmAccountSwitch } from '@/app/actions/confirm-actions';
import { readCredentials } from '@/lib/auth/confirm-link';
import { getCurrentUser } from '@/lib/auth/current-user';

type ConfirmSwitchPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function toParams(searchParams: ConfirmSwitchPageProps['searchParams']) {
  const params = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  });

  return params;
}

/**
 * 确认链接落在已登录的浏览器里时的中间页。存在的理由是 /auth/confirm 是个无认证 GET，
 * 光靠它无法区分「用户自己点了确认信」和「别人把确认链接投喂过来」——后者会把受害者
 * 静默切到攻击者账号。这里要求一次显式提交，把状态变更从 GET 挪到 POST。
 *
 * 不做「未登录就跳回 /auth/confirm」：两边互跳在会话状态抖动时会形成循环。
 * 未登录时照样渲染表单，只是不提账号切换。
 */
export default async function ConfirmSwitchPage({ searchParams }: ConfirmSwitchPageProps) {
  const params = toParams(searchParams);

  if (!readCredentials(params)) {
    redirect('/login?notice=confirm_invalid');
  }

  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex max-w-md items-center px-4 py-12">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
          <ShieldAlert className="h-4 w-4" />
          确认操作
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">继续处理确认链接？</h1>

        {user ? (
          <p className="mt-2 text-sm text-slate-600">
            当前登录的账号是 <span className="font-medium text-slate-900">{user.email}</span>
            。继续会切换到该确认链接对应的账号。如果这个链接不是你自己申请的，请直接关闭本页。
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            点击下方按钮完成邮箱确认并登录。如果这个链接不是你自己申请的，请直接关闭本页。
          </p>
        )}

        <form action={confirmAccountSwitch} className="mt-6">
          <input type="hidden" name="link" value={params.toString()} />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            {user ? '切换账号并继续' : '完成确认并登录'}
          </button>
        </form>
      </section>
    </main>
  );
}
