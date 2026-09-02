'use client';

import { Sparkles, Square } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { parseReviewBlocks } from '@/lib/ai/review-blocks';
import { StopImage } from '@/components/trip/stop-image';

export type ReviewPhoto = {
  index: number;
  dayIndex: number;
  stopTitle: string;
  imageUrl: string;
};

type TripReviewAiProps = {
  title: string;
  facts: unknown;
  photos: ReviewPhoto[];
};

function readSseFrame(frame: string) {
  const lines = frame.split('\n');
  const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
  const data = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n');

  if (!event || !data) return null;

  try {
    return { event, data: JSON.parse(data) as Record<string, unknown> };
  } catch {
    return null;
  }
}

function readString(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === 'string' ? value : undefined;
}

export function TripReviewAi({ title, facts, photos }: TripReviewAiProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const photoByIndex = useMemo(() => new Map(photos.map((photo) => [photo.index, photo])), [photos]);
  const blocks = useMemo(() => parseReviewBlocks(content, photos.length), [content, photos.length]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }

  async function generate() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setContent('');

    try {
      const response = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Image URLs stay client-side: the model only ever needs an index to cite,
        // and stop photos can be multi-megabyte data URLs.
        body: JSON.stringify({
          title,
          facts,
          photos: photos.map(({ index, dayIndex, stopTitle }) => ({ index, dayIndex, stopTitle })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'AI 服务暂时不可用，请稍后重试。');
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          const parsed = readSseFrame(frame);
          if (!parsed) continue;

          if (parsed.event === 'delta') {
            const text = readString(parsed.data, 'text');
            if (text) setContent((current) => current + text);
          } else if (parsed.event === 'error') {
            setError(readString(parsed.data, 'message') ?? '生成失败，请稍后重试。');
          }
        }
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : '生成失败，请稍后重试。');
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <div className="mt-4 rounded-md bg-white/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-indigo-950">AI 图文结论</h3>
          <p className="mt-1 text-xs text-slate-600">
            由上方确定性统计喂给本站配置的模型生成
            {photos.length === 0 ? '；当前行程还没有点位照片，本次只会输出文字。' : `，可引用 ${photos.length} 张点位照片。`}
          </p>
        </div>
        {loading ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Square className="h-4 w-4" />
            停止生成
          </button>
        ) : (
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Sparkles className="h-4 w-4" />
            {content ? '重新生成' : '生成图文复盘'}
          </button>
        )}
      </div>

      {error ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading && !content ? <p className="mt-3 text-sm text-slate-500">正在生成复盘结论…</p> : null}

      {blocks.length > 0 ? (
        <div className="mt-4 space-y-3">
          {blocks.map((block, index) => {
            if (block.type === 'heading') {
              return (
                <h4 key={index} className="text-base font-semibold text-slate-950">
                  {block.text}
                </h4>
              );
            }

            if (block.type === 'photo') {
              const photo = photoByIndex.get(block.photoIndex);
              return photo ? (
                <StopImage
                  key={index}
                  src={photo.imageUrl}
                  alt={photo.stopTitle}
                  badge={`Day ${photo.dayIndex}`}
                  className="h-56 rounded-md"
                />
              ) : null;
            }

            return (
              <p key={index} className="text-sm leading-6 text-slate-700">
                {block.text}
              </p>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
