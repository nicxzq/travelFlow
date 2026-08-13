'use client';

import Link from 'next/link';
import { Clock3, Compass, FolderClock, PlusCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { shanxiLoopTrip } from '@/lib/mock/shanxi-loop';

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

function dateOnly(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

export function SiteHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const scheduledSlots = useMemo(() => {
    if (!now) return [];
    const currentDate = dateOnly(now);
    return shanxiLoopTrip.days
      .find((day) => day.date === currentDate)
      ?.events.filter((event) => event.startTime)
      .slice(0, 3) ?? [];
  }, [now]);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <Compass className="h-5 w-5 text-emerald-600" />
          <span>TravelFlow</span>
        </Link>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Clock3 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium text-slate-800">{now ? formatDateTime(now) : '同步时间中'}</span>
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="truncate">
              {scheduledSlots.length > 0
                ? scheduledSlots.map((event) => `${event.startTime} ${event.title}`).join(' / ')
                : '今日暂无已排期时段'}
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/trip"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <FolderClock className="h-4 w-4" />
              行程管理
            </Link>
            <Link
              href="/new"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <PlusCircle className="h-4 w-4" />
              新建行程
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
