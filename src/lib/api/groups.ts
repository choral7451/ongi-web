import type { Group } from '@/types';
import { post, request } from './client';

export async function getMyGroups(): Promise<Group[]> {
  const result = await request<{ groups: Group[] }>('/ongi/groups');
  return result.groups;
}

export function getGroup(groupId: string): Promise<Group> {
  return request<Group>(`/ongi/groups/${groupId}`);
}

/** 새 가족 공간 — 만든 사람이 관리자 */
export function createGroup(name: string): Promise<Group> {
  const trimmed = name.trim();
  if (!trimmed) return Promise.reject(new Error('공간 이름을 입력해 주세요.'));
  return post<Group>('/ongi/groups', { name: trimmed });
}

/** 공간 이름 변경 — 관리자 전용 */
export function renameGroup(params: { groupId: string; name: string }): Promise<Group> {
  const trimmed = params.name.trim();
  if (!trimmed) return Promise.reject(new Error('공간 이름을 입력해 주세요.'));
  return request<Group>(`/ongi/groups/${params.groupId}`, { method: 'PUT', body: JSON.stringify({ name: trimmed }) });
}

/** 가족 공간 나가기 — 유일한 관리자면 서버가 다음 구성원에게 위임, 마지막 구성원이면 공간 정리 */
export const leaveGroup = (groupId: string) => post<null>(`/ongi/groups/${groupId}/leave`);

export function joinGroup(inviteCode: string): Promise<Group> {
  return post<Group>('/ongi/groups/join', { inviteCode: inviteCode.trim().toUpperCase() });
}
