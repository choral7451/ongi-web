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
    if (mode === 'auth') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else router.replace('/feed');
  }, [shouldRedirect, mode, router, pathname]);

  if (isHydrating || shouldRedirect) return <Spinner />;
  return <>{children}</>;
}
