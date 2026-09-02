'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { LogIn, Mail, UserPlus } from 'lucide-react';
import { useFormState, useFormStatus } from 'react-dom';
import type { AuthFormState } from '@/app/actions/auth-actions';

type AuthMode = 'login' | 'register';

type AuthFormProps = {
  mode: AuthMode;
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  next: string;
  notice?: string;
};

const copy: Record<AuthMode, Record<string, string>> = {
  login: {
    title: '登录 TravelFlow',
    description: '继续规划你的云端行程。',
    submit: '登录',
    pending: '登录中…',
    switchText: '还没有账号？',
    switchAction: '注册',
  },
  register: {
    title: '注册 TravelFlow',
    description: '用邮箱创建账号，行程将同步到云端。',
    submit: '注册',
    pending: '注册中…',
    switchText: '已有账号？',
    switchAction: '登录',
  },
};

const inputClass =
  'mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500';

function SubmitButton({ mode }: { mode: AuthMode }) {
  const { pending } = useFormStatus();
  const Icon = mode === 'login' ? LogIn : UserPlus;

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      <Icon className="h-4 w-4" />
      {pending ? copy[mode].pending : copy[mode].submit}
    </button>
  );
}

function switchHref(mode: AuthMode, next: string) {
  const path = mode === 'login' ? '/register' : '/login';
  return `${path}?next=${encodeURIComponent(next)}` as Route;
}

export function AuthForm({ mode, action, next, notice }: AuthFormProps) {
  const [state, formAction] = useFormState(action, {});
  const text = copy[mode];
  const message = state.message ?? notice;

  return (
    <main className="mx-auto flex max-w-md items-center px-4 py-12">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
          <Mail className="h-4 w-4" />
          邮箱认证
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{text.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{text.description}</p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />

          <label className="block">
            <span className="text-sm font-medium text-slate-700">邮箱</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state.email}
              placeholder="you@example.com"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">密码</span>
            <input
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              placeholder="至少 6 位"
              className={inputClass}
            />
          </label>

          {message ? (
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>
          ) : null}

          <SubmitButton mode={mode} />
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          {text.switchText}{' '}
          <Link
            href={switchHref(mode, next)}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            {text.switchAction}
          </Link>
        </p>
      </section>
    </main>
  );
}
