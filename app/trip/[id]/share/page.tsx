import { getTripDetails } from '@/app/actions/trip-actions';
import { TripWorkspace } from '@/components/trip/trip-workspace';

type SharePageProps = {
  params: {
    id: string;
  };
};

export default async function ShareTripPage({ params }: SharePageProps) {
  const trip = await getTripDetails(params.id);
  return <TripWorkspace trip={trip} readOnly />;
}
