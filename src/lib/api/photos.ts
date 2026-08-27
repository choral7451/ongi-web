import type { Comment, Photo } from '@/types';
import { del, post, postForm, put, request } from './client';
import { prepareImage } from '@/lib/utils/image';

async function photoList(path: string): Promise<Photo[]> {
  const result = await request<{ photos: Photo[] }>(path);
  return result.photos;
}

export const getFeed = (groupId: string) => photoList(`/ongi/groups/${groupId}/photos`);
export const getPhotosByAlbum = (albumId: string) => photoList(`/ongi/albums/${albumId}/photos`);
export const getUnfiledPhotos = (groupId: string) => photoList(`/ongi/groups/${groupId}/photos/unfiled`);
export const getPhoto = (id: string) => request<Photo>(`/ongi/photos/${id}`);

export async function getComments(photoId: string): Promise<Comment[]> {
  const result = await request<{ comments: Comment[] }>(`/ongi/photos/${photoId}/comments`);
  return result.comments;
}

export const toggleLike = (photoId: string) => post<Photo>(`/ongi/photos/${photoId}/like`);
export const updatePhoto = (p: { photoId: string; caption: string | null; albumId: string | null }) =>
  put<Photo>(`/ongi/photos/${p.photoId}`, { caption: p.caption, albumId: p.albumId });
export const deletePhoto = (photoId: string) => del(`/ongi/photos/${photoId}`);
export const deleteComment = (p: { photoId: string; commentId: string }) =>
  del(`/ongi/photos/${p.photoId}/comments/${p.commentId}`);
export const addComment = (p: { photoId: string; text: string }) =>
  post<Comment>(`/ongi/photos/${p.photoId}/comments`, { text: p.text });

export interface UploadTarget {
  groupId: string;
  albumId?: string;
}

export interface UploadPayload {
  files: File[];
  caption?: string;
  /** 크롭 비율 (width/height) — 1 정방형, 0.8 세로(4:5) */
  ratio: number;
  targets: UploadTarget[];
}

/** 사진 올리기 — 브라우저에서 크롭·JPEG 변환 → S3 업로드 → 그룹마다 독립 게시물 생성 */
export async function uploadPhotos(payload: UploadPayload): Promise<Photo[]> {
  const prepared = await Promise.all(payload.files.map((file) => prepareImage(file, { ratio: payload.ratio, maxSize: 2048 })));

  const form = new FormData();
  prepared.forEach((blob, index) => form.append('photoFiles', blob, `photo-${index + 1}.jpg`));
  const uploaded = await postForm<{ urls: string[] }>('/ongi/photos/files', form);

  const result = await post<{ photos: Photo[] }>('/ongi/photos', {
    photos: uploaded.urls.map((url) => ({ url, aspectRatio: payload.ratio })),
    caption: payload.caption,
    targets: payload.targets.map((t) => ({ groupId: t.groupId, albumId: t.albumId, personIds: [] })),
  });
  return result.photos;
}
