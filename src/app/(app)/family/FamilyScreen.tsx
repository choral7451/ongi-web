'use client';

import { ChevronRight, Copy, Hash, LogOut, Pencil, Plus, Share2 } from 'lucide-react';
import { NoGroupState } from '@/components/NoGroupState';
import { REPORT_DONE_MESSAGE } from '@/components/photos/usePhotoActions';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/State';
import { Tag } from '@/components/ui/Tag';
import { useRouter } from 'next/navigation';
import { useBlockMember, useCreateGroup, useFamily, useHasNoGroup, useJoinGroup, useLeaveGroup, useMembers, useRemoveMember, useRenameGroup, useReport, useUnblockMember } from '@/lib/queries';
import { useActiveGroupId, useSession } from '@/lib/store/session';
import { buildInviteMessage } from '@/lib/utils/invite';
import type { Member } from '@/types';

function roleTag(member: Member) {
  if (member.role === 'admin') return <Tag label="관리자" />;
  if (member.role === 'pending') return <Tag label="대기" variant="accent" />;
  return <Tag label="멤버" variant="neutral" />;
}

/** 가족 — 구성원 · 초대 */
export function FamilyScreen() {
  const dialog = useDialog();
  const alertError = useAlertError();
  const hasNoGroup = useHasNoGroup();
  const family = useFamily();
  const members = useMembers();
  const block = useBlockMember();
  const unblock = useUnblockMember();
  const remove = useRemoveMember();
  const router = useRouter();
  const activeGroupId = useActiveGroupId();

  const report = useReport();

  const inviteCode = family.data?.inviteCode ?? '';
  const me = members.data?.find((m) => m.isMe);
  const leave = useLeaveGroup();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const setActiveGroup = useSession((s) => s.setActiveGroup);

  const renameGroup = useRenameGroup();
  const isAdmin = members.data?.find((m) => m.isMe)?.role === 'admin';
  const promptRename = async () => {
    const name = await dialog.prompt({ title: '공간 이름 바꾸기', message: '가족 모두에게 새 이름으로 보여요.', confirmText: '변경', defaultValue: family.data?.name ?? '' });
    if (name?.trim()) renameGroup.mutate({ groupId: activeGroupId, name: name.trim() }, { onError: alertError('이름 변경 실패') });
  };

  const promptCreate = async () => {
    const name = await dialog.prompt({ title: '새 공간 만들기', message: '가족 공간 이름을 입력해 주세요.', confirmText: '만들기', placeholder: '예: 온기가족' });
    if (name?.trim()) createGroup.mutate(name.trim(), { onSuccess: (g) => setActiveGroup(g.id), onError: alertError('공간 만들기 실패') });
  };

  const promptJoin = async () => {
    const code = await dialog.prompt({ title: '초대 코드로 참여', message: '받은 6자리 초대 코드를 입력해 주세요.', confirmText: '참여하기', placeholder: '예: 483920' });
    if (code?.trim()) joinGroup.mutate(code.trim(), { onSuccess: (g) => setActiveGroup(g.id), onError: alertError('참여 실패') });
  };
  const isSoleAdmin = me?.role === 'admin' && !members.data?.some((m) => m.id !== me.id && m.role === 'admin');
  const othersCount = (members.data?.length ?? 1) - 1;
  const confirmLeave = async () => {
    const ok = await dialog.confirm({
      title: '가족 공간 나가기',
      message:
        othersCount === 0
          ? '마지막 구성원이라 나가면 이 가족 공간도 사라져요. 올린 사진은 함께 삭제됩니다.'
          : isSoleAdmin
            ? '나가면 가장 먼저 참여한 구성원이 관리자가 돼요. 올린 사진과 댓글은 공간에 남습니다.'
            : '올린 사진과 댓글은 공간에 남고, 다시 참여하려면 새 초대 코드가 필요해요.',
      confirmText: '나가기',
      destructive: true,
    });
    if (ok) leave.mutate(activeGroupId, { onSuccess: () => router.push('/feed'), onError: alertError('나가기 실패') });
  };

  const openMemberActions = (member: Member) =>
    dialog.actions(member.name, [
      member.blockedByMe
        ? { label: '차단 해제', onPress: () => unblock.mutate(member.id, { onError: alertError('차단 해제 실패') }) }
        : {
            label: '차단',
            destructive: true,
            onPress: async () => {
              if (await dialog.confirm({ title: '구성원 차단', message: `${member.name}의 사진과 댓글이 더 이상 보이지 않아요. 언제든 해제할 수 있어요.`, confirmText: '차단', destructive: true }))
                block.mutate(member.id, { onError: alertError('차단 실패') });
            },
          },
      {
        label: '신고',
        onPress: async () => {
          const reason = await dialog.prompt({ title: '구성원 신고', message: '신고 내용은 운영진이 24시간 안에 확인해요.', confirmText: '신고', destructive: true, placeholder: '신고 사유' });
          if (reason === null) return;
          report.mutate(
            { targetType: 'member', targetId: member.id, reason: reason.trim() || '사유 미입력' },
            { onSuccess: () => dialog.alert('신고 완료', REPORT_DONE_MESSAGE), onError: alertError('신고 실패') },
          );
        },
      },
      ...(me?.role === 'admin' && member.role !== 'admin'
        ? [
            {
              label: '가족 공간에서 내보내기',
              destructive: true,
              onPress: async () => {
                if (await dialog.confirm({ title: '구성원 내보내기', message: `${member.name}을(를) 이 가족 공간에서 내보낼까요? 다시 참여하려면 새 초대 코드가 필요해요.`, confirmText: '내보내기', destructive: true }))
                  remove.mutate(member.id, { onError: alertError('내보내기 실패') });
              },
            },
          ]
        : []),
    ]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      await dialog.alert('복사 완료', `초대 코드 ${inviteCode} 를 복사했어요.`);
    } catch {
      await dialog.alert('초대 코드', inviteCode);
    }
  };

  const shareCode = async () => {
    const text = buildInviteMessage({ groupName: family.data?.name, inviteCode, expiresInDays: family.data?.inviteExpiresInDays });
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // 취소 — 아래 복사로 폴백
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      await dialog.alert('복사 완료', '초대 문구를 복사했어요. 가족에게 붙여넣어 보내주세요.');
    } catch {
      await dialog.alert('초대 코드', inviteCode);
    }
  };

  if (hasNoGroup) return <NoGroupState />;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="sticky top-[calc(3.625rem+env(safe-area-inset-top))] z-20 -mx-5 bg-bg px-5 pt-1 pb-2.5 md:static md:z-auto md:mx-0 md:bg-transparent md:p-0 mb-1 md:mb-5">
        {family.data ? (
          <p className="text-xs tabular-nums text-muted">
            구성원 {family.data.memberCount}명 · 사진 {family.data.photoCount}장 · {family.data.sinceLabel}
          </p>
        ) : null}
      </header>

      <div className="grid gap-5 md:grid-cols-[1fr_320px] md:gap-8">
        <ul>
          {members.isPending ? (
            <Spinner />
          ) : (
            members.data?.map((member) => (
              <li
                key={member.id}
                onClick={() => !member.isMe && openMemberActions(member)}
                className={`flex items-center gap-3 border-b border-divider py-3 last:border-b-0 ${member.isMe ? '' : 'cursor-pointer hover:bg-neutral-100/60'}`}
              >
                <Avatar name={member.name} src={member.avatarUrl} size={40} pending={member.role === 'pending'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    {member.name}
                    {member.realName && member.realName !== member.name ? ` (${member.realName})` : ''}
                    {member.isMe ? <span className="ml-1.5 text-[11px] text-muted">(나)</span> : null}
                  </p>
                  <p className="text-[11px] tabular-nums text-muted">
                    {member.blockedByMe ? '차단됨' : member.role === 'pending' ? '초대 수락 대기 중' : `사진 ${member.photoCount}장`}
                  </p>
                </div>
                {roleTag(member)}
              </li>
            ))
          )}
        </ul>

        {inviteCode ? (
          <aside className="flex h-fit flex-col items-center gap-[9px] rounded-md border border-divider p-[18px] text-center shadow-sm">
            <p className="text-[10px] uppercase tracking-[1px] text-accent">가족 초대하기</p>
            <p className="font-serif text-[34px] leading-tight tracking-[2.7px] tabular-nums text-ink">{inviteCode}</p>
            <p className="text-[13px] leading-5 text-ink/80">
              초대 코드는 {family.data?.inviteExpiresInDays ?? 7}일간 유효해요.
              <br />
              가족이 앱이나 웹에서 코드를 입력하면 바로 함께할 수 있어요.
            </p>
            <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
              <Button variant="secondary" onClick={copyCode} icon={<Copy className="h-[15px] w-[15px]" strokeWidth={1.75} />}>
                코드 복사
              </Button>
              <Button onClick={shareCode} icon={<Share2 className="h-[15px] w-[15px]" strokeWidth={1.75} />}>
                초대 코드 공유
              </Button>
            </div>
          </aside>
        ) : null}
      </div>

      {/* 헤더 드롭다운은 전환 전용 — 공간 관리는 설정 리스트 카드로 */}
      <div className="mt-8 flex max-w-md flex-col gap-2.5 md:mt-10">
        <p className="text-[11px] tracking-[1px] text-accent">공간 관리</p>
        <div className="overflow-hidden rounded-md border border-divider">
          {isAdmin ? (
            <>
              <button type="button" onClick={promptRename} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left hover:bg-neutral-100">
                <Pencil className="h-4 w-4 text-muted" strokeWidth={1.75} />
                <span className="flex-1 text-sm text-ink">공간 이름 바꾸기</span>
                <ChevronRight className="h-[15px] w-[15px] text-neutral-400" strokeWidth={1.75} />
              </button>
              <div className="border-t border-divider" />
            </>
          ) : null}
          <button type="button" onClick={promptCreate} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left hover:bg-neutral-100">
            <Plus className="h-4 w-4 text-muted" strokeWidth={1.75} />
            <span className="flex-1 text-sm text-ink">새 공간 만들기</span>
            <ChevronRight className="h-[15px] w-[15px] text-neutral-400" strokeWidth={1.75} />
          </button>
          <div className="border-t border-divider" />
          <button type="button" onClick={promptJoin} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left hover:bg-neutral-100">
            <Hash className="h-4 w-4 text-muted" strokeWidth={1.75} />
            <span className="flex-1 text-sm text-ink">초대 코드로 참여</span>
            <ChevronRight className="h-[15px] w-[15px] text-neutral-400" strokeWidth={1.75} />
          </button>
          <div className="border-t border-divider" />
          <button type="button" onClick={confirmLeave} disabled={leave.isPending} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left hover:bg-neutral-100 disabled:opacity-50">
            <LogOut className="h-4 w-4 text-danger" strokeWidth={1.75} />
            <span className="flex-1 text-sm text-danger">{leave.isPending ? '나가는 중…' : '가족 공간 나가기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
