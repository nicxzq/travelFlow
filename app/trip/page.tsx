import { TripLibrary } from '@/components/trip/trip-library';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function TripPage() {
  const user = await getCurrentUser();

  return (
    <main>
      <TripLibrary userId={user?.id ?? null} />
    </main>
  );
}
