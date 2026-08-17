'use client';

import { Copy, ExternalLink, LocateFixed, MapPin, Share2, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { TripEvent, TripWithDaysAndEvents } from '@/lib/domain/trip';
import type { DestinationMapPoint } from '@/lib/mock/destination-map';
import {
  buildPlatformKeyword,
  buildPlatformLaunch,
  type SearchPlatform,
  type SearchScenario,
} from '@/lib/platform-search';
import { buildRecommendationPrompt, distanceInKilometers, type GeoPoint } from '@/lib/trip-execution/reducer';

type NearbyDecisionCardProps = {
  trip: TripWithDaysAndEvents;
  currentEvent?: TripEvent;
  mapPoints?: DestinationMapPoint[];
};

const platformChoices: SearchPlatform[] = ['amap', 'meituan', 'dianping', 'ctrip'];

const scenarioLabels: Record<SearchScenario, string> = {
  attraction: '附近玩半天',
  food: '找性价比餐厅',
  hotel: '找家庭住宿',
};

export function NearbyDecisionCard({ trip, currentEvent, mapPoints = [] }: NearbyDecisionCardProps) {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [availableHours, setAvailableHours] = useState(4);
  const [searchScenario, setSearchScenario] = useState<SearchScenario>('attraction');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'select'>('idle');
  const [platformStatus, setPlatformStatus] = useState<string | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const platformKeywordRef = useRef<HTMLInputElement>(null);
  const referencePoint = useMemo(() => {
    if (position) return position;
    if (currentEvent?.geo) return currentEvent.geo;
    const currentMapPoint = mapPoints.find(
      (point) =>
        point.eventId === currentEvent?.id ||
        (currentEvent?.locationName
          ? point.name.includes(currentEvent.locationName) || currentEvent.locationName.includes(point.name)
          : false),
    );
    return currentMapPoint ? { lat: currentMapPoint.lat, lng: currentMapPoint.lng } : null;
  }, [currentEvent?.geo, currentEvent?.id, currentEvent?.locationName, mapPoints, position]);
  const remainingEvents = useMemo(
    () =>
      trip.days
        .flatMap((day) => day.events)
        .filter((event) => event.status !== 'cancelled' && event.actualStatus !== 'completed' && event.id !== currentEvent?.id),
    [currentEvent?.id, trip.days],
  );
  const candidates = useMemo(() => {
    if (!referencePoint) return [];
    return remainingEvents
      .map((event) => {
        const mapPoint = mapPoints.find((point) => point.eventId === event.id);
        const geo = event.geo ?? (mapPoint ? { lat: mapPoint.lat, lng: mapPoint.lng } : undefined);
        return geo ? { event, distance: distanceInKilometers(referencePoint, geo) } : undefined;
      })
      .filter((candidate): candidate is { event: TripEvent; distance: number } => Boolean(candidate))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [mapPoints, referencePoint, remainingEvents]);
  const placeName = currentEvent?.locationName ?? currentEvent?.title ?? trip.destination;
  const prompt = buildRecommendationPrompt({
    placeName,
    availableHours,
    tripTitle: trip.title,
    coordinates: position ?? undefined,
    remainingEvents: remainingEvents.slice(0, 8).map((event) => event.title),
  });
  const platformKeyword = buildPlatformKeyword({
    scenario: searchScenario,
    placeName,
    availableHours,
  });

  function requestLocation() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('当前浏览器不支持定位，可继续按当前行程地点生成推荐问题。');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('定位权限未开启，已继续使用当前行程地点。');
        } else if (error.code === error.TIMEOUT) {
          setLocationError('定位超时，已继续使用当前行程地点。');
        } else {
          setLocationError('暂时无法取得位置，已继续使用当前行程地点。');
        }
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
    } catch {
      promptRef.current?.focus();
      promptRef.current?.select();
      setCopyState('select');
    }
  }

  async function sharePrompt() {
    if (!navigator.share) {
      await copyPrompt();
      return;
    }
    try {
      await navigator.share({ title: `${trip.title} · 附近推荐问题`, text: prompt });
    } catch {
      // Closing the native share sheet is a valid no-op.
    }
  }

  function openPlatform(platform: SearchPlatform) {
    const launch = buildPlatformLaunch({
      platform,
      scenario: searchScenario,
      placeName,
      availableHours,
      coordinates: position ?? undefined,
    });

    window.open(launch.url, '_blank', 'noopener,noreferrer');

    if (!navigator.clipboard?.writeText) {
      platformKeywordRef.current?.focus();
      platformKeywordRef.current?.select();
      setPlatformStatus(`已打开${launch.label}；请长按复制下方关键词后粘贴搜索。`);
      return;
    }

    void navigator.clipboard.writeText(launch.keyword).then(
      () => {
        setPlatformStatus(
          launch.directSearch
            ? `已打开${launch.label}并带入关键词，同时已复制备用。`
            : `关键词已复制，已打开${launch.label}；请在官方平台内粘贴搜索。`,
        );
      },
      () => {
        platformKeywordRef.current?.focus();
        platformKeywordRef.current?.select();
        setPlatformStatus(`已打开${launch.label}；关键词未自动复制，请长按下方内容复制。`);
      },
    );
  }

  return (
    <section className="rounded-lg border border-violet-200 bg-violet-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-violet-700">
            <Sparkles className="h-4 w-4" />
            附近决策助手
          </p>
          <h2 className="mt-2 text-lg font-semibold">现在附近还能去哪？</h2>
          <p className="mt-1 text-sm text-violet-900">先排序行程内已有备选，再把完整上下文复制或分享给豆包等助手。</p>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
        >
          <LocateFixed className="h-4 w-4" />
          {position ? '已使用当前位置' : '使用当前位置'}
        </button>
      </div>

      {locationError ? <p role="status" className="mt-3 rounded-md bg-white/70 p-3 text-sm text-violet-900">{locationError}</p> : null}

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-violet-950">行程内附近备选</h3>
          <span className="text-xs text-violet-700">直线距离估算 · 营业状态待核验</span>
        </div>
        <div className="mt-2 space-y-2">
          {candidates.length === 0 ? (
            <p className="rounded-md bg-white/70 p-3 text-sm text-violet-900">现有行程里没有带坐标的可用备选，可直接生成外部推荐问题。</p>
          ) : null}
          {candidates.map(({ event, distance }) => (
            <div key={event.id} className="flex items-start justify-between gap-3 rounded-md bg-white/80 p-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{event.title}</p>
                <p className="mt-1 text-xs text-slate-500">{event.locationName ?? '地点信息待核验'}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-violet-700">
                <MapPin className="h-3.5 w-3.5" />
                {distance.toFixed(1)} km
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-md bg-white/80 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
          可用时间
          <select
            value={availableHours}
            onChange={(inputEvent) => setAvailableHours(Number(inputEvent.target.value))}
            className="rounded-md border border-violet-200 bg-white px-2 py-1 text-sm"
          >
            <option value={2}>2 小时</option>
            <option value={4}>半天（4 小时）</option>
            <option value={6}>6 小时</option>
          </select>
        </label>
        <textarea ref={promptRef} readOnly value={prompt} aria-label="附近推荐问题" className="mt-3 block h-36 w-full resize-y rounded-md border border-violet-100 bg-white p-3 text-xs leading-5 text-slate-600" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={copyPrompt} className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">
            <Copy className="h-4 w-4" />
            {copyState === 'copied' ? '已复制' : copyState === 'select' ? '请长按复制' : '复制推荐问题'}
          </button>
          <button type="button" onClick={sharePrompt} className="inline-flex items-center gap-2 rounded-md border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">
            <Share2 className="h-4 w-4" />
            系统分享
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">当前未读取美团、大众点评或携程数据。请外部助手标注来源和更新时间，不要虚构评分或价格。</p>
      </div>

      <div className="mt-4 rounded-md border border-violet-200 bg-white/90 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">去官方平台核验</h3>
            <p className="mt-1 text-xs text-slate-500">TravelFlow 生成关键词；评分、价格和营业状态以官方页面为准。</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            想解决
            <select
              value={searchScenario}
              onChange={(inputEvent) => {
                setSearchScenario(inputEvent.target.value as SearchScenario);
                setPlatformStatus(null);
              }}
              className="rounded-md border border-violet-200 bg-white px-2 py-1 text-sm"
            >
              {Object.entries(scenarioLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 block text-xs font-medium text-slate-600">
          搜索关键词
          <input
            ref={platformKeywordRef}
            readOnly
            value={platformKeyword}
            className="mt-1 block w-full rounded-md border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-slate-700"
          />
        </label>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {platformChoices.map((platform) => {
            const launch = buildPlatformLaunch({
              platform,
              scenario: searchScenario,
              placeName,
              availableHours,
              coordinates: position ?? undefined,
            });
            return (
              <button
                key={platform}
                type="button"
                onClick={() => openPlatform(platform)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
              >
                <ExternalLink className="h-4 w-4" />
                {platform === 'amap' ? `打开${launch.label}` : `去${launch.label}搜`}
              </button>
            );
          })}
        </div>

        {platformStatus ? <p aria-live="polite" className="mt-3 rounded-md bg-violet-50 p-2 text-xs text-violet-900">{platformStatus}</p> : null}
        <p className="mt-3 text-xs leading-5 text-slate-500">TravelFlow 不接触平台账号、密码或 Cookie；登录只在官方平台内完成。当前未读取平台评分、价格或实时余量。</p>
      </div>
    </section>
  );
}
