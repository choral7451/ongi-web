'use client';

import { useQuery } from '@tanstack/react-query';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, Spinner } from '@/components/ui/State';
import { adminApi } from '@/lib/api';

export function DashboardTab() {
  const dashboard = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.getDashboard });

  if (dashboard.isPending) return <Spinner />;
  if (dashboard.isError) return <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />;

  const { totals, signups } = dashboard.data;
  const stats = [
    { label: '가입자', value: totals.users, sub: `최근 7일 +${totals.newUsers7d}` },
    { label: '가족 공간', value: totals.groups },
    { label: '사진', value: totals.photos },
    { label: '영상', value: totals.videos },
    { label: '댓글', value: totals.comments },
    { label: '미처리 신고', value: totals.openReports, alert: totals.openReports > 0 },
    { label: '미답변 문의', value: totals.openInquiries ?? 0, alert: (totals.openInquiries ?? 0) > 0 },
  ];
  const max = Math.max(1, ...signups.map((s) => s.count));

  return (
    <div className="flex flex-col gap-10">
      <section>
        <SectionHeader title="누적" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-divider px-4 py-3.5">
              <p className="text-[12px] text-muted">{stat.label}</p>
              <p className={`mt-1 font-serif text-2xl font-semibold tabular-nums ${stat.alert ? 'text-danger' : 'text-ink'}`}>
                {stat.value.toLocaleString()}
              </p>
              {stat.sub ? <p className="mt-0.5 text-[11px] text-muted">{stat.sub}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="최근 14일 가입" meta={`${signups.reduce((sum, s) => sum + s.count, 0)}명`} />
        <div className="flex h-40 items-end gap-1.5 border-b border-divider pb-px" role="img" aria-label="최근 14일 일별 가입 수">
          {signups.map((s) => (
            <div key={s.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${s.day} · ${s.count}명`}>
              <span className="text-[10px] tabular-nums text-muted">{s.count || ''}</span>
              <div className="w-full rounded-t-sm bg-accent-400" style={{ height: `${(s.count / max) * 100}%`, minHeight: s.count ? 3 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {signups.map((s, index) => (
            <span key={s.day} className="flex-1 text-center text-[10px] tabular-nums text-muted">
              {index % 2 === 1 || index === signups.length - 1 ? s.day.slice(5).replace('-', '/') : ''}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
