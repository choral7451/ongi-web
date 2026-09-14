'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/State';
import { Tag } from '@/components/ui/Tag';
import { adminApi } from '@/lib/api';
import type { AdminReport } from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';
import { formatFullDateTime } from '@/lib/utils/format';
import { Pager } from './Pager';

type StatusFilter = 'open' | 'resolved' | 'all';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'open', label: '미처리' },
  { key: 'resolved', label: '처리 완료' },
  { key: 'all', label: '전체' },
];

const TARGET_LABEL: Record<AdminReport['targetType'], string> = { photo: '사진', comment: '댓글', member: '구성원' };

export function ReportsTab() {
  const [status, setStatus] = useState<StatusFilter>('open');
  const [page, setPage] = useState(1);
  const reports = useQuery({ queryKey: ['admin', 'reports', status, page], queryFn: () => adminApi.getReports(status, page) });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => {
              setStatus(filter.key);
              setPage(1);
            }}
            className={cn(
              'rounded-full border px-3 py-1 text-[13px]',
              status === filter.key ? 'border-accent bg-accent-100 text-accent-800' : 'border-divider text-muted hover:text-ink',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {reports.isPending ? <Spinner /> : null}
      {reports.isError ? <ErrorState message={reports.error.message} onRetry={() => reports.refetch()} /> : null}
      {reports.data?.length === 0 ? <EmptyState>신고가 없어요.</EmptyState> : null}
      <ul className="flex flex-col gap-3">
        {reports.data?.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </ul>

      <Pager page={page} hasNext={(reports.data?.length ?? 0) === 50} onChange={setPage} />
    </div>
  );
}

function ReportCard({ report }: { report: AdminReport }) {
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const alertError = useAlertError();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });

  const toggleStatus = useMutation({
    mutationFn: () => adminApi.setReportStatus(report.id, report.status === 'open' ? 'resolved' : 'open'),
    onSuccess: refresh,
    onError: alertError('상태 변경 실패'),
  });
  const removeTarget = useMutation({ mutationFn: () => adminApi.removeReportTarget(report.id), onSuccess: refresh, onError: alertError('삭제 실패') });

  const confirmRemove = async () => {
    const ok = await dialog.confirm({
      title: `신고된 ${TARGET_LABEL[report.targetType]}을(를) 삭제할까요?`,
      message: '가족 공간에서 바로 사라지고 되돌릴 수 없어요. 삭제 후 처리 완료로 표시돼요.',
      confirmText: '삭제',
      destructive: true,
    });
    if (ok) removeTarget.mutate();
  };

  const media = report.photo?.thumbUrl ?? (report.photo?.mediaType === 'video' ? null : report.photo?.url);

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-divider p-4 md:flex-row">
      {report.photo ? (
        <a
          href={report.photo.url ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface md:w-28"
        >
          {media ? (
            // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL 은 next/image 최적화 대상이 아니다
            <img src={media} alt="" className={cn('h-full w-full object-cover', report.targetDeleted && 'opacity-40 grayscale')} />
          ) : (
            <span className="text-[12px] text-muted">{report.photo.mediaType === 'video' ? '영상' : '미리보기 없음'}</span>
          )}
        </a>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag label={TARGET_LABEL[report.targetType]} variant="outline" />
          <Tag label={report.status === 'open' ? '미처리' : '처리 완료'} variant={report.status === 'open' ? 'accent' : 'neutral'} />
          {report.targetDeleted ? <Tag label="삭제됨" variant="neutral" /> : null}
          <span className="ml-auto text-[11px] text-muted">{formatFullDateTime(report.createdAt)}</span>
        </div>

        <p className="text-sm text-ink">
          <span className="text-muted">사유 · </span>
          {report.reason}
        </p>
        {report.commentText ? <p className="rounded-md bg-surface px-3 py-2 text-[13px] text-ink">“{report.commentText}”</p> : null}
        {report.photo?.caption && report.targetType === 'photo' ? <p className="text-[13px] text-muted">문구 · {report.photo.caption}</p> : null}

        <p className="text-[12px] text-muted">
          {report.group ? `${report.group.name} · ` : ''}
          {report.targetType === 'member' ? '신고된 구성원' : '작성자'} {report.targetName ?? '알 수 없음'}
          {report.targetUserId ? ` (#${report.targetUserId})` : ''} · 신고자 {report.reporter.name ?? '알 수 없음'} (#{report.reporter.userId})
        </p>

        <div className="mt-1 flex flex-wrap gap-2">
          {report.targetType !== 'member' && !report.targetDeleted ? (
            <Button variant="danger" size="sm" disabled={removeTarget.isPending} onClick={confirmRemove}>
              {TARGET_LABEL[report.targetType]} 삭제
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" disabled={toggleStatus.isPending} onClick={() => toggleStatus.mutate()}>
            {report.status === 'open' ? '처리 완료로 표시' : '미처리로 되돌리기'}
          </Button>
        </div>
      </div>
    </li>
  );
}
