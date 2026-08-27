import type { Album } from '@/types';
import { del, post, put, request } from './client';

export async function getAlbums(groupId: string): Promise<Album[]> {
  const result = await request<{ albums: Album[] }>(`/ongi/groups/${groupId}/albums`);
  return result.albums;
}

export const createAlbum = (groupId: string, title: string) => post<Album>(`/ongi/groups/${groupId}/albums`, { title });
export const renameAlbum = (albumId: string, title: string) => put<Album>(`/ongi/albums/${albumId}`, { title });
/** 앨범만 삭제 — 사진은 미분류로 이동 */
export const deleteAlbum = (albumId: string) => del(`/ongi/albums/${albumId}`);
