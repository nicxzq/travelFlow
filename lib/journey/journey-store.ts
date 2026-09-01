import type { JourneyOverlay, JourneyStopOverlay } from '@/lib/domain/journey';

const STORAGE_VERSION = 'v1';

/** Imported JSON is untrusted; these keys would poison the overlay's prototype. */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const storageKey = (tripId: string) => `travelflow:journey-overlay:${tripId}:${STORAGE_VERSION}`;

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Values here end up in an <img src>, so only same-origin paths, https and inline
 * images are accepted. Anything else (javascript:, http:, blob:) is rejected.
 */
export function isSafeImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  if (/^data:image\/(png|jpe?g|gif|webp|avif);/i.test(trimmed)) return true;

  try {
    return new URL(trimmed).protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeStop(value: unknown): JourneyStopOverlay | null {
  if (typeof value !== 'object' || value === null) return null;

  const record = value as Record<string, unknown>;
  const imageUrl = typeof record.imageUrl === 'string' ? record.imageUrl.trim() : undefined;
  const story = typeof record.story === 'string' ? record.story : undefined;
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
    : undefined;

  return {
    imageUrl: imageUrl && isSafeImageUrl(imageUrl) ? imageUrl : undefined,
    story,
    tags,
  };
}

export function parseOverlay(raw: string): JourneyOverlay | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const overlay: JourneyOverlay = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([eventId, value]) => {
      if (FORBIDDEN_KEYS.has(eventId)) return;

      const stop = sanitizeStop(value);
      if (stop) overlay[eventId] = stop;
    });

    return overlay;
  } catch {
    return null;
  }
}

export function readOverlay(tripId: string): JourneyOverlay {
  if (!canUseStorage()) return {};

  const raw = window.localStorage.getItem(storageKey(tripId));
  return raw ? parseOverlay(raw) ?? {} : {};
}

export function writeOverlay(tripId: string, overlay: JourneyOverlay): { ok: true } | { ok: false; reason: string } {
  if (!canUseStorage()) return { ok: false, reason: '当前环境不支持本地存储' };

  try {
    window.localStorage.setItem(storageKey(tripId), JSON.stringify(overlay));
    return { ok: true };
  } catch {
    return { ok: false, reason: '浏览器本地空间已满，建议把大图改成图片 URL' };
  }
}

export function clearOverlay(tripId: string) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(storageKey(tripId));
}

export function downloadOverlay(tripId: string, overlay: JourneyOverlay) {
  const blob = new Blob([JSON.stringify(overlay, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${tripId}-journey-overlay.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
