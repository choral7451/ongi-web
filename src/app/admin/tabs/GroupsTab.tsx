'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/State';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils/cn';
import { formatFullDateTime } from '@/lib/utils/format';
import { AdminPhotoGrid } from './AdminPhotoGrid';
import { Pager } from './Pager';

export function GroupsTab({ canViewPhotos }: { canViewPhotos: boolean }) {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const groups = useQuery({ queryKey: ['admin', 'groups', query, page], queryFn: () => adminApi.getGroups(query, page) });

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(draft.trim());
            setPage(1);
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="공간 이름 · id" />
          <Button type="submit" variant="secondary">
            검색
          </Button>
        </form>

        {groups.isPending ? <Spinner /> : null}
        {groups.isError ? <ErrorState message={groups.error.message} onRetry={() => groups.refetch()} /> : null}
        {groups.data?.length === 0 ? <EmptyState>가족 공간이 없어요.</EmptyState> : null}
        <ul className="flex flex-col divide-y divide-divider border-y border-divider">
          {groups.data?.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => setSelectedId(group.id)}
                className={cn('flex w-full items-center gap-3 px-2 py-2.5 text-left hover:bg-neutral-100', selectedId === group.id && 'bg-accent-100')}
              >
                <span className="w-10 shrink-0 text-[11px] tabular-nums text-muted">#{group.id}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{group.name}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-muted">
                  구성원 {group.memberCount} · 사진 {group.photoCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Pager page={page} hasNext={(groups.data?.length ?? 0) === 50} onChange={setPage} />
      </div>

      <div className="min-w-0">{selectedId ? <GroupDetail key={selectedId} groupId={selectedId} canViewPhotos={canViewPhotos} /> : <EmptyState>공간을 선택하면 상세가 보여요.</EmptyState>}</div>
    </div>
  );
}

function GroupDetail({ groupId, canViewPhotos }: { groupId: string; canViewPhotos: boolean }) {
  const detail = useQuery({ queryKey: ['admin', 'group', groupId], queryFn: () => adminApi.getGroup(groupId) });

  if (detail.isPending) return <Spinner />;
  if (detail.isError) return <ErrorState message={detail.error.message} onRetry={() => detail.refetch()} />;

  const { group, members } = detail.data;

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-divider p-4">
      <h2 className="font-serif text-lg font-semibold text-ink">{group.name}</h2>

      <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
        <dt className="text-muted">id</dt>
        <dd className="tabular-nums text-ink">#{group.id}</dd>
        <dt className="text-muted">만든 날</dt>
        <dd className="text-ink">{formatFullDateTime(group.createdAt)}</dd>
        <dt className="text-muted">사진 · 영상</dt>
        <dd className="tabular-nums text-ink">{group.photoCount}</dd>
        <dt className="text-muted">마지막 업로드</dt>
        <dd className="text-ink">{group.lastPhotoAt ? formatFullDateTime(group.lastPhotoAt) : '없음'}</dd>
      </dl>

      <section>
        <SectionHeader title="구성원" size="sm" meta={`${members.length}명`} />
        <ul className="flex flex-col gap-1.5">
          {members.map((member) => (
            <li key={member.memberId} className="flex items-center gap-2 text-[13px]">
              <span className="text-ink">{member.name}</span>
              {member.role === 'admin' ? <span className="text-[11px] text-accent-700">공간 관리자</span> : null}
              <span className="ml-auto text-[11px] tabular-nums text-muted">
                사진 {member.photoCount} · 사용자 #{member.userId}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {canViewPhotos ? <AdminPhotoGrid target="group" id={group.id} /> : null}
    </div>
  );
}
