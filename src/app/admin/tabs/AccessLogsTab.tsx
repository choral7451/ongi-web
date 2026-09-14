'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/State';
import { adminApi } from '@/lib/api';
import { formatFullDateTime } from '@/lib/utils/format';
import { Pager } from './Pager';

const TARGET_LABEL = { group: '가족 공간', user: '사용자' };

/** 운영 책임자의 가족 사진 열람 기록 — 개인정보 처리방침 5·7조 */
export function AccessLogsTab() {
  const [page, setPage] = useState(1);
  const logs = useQuery({ queryKey: ['admin', 'access-logs', page], queryFn: () => adminApi.getAccessLogs(page) });

  if (logs.isPending) return <Spinner />;
  if (logs.isError) return <ErrorState message={logs.error.message} onRetry={() => logs.refetch()} />;

  return (
    <div className="flex flex-col gap-3">
      {logs.data.length === 0 ? <EmptyState>열람 기록이 없어요.</EmptyState> : null}
      <ul className="flex flex-col divide-y divide-divider border-y border-divider">
        {logs.data.map((log) => (
          <li key={log.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-2 py-2.5 text-[13px]">
            <span className="text-ink">
              {log.adminName ?? '알 수 없음'} <span className="text-[11px] text-muted">#{log.adminUserId}</span>
            </span>
            <span className="text-muted">→</span>
            <span className="text-ink">
              {TARGET_LABEL[log.targetType] ?? log.targetType} {log.targetName ?? ''} <span className="text-[11px] text-muted">#{log.targetId}</span> 사진 열람
            </span>
            <span className="ml-auto text-[11px] tabular-nums text-muted">{formatFullDateTime(log.createdAt)}</span>
          </li>
        ))}
      </ul>
      <Pager page={page} hasNext={logs.data.length === 50} onChange={setPage} />
    </div>
  );
}
