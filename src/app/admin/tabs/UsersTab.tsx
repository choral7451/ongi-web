'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/State';
import { Tag } from '@/components/ui/Tag';
import { adminApi } from '@/lib/api';
import type { AdminUser } from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';
import { formatFullDateTime } from '@/lib/utils/format';
import { AdminPhotoGrid } from './AdminPhotoGrid';
import { Pager } from './Pager';

const TYPE_LABEL: Record<AdminUser['type'], string> = { USER: '일반', ADMIN: '관리자', SUPER_ADMIN: '최고 관리자' };
const SNS_LABEL: Record<string, string> = { google: 'Google', apple: 'Apple', kakao: '카카오', naver: '네이버' };

export function UsersTab({
  myUserId,
  canGrant,
  canSeeSensitive,
  canViewPhotos,
}: {
  myUserId: string;
  canGrant: boolean;
  canSeeSensitive: boolean;
  canViewPhotos: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const users = useQuery({ queryKey: ['admin', 'users', query, page], queryFn: () => adminApi.getUsers(query, page) });

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
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={canSeeSensitive ? '이름 · 이메일 · id' : '이름 · id'} />
          <Button type="submit" variant="secondary">
            검색
          </Button>
        </form>

        {users.isPending ? <Spinner /> : null}
        {users.isError ? <ErrorState message={users.error.message} onRetry={() => users.refetch()} /> : null}
        {users.data?.length === 0 ? <EmptyState>사용자가 없어요.</EmptyState> : null}
        <ul className="flex flex-col divide-y divide-divider border-y border-divider">
          {users.data?.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => setSelectedId(user.id)}
                className={cn('flex w-full items-center gap-3 px-2 py-2.5 text-left hover:bg-neutral-100', selectedId === user.id && 'bg-accent-100')}
              >
                <span className="w-10 shrink-0 text-[11px] tabular-nums text-muted">#{user.id}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm', user.deletedAt ? 'text-muted line-through' : 'text-ink')}>{user.name}</span>
                  <span className="block truncate text-[11px] text-muted">{user.email ?? '이메일 없음'}</span>
                </span>
                {user.type !== 'USER' ? <Tag label={TYPE_LABEL[user.type]} variant="accent" /> : null}
                <span className="shrink-0 text-[11px] tabular-nums text-muted">
                  공간 {user.groupCount} · 사진 {user.photoCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Pager page={page} hasNext={(users.data?.length ?? 0) === 50} onChange={setPage} />
      </div>

      <div className="min-w-0">
        {selectedId ? (
          <UserDetail key={selectedId} userId={selectedId} isMe={selectedId === myUserId} canGrant={canGrant} canViewPhotos={canViewPhotos} />
        ) : (
          <EmptyState>사용자를 선택하면 상세가 보여요.</EmptyState>
        )}
      </div>
    </div>
  );
}

function UserDetail({ userId, isMe, canGrant, canViewPhotos }: { userId: string; isMe: boolean; canGrant: boolean; canViewPhotos: boolean }) {
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const alertError = useAlertError();
  const detail = useQuery({ queryKey: ['admin', 'user', userId], queryFn: () => adminApi.getUser(userId) });
  const grant = useMutation({
    mutationFn: (type: 'USER' | 'ADMIN') => adminApi.setUserType(userId, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    onError: alertError('등급 변경 실패'),
  });

  if (detail.isPending) return <Spinner />;
  if (detail.isError) return <ErrorState message={detail.error.message} onRetry={() => detail.refetch()} />;

  const { user, groups } = detail.data;
  const nextType = user.type === 'ADMIN' ? 'USER' : 'ADMIN';
  const showGrant = canGrant && !isMe && !user.deletedAt && user.type !== 'SUPER_ADMIN';

  const confirmGrant = async () => {
    const ok = await dialog.confirm({
      title: nextType === 'ADMIN' ? `${user.name} 님을 관리자로 지정할까요?` : `${user.name} 님의 관리자 권한을 해제할까요?`,
      message: nextType === 'ADMIN' ? '관리자는 운영 현황·신고·사용자/가족 공간 조회를 할 수 있어요. 이메일 원문 등 민감 정보는 볼 수 없어요.' : undefined,
      confirmText: nextType === 'ADMIN' ? '지정' : '해제',
      destructive: nextType === 'USER',
    });
    if (ok) grant.mutate(nextType);
  };

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-divider p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-serif text-lg font-semibold text-ink">{user.name}</h2>
        <Tag label={TYPE_LABEL[user.type]} variant={user.type === 'USER' ? 'neutral' : 'accent'} />
        {user.deletedAt ? <Tag label="탈퇴" variant="neutral" /> : null}
      </div>

      <dl className="grid grid-cols-[80px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
        <dt className="text-muted">id</dt>
        <dd className="tabular-nums text-ink">#{user.id}</dd>
        <dt className="text-muted">이메일</dt>
        <dd className="break-all text-ink">{user.email ?? '없음'}</dd>
        {user.snsType ? (
          <>
            <dt className="text-muted">로그인</dt>
            <dd className="text-ink">{SNS_LABEL[user.snsType] ?? user.snsType}</dd>
          </>
        ) : null}
        <dt className="text-muted">가입</dt>
        <dd className="text-ink">{formatFullDateTime(user.createdAt)}</dd>
        {user.deletedAt ? (
          <>
            <dt className="text-muted">탈퇴</dt>
            <dd className="text-ink">{formatFullDateTime(user.deletedAt)}</dd>
          </>
        ) : null}
        <dt className="text-muted">사진</dt>
        <dd className="tabular-nums text-ink">{user.photoCount}</dd>
      </dl>

      <section>
        <SectionHeader title="소속 가족 공간" size="sm" meta={`${groups.length}곳`} />
        {groups.length === 0 ? <p className="text-[13px] text-muted">소속된 공간이 없어요.</p> : null}
        <ul className="flex flex-col gap-1.5">
          {groups.map((group) => (
            <li key={group.groupId} className="flex items-center gap-2 text-[13px]">
              <span className="text-ink">{group.groupName}</span>
              <span className="text-muted">
                · {group.memberName}
                {group.role === 'admin' ? ' (공간 관리자)' : ''}
              </span>
              <span className="ml-auto text-[11px] text-muted">#{group.groupId}</span>
            </li>
          ))}
        </ul>
      </section>

      {canViewPhotos ? <AdminPhotoGrid target="user" id={user.id} /> : null}

      {showGrant ? (
        <Button variant={nextType === 'ADMIN' ? 'primary' : 'danger'} disabled={grant.isPending} onClick={confirmGrant} className="self-start">
          {nextType === 'ADMIN' ? '관리자로 지정' : '관리자 해제'}
        </Button>
      ) : null}
    </div>
  );
}
