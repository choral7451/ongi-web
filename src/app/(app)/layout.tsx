import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';

/** 로그인이 필요한 모든 화면 — 탭 구조의 셸 안에 그린다 */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
