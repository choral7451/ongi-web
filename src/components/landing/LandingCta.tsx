'use client';

import Link from 'next/link';
import { useSession } from '@/lib/store/session';

/** 랜딩 CTA — 세션 상태에 따라 "시작하기" 또는 "피드로 가기" */
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
      {isAuthenticated ? null : (
        <Link href="/legal/privacy" className="rounded-md border border-divider px-6 py-3 font-serif text-sm font-semibold text-ink hover:bg-neutral-100">
          개인정보 처리방침 보기
        </Link>
      )}
    </>
  );
}
