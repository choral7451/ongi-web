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

  useEffect(() => {
    void restore();
  }, [restore]);

  return (
    <QueryClientProvider client={queryClient}>
      <DialogProvider>{children}</DialogProvider>
    </QueryClientProvider>
  );
}
