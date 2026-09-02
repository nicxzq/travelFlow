import { signUpWithEmail } from '@/app/actions/auth-actions';
import { safeNext } from '@/lib/auth/safe-next';
import { AuthForm } from '@/components/auth/auth-form';

type RegisterPageProps = {
  searchParams?: { next?: string | string[] };
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const next = Array.isArray(searchParams?.next) ? searchParams?.next[0] : searchParams?.next;

  return <AuthForm mode="register" action={signUpWithEmail} next={safeNext(next)} />;
}
