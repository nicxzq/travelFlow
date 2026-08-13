import { MapPin } from 'lucide-react';
import type { DestinationMapPoint } from '@/lib/mock/destination-map';

type DestinationMapProps = {
  points: DestinationMapPoint[];
  activeDayIndex?: number;
};

const pointStyles: Record<DestinationMapPoint['kind'], string> = {
  airport: 'bg-sky-600',
  spot: 'bg-emerald-600',
  hotel: 'bg-violet-600',
  food: 'bg-amber-500',
  route: 'bg-rose-500',
};

function getPosition(point: DestinationMapPoint, points: DestinationMapPoint[]) {
  const lngValues = points.map((item) => item.lng);
  const latValues = points.map((item) => item.lat);
  const minLng = Math.min(...lngValues);
  const maxLng = Math.max(...lngValues);
  const minLat = Math.min(...latValues);
  const maxLat = Math.max(...latValues);
  const x = ((point.lng - minLng) / Math.max(maxLng - minLng, 0.01)) * 78 + 11;
  const y = (1 - (point.lat - minLat) / Math.max(maxLat - minLat, 0.01)) * 70 + 15;

  return {
    left: `${x}%`,
    top: `${y}%`,
  };
}

export function DestinationMap({ points, activeDayIndex }: DestinationMapProps) {
  if (points.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">目的地地图</h2>
        <p className="mt-2 text-sm text-slate-500">当前目的地暂无内置地图点位。</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-emerald-600" />
            长治目的地地图
          </h2>
          <p className="mt-1 text-sm text-slate-600">按行程点位展示机场、景区、住宿和道路节点。</p>
        </div>
        <p className="text-xs text-slate-500">静态点位 · 可后续接入高德地图</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative min-h-72 overflow-hidden rounded-lg border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#f8fafc_48%,#eef2ff_100%)]">
          <div className="absolute left-[12%] top-[54%] h-24 w-[76%] rotate-[-13deg] rounded-full border-t-4 border-dashed border-emerald-300" />
          <div className="absolute left-[23%] top-[24%] h-36 w-[48%] rotate-[18deg] rounded-full border-l-4 border-dashed border-sky-200" />
          {points.map((point) => {
            const isActive = point.dayIndex === activeDayIndex;
            return (
              <div
                key={point.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={getPosition(point, points)}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ring-4 ${
                    isActive ? 'ring-emerald-200' : 'ring-white/80'
                  } ${pointStyles[point.kind]}`}
                  title={point.name}
                >
                  {point.dayIndex ?? '·'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          {points.map((point) => (
            <div
              key={point.id}
              className={`rounded-md border p-3 text-sm ${
                point.dayIndex === activeDayIndex ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="font-medium text-slate-900">
                {point.dayIndex ? `Day ${point.dayIndex} · ` : ''}
                {point.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {point.city} · {point.kind}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
