'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/State';
import { Tag } from '@/components/ui/Tag';
import { adminApi } from '@/lib/api';
import type { AdminUser, AdminUserSort } from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';
import { formatFullDateTime, formatTime } from '@/lib/utils/format';
import { AdminPhotoGrid } from './AdminPhotoGrid';
import { Pager } from './Pager';

const TYPE_LABEL: Record<AdminUser['type'], string> = { USER: '일반', ADMIN: '관리자', SUPER_ADMIN: '최고 관리자' };
const SNS_LABEL: Record<string, string> = { google: 'Google', apple: 'Apple', kakao: '카카오', naver: '네이버' };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const shortDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

/** 오늘 14:32 · 어제 14:32 · 3일 전 · 2026.09.20 — 가까울수록 자세히 */
export function formatLastSeen(iso: string, now: Date = new Date()): string {
  const seen = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(seen)) / 86_400_000);
  if (days <= 0) return `오늘 ${formatTime(iso)}`;
  if (days === 1) return `어제 ${formatTime(iso)}`;
  if (days < 7) return `${days}일 전`;
  return shortDate(seen);
}

/** 사용자 — 상세로 들어가지 않고 표 하나로 본다. 사진만 행을 펼쳐서 본다 (열람 기록이 남는 일이라 누를 때만 불러온다) */
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
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const alertError = useAlertError();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<AdminUserSort>('joined');
  const [photosOf, setPhotosOf] = useState<string | null>(null);
  const users = useQuery({
    queryKey: ['admin', 'users', query, page, sort],
    queryFn: () => adminApi.getUsers(query, page, sort),
    // 쪽·정렬을 바꾸는 동안 표가 사라졌다 나타나지 않게 이전 목록을 흐리게 남긴다
    placeholderData: keepPreviousData,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });
  const grant = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'USER' | 'ADMIN' }) => adminApi.setUserType(id, type),
    onSuccess: refresh,
    onError: alertError('등급 변경 실패'),
  });
  const markTest = useMutation({
    mutationFn: ({ id, isTest }: { id: string; isTest: boolean }) => adminApi.setUserTest(id, isTest),
    onSuccess: refresh,
    onError: alertError('테스트 계정 변경 실패'),
  });
  const busy = grant.isPending || markTest.isPending;

  const confirmGrant = async (user: AdminUser) => {
    const type = user.type === 'ADMIN' ? 'USER' : 'ADMIN';
    const ok = await dialog.confirm({
      title: type === 'ADMIN' ? `${user.name} 님을 관리자로 지정할까요?` : `${user.name} 님의 관리자 권한을 해제할까요?`,
      message: type === 'ADMIN' ? '관리자는 운영 현황·신고·사용자/가족 공간 조회를 할 수 있어요. 이메일 원문 등 민감 정보는 볼 수 없어요.' : undefined,
      confirmText: type === 'ADMIN' ? '지정' : '해제',
      destructive: type === 'USER',
    });
    if (ok) grant.mutate({ id: user.id, type });
  };

  const confirmTest = async (user: AdminUser) => {
    const isTest = !user.isTest;
    const ok = await dialog.confirm({
      title: isTest ? `${user.name} 님을 테스트 계정으로 표시할까요?` : `${user.name} 님의 테스트 계정 표시를 풀까요?`,
      message: isTest
        ? '운영 현황과 지표의 수치에서 빠져요. 이 계정이 올린 사진·댓글·대화와, 테스트 계정만 있는 공간도 함께 빠져요. 계정 사용에는 영향이 없어요.'
        : '이 계정과 그동안의 기록이 수치에 다시 들어가요.',
      confirmText: isTest ? '표시' : '풀기',
    });
    if (ok) markTest.mutate({ id: user.id, isTest });
  };

  const changeSort = (next: AdminUserSort) => {
    setSort(next);
    setPage(1);
  };
  const hasActions = canGrant || canViewPhotos;
  const columnCount = 5 + (canSeeSensitive ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <form
        className="flex max-w-md gap-2"
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

      {users.data?.length ? (
        <div className={cn('-mx-4 overflow-x-auto px-4 transition-opacity md:mx-0 md:px-0', users.isPlaceholderData && 'opacity-50')}>
          <table className="w-full min-w-[920px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-y border-divider text-[11px] text-muted">
                <th className="min-w-[200px] py-2 pr-3 font-normal">사용자</th>
                {canSeeSensitive ? <th className="px-3 font-normal">로그인</th> : null}
                <SortHeader label="가입" active={sort === 'joined'} onClick={() => changeSort('joined')} />
                <SortHeader label="마지막 접속" active={sort === 'seen'} onClick={() => changeSort('seen')} />
                <th className="min-w-[170px] px-3 font-normal">공간</th>
                <th className="px-3 text-right font-normal">사진</th>
                {hasActions ? <th className="py-2 pl-3 text-right font-normal">관리</th> : null}
              </tr>
            </thead>
            <tbody>
              {users.data.map((user) => {
                const isMe = user.id === myUserId;
                const canChangeType = canGrant && !isMe && !user.deletedAt && user.type !== 'SUPER_ADMIN';
                const showingPhotos = photosOf === user.id;
                return (
                  <Fragment key={user.id}>
                    <tr className={cn('border-b border-divider align-top', showingPhotos && 'bg-accent-100/50')}>
                      <td className="py-2.5 pr-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn('font-medium', user.deletedAt ? 'text-muted line-through' : 'text-ink')}>{user.name}</span>
                          {isMe ? <span className="text-[11px] text-muted">(나)</span> : null}
                          {user.type !== 'USER' ? <Tag label={TYPE_LABEL[user.type]} variant="accent" /> : null}
                          {user.isTest ? <Tag label="테스트" variant="outline" /> : null}
                          {user.deletedAt ? <Tag label="탈퇴" variant="neutral" /> : null}
                        </div>
                        <p className="mt-0.5 text-[11px] break-all text-muted">
                          <span className="tabular-nums">#{user.id}</span> · {user.email ?? '이메일 없음'}
                        </p>
                      </td>
                      {canSeeSensitive ? <td className="px-3 py-2.5 whitespace-nowrap text-ink">{user.snsType ? (SNS_LABEL[user.snsType] ?? user.snsType) : '—'}</td> : null}
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums text-ink" title={formatFullDateTime(user.createdAt)}>
                        {shortDate(new Date(user.createdAt))}
                        {user.deletedAt ? (
                          <span className="block text-[11px] text-muted" title={formatFullDateTime(user.deletedAt)}>
                            탈퇴 {shortDate(new Date(user.deletedAt))}
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={cn('px-3 py-2.5 whitespace-nowrap tabular-nums', user.lastSeenAt ? 'text-ink' : 'text-muted')}
                        title={user.lastSeenAt ? formatFullDateTime(user.lastSeenAt) : '2026년 9월 29일부터 접속을 기록해요. 그 뒤로 접속하지 않았어요.'}
                      >
                        {user.lastSeenAt ? formatLastSeen(user.lastSeenAt) : '기록 없음'}
                      </td>
                      <td className="px-3 py-2.5 text-ink">
                        {user.groups ? (
                          user.groups.length === 0 ? (
                            <span className="text-muted">없음</span>
                          ) : (
                            <ul className="flex flex-col gap-0.5">
                              {user.groups.map((group) => (
                                <li key={group.groupId}>
                                  {group.groupName}
                                  <span className="text-[11px] text-muted">
                                    {' '}
                                    · {group.memberName}
                                    {group.role === 'admin' ? ' (공간 관리자)' : ''}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )
                        ) : (
                          <span className="tabular-nums">{user.groupCount}곳</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink">{user.photoCount.toLocaleString()}</td>
                      {hasActions ? (
                        <td className="py-2 pl-3">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {canViewPhotos ? (
                              <Button variant={showingPhotos ? 'primary' : 'secondary'} size="sm" onClick={() => setPhotosOf(showingPhotos ? null : user.id)}>
                                {showingPhotos ? '사진 닫기' : '사진'}
                              </Button>
                            ) : null}
                            {canGrant ? (
                              <Button variant="secondary" size="sm" disabled={busy} onClick={() => confirmTest(user)}>
                                {user.isTest ? '테스트 풀기' : '테스트 표시'}
                              </Button>
                            ) : null}
                            {canChangeType ? (
                              <Button variant={user.type === 'ADMIN' ? 'danger' : 'secondary'} size="sm" disabled={busy} onClick={() => confirmGrant(user)}>
                                {user.type === 'ADMIN' ? '관리자 해제' : '관리자 지정'}
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                    {showingPhotos ? (
                      <tr className="border-b border-divider bg-accent-100/50">
                        <td colSpan={columnCount} className="px-3 pt-1 pb-4">
                          <div className="max-w-xl">
                            <AdminPhotoGrid target="user" id={user.id} />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <Pager page={page} hasNext={(users.data?.length ?? 0) === 50} onChange={setPage} />
    </div>
  );
}

/** 누르면 그 기준으로 정렬하는 열 제목 — 지금 기준인 열에는 ↓ */
function SortHeader({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th className="px-3 font-normal" aria-sort={active ? 'descending' : 'none'}>
      <button type="button" onClick={onClick} className={cn('inline-flex items-center gap-1 py-2 hover:text-ink', active && 'font-semibold text-ink')}>
        {label}
        <span aria-hidden className={active ? 'text-accent' : 'text-transparent'}>
          ↓
        </span>
      </button>
    </th>
  );
}
