import { getCurrentUser } from '@/lib/auth/current-user';

// 临时观测点，Stage 1 验证通过后删除。
export default async function WhoamiPage() {
  const user = await getCurrentUser();

  return <pre className="p-6 text-xs">{JSON.stringify(user, null, 2)}</pre>;
}
