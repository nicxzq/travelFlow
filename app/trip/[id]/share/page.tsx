import { getTripDetails } from '@/app/actions/trip-actions';
import { TripWorkspace } from '@/components/trip/trip-workspace';

type SharePageProps = {
  params: {
    id: string;
  };
};

export default async function ShareTripPage({ params }: SharePageProps) {
  const trip = await getTripDetails(params.id);
  // Deliberately unscoped: a share link shows someone else's trip, so keying the
  // local execution state to the viewer would surface the viewer's own archive here.
  return <TripWorkspace trip={trip} readOnly userId={null} />;
}
