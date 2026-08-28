import type { Metadata, Viewport } from 'next';
import { Fredoka, Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import { AppProviders } from '@/components/providers/AppProviders';
import './globals.css';

const notoSans = Noto_Sans_KR({
  variable: '--font-noto-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

const fredoka = Fredoka({ variable: '--font-logo', subsets: ['latin'], weight: ['700'], display: 'swap' });

const notoSerif = Noto_Serif_KR({
  variable: '--font-noto-serif',
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  // 모든 페이지 탭 제목을 '온기'로 고정 (페이지별 title 은 검색 엔진용 메타로만 남고 탭엔 안 보임)
  title: { default: '온기', template: '온기' },
  description: '흩어져 있는 가족의 하루를 한 곳에 모아 함께 봐요.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  // iOS Safari 가 16px 미만 입력창 포커스 시 자동 확대하는 것을 막음 (핀치 줌도 함께 비활성)
  maximumScale: 1,
  userScalable: false,
  // 홈 화면에 추가한 PWA 등에서 상단 노치 영역까지 쓰고 safe-area 로 패딩
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${notoSans.variable} ${notoSerif.variable} ${fredoka.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
