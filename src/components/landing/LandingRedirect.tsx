'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/lib/store/session';

/** 로그인 상태로 랜딩(/)에 오면 피드로 보낸다 — 세션은 localStorage 기반이라 클라이언트에서 판별 */
export function LandingRedirect() {
  const router = useRouter();
  const isHydrating = useSession((s) => s.isHydrating);
  const isAuthenticated = useSession((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isHydrating && isAuthenticated) router.replace('/feed');
  }, [isHydrating, isAuthenticated, router]);

  return null;
}
