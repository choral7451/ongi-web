'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAlertError } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Input';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/State';
import { Tag } from '@/components/ui/Tag';
import { adminApi } from '@/lib/api';
import type { AdminInquiry } from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';
import { formatFullDateTime } from '@/lib/utils/format';
import { Pager } from './Pager';

type StatusFilter = 'open' | 'answered' | 'all';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'open', label: '답변 대기' },
  { key: 'answered', label: '답변 완료' },
  { key: 'all', label: '전체' },
];

const MAX_LENGTH = 2000;

export function InquiriesTab() {
  const [status, setStatus] = useState<StatusFilter>('open');
  const [page, setPage] = useState(1);
  const inquiries = useQuery({ queryKey: ['admin', 'inquiries', status, page], queryFn: () => adminApi.getInquiries(status, page) });

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

      {inquiries.isPending ? <Spinner /> : null}
      {inquiries.isError ? <ErrorState message={inquiries.error.message} onRetry={() => inquiries.refetch()} /> : null}
      {inquiries.data?.length === 0 ? <EmptyState>문의가 없어요.</EmptyState> : null}
      <ul className="flex flex-col gap-3">
        {inquiries.data?.map((inquiry) => (
          <InquiryCard key={inquiry.id} inquiry={inquiry} />
        ))}
      </ul>

      <Pager page={page} hasNext={(inquiries.data?.length ?? 0) === 50} onChange={setPage} />
    </div>
  );
}

function InquiryCard({ inquiry }: { inquiry: AdminInquiry }) {
  const queryClient = useQueryClient();
  const alertError = useAlertError();
  const [editing, setEditing] = useState(inquiry.answer === null);
  const [draft, setDraft] = useState(inquiry.answer ?? '');
  const save = useMutation({
    mutationFn: (answer: string) => adminApi.answerInquiry(inquiry.id, answer),
    onSuccess: () => {
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: alertError('답변 저장 실패'),
  });

  const answer = draft.trim();

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-divider p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tag label={inquiry.status === 'open' ? '답변 대기' : '답변 완료'} variant={inquiry.status === 'open' ? 'accent' : 'neutral'} />
        <span className="text-[13px] text-ink">{inquiry.user.name ?? '알 수 없음'}</span>
        <span className="text-[11px] text-muted">
          #{inquiry.user.id}
          {inquiry.user.email ? ` · ${inquiry.user.email}` : ''}
        </span>
        <span className="ml-auto text-[11px] text-muted">{formatFullDateTime(inquiry.createdAt)}</span>
      </div>

      <p className="text-sm leading-6 whitespace-pre-wrap text-ink">{inquiry.content}</p>

      {editing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (answer.length > 0 && !save.isPending) save.mutate(answer);
          }}
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="답변을 입력하면 문의한 사용자가 앱에서 볼 수 있어요. 첫 답변은 푸시 알림도 가요."
            className="min-h-28"
          />
          <div className="flex items-center gap-2">
            <span className="text-[11px] tabular-nums text-muted">
              {draft.length}/{MAX_LENGTH}
            </span>
            {inquiry.answer !== null ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setDraft(inquiry.answer ?? '');
                  setEditing(false);
                }}
              >
                취소
              </Button>
            ) : null}
            <Button type="submit" variant="solid" size="sm" disabled={answer.length === 0 || save.isPending} className={inquiry.answer === null ? 'ml-auto' : undefined}>
              {save.isPending ? '저장 중…' : inquiry.answer === null ? '답변 등록' : '수정 저장'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-1.5 rounded-md bg-accent-100 px-3.5 py-3">
          <div className="flex items-center gap-2">
            <span className="font-serif text-[12px] font-semibold text-accent-800">답변</span>
            <span className="text-[11px] text-muted">
              {inquiry.answeredByName ?? ''}
              {inquiry.answeredAt ? ` · ${formatFullDateTime(inquiry.answeredAt)}` : ''}
            </span>
            <button type="button" onClick={() => setEditing(true)} className="ml-auto text-[12px] text-accent-700 underline">
              수정
            </button>
          </div>
          <p className="text-sm leading-6 whitespace-pre-wrap text-ink">{inquiry.answer}</p>
        </div>
      )}
    </li>
  );
}
