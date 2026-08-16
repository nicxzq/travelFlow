'use client';

import { BookOpenCheck, Check, ChevronDown, Clock3, Edit3, ExternalLink, Navigation, Search, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { TripEvent } from '@/lib/domain/trip';
import type { StudyCard } from '@/lib/mock/study-cards';

type TimelineCardProps = {
  event: TripEvent;
  state: 'active' | 'past' | 'future';
  readOnly?: boolean;
  studyCard?: StudyCard;
  completedStudyTaskIds?: string[];
  studyAnswers?: Record<string, string>;
  onChange?: (eventId: string, patch: Partial<TripEvent>) => void;
  onDelete?: (eventId: string) => void;
  onToggleStudyTask?: (taskId: string) => void;
  onStudyAnswerChange?: (taskId: string, answer: string) => void;
};

const categoryLabels: Record<TripEvent['category'], string> = {
  transport: '交通',
  spot: '景点',
  hotel: '住宿',
  food: '餐饮',
  custom: '事项',
};

function isValidTime(value: string) {
  return value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function TimelineCard({
  event,
  state,
  readOnly = false,
  studyCard,
  completedStudyTaskIds = [],
  studyAnswers = {},
  onChange,
  onDelete,
  onToggleStudyTask,
  onStudyAnswerChange,
}: TimelineCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [openReferenceTaskIds, setOpenReferenceTaskIds] = useState<string[]>([]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    title: event.title,
    description: event.description ?? '',
    locationName: event.locationName ?? '',
  });
  const style =
    state === 'active'
      ? 'border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-100'
      : state === 'past'
        ? 'border-slate-200 bg-slate-100 opacity-70'
        : 'border-slate-200 bg-white';
  const completedCount = studyCard?.tasks.filter((task) => completedStudyTaskIds.includes(task.id)).length ?? 0;
  const progress = studyCard ? Math.round((completedCount / studyCard.tasks.length) * 100) : 0;
  const studyPanelId = `${event.id}-study-panel`;

  return (
    <article className={`rounded-xl border p-4 shadow-sm transition ${style}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {isEditing ? (
          <div className="grid w-full min-w-0 flex-1 gap-2 sm:grid-cols-2">
            <input
              aria-label="开始时间"
              value={draft.startTime}
              onChange={(inputEvent) => setDraft((current) => ({ ...current, startTime: inputEvent.target.value }))}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="开始时间"
            />
            <input
              aria-label="结束时间"
              value={draft.endTime}
              onChange={(inputEvent) => setDraft((current) => ({ ...current, endTime: inputEvent.target.value }))}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="结束时间"
            />
            <input
              aria-label="行程标题"
              value={draft.title}
              onChange={(inputEvent) => setDraft((current) => ({ ...current, title: inputEvent.target.value }))}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
              placeholder="行程标题"
            />
            <input
              aria-label="地点"
              value={draft.locationName}
              onChange={(inputEvent) => setDraft((current) => ({ ...current, locationName: inputEvent.target.value }))}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
              placeholder="地点"
            />
            <textarea
              aria-label="说明"
              value={draft.description}
              onChange={(inputEvent) => setDraft((current) => ({ ...current, description: inputEvent.target.value }))}
              className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
              placeholder="说明"
            />
            {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-slate-900">{event.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{event.description ?? '暂无描述'}</p>
            {event.locationName ? <p className="mt-1 text-xs text-slate-500">{event.locationName}</p> : null}
          </div>
        )}
        <span className="shrink-0 rounded-md bg-slate-900 px-2 py-1 text-xs text-white">{categoryLabels[event.category]}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <Clock3 className="h-4 w-4" />
        <span>
          {event.startTime ?? '--:--'} - {event.endTime ?? '--:--'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={() => {
                const nextTitle = draft.title.trim();
                const nextStart = draft.startTime.trim();
                const nextEnd = draft.endTime.trim();

                if (!nextTitle) {
                  setError('行程标题不能为空。');
                  return;
                }

                if (!isValidTime(nextStart) || !isValidTime(nextEnd)) {
                  setError('时间格式需为 HH:mm。');
                  return;
                }

                if (nextStart && nextEnd && nextStart > nextEnd) {
                  setError('结束时间不能早于开始时间。');
                  return;
                }

                onChange?.(event.id, {
                  startTime: nextStart || undefined,
                  endTime: nextEnd || undefined,
                  title: nextTitle,
                  description: draft.description.trim() || undefined,
                  locationName: draft.locationName.trim() || undefined,
                  status: 'changed',
                });
                setError(null);
                setIsEditing(false);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Check className="h-4 w-4" />
              保存调整
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft({
                  startTime: event.startTime ?? '',
                  endTime: event.endTime ?? '',
                  title: event.title,
                  description: event.description ?? '',
                  locationName: event.locationName ?? '',
                });
                setError(null);
                setIsEditing(false);
              }}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              取消
            </button>
          </>
        ) : null}
        {event.navigationUrl ? (
          <a
            href={event.navigationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Navigation className="h-4 w-4" />
            导航前往
          </a>
        ) : null}
        {!readOnly && !isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Edit3 className="h-4 w-4" />
            调整行程
          </button>
        ) : null}
        {!readOnly && !isEditing ? (
          <button
            type="button"
            onClick={() => {
              if (!isConfirmingDelete) {
                setIsConfirmingDelete(true);
                return;
              }
              onDelete?.(event.id);
            }}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
              isConfirmingDelete
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {isConfirmingDelete ? '确认删除' : '删除'}
          </button>
        ) : null}
        {studyCard ? (
          <button
            type="button"
            aria-expanded={isStudyOpen}
            aria-controls={studyPanelId}
            onClick={() => setIsStudyOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-md border border-cyan-200 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-50"
          >
            <BookOpenCheck className="h-4 w-4" />
            研学闯关
          </button>
        ) : null}
        {readOnly ? <span className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500">只读</span> : null}
        {state === 'active' ? (
          <span className="rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">进行中</span>
        ) : null}
      </div>

      {studyCard && isStudyOpen ? (
        <div
          id={studyPanelId}
          role="region"
          aria-label={`${studyCard.theme}研学闯关`}
          className="mt-4 animate-[studyReveal_220ms_ease-out] overflow-hidden rounded-lg border border-cyan-100 bg-white"
        >
          <div className="relative min-h-44 p-4 text-white">
            <Image src={studyCard.imageUrl} alt={studyCard.imageAlt} fill sizes="(max-width: 768px) 100vw, 760px" className="object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-br ${studyCard.accent}`} />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{studyCard.theme}</p>
                  <p className="mt-1 text-xs text-white/80">
                    {studyCard.roleName} · {studyCard.estimatedMinutes} 分钟 · {studyCard.badgeName}
                  </p>
                </div>
                <div className="rounded-md bg-white/15 px-3 py-2 text-xs backdrop-blur">
                  {completedCount}/{studyCard.tasks.length} 完成
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/90">{studyCard.story}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4">
            {studyCard.tasks.map((task) => {
              const isReferenceOpen = openReferenceTaskIds.includes(task.id);
              const referenceLabel = task.type === 'quiz' ? '参考答案' : '参考思路';
              const referenceId = `${event.id}-${task.id}-reference`;
              const answer = studyAnswers[task.id] ?? '';

              return (
                <article key={task.id} className="rounded-lg border border-cyan-100 bg-cyan-50/50 p-3">
                  <label className="flex items-start gap-2 text-sm font-medium text-cyan-950">
                    <input
                      type="checkbox"
                      checked={completedStudyTaskIds.includes(task.id)}
                      disabled={readOnly}
                      onChange={() => onToggleStudyTask?.(task.id)}
                      className="mt-1 h-4 w-4 rounded border-cyan-300 text-cyan-700"
                    />
                    <span>{task.prompt}</span>
                  </label>

                  <div className="mt-3 pl-6">
                    <p className="text-xs font-medium text-cyan-800">孩子的答案</p>
                    {readOnly ? (
                      <p className={`mt-1 whitespace-pre-wrap rounded-md bg-white p-3 text-sm ${answer ? 'text-slate-700' : 'text-slate-400'}`}>
                        {answer || '还没有作答'}
                      </p>
                    ) : (
                      <>
                        <textarea
                          aria-label={`${task.prompt} 的孩子答案`}
                          rows={task.type === 'reflection' ? 3 : 2}
                          value={answer}
                          onChange={(inputEvent) => onStudyAnswerChange?.(task.id, inputEvent.target.value)}
                          placeholder="写下孩子自己的观察或回答"
                          className="mt-1 w-full resize-y rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                        {!answer && completedStudyTaskIds.includes(task.id) ? (
                          <p className="mt-1 text-xs text-slate-500">已完成，但暂无记录内容</p>
                        ) : null}
                      </>
                    )}

                    <button
                      type="button"
                      aria-expanded={isReferenceOpen}
                      aria-controls={referenceId}
                      onClick={() =>
                        setOpenReferenceTaskIds((current) =>
                          current.includes(task.id) ? current.filter((taskId) => taskId !== task.id) : [...current, task.id],
                        )
                      }
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-900"
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isReferenceOpen ? 'rotate-180' : ''}`} />
                      {isReferenceOpen ? `收起${referenceLabel}` : `查看${referenceLabel}`}
                    </button>

                    {isReferenceOpen ? (
                      <div
                        id={referenceId}
                        role="region"
                        aria-label={`${task.prompt} 的${referenceLabel}`}
                        className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950"
                      >
                        {task.referenceAnswer}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}

            <div className="flex flex-wrap gap-2 pt-2">
              {studyCard.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-cyan-200 px-3 py-2 text-xs font-medium text-cyan-800 hover:bg-cyan-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {link.label}
                </a>
              ))}
              {studyCard.quickSearches.map((search) => (
                <a
                  key={search.query}
                  href={`https://www.baidu.com/s?wd=${encodeURIComponent(search.query)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Search className="h-3.5 w-3.5" />
                  {search.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
