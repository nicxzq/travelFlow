import { GenerateTripForm } from '@/components/new-trip/generate-form';

export default function NewTripPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold">创建新行程</h1>
        <p className="mt-3 text-slate-600">
          告诉我你想去哪、玩几天、和谁去、偏好什么节奏，我会先生成一版可查看的行程；不满意可以继续优化或重新生成。
        </p>

        <GenerateTripForm />
      </section>
    </main>
  );
}
