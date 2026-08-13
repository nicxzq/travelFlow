'use client';

import Link from 'next/link';
import { Code2, Eye, Lightbulb, MapPin, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { EventCategory, GeneratedItinerary } from '@/lib/domain/trip';

type LocalItineraryItem = {
  id: string;
  createdAt: string;
  sourcePrompt: string;
  itinerary: GeneratedItinerary;
};

const ACTIVE_KEY = 'travelflow_local_itinerary_v1';
const LIST_KEY = 'travelflow_local_itinerary_list_v1';
const categoryLabels: Record<EventCategory, string> = {
  transport: '交通',
  spot: '景点',
  hotel: '住宿',
  food: '餐饮',
  custom: '事项',
};

const popularTwoDayPrompts = [
  '从当前位置出发，推荐杭州2日游，节奏轻松，包含西湖、灵隐寺、亲子友好餐厅和雨天备选。',
  '从当前位置出发，推荐成都2日游，适合第一次去，包含熊猫基地、宽窄巷子、火锅和交通建议。',
  '从当前位置出发，推荐南京2日游，偏历史文化和亲子研学，安排夫子庙、中山陵和博物馆。',
  '从当前位置出发，推荐厦门2日游，节奏轻松，包含鼓浪屿、沙坡尾、海边散步和避暑提醒。',
  '从当前位置出发，推荐西安2日游，包含兵马俑、城墙、陕西历史博物馆和小学生研学重点。',
  '从当前位置出发，推荐重庆2日游，包含轻轨、洪崖洞、江景、火锅和少走路路线。',
];

type BulletListProps = {
  title: string;
  items: string[];
};

function BulletList({ title, items }: BulletListProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function randomPrompt() {
  return popularTwoDayPrompts[Math.floor(Math.random() * popularTwoDayPrompts.length)];
}

export function GenerateTripForm() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [streamText, setStreamText] = useState('');
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [localItems, setLocalItems] = useState<LocalItineraryItem[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const saved = safeParse<GeneratedItinerary>(localStorage.getItem(ACTIVE_KEY));
    const savedList = safeParse<LocalItineraryItem[]>(localStorage.getItem(LIST_KEY)) ?? [];
    setPrompt(randomPrompt());

    if (saved) {
      setItinerary(saved);
      setJsonText(JSON.stringify(saved, null, 2));
    }
    setLocalItems(savedList);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    const timer = window.setInterval(() => {
      setProgress((value) => (value >= 92 ? value : value + 8));
    }, 500);

    return () => window.clearInterval(timer);
  }, [loading]);

  const canImprove = useMemo(() => Boolean(itinerary && jsonText.trim()), [itinerary, jsonText]);

  async function streamGenerate(payload: {
    prompt: string;
    existingItinerary?: GeneratedItinerary;
    refinementMode?: 'canvas_refine' | 'regenerate';
  }) {
    setLoading(true);
    setError(null);
    setStreamText('');
    setToast('正在生成行程，通常需要几十秒。');

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        const failed = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failed?.error ?? '请求失败，请稍后再试');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const eventLine = chunk.split('\n').find((line) => line.startsWith('event:'));
          const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'));
          if (!eventLine || !dataLine) continue;

          const event = eventLine.replace('event:', '').trim();
          const data = JSON.parse(dataLine.replace('data:', '').trim()) as {
            text?: string;
            message?: string;
            itinerary?: GeneratedItinerary;
          };

          if (event === 'delta' && data.text) {
            setStreamText((prev) => prev + data.text);
          }

          if (event === 'itinerary' && data.itinerary) {
            setProgress(100);
            setItinerary(data.itinerary);
            setJsonText(JSON.stringify(data.itinerary, null, 2));
            setShowCode(false);
            setToast('行程已生成，可以查看结果或继续优化。');
          }

          if (event === 'error') {
            throw new Error(data.message ?? '生成失败，请稍后重试。');
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
      setToast('生成失败，请检查配置后重试。');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setToast('请先输入想去哪里、几天、同行人和偏好。');
      return;
    }
    await streamGenerate({ prompt, refinementMode: 'regenerate' });
  }

  async function handleRegenerate() {
    if (!itinerary) {
      setToast('请先创建一次行程，再重新生成。');
      return;
    }
    await streamGenerate({ prompt, refinementMode: 'regenerate' });
  }

  async function handleImprove() {
    try {
      const parsed = JSON.parse(jsonText) as GeneratedItinerary;
      setToast('会保留当前结果，重点修正时间、交通和缺失信息。');
      await streamGenerate({ prompt, existingItinerary: parsed, refinementMode: 'canvas_refine' });
    } catch {
      setError('代码视图里的 JSON 不是合法格式，请先修正后再继续优化。');
      setToast('JSON 格式有问题，暂时不能继续优化。');
    }
  }

  function persistList(list: LocalItineraryItem[]) {
    setLocalItems(list);
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  }

  function saveToLocal() {
    if (!itinerary) {
      setToast('还没有可保存的行程。');
      return;
    }
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(itinerary));

    const item: LocalItineraryItem = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      sourcePrompt: prompt,
      itinerary,
    };

    persistList([item, ...localItems].slice(0, 20));
    setToast('已保存，可在“行程”入口查看本地记录。');
  }

  function loadItem(item: LocalItineraryItem) {
    setPrompt(item.sourcePrompt);
    setItinerary(item.itinerary);
    setJsonText(JSON.stringify(item.itinerary, null, 2));
    setShowCode(false);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(item.itinerary));
    setToast('已加载本地记录。');
  }

  function removeItem(id: string) {
    persistList(localItems.filter((item) => item.id !== id));
    setToast('已删除本地记录。');
  }

  function useRandomPrompt() {
    setPrompt(randomPrompt());
    setToast('已换一个热门 2 日游灵感。');
  }

  return (
    <div className="mt-6 space-y-4">
      {toast ? <div className="fixed right-4 top-20 z-20 rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div> : null}

      <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">
              <Lightbulb className="h-4 w-4" />
              热门 2 日游灵感
            </p>
            <p className="mt-1 text-sm text-blue-900">会参考你的当前位置表达成“从当前位置出发”，城市随机推荐，可直接修改。</p>
          </div>
          <button onClick={useRandomPrompt} className="rounded-md border border-blue-300 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100">
            换一个城市
          </button>
        </div>
      </section>

      <textarea
        className="h-32 w-full rounded-lg border border-slate-300 bg-white p-4 outline-none ring-emerald-500 transition focus:ring"
        placeholder="例如：从当前位置出发，推荐杭州2日游，节奏轻松，包含亲子友好餐厅和雨天备选"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {loading ? '生成中...' : '创建行程'}
        </button>

        <button
          onClick={handleRegenerate}
          disabled={loading || !itinerary}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          不满意，重新生成
        </button>

        <button
          onClick={handleImprove}
          disabled={loading || !canImprove}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          按当前结果继续优化
        </button>

        <button
          onClick={saveToLocal}
          disabled={!itinerary}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          保存到本地
        </button>
      </div>

      {loading ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center justify-between text-sm text-emerald-800">
            <span>生成进度</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full rounded-full bg-emerald-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </section>
      ) : null}

      {streamText ? (
        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="font-semibold text-slate-700">生成过程</h3>
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-slate-600">{streamText}</pre>
        </section>
      ) : null}

      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {itinerary ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{itinerary.tripTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">
                目的地：{itinerary.tripHighlights.destination} ｜ 日期：{itinerary.tripHighlights.travelDates} ｜ 旅行者：
                {itinerary.tripHighlights.travelers}
              </p>
              <p className="text-sm text-slate-600">天气信息：{itinerary.tripHighlights.weatherInfo}</p>
            </div>
            <button
              onClick={() => {
                setShowCode((value) => !value);
                setToast(showCode ? '已切回行程视图。' : '已切换到可编辑 JSON。');
              }}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              title={showCode ? '查看行程内容' : '查看或编辑 JSON'}
            >
              {showCode ? <Eye className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
              {showCode ? '行程视图' : '代码'}
            </button>
          </header>

          {showCode ? (
            <textarea
              className="h-72 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs outline-none ring-blue-500 transition focus:ring"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
          ) : (
            <>
              <BulletList title="概览：每日安排" items={itinerary.overview.dailyArrangement} />
              <BulletList title="概览：交通" items={itinerary.overview.transportationSummary} />
              <BulletList title="概览：住宿" items={itinerary.overview.accommodationSummary} />
              <BulletList title="概览：实用信息" items={itinerary.overview.practicalSummary} />

              <section>
                <h3 className="font-semibold">详细行程安排</h3>
                <div className="mt-2 space-y-3">
                  {itinerary.detailedItinerary.map((day) => (
                    <article key={day.dayIndex} className="rounded-lg border border-slate-200 p-3">
                      <h4 className="font-semibold">
                        Day {day.dayIndex} · {day.date} · {day.theme}
                      </h4>
                      <ul className="mt-2 space-y-2 text-sm">
                        {day.events.map((event, index) => (
                          <li key={`${day.dayIndex}-${index}`} className="rounded-md bg-slate-50 p-2">
                            <div>
                              <span className="font-medium">{event.time}</span> · {event.title}（{categoryLabels[event.category]}）
                            </div>
                            <div className="text-slate-600">{event.description}</div>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold">本地行程管理</h3>
            <p className="mt-1 text-sm text-slate-600">已保存 {localItems.length} 条，后续可升级为登录后云端同步。</p>
          </div>
          <Link href="/trip" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800">
            <MapPin className="h-4 w-4" />
            去行程入口查看
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {localItems.length === 0 ? <p className="text-sm text-slate-500">暂无本地行程。</p> : null}
          {localItems.map((item) => (
            <article key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium">{item.itinerary.tripTitle}</p>
                <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded border px-2 py-1 text-xs" onClick={() => loadItem(item)}>
                  加载
                </button>
                <button className="rounded border px-2 py-1 text-xs" onClick={() => removeItem(item.id)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
