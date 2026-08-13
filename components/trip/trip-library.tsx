'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExternalLink, FolderClock, Share2 } from 'lucide-react';
import type { GeneratedItinerary } from '@/lib/domain/trip';

type LocalItineraryItem = {
  id: string;
  createdAt: string;
  sourcePrompt: string;
  itinerary: GeneratedItinerary;
};

const LIST_KEY = 'travelflow_local_itinerary_list_v1';
const ACTIVE_KEY = 'travelflow_local_itinerary_v1';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function TripLibrary() {
  const [localItems, setLocalItems] = useState<LocalItineraryItem[]>([]);

  useEffect(() => {
    setLocalItems(safeParse<LocalItineraryItem[]>(localStorage.getItem(LIST_KEY)) ?? []);
  }, []);

  function openGenerated(item: LocalItineraryItem) {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(item.itinerary));
    window.location.href = '/new';
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-emerald-700">历史行程</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">我的行程</h1>
        <p className="mt-2 text-slate-600">这里集中管理已准备、已生成或后续归档的旅行计划。</p>
      </header>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <FolderClock className="h-4 w-4" />
              已准备
            </p>
            <h2 className="mt-2 text-xl font-semibold">长沙 → 长治 → 晋东南到晋南自驾环线</h2>
            <p className="mt-2 text-sm text-emerald-900">2026-08-15 至 2026-08-20 · 6 天 5 晚 · 自驾亲子行程</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/trip/shanxi-loop-2026"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <ExternalLink className="h-4 w-4" />
              打开总览
            </Link>
            <Link
              href="/trip/shanxi-loop-2026/share"
              className="inline-flex items-center gap-2 rounded-md border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
            >
              <Share2 className="h-4 w-4" />
              同行分享
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">本地保存记录</h2>
        <p className="mt-1 text-sm text-slate-600">这些记录保存在当前浏览器里，登录同步会在后续版本接入。</p>
        <div className="mt-4 space-y-3">
          {localItems.length === 0 ? <p className="text-sm text-slate-500">暂无本地生成记录。</p> : null}
          {localItems.map((item) => (
            <article key={item.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{item.itinerary.tripTitle}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => openGenerated(item)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                打开生成结果
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
