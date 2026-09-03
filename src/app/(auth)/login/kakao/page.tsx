'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Spinner } from '@/components/ui/State';

/** 카카오 로그인 콜백 — 인가 코드를 로그인 화면으로 넘겨 공용 로그인 흐름을 재사용한다 */
function KakaoCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get('code');
    const next = params.get('state');
    if (!code) {
      router.replace('/login');
      return;
    }
    const query = new URLSearchParams({ kakaoCode: code });
    if (next) query.set('next', next);
    router.replace(`/login?${query.toString()}`);
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
