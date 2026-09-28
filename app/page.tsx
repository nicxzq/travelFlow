import Link from 'next/link';
import { Bell, Camera, CheckCircle2, ExternalLink, FolderClock, Share2 } from 'lucide-react';
import { getNextEvent, getTripScheduleContext } from '@/lib/domain/trip-schedule';
import { southwestLoopTrip } from '@/lib/mock/southwest-loop';

export const dynamic = 'force-dynamic';

const highlights = [
  {
    title: '每天打开就知道去哪',
    desc: '自动切到当天计划，同时提前看明天景点和注意事项。',
    icon: Bell,
    motion: 'animate-[float_3s_ease-in-out_infinite]',
  },
  {
    title: '同行的人看同一份',
    desc: '把只读链接发给家人朋友，集合时间、地点、提醒不会传乱。',
    icon: Share2,
    motion: 'animate-[pulseSoft_2.8s_ease-in-out_infinite]',
  },
  {
    title: '路上记录不丢',
    desc: '后续可把照片、文字和当天景点绑定，旅行结束直接整理游记。',
    icon: Camera,
    motion: 'animate-[float_3.4s_ease-in-out_infinite]',
  },
];

export default function HomePage() {
  const trip = southwestLoopTrip;
  const context = getTripScheduleContext(trip);
  const nextEvent = context.phase === 'posttrip' ? undefined : context.phase === 'pretrip' ? context.today.events[0] : getNextEvent(context.today);
  const undoneTodos = (trip.todos ?? []).filter((todo) => todo.status !== 'done').length;

  return (
    <main>
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
        <div className="overflow-hidden rounded-lg border border-sky-200 bg-white">
          <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-700">
                <FolderClock className="h-4 w-4" />
                进行中 · 国庆自驾环线
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">今天去哪、明天准备什么，一眼看清。</h1>
              <p className="mt-4 max-w-2xl text-slate-600">
                长沙 → 贵州 → 昆明 → 广西 → 长沙，12 天湘黔滇桂大环线。TravelFlow 把完整行程整理成每天的导引页：下一站、导航、待办、风险提醒和同行分享都放在一起。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/trip/southwest-loop-2026"
                  className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  打开行程总览
                </Link>
                <Link
                  href="/trip/southwest-loop-2026/share"
                  className="inline-flex items-center gap-2 rounded-md border border-sky-200 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                >
                  <Share2 className="h-4 w-4" />
                  打开同行分享页
                </Link>
                <Link
                  href="/trip"
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  查看全部行程
                </Link>
              </div>
            </div>

            <div className="relative min-h-56 rounded-lg bg-slate-950 p-5 text-white">
              <div className="absolute right-6 top-5 h-3 w-3 animate-ping rounded-full bg-sky-300" />
              <div className="space-y-3">
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-xs text-sky-200">下一站</p>
                  <p className="mt-1 font-semibold">{nextEvent?.title ?? '暂无下一站'}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {nextEvent ? `${nextEvent.startTime ?? '待定'} - ${nextEvent.endTime ?? '待定'} · ${nextEvent.locationName ?? '地点待定'}` : '当天行程已结束'}
                  </p>
                </div>
                <div className="ml-8 rounded-md bg-white/10 p-3">
                  <p className="text-xs text-blue-200">明日预告</p>
                  <p className="mt-1 font-semibold">{context.tomorrow?.summary ?? '没有下一天安排'}</p>
                </div>
                <div className="rounded-md bg-sky-400/20 p-3">
                  <p className="inline-flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    {undoneTodos} 项待办待关注
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map(({ title, desc, icon: Icon, motion }) => (
            <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 ${motion}`}>
                <Icon className="h-5 w-5 text-sky-600" />
              </div>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
