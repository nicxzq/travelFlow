import Link from 'next/link';
import { Bell, Camera, CheckCircle2, MapPinned, Share2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

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
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
        <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white">
          <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div>
              <p className="text-sm font-medium text-emerald-700">给这次山西自驾准备的旅行助手</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">今天去哪、明天准备什么，一眼看清。</h1>
              <p className="mt-4 max-w-2xl text-slate-600">
                TravelFlow 会把完整行程整理成每天的导引页：下一站、导航、待办、风险提醒和同行分享都放在一起。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/trip"
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  查看我的行程
                </Link>
                <Link
                  href="/trip/shanxi-loop-2026/share"
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <Share2 className="h-4 w-4" />
                  打开同行分享页
                </Link>
              </div>
            </div>

            <div className="relative min-h-56 rounded-lg bg-slate-950 p-5 text-white">
              <div className="absolute right-6 top-5 h-3 w-3 animate-ping rounded-full bg-emerald-300" />
              <div className="space-y-3">
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-xs text-emerald-200">下一站</p>
                  <p className="mt-1 font-semibold">壶口瀑布山西侧</p>
                  <p className="mt-1 text-xs text-slate-300">10:00 - 12:00 · 雨衣和防水袋</p>
                </div>
                <div className="ml-8 rounded-md bg-white/10 p-3">
                  <p className="text-xs text-blue-200">明日预告</p>
                  <p className="mt-1 font-semibold">云丘山 → 运城 → 七彩盐湖</p>
                </div>
                <div className="rounded-md bg-emerald-400/20 p-3">
                  <p className="inline-flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    已同步给同行
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map(({ title, desc, icon: Icon, motion }) => (
            <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 ${motion}`}>
                <Icon className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </article>
          ))}
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="inline-flex items-center gap-2 font-semibold">
            <MapPinned className="h-5 w-5 text-emerald-600" />
            当前已准备好的行程
          </h2>
          <p className="mt-2 text-sm text-slate-600">晋东南到晋南自驾环线，6 天 5 晚，含每日安排、待办提醒和外部导航。</p>
          <Link href="/trip/shanxi-loop-2026" className="mt-4 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800">
            进入行程总览
          </Link>
        </section>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-5 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>如有操作问题或咨询事宜，请加管理员 carl-xu 咨询。</p>
          <p>版本号 1.0.0</p>
        </div>
      </footer>
    </main>
  );
}
