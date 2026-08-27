import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import { AppProviders } from '@/components/providers/AppProviders';
import './globals.css';

const notoSans = Noto_Sans_KR({
  variable: '--font-noto-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

const notoSerif = Noto_Serif_KR({
  variable: '--font-noto-serif',
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: '온기 — 우리 가족의 오늘을 담는 곳', template: '%s · 온기' },
  description: '흩어져 있는 가족의 하루를 한 곳에 모아 함께 봐요.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  // iOS Safari 가 16px 미만 입력창 포커스 시 자동 확대하는 것을 막음 (핀치 줌도 함께 비활성)
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${notoSans.variable} ${notoSerif.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
