'use client';

import { Archive, ArchiveRestore, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import type { TripWithDaysAndEvents } from '@/lib/domain/trip';
import type { ExecutionReview } from '@/lib/trip-execution/reducer';
import { TripReviewAi, type ReviewPhoto } from '@/components/trip/trip-review-ai';

type TripReviewCardProps = {
  trip: TripWithDaysAndEvents;
  review: ExecutionReview;
  photos: ReviewPhoto[];
  readOnly?: boolean;
  onArchive: () => void;
  onUnarchive: () => void;
};

const ARCHIVE_BUTTON = 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium';

function formatArchivedAt(value?: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDeviation(minutes?: number) {
  if (minutes === undefined) return '未记录时间偏差';
  if (minutes === 0) return '与原计划时间一致';
  return minutes > 0 ? `比原计划晚 ${minutes} 分钟` : `比原计划早 ${Math.abs(minutes)} 分钟`;
}

export function TripReviewCard({ trip, review, photos, readOnly = false, onArchive, onUnarchive }: TripReviewCardProps) {
  const dayLabels = useMemo(
    () => new Map(trip.days.map((day) => [day.id, `Day ${day.dayIndex} · ${day.date ?? '日期待定'}`])),
    [trip.days],
  );
  const changedRows = review.rows.filter((row) => row.changed);
  // Every changed event across every day, scrolled rather than truncated: a cut-off
  // list silently understates how far execution drifted from the plan.
  const changedRowList = (
    <div
      tabIndex={0}
      role="group"
      aria-label="发生变化的行程明细"
      className="max-h-[26rem] space-y-2 overflow-auto pr-1"
    >
      {changedRows.map((row) => (
        <article key={row.eventId} className="rounded-md bg-white/80 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-slate-900">{row.title}</p>
            <span className={row.cancelled || row.missing ? 'text-xs font-medium text-red-600' : 'text-xs font-medium text-indigo-700'}>
              {row.missing ? '实际行程中已无此项' : row.cancelled ? '已取消' : row.actualAt ? '实际已完成' : '计划已调整'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {dayLabels.get(row.initialDayId) ?? row.initialDayId} {row.initialStartTime ?? '--:--'} →{' '}
            {dayLabels.get(row.currentDayId) ?? row.currentDayId} {row.currentStartTime ?? '--:--'}
          </p>
          {row.actualAt ? <p className="mt-1 text-xs text-slate-500">{formatDeviation(row.deviationMinutes)}</p> : null}
        </article>
      ))}
    </div>
  );
  const facts = useMemo(
    () => ({
      destination: trip.destination,
      dates: [trip.startDate, trip.endDate].filter(Boolean).join(' ~ '),
      archived: review.archived,
      baselineStale: review.baselineStale,
      plannedCount: review.initialCount,
      actualActiveCount: review.currentActiveCount,
      changeCounts: review.counts,
      addedEventIds: review.addedEventIds,
      changedItems: changedRows,
    }),
    [changedRows, review, trip.destination, trip.endDate, trip.startDate],
  );

  return (
    <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700">
        <BarChart3 className="h-4 w-4" />
        行程执行复盘
      </p>
      <h2 className="mt-2 text-lg font-semibold">初始计划和实际执行发生了什么变化</h2>
      <p className="mt-1 text-sm text-indigo-900">
        原计划取自最初捕获的快照，实际取自{review.archived ? '归档时冻结的最终行程' : '当前实时行程'}；
        以下结论由两者确定性比对得出，不把推测当事实。
      </p>

      {review.baselineStale ? (
        <p className="mt-3 rounded-md bg-amber-100/80 p-3 text-xs text-amber-950">
          原计划基线来自更早的行程版本。基础行程改版后行程点已整体更换，逐项对比会把全部旧点位判为「已取消」，
          因此下方明细与 AI 结论仅作参考、不代表真实执行情况。
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-white/80 p-3">
        <div className="text-xs text-slate-600">
          {review.archived ? (
            <>
              <span className="font-medium text-slate-900">已归档 · {formatArchivedAt(review.archivedAt)}</span>
              {review.changesAfterArchive > 0 ? `：归档后又记录了 ${review.changesAfterArchive} 次调整，归档内容保持冻结。` : '：归档内容保持冻结。'}
            </>
          ) : (
            '尚未归档。归档会把当前行程冻结为「最终执行版」，之后仍可继续修改行程。'
          )}
        </div>
        {readOnly ? null : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onArchive} className={`${ARCHIVE_BUTTON} bg-indigo-600 text-white hover:bg-indigo-700`}>
              <Archive className="h-4 w-4" />
              {review.archived ? '更新归档' : '归档为最终版'}
            </button>
            {review.archived ? (
              <button type="button" onClick={onUnarchive} className={`${ARCHIVE_BUTTON} border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50`}>
                <ArchiveRestore className="h-4 w-4" />
                取消归档
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-md bg-white/80 p-3"><p className="text-xs text-slate-500">原计划</p><p className="mt-1 font-semibold">{review.initialCount} 项</p></div>
        <div className="rounded-md bg-white/80 p-3"><p className="text-xs text-slate-500">当前有效</p><p className="mt-1 font-semibold">{review.currentActiveCount} 项</p></div>
        <div className="rounded-md bg-white/80 p-3"><p className="text-xs text-slate-500">取消</p><p className="mt-1 font-semibold">{review.counts.cancel} 次</p></div>
        <div className="rounded-md bg-white/80 p-3"><p className="text-xs text-slate-500">移动/交换</p><p className="mt-1 font-semibold">{review.counts.move + review.counts.swap} 次</p></div>
        <div className="rounded-md bg-white/80 p-3"><p className="text-xs text-slate-500">顺延</p><p className="mt-1 font-semibold">{review.counts.postpone} 次</p></div>
        <div className="rounded-md bg-white/80 p-3"><p className="text-xs text-slate-500">实际完成</p><p className="mt-1 font-semibold">{review.counts.actualComplete} 项</p></div>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold text-indigo-950">发生变化的行程</h3>
        {changedRows.length === 0 ? <p className="rounded-md bg-white/70 p-3 text-sm text-indigo-900">还没有记录行程调整或实际完成。</p> : null}
        {changedRows.length > 0 && review.baselineStale ? (
          // Stale baselines flag every old event as missing, so the list is collapsed
          // by default rather than presenting a version mismatch as execution drift.
          <details className="rounded-md bg-white/70 p-3">
            <summary className="cursor-pointer text-sm font-medium text-indigo-900">
              展开 {changedRows.length} 条明细（版本不一致，仅供参考）
            </summary>
            <div className="mt-3">{changedRowList}</div>
          </details>
        ) : null}
        {changedRows.length > 0 && !review.baselineStale ? changedRowList : null}
      </div>

      {review.baselineStale ? (
        <p className="mt-4 rounded-md bg-white/80 p-3 text-xs text-slate-600">
          原计划与实际行程来自不同的行程版本，逐项差异无法可靠比对，AI 图文结论已暂停以免把改版误读成执行偏差。
        </p>
      ) : (
        <TripReviewAi title={trip.title} facts={facts} photos={photos} />
      )}
    </section>
  );
}
