import type { LegalDoc, ProfileStats } from '@/types';
import { del, postForm, put, request } from './client';
import { prepareImage } from '@/lib/utils/image';

export interface Me {
  id: string;
  name: string;
  provider: string;
  avatarUrl: string | null;
}

export const getMe = () => request<Me>('/ongi/users/me');
export const getProfileStats = () => request<ProfileStats>('/ongi/users/me/stats');
/** 공개 엔드포인트 — 로그인 전에도 조회 가능 */
export const getLegalDoc = (slug: string) => request<LegalDoc>(`/ongi/legal/${slug}`);
export const updateMyName = (name: string) => put<Me>('/ongi/users/me', { name });
/** 회원탈퇴 — 익명화 + 사진·댓글·구성원 삭제 + 토큰 무효화 + S3 원본 삭제 */
export const deleteAccount = () => del('/ongi/users/me');

export async function uploadAvatar(file: File): Promise<Me> {
  const blob = await prepareImage(file, { ratio: 1, maxSize: 400 });
  const form = new FormData();
  form.append('avatarFile', blob, 'avatar.jpg');
  return postForm<Me>('/ongi/users/me/avatar', form);
}
