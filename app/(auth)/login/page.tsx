import { signInWithEmail } from '@/app/actions/auth-actions';
import { safeNext } from '@/lib/auth/safe-next';
import { AuthForm } from '@/components/auth/auth-form';
import { resolveAuthNotice } from '@/lib/auth/messages';

type LoginPageProps = {
  searchParams?: { next?: string | string[]; notice?: string | string[] };
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <AuthForm
      mode="login"
      action={signInWithEmail}
      next={safeNext(first(searchParams?.next))}
      notice={resolveAuthNotice(first(searchParams?.notice))}
    />
  );
}
