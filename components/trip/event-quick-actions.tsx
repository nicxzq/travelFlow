'use client';

import { CalendarClock, CheckCircle2, ChevronDown, RotateCcw, Shuffle, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { TripDay, TripEvent } from '@/lib/domain/trip';

type EventQuickActionsProps = {
  event: TripEvent;
  days: Array<Pick<TripDay, 'id' | 'dayIndex' | 'date'>>;
  nextDayId?: string;
  canSwapNext: boolean;
  onPostpone: (minutes: number) => void;
  onMove: (targetDayId: string) => void;
  onSwapNext: () => void;
  onCancel: () => void;
  onRestore: () => void;
  onToggleComplete: () => void;
};

export function EventQuickActions({
  event,
  days,
  nextDayId,
  canSwapNext,
  onPostpone,
  onMove,
  onSwapNext,
  onCancel,
  onRestore,
  onToggleComplete,
}: EventQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [targetDayId, setTargetDayId] = useState(event.dayId);
  const panelId = `${event.id}-quick-actions`;

  if (event.status === 'cancelled') {
    return (
      <button
        type="button"
        onClick={onRestore}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <RotateCcw className="h-4 w-4" />
        恢复行程
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          setIsOpen((current) => !current);
          setIsConfirmingCancel(false);
        }}
        className="inline-flex items-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
      >
        <CalendarClock className="h-4 w-4" />
        快速调整
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div id={panelId} role="region" aria-label={`${event.title}快速调整`} className="mt-2 w-full rounded-lg border border-blue-100 bg-blue-50 p-3 sm:min-w-80">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onPostpone(30)}
              className="rounded-md bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-100"
            >
              推迟 30 分钟
            </button>
            <button
              type="button"
              disabled={!nextDayId}
              onClick={() => nextDayId && onMove(nextDayId)}
              className="rounded-md bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              移到明天
            </button>
            <button
              type="button"
              disabled={!canSwapNext}
              onClick={onSwapNext}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <Shuffle className="h-4 w-4" />
              与下一项交换
            </button>
            <button
              type="button"
              onClick={onToggleComplete}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-100"
            >
              {event.actualStatus === 'completed' ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {event.actualStatus === 'completed' ? '撤销实际完成' : '标记实际完成'}
            </button>
          </div>

          <div className="mt-2 flex gap-2">
            <select
              aria-label="选择目标日期"
              value={targetDayId}
              onChange={(inputEvent) => setTargetDayId(inputEvent.target.value)}
              className="min-w-0 flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              {days.map((day) => (
                <option key={day.id} value={day.id}>
                  Day {day.dayIndex} · {day.date ?? '日期待定'}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={targetDayId === event.dayId}
              onClick={() => onMove(targetDayId)}
              className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              移动
            </button>
          </div>

          <div className="mt-3 border-t border-blue-100 pt-3">
            <button
              type="button"
              onClick={() => {
                if (isConfirmingCancel) {
                  onCancel();
                  setIsOpen(false);
                  setIsConfirmingCancel(false);
                } else {
                  setIsConfirmingCancel(true);
                }
              }}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              {isConfirmingCancel ? '确认标记取消' : '标记取消'}
            </button>
            <p className="mt-2 text-xs leading-5 text-slate-500">取消会保留在变更记录中，用于撤销和旅行复盘。</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
