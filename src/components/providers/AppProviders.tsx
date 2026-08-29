'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { DialogProvider } from '@/components/ui/Dialog';
import { useSession } from '@/lib/store/session';

/** 전역 프로바이더 — react-query, 다이얼로그, 세션 복원 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }),
  );
  const restore = useSession((s) => s.restore);
  const isHydrating = useSession((s) => s.isHydrating);
  const isAuthenticated = useSession((s) => s.isAuthenticated);

  useEffect(() => {
    void restore();
  }, [restore]);

  // 로그아웃 시 이전 계정의 캐시(me·그룹·피드 등)를 비워 다음 계정에 섞이지 않게
  useEffect(() => {
    if (!isHydrating && !isAuthenticated) queryClient.clear();
  }, [queryClient, isHydrating, isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <DialogProvider>{children}</DialogProvider>
    </QueryClientProvider>
  );
}
