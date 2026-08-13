import Link from 'next/link';
import { Compass, FolderClock, PlusCircle } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <Compass className="h-5 w-5 text-emerald-600" />
          <span>TravelFlow</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/trip"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FolderClock className="h-4 w-4" />
            行程
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
    </header>
  );
}
