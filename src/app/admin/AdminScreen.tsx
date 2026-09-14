'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDialog } from '@/components/ui/Dialog';
import { ErrorState, Spinner } from '@/components/ui/State';
import { Tag } from '@/components/ui/Tag';
import { adminApi } from '@/lib/api';
import type { AdminMe, AdminPermission } from '@/lib/api/admin';
import { signInWithGoogle, signInWithKakaoCode } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { GoogleSignInCancelled } from '@/lib/api/google';
import { startKakaoLogin } from '@/lib/api/kakao';
import { useSession } from '@/lib/store/session';
import { cn } from '@/lib/utils/cn';
import { AccessLogsTab } from './tabs/AccessLogsTab';
import { ConfigsTab } from './tabs/ConfigsTab';
import { DashboardTab } from './tabs/DashboardTab';
import { GroupsTab } from './tabs/GroupsTab';
import { ReportsTab } from './tabs/ReportsTab';
import { UsersTab } from './tabs/UsersTab';

const TABS: { key: string; label: string; permission: AdminPermission }[] = [
  { key: 'dashboard', label: '운영 현황', permission: 'dashboard' },
  { key: 'reports', label: '신고', permission: 'reports' },
  { key: 'users', label: '사용자', permission: 'directory' },
  { key: 'groups', label: '가족 공간', permission: 'directory' },
  { key: 'configs', label: '앱 버전', permission: 'configs' },
  { key: 'access-logs', label: '열람 기록', permission: 'photos' },
];

/** 관리자 페이지 — 로그인 → 서버에서 관리자 등급 확인 → 등급이 가진 권한의 탭만 보여준다. 관리자가 아니면 404 처럼 보인다 */
export function AdminScreen() {
  const isHydrating = useSession((s) => s.isHydrating);
  const isAuthenticated = useSession((s) => s.isAuthenticated);

  if (isHydrating) return <Spinner />;
  if (!isAuthenticated) return <AdminLogin />;
  return <AdminGate />;
}

function AdminGate() {
  const me = useQuery({ queryKey: ['admin', 'me'], queryFn: adminApi.getMe, retry: false });

  if (me.isPending) return <Spinner />;
  if (me.error instanceof ApiError && (me.error.status === 403 || me.error.status === 401)) return <NotFoundView />;
  if (me.isError) return <ErrorState message="관리자 정보를 불러오지 못했어요." onRetry={() => me.refetch()} />;
  return <AdminShell me={me.data} />;
}

function AdminShell({ me }: { me: AdminMe }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const signOut = useSession((s) => s.signOut);
  const tabs = TABS.filter((tab) => me.permissions.includes(tab.permission));
  const active = tabs.find((tab) => tab.key === params.get('tab')) ?? tabs[0];
  const can = (permission: AdminPermission) => me.permissions.includes(permission);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pt-6 pb-16 md:px-8">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-xl font-semibold text-ink">온기 관리자</h1>
        <Tag label={me.type === 'SUPER_ADMIN' ? '최고 관리자' : '관리자'} variant={me.type === 'SUPER_ADMIN' ? 'accent' : 'neutral'} />
        <span className="ml-auto text-[13px] text-muted">{me.name}</span>
        <button type="button" onClick={signOut} className="text-[13px] text-accent-700 underline">
          로그아웃
        </button>
      </header>

      <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-divider px-4 md:mx-0 md:px-0" aria-label="관리자 메뉴">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => router.replace(`${pathname}?tab=${tab.key}`)}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-2.5 font-serif text-sm font-semibold transition-colors',
              tab.key === active?.key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {active?.key === 'dashboard' ? <DashboardTab /> : null}
      {active?.key === 'reports' ? <ReportsTab /> : null}
      {active?.key === 'users' ? <UsersTab myUserId={me.userId} canGrant={can('grant')} canSeeSensitive={can('sensitive')} canViewPhotos={can('photos')} /> : null}
      {active?.key === 'groups' ? <GroupsTab canViewPhotos={can('photos')} /> : null}
      {active?.key === 'configs' ? <ConfigsTab /> : null}
      {active?.key === 'access-logs' ? <AccessLogsTab /> : null}
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="font-serif text-5xl font-semibold text-ink">404</p>
      <p className="text-sm text-muted">찾으시는 페이지가 없어요.</p>
      <Link href="/" className="text-sm text-accent-700 underline">
        처음으로
      </Link>
    </div>
  );
}

function AdminLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const dialog = useDialog();
  const setUser = useSession((s) => s.setUser);
  const [pending, setPending] = useState(false);
  const kakaoHandled = useRef(false);

  const start = async (run: () => Promise<{ id: string; name: string; provider: string }>) => {
    if (pending) return;
    setPending(true);
    try {
      setUser(await run());
      router.replace('/admin');
    } catch (e) {
      if (!(e instanceof GoogleSignInCancelled)) await dialog.alert('로그인 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  };

  // 카카오 콜백(/login/kakao)이 넘겨준 인가 코드 처리 (1회)
  const kakaoCode = params.get('kakaoCode');
  useEffect(() => {
    if (!kakaoCode || kakaoHandled.current) return;
    kakaoHandled.current = true;
    void start(() => signInWithKakaoCode(kakaoCode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kakaoCode]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-7">
      <h1 className="mb-2 font-serif text-xl font-semibold text-ink">온기 관리자</h1>
      <p className="mb-8 text-[13px] text-muted">관리자 계정으로 로그인해 주세요.</p>
      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(signInWithGoogle)}
          className="h-12 rounded-lg border border-divider bg-white text-[15px] font-semibold text-[#1f1f1f] hover:bg-neutral-100 disabled:opacity-60"
        >
          {pending ? '연결 중…' : 'Google로 로그인'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startKakaoLogin('/admin')}
          className="h-12 rounded-lg bg-[#FEE500] text-[15px] font-semibold text-[#191919] hover:opacity-90 disabled:opacity-60"
        >
          카카오로 로그인
        </button>
      </div>
    </div>
  );
}
