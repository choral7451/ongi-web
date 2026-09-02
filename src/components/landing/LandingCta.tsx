'use client';

import Link from 'next/link';
import { useSession } from '@/lib/store/session';

const APP_STORE_URL = 'https://apps.apple.com/app/id6805759281';

/** 랜딩 CTA — 세션 상태에 따라 "시작하기" 또는 "피드로 가기" + App Store 다운로드 */
export function LandingCta({ variant }: { variant: 'header' | 'hero' }) {
  const isHydrating = useSession((s) => s.isHydrating);
  const isAuthenticated = useSession((s) => s.isAuthenticated);
  const href = isAuthenticated ? '/feed' : '/login';
  const label = isAuthenticated ? '피드로 가기' : variant === 'header' ? '로그인' : '무료로 시작하기';

  if (variant === 'header') {
    return (
      <Link href={href} className="rounded-md border border-accent px-3.5 py-1.5 font-serif text-[13px] font-semibold text-accent hover:bg-accent-100" aria-disabled={isHydrating}>
        {label}
      </Link>
    );
  }
  return (
    <>
      <Link href={href} className="rounded-md bg-accent px-6 py-3 font-serif text-sm font-semibold text-white hover:bg-accent-700">
        {label}
      </Link>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 font-serif text-sm font-semibold text-bg hover:opacity-85"
      >
        {/* Apple 로고 —  글리프는 안드로이드에서 깨져서 SVG 사용 */}
        <svg aria-hidden viewBox="0 0 384 512" className="h-4 w-4 fill-current">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
        </svg>
        App Store에서 받기
      </a>
      {isAuthenticated ? null : (
        <Link href="/legal/privacy" className="rounded-md border border-divider px-6 py-3 font-serif text-sm font-semibold text-ink hover:bg-neutral-100">
          개인정보 처리방침 보기
        </Link>
      )}
    </>
  );
}
