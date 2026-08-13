import { getTripDetails } from '@/app/actions/trip-actions';
import { TripWorkspace } from '@/components/trip/trip-workspace';

type TripPageProps = {
  params: {
    id: string;
  };
};

export default async function TripDetailPage({ params }: TripPageProps) {
  const trip = await getTripDetails(params.id);
  return <TripWorkspace trip={trip} />;
}
