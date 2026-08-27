import type { Member } from '@/types';
import { del, post, request } from './client';

export async function getMembers(groupId: string): Promise<Member[]> {
  const result = await request<{ members: Member[] }>(`/ongi/groups/${groupId}/members`);
  return result.members;
}

/** 차단 — 차단한 사람의 사진·댓글이 내 화면에서 사라진다 (상대에게 알리지 않음) */
export const blockMember = (memberId: string) => post<null>(`/ongi/members/${memberId}/block`);
export const unblockMember = (memberId: string) => del(`/ongi/members/${memberId}/block`);
/** 내보내기 — 관리자만 */
export const removeMember = (p: { groupId: string; memberId: string }) =>
  del(`/ongi/groups/${p.groupId}/members/${p.memberId}`);
