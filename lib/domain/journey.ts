import type { EventCategory, TransportMode, TripWithDaysAndEvents } from '@/lib/domain/trip';

export type { TransportMode } from '@/lib/domain/trip';

export type LatLng = {
  lat: number;
  lng: number;
};

export type JourneyStopOverlay = {
  imageUrl?: string;
  story?: string;
  tags?: string[];
};

export type JourneyOverlay = Record<string, JourneyStopOverlay>;

export interface JourneyStop {
  eventId: string;
  dayId: string;
  dayIndex: number;
  order: number;
  title: string;
  lat: number;
  lng: number;
  time?: string;
  kind: EventCategory;
  mode: TransportMode;
  description?: string;
  navigationUrl?: string;
  imageUrl?: string;
  story?: string;
  tags: string[];
}

export interface JourneyDay {
  dayId: string;
  dayIndex: number;
  date?: string;
  summary?: string;
  firstStopIndex: number;
  stopCount: number;
}

export interface JourneyTrack {
  tripId: string;
  title: string;
  subtitle?: string;
  days: JourneyDay[];
  stops: JourneyStop[];
  unresolvedEventIds: string[];
}

export interface JourneySegment {
  key: string;
  fromIndex: number;
  toIndex: number;
  from: LatLng;
  to: LatLng;
  mode: TransportMode;
}

const LAST_SORT_KEY = '99:99';

function inferMode(title: string): TransportMode {
  return /航班|飞机|flight/i.test(title) ? 'flight' : 'drive';
}

export function buildJourneyTrack(trip: TripWithDaysAndEvents, overlay: JourneyOverlay = {}): JourneyTrack {
  const stops: JourneyStop[] = [];
  const days: JourneyDay[] = [];
  const unresolvedEventIds: string[] = [];

  [...trip.days]
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .forEach((day) => {
      const firstStopIndex = stops.length;

      day.events
        .map((event, index) => ({ event, index }))
        .sort((a, b) => {
          const aTime = a.event.startTime ?? LAST_SORT_KEY;
          const bTime = b.event.startTime ?? LAST_SORT_KEY;
          return aTime === bTime ? a.index - b.index : aTime.localeCompare(bTime);
        })
        .forEach(({ event }) => {
          if (!event.geo) {
            unresolvedEventIds.push(event.id);
            return;
          }

          const patch = overlay[event.id] ?? {};
          stops.push({
            eventId: event.id,
            dayId: day.id,
            dayIndex: day.dayIndex,
            order: stops.length - firstStopIndex,
            title: event.title,
            lat: event.geo.lat,
            lng: event.geo.lng,
            time: event.startTime,
            kind: event.category,
            mode: event.transportMode ?? inferMode(event.title),
            description: event.description,
            navigationUrl: event.navigationUrl,
            imageUrl: patch.imageUrl,
            story: patch.story ?? event.description,
            tags: patch.tags ?? [],
          });
        });

      days.push({
        dayId: day.id,
        dayIndex: day.dayIndex,
        date: day.date,
        summary: day.summary,
        firstStopIndex,
        stopCount: stops.length - firstStopIndex,
      });
    });

  return {
    tripId: trip.id,
    title: trip.title,
    subtitle: [trip.destination, trip.startDate && trip.endDate ? `${trip.startDate} ~ ${trip.endDate}` : undefined]
      .filter(Boolean)
      .join(' · '),
    days,
    stops,
    unresolvedEventIds,
  };
}

export function buildJourneySegments(track: JourneyTrack): JourneySegment[] {
  const segments: JourneySegment[] = [];

  for (let index = 1; index < track.stops.length; index += 1) {
    const from = track.stops[index - 1];
    const to = track.stops[index];
    segments.push({
      key: `${from.eventId}->${to.eventId}`,
      fromIndex: index - 1,
      toIndex: index,
      from: { lat: from.lat, lng: from.lng },
      to: { lat: to.lat, lng: to.lng },
      mode: to.mode,
    });
  }

  return segments;
}

export function mergeOverlay(base: JourneyOverlay, patch: JourneyOverlay): JourneyOverlay {
  const merged: JourneyOverlay = { ...base };
  Object.entries(patch).forEach(([eventId, value]) => {
    merged[eventId] = { ...merged[eventId], ...value };
  });
  return merged;
}
