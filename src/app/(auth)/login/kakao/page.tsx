'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Spinner } from '@/components/ui/State';

/** 카카오 로그인 콜백 — 웹은 랜딩 전용이라 관리자 로그인(state=/admin)만 인가 코드를 넘기고, 그 외는 랜딩으로 */
function KakaoCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get('code');
    const next = params.get('state');
    if (!code || !next?.startsWith('/admin')) {
      router.replace('/');
      return;
    }
    router.replace(`/admin?${new URLSearchParams({ kakaoCode: code }).toString()}`);
  }, [params, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <KakaoCallback />
    </Suspense>
  );
}
