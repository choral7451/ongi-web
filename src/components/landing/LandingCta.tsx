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
        {/* Apple 로고 글리프 — 시스템 폰트에 포함 */}
        <span aria-hidden className="text-base leading-none"></span>
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
