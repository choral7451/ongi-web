'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface LoadMoreSentinelProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

/** 무한 스크롤 센티널 — 목록 끝에 두면 화면에 들어올 때 다음 페이지를 불러온다 */
export function LoadMoreSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage }: LoadMoreSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) fetchNextPage();
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!hasNextPage && !isFetchingNextPage) return null;

  return (
    <div ref={ref} className="flex justify-center py-6" aria-hidden>
      {isFetchingNextPage ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : null}
    </div>
  );
}
