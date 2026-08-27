'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useDialog } from '@/components/ui/Dialog';
import { profileApi } from '@/lib/api';
import { DEFAULT_USER_NAME, DEV_LOGIN_ENABLED, signInAsDev, signInWithGoogle } from '@/lib/api/auth';
import { GoogleSignInCancelled } from '@/lib/api/google';
import { useSession } from '@/lib/store/session';

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** 로그인 — 구글 계정. 가입은 서버가 자동 처리 */
export function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const dialog = useDialog();
  const setUser = useSession((s) => s.setUser);
  const setCurrentUserName = useSession((s) => s.setCurrentUserName);
  const [pending, setPending] = useState(false);

  const finish = async (user: { id: string; name: string; provider: string }) => {
    setUser(user);
    // 로그인 후 첫 화면은 항상 홈. 초대 링크(/groups?code=…)로 들어온 경우만 그쪽으로 복귀
    const next = params.get('next');
    router.replace(next && next.startsWith('/groups') && next.includes('code=') ? next : '/feed');
    if (user.name === DEFAULT_USER_NAME) {
      const name = await dialog.prompt({ title: '가족에게 보여질 이름', message: "이름은 언제든 '나' 페이지에서 바꿀 수 있어요.", confirmText: '저장' });
      if (name?.trim()) profileApi.updateMyName(name.trim()).then((me) => setCurrentUserName(me.name)).catch(() => {});
    }
  };

  const start = async (run: () => Promise<{ id: string; name: string; provider: string }>) => {
    if (pending) return;
    setPending(true);
    try {
      await finish(await run());
    } catch (e) {
      if (!(e instanceof GoogleSignInCancelled)) await dialog.alert('로그인 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pt-10 pb-14">
      {/* 브랜드 블록은 정중앙보다 위쪽에 — 모바일에서 화면 전체가 위로 올라간 인상 */}
      <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <p className="mb-3 text-[11px] tracking-[0.15em] text-accent">우리 가족의 오늘을 담는 곳</p>
        <h1 className="font-serif text-6xl font-semibold tracking-[0.15em] text-ink">ONGI</h1>
        <div className="my-4 h-px w-14 bg-accent-300" />
        <p className="text-sm leading-6 text-muted">
          흩어져 있는 가족의 하루를
          <br />한 곳에 모아 함께 봐요
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(signInWithGoogle)}
          className="flex h-13 items-center justify-center gap-3 rounded-lg border border-divider bg-white text-[15px] font-semibold text-[#1f1f1f] transition-opacity hover:bg-neutral-100 disabled:opacity-60"
        >
          <GoogleLogo />
          {pending ? '연결 중…' : 'Google로 시작하기'}
        </button>
        {DEV_LOGIN_ENABLED ? (
          <button type="button" disabled={pending} onClick={() => start(() => signInAsDev('google'))} className="h-11 rounded-lg border border-dashed border-divider text-sm text-muted">
            개발용 로그인 (토큰 없음)
          </button>
        ) : null}
        <p className="mt-2 text-center text-[11px] leading-5 text-muted">
          시작하면 온기의{' '}
          <Link href="/legal/terms" className="text-accent-700 underline">
            이용약관
          </Link>{' '}
          및{' '}
          <Link href="/legal/privacy" className="text-accent-700 underline">
            개인정보 처리방침
          </Link>
          에 동의하게 됩니다. 가족 공간에서 부적절하거나 타인을 괴롭히는 콘텐츠는 허용되지 않아요.
        </p>
      </div>
    </div>
  );
}
