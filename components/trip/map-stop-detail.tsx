'use client';

import { ExternalLink, LocateFixed } from 'lucide-react';
import type { TripDay, TripEvent } from '@/lib/domain/trip';
import type { StudyCard } from '@/lib/mock/study-cards';
import { EventQuickActions } from '@/components/trip/event-quick-actions';

type MapStopDetailProps = {
  /** Everything renders off the live event; holding a JourneyStop snapshot here
   *  would go stale the moment the trip is moved, swapped or postponed. */
  event: TripEvent;
  tags: string[];
  dayLabel: string;
  studyCard?: StudyCard;
  readOnly?: boolean;
  availableDays: Array<Pick<TripDay, 'id' | 'dayIndex' | 'date'>>;
  nextDayId?: string;
  nextEventId?: string;
  onJumpToDay: () => void;
  onPostpone: (eventId: string, minutes: number) => void;
  onMove: (eventId: string, targetDayId: string) => void;
  onSwap: (eventId: string, otherEventId: string) => void;
  onCancel: (eventId: string) => void;
  onRestore: (eventId: string) => void;
  onToggleActualComplete: (eventId: string) => void;
};

export function MapStopDetail({
  event,
  tags,
  dayLabel,
  studyCard,
  readOnly = false,
  availableDays,
  nextDayId,
  nextEventId,
  onJumpToDay,
  onPostpone,
  onMove,
  onSwap,
  onCancel,
  onRestore,
  onToggleActualComplete,
}: MapStopDetailProps) {
  return (
    <article
      id="map-stop-detail"
      role="region"
      aria-label={`${event.title} 站点详情`}
      className="border-t border-slate-200 bg-white p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-emerald-700">{dayLabel}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">{event.title}</h3>
            {event.status === 'cancelled' ? (
              <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">已取消</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {event.startTime ?? '--:--'}
            {event.endTime ? ` - ${event.endTime}` : ''} · {event.locationName ?? event.category}
          </p>
          {event.description ? <p className="mt-2 text-sm leading-6 text-slate-700">{event.description}</p> : null}
          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-md bg-slate-100 px-2 py-1">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onJumpToDay}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            <LocateFixed className="h-4 w-4" />
            跳到当天
          </button>
          {event.navigationUrl ? (
            <a
              href={event.navigationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <ExternalLink className="h-4 w-4" />
              导航
            </a>
          ) : null}
        </div>
      </div>

      {studyCard ? (
        <div className="mt-4 rounded-md border border-cyan-100 bg-cyan-50 p-3 text-sm">
          <p className="font-medium text-cyan-950">{studyCard.theme}</p>
          <p className="mt-1 text-xs text-cyan-800">
            {studyCard.roleName} · {studyCard.estimatedMinutes} 分钟 · {studyCard.badgeName}
          </p>
        </div>
      ) : null}

      {readOnly ? null : (
        <div className="mt-4">
          <EventQuickActions
            event={event}
            days={availableDays}
            nextDayId={nextDayId}
            canSwapNext={Boolean(nextEventId)}
            onPostpone={(minutes) => onPostpone(event.id, minutes)}
            onMove={(targetDayId) => onMove(event.id, targetDayId)}
            onSwapNext={() => nextEventId && onSwap(event.id, nextEventId)}
            onCancel={() => onCancel(event.id)}
            onRestore={() => onRestore(event.id)}
            onToggleComplete={() => onToggleActualComplete(event.id)}
          />
        </div>
      )}
    </article>
  );
}
