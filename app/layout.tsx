import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth/current-user';
import './globals.css';

export const metadata: Metadata = {
  title: 'TravelFlow',
  description: '智能旅行伴侣 - AI 行程规划与行中助手',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen flex-col">
          <SiteHeader userEmail={user?.email ?? null} />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
