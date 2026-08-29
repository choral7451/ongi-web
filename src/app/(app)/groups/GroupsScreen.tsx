'use client';

import { Check, Plus, Ticket, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Spinner } from '@/components/ui/State';
import { useCreateGroup, useJoinGroup, useMyGroups } from '@/lib/queries';
import { useSession } from '@/lib/store/session';
import { cn } from '@/lib/utils/cn';

/** 가족 공간 전환 · 만들기 · 초대 코드 참여 */
export function GroupsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 초대 링크(/groups?code=ONGI-XXXX)로 들어오면 참여 탭 + 코드 프리필
  const codeParam = searchParams.get('code')?.trim().toUpperCase() ?? '';
  const tab = searchParams.get('tab') ?? (codeParam ? 'join' : null);
  const groups = useMyGroups();
  const activeGroupId = useSession((s) => s.activeGroupId);
  const setActiveGroup = useSession((s) => s.setActiveGroup);
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const [newName, setNewName] = useState('');
  const [inviteCode, setInviteCode] = useState(codeParam);
  const [error, setError] = useState<string | null>(null);

  const switchTo = (groupId: string) => {
    setActiveGroup(groupId);
    router.push('/feed');
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between md:block">
        <button type="button" onClick={() => router.back()} aria-label="닫기" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-neutral-100 md:hidden">
          <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <h1 className="font-serif text-xl font-semibold text-ink md:text-3xl">가족 공간</h1>
        <span className="w-9 md:hidden" />
      </div>

      <SectionHeader title="내 공간" meta={groups.data ? `${groups.data.length}개` : undefined} />
      {groups.isPending ? (
        <Spinner />
      ) : groups.data && groups.data.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {groups.data.map((group) => {
            const active = group.id === activeGroupId;
            return (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => switchTo(group.id)}
                  className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left', active ? 'border-accent bg-accent-100' : 'border-divider hover:bg-neutral-100')}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-divider bg-bg font-serif text-[17px] font-semibold text-accent-800">{group.name.slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{group.name}</span>
                    <span className="block text-[11px] tabular-nums text-muted">
                      구성원 {group.memberCount}명 · 사진 {group.photoCount}장
                    </span>
                  </span>
                  {active ? <Check className="h-[18px] w-[18px] text-accent" strokeWidth={1.75} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted">아직 참여한 가족 공간이 없어요.</p>
      )}

      <div className={cn('mt-7', tab === 'join' && 'order-2')}>
        <SectionHeader title="새 공간 만들기" size="sm" />
        <form
          className="flex gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            createGroup.mutate(newName, { onSuccess: (g) => switchTo(g.id), onError: (err) => setError(err.message) });
          }}
        >
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="예: 김씨네 온기" autoFocus={tab === 'create'} aria-label="공간 이름" />
          <Button type="submit" className="w-28" disabled={newName.trim().length === 0 || createGroup.isPending} icon={<Plus className="h-[15px] w-[15px]" strokeWidth={1.75} />}>
            {createGroup.isPending ? '만드는 중…' : '만들기'}
          </Button>
        </form>
        <p className="mt-2 text-[11px] text-muted">공간을 만들면 초대 코드가 발급돼요. 가족 페이지에서 언제든 확인할 수 있어요.</p>
      </div>

      <div className="mt-7">
        <SectionHeader title="초대 코드로 참여" size="sm" />
        <form
          className="flex gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            joinGroup.mutate(inviteCode, { onSuccess: (g) => switchTo(g.id), onError: (err) => setError(err.message) });
          }}
        >
          <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="예: ONGI-1234" autoFocus={tab === 'join'} aria-label="초대 코드" />
          <Button type="submit" className="w-28" disabled={inviteCode.trim().length === 0 || joinGroup.isPending} icon={<Ticket className="h-[15px] w-[15px]" strokeWidth={1.75} />}>
            {joinGroup.isPending ? '확인 중…' : '참여하기'}
          </Button>
        </form>
        {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
