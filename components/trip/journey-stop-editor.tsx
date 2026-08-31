'use client';

import { Download, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { JourneyOverlay, JourneyTrack } from '@/lib/domain/journey';
import { downloadOverlay, isSafeImageUrl, parseOverlay } from '@/lib/journey/journey-store';

type JourneyStopEditorProps = {
  track: JourneyTrack;
  overlay: JourneyOverlay;
  storageError: string | null;
  onSave: (overlay: JourneyOverlay) => boolean;
  onReset: () => void;
  onClose: () => void;
};

type Draft = Record<string, { imageUrl: string; tags: string; story: string }>;

function toDraft(track: JourneyTrack, overlay: JourneyOverlay): Draft {
  return Object.fromEntries(
    track.stops.map((stop) => {
      const patch = overlay[stop.eventId] ?? {};
      return [
        stop.eventId,
        {
          imageUrl: patch.imageUrl ?? '',
          tags: (patch.tags ?? stop.tags).join('，'),
          story: patch.story ?? stop.story ?? '',
        },
      ];
    }),
  );
}

export function JourneyStopEditor({ track, overlay, storageError, onSave, onReset, onClose }: JourneyStopEditorProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(track, overlay));
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  // Capture phase, so Escape closes this dialog before the surrounding fullscreen
  // overlay's bubble-phase handler sees it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCloseRef.current();
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  const invalidImages = useMemo(
    () => Object.entries(draft).filter(([, value]) => !isSafeImageUrl(value.imageUrl)).map(([eventId]) => eventId),
    [draft],
  );

  function update(eventId: string, patch: Partial<Draft[string]>) {
    setDraft((current) => ({ ...current, [eventId]: { ...current[eventId], ...patch } }));
  }

  function buildOverlay(): JourneyOverlay {
    return Object.fromEntries(
      Object.entries(draft).map(([eventId, value]) => [
        eventId,
        {
          imageUrl: value.imageUrl.trim() || undefined,
          story: value.story.trim() || undefined,
          tags: value.tags
            .split(/[，,]/)
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
      ]),
    );
  }

  function handleSave() {
    if (invalidImages.length > 0) {
      setMessage('存在无法使用的图片网址：只接受 https:// 开头、站内 / 路径或 data:image 内联图片。');
      return;
    }

    setMessage(onSave(buildOverlay()) ? '已保存到本浏览器' : null);
  }

  async function handleImport(file: File) {
    const parsed = parseOverlay(await file.text());
    if (!parsed) {
      setMessage('JSON 解析失败，请确认文件来自本页导出。');
      return;
    }

    setDraft(toDraft(track, parsed));
    setMessage('已导入，确认后点击保存生效。');
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 p-4" role="dialog" aria-modal="true" aria-label="维护景点图片与故事">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold">景点图片与故事维护</h2>
          <button type="button" onClick={onClose} aria-label="关闭" className="ml-auto grid h-8 w-8 place-items-center rounded-lg bg-slate-100 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-auto bg-slate-50 p-5">
          <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
            图片网址只接受 <code>https://</code> 开头、站内 <code>/</code> 路径或 <code>data:image</code> 内联图片。内容保存在当前浏览器，可用「导出 JSON」备份或迁移。
          </p>

          {storageError ? <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{storageError}</p> : null}
          {message ? <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">{message}</p> : null}

          {track.days.map((day) => (
            <section key={day.dayId} className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500">
                DAY {day.dayIndex} · {day.date}
              </h3>

              {track.stops.slice(day.firstStopIndex, day.firstStopIndex + day.stopCount).map((stop) => {
                const value = draft[stop.eventId];
                const invalid = invalidImages.includes(stop.eventId);

                return (
                  <details key={stop.eventId} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium">
                      {stop.time ? `${stop.time} · ` : ''}
                      {stop.title}
                    </summary>
                    <div className="space-y-3 border-t border-slate-200 p-3">
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-600">图片网址</span>
                        <input
                          value={value.imageUrl}
                          onChange={(event) => update(stop.eventId, { imageUrl: event.target.value })}
                          placeholder="https://..."
                          className={`mt-1 w-full rounded-md border px-2.5 py-2 text-sm outline-none focus:ring-2 ${
                            invalid ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-300 focus:ring-emerald-100'
                          }`}
                        />
                        {invalid ? <span className="mt-1 block text-[11px] text-rose-600">不被接受的网址协议</span> : null}
                      </label>

                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-600">标签（逗号分隔）</span>
                        <input
                          value={value.tags}
                          onChange={(event) => update(stop.eventId, { tags: event.target.value })}
                          className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-600">故事</span>
                        <textarea
                          value={value.story}
                          onChange={(event) => update(stop.eventId, { story: event.target.value })}
                          rows={4}
                          className="mt-1 w-full resize-y rounded-md border border-slate-300 px-2.5 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </label>
                    </div>
                  </details>
                );
              })}
            </section>
          ))}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={() => downloadOverlay(track.tripId, buildOverlay())}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            导出 JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5" />
            导入 JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => {
              onReset();
              setDraft(toDraft(track, {}));
              setMessage('已恢复默认内容。');
            }}
            className="rounded-md px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            恢复默认
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="ml-auto rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            保存
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
