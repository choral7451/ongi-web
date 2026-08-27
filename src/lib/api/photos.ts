import type { Comment, Photo } from '@/types';
import { del, post, postForm, request } from './client';
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
export const deletePhoto = (photoId: string) => del(`/ongi/photos/${photoId}`);
/** 사진 일괄 앨범 이동 — albumId null 이면 미분류. 권한 없거나 다른 그룹 사진은 skippedIds */
export const movePhotos = (p: { photoIds: string[]; albumId: string | null }) =>
  post<{ movedIds: string[]; skippedIds: string[] }>('/ongi/photos/move', p);
/** 사진 일괄 삭제 — 사진마다 작성자·관리자 권한을 서버가 확인하고, 권한 없는 것은 skippedIds 로 돌려준다 */
export const deletePhotos = (photoIds: string[]) => post<{ deletedIds: string[]; skippedIds: string[] }>('/ongi/photos/delete', { photoIds });
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
  targets: UploadTarget[];
  /** 진행률 콜백 — 완료(성공+실패)된 장수 / 전체 */
  onProgress?: (done: number, total: number) => void;
}

export interface UploadResult {
  photos: Photo[];
  /** 실패한 파일 — 그대로 다시 넘기면 실패분만 재시도 */
  failedFiles: File[];
  errorMessage?: string;
}

/** 서버는 요청당 파일 10장까지 받는다 (FilesInterceptor 한도) */
export const UPLOAD_CHUNK_SIZE = 10;
const UPLOAD_CONCURRENCY = 2;
/** 한 번에 선택 가능한 최대 장수 */
export const UPLOAD_MAX_SELECT = 500;

/** 청크 하나 — 변환 → S3 업로드 → 게시. 실패하면 throw */
async function uploadChunk(files: File[], payload: UploadPayload, withCaption: boolean): Promise<Photo[]> {
  const prepared = await Promise.all(files.map((file) => prepareImage(file, { maxSize: 2048 })));

  const form = new FormData();
  prepared.forEach((item, index) => form.append('photoFiles', item.blob, `photo-${index + 1}.jpg`));
  const uploaded = await postForm<{ urls: string[] }>('/ongi/photos/files', form);

  const result = await post<{ photos: Photo[] }>('/ongi/photos', {
    photos: uploaded.urls.map((url, index) => ({ url, aspectRatio: prepared[index].aspectRatio })),
    caption: withCaption ? payload.caption : undefined,
    targets: payload.targets.map((t) => ({ groupId: t.groupId, albumId: t.albumId, personIds: [] })),
  });
  return result.photos;
}

/**
 * 사진 올리기 — 10장씩 청크로 나눠 동시 2개까지 업로드.
 * 100장 이상도 브라우저 메모리 폭주 없이 올라가고, 청크 하나가 실패해도 나머지는 계속 진행한 뒤 실패분을 돌려준다.
 */
export async function uploadPhotos(payload: UploadPayload): Promise<UploadResult> {
  // 청크 크기는 장수에 맞춰 조절 — 적게 올릴 때도 진행률이 1장 단위로 움직이게 (2장 → 1장씩, 100장 → 10장씩)
  const chunkSize = Math.max(1, Math.min(UPLOAD_CHUNK_SIZE, Math.ceil(payload.files.length / 4)));
  const chunks: File[][] = [];
  for (let i = 0; i < payload.files.length; i += chunkSize) chunks.push(payload.files.slice(i, i + chunkSize));

  const total = payload.files.length;
  let done = 0;
  const photos: Photo[] = [];
  const failedFiles: File[] = [];
  let errorMessage: string | undefined;
  payload.onProgress?.(0, total);

  let cursor = 0;
  const worker = async () => {
    while (cursor < chunks.length) {
      const index = cursor++;
      const files = chunks[index];
      try {
        // 문구는 첫 사진에만 붙는다 — 첫 청크에서만 전달
        photos.push(...(await uploadChunk(files, payload, index === 0)));
      } catch (e) {
        failedFiles.push(...files);
        errorMessage = e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.';
      } finally {
        done += files.length;
        payload.onProgress?.(done, total);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, chunks.length) }, worker));

  return { photos, failedFiles, errorMessage };
}
