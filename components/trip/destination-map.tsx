import { MapPin } from 'lucide-react';
import type { DestinationMapPoint } from '@/lib/mock/destination-map';

type DestinationMapProps = {
  points: DestinationMapPoint[];
  activeDayIndex?: number;
  selectedPointId?: string;
  onPointSelect?: (point: DestinationMapPoint) => void;
};

const pointStyles: Record<DestinationMapPoint['kind'], string> = {
  airport: 'bg-sky-600',
  spot: 'bg-emerald-600',
  hotel: 'bg-violet-600',
  food: 'bg-amber-500',
  route: 'bg-rose-500',
};

const kindLabels: Record<DestinationMapPoint['kind'], string> = {
  airport: '机场',
  spot: '景点',
  hotel: '住宿',
  food: '餐饮',
  route: '道路',
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

export function DestinationMap({ points, activeDayIndex, selectedPointId, onPointSelect }: DestinationMapProps) {
  if (points.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">目的地地图</h2>
        <p className="mt-2 text-sm text-slate-500">当前目的地暂无内置地图点位。</p>
      </section>
    );
  }

  const selectedPoint = points.find((point) => point.id === selectedPointId) ?? points.find((point) => point.dayIndex === activeDayIndex);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="px-5 pt-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-emerald-600" />
            山西自驾目的地地图
          </h2>
          <p className="mt-1 text-sm text-slate-600">按行程点位展示机场、景区、住宿和道路节点。</p>
        </div>
        <p className="px-5 text-xs text-slate-500 md:pt-5">6 天全量点位 · 点击联动行程</p>
      </div>

      <div className="mt-4 grid lg:grid-cols-[1.5fr_1fr]">
        <div className="relative min-h-[420px] overflow-hidden bg-[linear-gradient(135deg,#d7efe8_0%,#edf7f3_34%,#dbeafe_35%,#dbeafe_38%,#f8fafc_39%,#f1f5f9_100%)]">
          <iframe
            title="山西自驾目的地地图背景"
            src="https://www.openstreetmap.org/export/embed.html?bbox=110.15%2C34.65%2C113.85%2C37.30&layer=mapnik"
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-white/10" />
          <div className="absolute left-[8%] top-[56%] h-24 w-[82%] rotate-[-13deg] rounded-full border-t-[6px] border-dashed border-emerald-600/45" />
          <div className="absolute left-[23%] top-[23%] h-36 w-[48%] rotate-[18deg] rounded-full border-l-[6px] border-dashed border-sky-600/35" />
          <div className="absolute bottom-4 left-4 rounded-md bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur">
            长治 · 平遥 · 临汾 · 运城
          </div>
          {points.map((point) => {
            const isActive = point.dayIndex === activeDayIndex;
            const isSelected = point.id === selectedPoint?.id;
            return (
              <button
                type="button"
                key={point.id}
                aria-label={`查看 ${point.name}`}
                onClick={() => onPointSelect?.(point)}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-900"
                style={getPosition(point, points)}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ring-4 transition ${
                    isSelected ? 'h-10 w-10 ring-amber-300' : isActive ? 'ring-emerald-200' : 'ring-white/80'
                  } ${pointStyles[point.kind]}`}
                  title={point.name}
                >
                  {point.dayIndex ?? '·'}
                </div>
              </button>
            );
          })}
        </div>

        <div className="max-h-[420px] space-y-2 overflow-auto border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
          {selectedPoint ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">
                Day {selectedPoint.dayIndex} · {selectedPoint.name}
              </p>
              <p className="mt-1 text-xs text-slate-600">{selectedPoint.description}</p>
              {selectedPoint.navigationUrl ? (
                <a href={selectedPoint.navigationUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-emerald-700">
                  打开导航
                </a>
              ) : null}
            </div>
          ) : null}
          {points.map((point) => (
            <button
              type="button"
              key={point.id}
              onClick={() => onPointSelect?.(point)}
              className={`w-full rounded-md border p-3 text-left text-sm transition hover:border-emerald-300 hover:bg-emerald-50 ${
                point.id === selectedPoint?.id
                  ? 'border-amber-300 bg-amber-50'
                  : point.dayIndex === activeDayIndex
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white'
              }`}
            >
              <p className="font-medium text-slate-900">
                {point.dayIndex ? `Day ${point.dayIndex} · ` : ''}
                {point.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {point.city} · {kindLabels[point.kind]}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
