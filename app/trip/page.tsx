import { SiteHeader } from '@/components/site-header';
import { TripLibrary } from '@/components/trip/trip-library';

export default function TripPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <TripLibrary />
    </main>
  );
}
