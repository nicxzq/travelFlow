'use client';

import { BarChart3, Copy } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { TripWithDaysAndEvents } from '@/lib/domain/trip';
import type { ExecutionReview } from '@/lib/trip-execution/reducer';

type TripReviewCardProps = {
  trip: TripWithDaysAndEvents;
  review: ExecutionReview;
};

function formatDeviation(minutes?: number) {
  if (minutes === undefined) return '未记录时间偏差';
  if (minutes === 0) return '与原计划时间一致';
  return minutes > 0 ? `比原计划晚 ${minutes} 分钟` : `比原计划早 ${Math.abs(minutes)} 分钟`;
}

export function TripReviewCard({ trip, review }: TripReviewCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'select'>('idle');
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const dayLabels = useMemo(
    () => new Map(trip.days.map((day) => [day.id, `Day ${day.dayIndex} · ${day.date ?? '日期待定'}`])),
    [trip.days],
  );
  const changedRows = review.rows.filter((row) => row.changed);
  const prompt = [
    `请分析“${trip.title}”的计划与实际差异。`,
    '事实数据：',
    JSON.stringify(
      {
        initialCount: review.initialCount,
        currentActiveCount: review.currentActiveCount,
        changeCounts: review.counts,
        changedItems: changedRows,
      },
      null,
      2,
    ),
    '请 AI 分析的问题：',
    '1. 哪些调整最可能来自时间估算、交通衔接或体力安排问题？推测必须明确标为推测。',
    '2. 把已经验证的事实整理成一份实际旅行攻略。',
    '3. 给下次规划提出 3-5 条可执行规则，并引用对应事实。',
  ].join('\n');

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

  return (
    <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700">
        <BarChart3 className="h-4 w-4" />
        行程执行复盘
      </p>
      <h2 className="mt-2 text-lg font-semibold">初始计划和实际执行发生了什么变化</h2>
      <p className="mt-1 text-sm text-indigo-900">以下结论由本地快照和变更记录确定性计算，不把推测当事实。</p>

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
        {changedRows.slice(0, 10).map((row) => (
          <article key={row.eventId} className="rounded-md bg-white/80 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-slate-900">{row.title}</p>
              <span className={row.cancelled ? 'text-xs font-medium text-red-600' : 'text-xs font-medium text-indigo-700'}>
                {row.cancelled ? '已取消' : row.actualAt ? '实际已完成' : '计划已调整'}
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

      <div className="mt-4 rounded-md bg-white/80 p-3">
        <textarea ref={promptRef} readOnly value={prompt} aria-label="AI 深度分析上下文" className="block h-36 w-full resize-y rounded-md border border-indigo-100 bg-white p-3 text-xs leading-5 text-slate-600" />
        <button type="button" onClick={copyPrompt} className="mt-3 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Copy className="h-4 w-4" />
          {copyState === 'copied' ? '已复制' : copyState === 'select' ? '请长按复制' : '复制给 AI 深度分析'}
        </button>
      </div>
    </section>
  );
}
