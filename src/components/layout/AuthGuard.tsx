'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/State';
import { useSession } from '@/lib/store/session';

/**
 * 보호 구역 — 세션 복원이 끝날 때까지 스피너, 비로그인은 /login 으로.
 * mode="guest" 는 반대로(로그인 상태면 홈으로) — 로그인 페이지용.
 */
export function AuthGuard({ children, mode = 'auth' }: { children: React.ReactNode; mode?: 'auth' | 'guest' }) {
  const isHydrating = useSession((s) => s.isHydrating);
  const isAuthenticated = useSession((s) => s.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  const shouldRedirect = !isHydrating && (mode === 'auth' ? !isAuthenticated : isAuthenticated);

  useEffect(() => {
    if (!shouldRedirect) return;
    if (mode === 'auth') {
      // 쿼리(예: /groups?code=6자리 숫자 초대 링크)까지 보존해 로그인 후 그대로 복귀
      const next = pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } else {
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next && next.startsWith('/') ? next : '/feed');
    }
  }, [shouldRedirect, mode, router, pathname]);

  if (isHydrating || shouldRedirect) return <Spinner />;
  return <>{children}</>;
}
