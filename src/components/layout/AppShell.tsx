'use client';

import { ChevronDown, Home, Image as ImageIcon, Plus, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveGroupSync, useMyGroups } from '@/lib/queries';
import { useSession } from '@/lib/store/session';
import { cn } from '@/lib/utils/cn';

const NAV = [
  { href: '/feed', label: '홈', Icon: Home },
  { href: '/albums', label: '앨범', Icon: ImageIcon },
  { href: '/upload', label: '올리기', Icon: Plus, primary: true },
  { href: '/family', label: '가족', Icon: Users },
  { href: '/profile', label: '나', Icon: User },
] as const;

/** 데스크톱은 좌측 사이드바, 모바일은 하단 탭 — 앱의 탭 구조와 동일 */
export function AppShell({ children }: { children: React.ReactNode }) {
  useActiveGroupSync();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  // 로고 클릭 → 홈으로 이동하며 피드 새로고침
  const refreshFeed = () => queryClient.invalidateQueries({ queryKey: ['feed'] });
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // ONGI 로고 + 가족 공간 선택 헤더 — 4개 탭 모두 상단 고정. 상세·모달 화면은 각자 헤더를 갖는다
  const showMobileHeader = ['/feed', '/albums', '/family', '/profile'].includes(pathname);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-divider px-4 py-6 md:flex">
        <GroupSwitcher />
        <nav className="mt-6 flex flex-col gap-1" aria-label="주요 메뉴">
          {NAV.map(({ href, label, Icon, ...rest }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100',
                isActive(href) ? 'text-accent' : 'text-neutral-700',
                'primary' in rest && 'mt-2 border border-accent text-accent',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto text-[11px] leading-relaxed text-muted">
          <Link href="/legal/terms" className="hover:underline">
            이용약관
          </Link>
          {' · '}
          <Link href="/legal/privacy" className="hover:underline">
            개인정보 처리방침
          </Link>
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {showMobileHeader ? (
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-bg px-5 pt-[calc(0.625rem+env(safe-area-inset-top))] pb-3.5 md:hidden">
            <Link
              href="/feed"
              onClick={refreshFeed}
              className="inline-block origin-left scale-x-[1.15] text-[30px] leading-[34px] font-bold tracking-[3px] text-ink [font-family:var(--font-logo),sans-serif]"
              aria-label="홈으로"
            >
              ONGI
            </Link>
            <GroupSwitcher compact />
          </header>
        ) : null}
        <main className="flex-1 px-5 pb-24 md:px-8 md:pt-8 md:pb-10">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex min-h-[74px] items-center border-t border-divider bg-bg px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="하단 메뉴"
      >
        {NAV.map(({ href, label, Icon, ...rest }) => {
          const primary = 'primary' in rest;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn('flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] tracking-[0.4px]', !primary && isActive(href) ? 'text-accent' : 'text-neutral-600')}
            >
              {primary ? (
                <span className="-mt-[22px] flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-bg text-accent">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
              ) : (
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
              )}
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** 가족 공간 이름(→ 전환 화면)과 ONGI 로고(→ 홈)는 서로 다른 링크 */
function GroupSwitcher({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();
  const refreshFeed = () => queryClient.invalidateQueries({ queryKey: ['feed'] });
  const groups = useMyGroups();
  const activeGroupId = useSession((s) => s.activeGroupId);
  const active = groups.data?.find((g) => g.id === activeGroupId);

  if (compact) {
    return (
      <Link
        href="/groups"
        className="flex max-w-[50%] items-center gap-1 rounded-full border border-divider px-3 py-[7px] text-[13px] tracking-[0.3px] text-accent"
        aria-label="가족 공간 전환"
      >
        <span className="truncate">{active?.name ?? '우리 가족의 오늘'}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      </Link>
    );
  }

  return (
    <div className="flex flex-col">
      <Link href="/groups" className="flex items-center gap-1 text-[11px] tracking-wide text-accent hover:underline" aria-label="가족 공간 전환">
        {active?.name ?? '우리 가족의 오늘'}
        <ChevronDown className="h-3 w-3" strokeWidth={1.75} />
      </Link>
      <Link href="/feed" onClick={refreshFeed} className="inline-block origin-left scale-x-[1.15] text-3xl leading-none font-bold tracking-[0.12em] text-ink [font-family:var(--font-logo),sans-serif]" aria-label="홈으로">
        ONGI
      </Link>
    </div>
  );
}
