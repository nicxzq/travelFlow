import { getTripDetails } from '@/app/actions/trip-actions';
import { TripWorkspace } from '@/components/trip/trip-workspace';
import { getCurrentUser } from '@/lib/auth/current-user';

type TripPageProps = {
  params: {
    id: string;
  };
};

export default async function TripDetailPage({ params }: TripPageProps) {
  const [trip, user] = await Promise.all([getTripDetails(params.id), getCurrentUser()]);
  return <TripWorkspace trip={trip} userId={user?.id ?? null} />;
}
