'use client';

import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { albumsApi, familyApi, groupsApi, photosApi, profileApi, reportsApi } from '@/lib/api';
import type { UploadPayload } from '@/lib/api/photos';
import { useActiveGroupId, useSession } from '@/lib/store/session';
import type { Comment, Photo } from '@/types';

/** 그룹 스코프 데이터는 키에 groupId 가 들어간다 — 그룹 전환 시 캐시가 자동으로 바뀐다 */
export const queryKeys = {
  myGroups: ['myGroups'] as const,
  feed: (groupId: string) => ['feed', groupId] as const,
  photo: (id: string) => ['photo', id] as const,
  comments: (photoId: string) => ['comments', photoId] as const,
  albums: (groupId: string) => ['albums', groupId] as const,
  albumPhotos: (albumId: string) => ['albumPhotos', albumId] as const,
  unfiledPhotos: (groupId: string) => ['unfiledPhotos', groupId] as const,
  group: (groupId: string) => ['group', groupId] as const,
  members: (groupId: string) => ['members', groupId] as const,
  me: ['me'] as const,
  profileStats: ['profileStats'] as const,
  legal: (slug: string) => ['legal', slug] as const,
};

/** 같은 사진이 여러 목록 캐시에 존재한다 — 좋아요·삭제 시 전부 함께 갱신 */

// ── 그룹 ──────────────────────────────────────────────

export const useMyGroups = () => useQuery({ queryKey: queryKeys.myGroups, queryFn: groupsApi.getMyGroups });

/** 활성 그룹 보정 — 비어 있거나 목록에 없으면 첫 그룹으로 */
export function useActiveGroupSync() {
  const { data: groups } = useMyGroups();
  const activeGroupId = useActiveGroupId();
  const setActiveGroup = useSession((s) => s.setActiveGroup);
  useEffect(() => {
    if (!groups || groups.length === 0) return;
    if (!activeGroupId || !groups.some((g) => g.id === activeGroupId)) setActiveGroup(groups[0].id);
  }, [groups, activeGroupId, setActiveGroup]);
}

/** 가족 공간이 하나도 없는지 (로드 완료 후) */
export function useHasNoGroup(): boolean {
  const groups = useMyGroups();
  return groups.isSuccess && groups.data.length === 0;
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: groupsApi.createGroup, onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myGroups }) });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: groupsApi.joinGroup, onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myGroups }) });
}

// ── 그룹 콘텐츠 ────────────────────────────────────────

/** 사진 목록 페이지 크기 — 스크롤 끝에서 이어서 불러온다 */
const PAGE_SIZE = 30;

/**
 * 사진 목록 공통 — 커서(직전 페이지 마지막 사진 id) 기반 무한 스크롤.
 * 캐시에는 InfiniteData<Photo[]> 로 들어가지만, 소비처가 그대로 쓰도록 data 는 페이지를 평탄화한 Photo[] 로 돌려준다.
 */
function usePhotoList(queryKey: readonly unknown[], fetchPage: (after: string | undefined) => Promise<Photo[]>, enabled: boolean) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined as string | undefined,
    // 한 페이지가 PAGE_SIZE 보다 짧으면 마지막 페이지
    getNextPageParam: (lastPage) => (lastPage.length < PAGE_SIZE ? undefined : lastPage[lastPage.length - 1]?.id),
    enabled,
  });
  const data = useMemo(() => query.data?.pages.flat(), [query.data]);
  return { ...query, data };
}

export function useFeed() {
  const groupId = useActiveGroupId();
  return usePhotoList(queryKeys.feed(groupId), (after) => photosApi.getFeed(groupId, { limit: PAGE_SIZE, after }), !!groupId);
}

const PHOTO_LIST_KEYS = new Set(['feed', 'albumPhotos', 'unfiledPhotos']);

/** 목록 캐시의 실제 모양 — 무한 스크롤 페이지 배열 */
type PhotoListCache = InfiniteData<Photo[], string | undefined>;

/** 모든 사진 목록 캐시(페이지 안의 사진)를 바꿔치기 — pageParams 는 보존, InfiniteData 모양이 아니면 건너뛴다 */
function patchPhotoLists(qc: QueryClient, patch: (photo: Photo) => Photo) {
  qc.setQueriesData<PhotoListCache>(
    { predicate: (q) => PHOTO_LIST_KEYS.has(q.queryKey[0] as string) },
    (old) => (old && Array.isArray(old.pages) ? { ...old, pages: old.pages.map((page) => page.map(patch)) } : old),
  );
}

/** 모든 사진 목록 캐시에서 keep 이 false 인 사진 제거 — pageParams 는 보존, InfiniteData 모양이 아니면 건너뛴다 */
function filterPhotoLists(qc: QueryClient, keep: (photo: Photo) => boolean) {
  qc.setQueriesData<PhotoListCache>(
    { predicate: (q) => PHOTO_LIST_KEYS.has(q.queryKey[0] as string) },
    (old) => (old && Array.isArray(old.pages) ? { ...old, pages: old.pages.map((page) => page.filter(keep)) } : old),
  );
}

/** 목록 캐시(피드·앨범·미분류)에 이미 있는 사진 — 상세 진입/이전·다음 이동 시 서버 응답 전에 바로 보여준다 */
function findPhotoInLists(qc: QueryClient, id: string): Photo | undefined {
  for (const [, data] of qc.getQueriesData<PhotoListCache>({ predicate: (q) => PHOTO_LIST_KEYS.has(q.queryKey[0] as string) })) {
    if (!data || !Array.isArray(data.pages)) continue;
    for (const page of data.pages) {
      const found = Array.isArray(page) ? page.find((p) => p.id === id) : undefined;
      if (found) return found;
    }
  }
  return undefined;
}

export function usePhoto(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.photo(id),
    queryFn: () => photosApi.getPhoto(id),
    enabled: !!id,
    // 이전/다음으로 넘길 때 스피너로 바뀌었다 다시 그려지는 깜빡임 방지
    placeholderData: () => findPhotoInLists(qc, id),
  });
}

export const useAlbumPhotos = (albumId: string) =>
  usePhotoList(queryKeys.albumPhotos(albumId), (after) => photosApi.getPhotosByAlbum(albumId, { limit: PAGE_SIZE, after }), !!albumId);

export const useUnfiledPhotos = (groupId: string) =>
  usePhotoList(queryKeys.unfiledPhotos(groupId), (after) => photosApi.getUnfiledPhotos(groupId, { limit: PAGE_SIZE, after }), !!groupId);

export const useComments = (photoId: string) =>
  useQuery({ queryKey: queryKeys.comments(photoId), queryFn: () => photosApi.getComments(photoId), enabled: !!photoId, placeholderData: keepPreviousData });

export function useAlbums() {
  const groupId = useActiveGroupId();
  return useAlbumsOf(groupId);
}

export const useAlbumsOf = (groupId: string) =>
  useQuery({ queryKey: queryKeys.albums(groupId), queryFn: () => albumsApi.getAlbums(groupId), enabled: !!groupId });

export function useCreateAlbum() {
  const qc = useQueryClient();
  const groupId = useActiveGroupId();
  return useMutation({
    mutationFn: (title: string) => albumsApi.createAlbum(groupId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.albums(groupId) }),
  });
}

export function useRenameAlbum() {
  const qc = useQueryClient();
  const groupId = useActiveGroupId();
  return useMutation({
    mutationFn: (p: { albumId: string; title: string }) => albumsApi.renameAlbum(p.albumId, p.title),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.albums(groupId) }),
  });
}

export function useDeleteAlbum() {
  const qc = useQueryClient();
  const groupId = useActiveGroupId();
  return useMutation({
    mutationFn: albumsApi.deleteAlbum,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.albums(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.unfiledPhotos(groupId) });
    },
  });
}

export function useFamily() {
  const groupId = useActiveGroupId();
  return useQuery({ queryKey: queryKeys.group(groupId), queryFn: () => groupsApi.getGroup(groupId), enabled: !!groupId });
}

export function useMembers() {
  const groupId = useActiveGroupId();
  return useQuery({ queryKey: queryKeys.members(groupId), queryFn: () => familyApi.getMembers(groupId), enabled: !!groupId });
}

// ── 프로필 ────────────────────────────────────────────

export const useMe = () => useQuery({ queryKey: queryKeys.me, queryFn: profileApi.getMe });
export const useProfileStats = () => useQuery({ queryKey: queryKeys.profileStats, queryFn: profileApi.getProfileStats });
export const useLegalDoc = (slug: string) =>
  useQuery({ queryKey: queryKeys.legal(slug), queryFn: () => profileApi.getLegalDoc(slug), staleTime: Infinity });

function useApplyProfileChange() {
  const qc = useQueryClient();
  const groupId = useActiveGroupId();
  const setCurrentUserName = useSession((s) => s.setCurrentUserName);
  return (me: profileApi.Me) => {
    qc.setQueryData(queryKeys.me, me);
    setCurrentUserName(me.name);
    qc.invalidateQueries({ queryKey: queryKeys.members(groupId) });
  };
}

export function useUpdateMyName() {
  const apply = useApplyProfileChange();
  return useMutation({ mutationFn: profileApi.updateMyName, onSuccess: apply });
}

export function useUploadAvatar() {
  const apply = useApplyProfileChange();
  return useMutation({ mutationFn: profileApi.uploadAvatar, onSuccess: apply });
}

export const useDeleteAccount = () => useMutation({ mutationFn: profileApi.deleteAccount });

// ── 변경 ──────────────────────────────────────────────

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: photosApi.toggleLike,
    onSuccess: (photo) => {
      qc.setQueryData(queryKeys.photo(photo.id), photo);
      // 리페치하면 스피너로 화면이 튀므로, 모든 사진 목록 캐시에서 해당 사진만 바꿔치기
      patchPhotoLists(qc, (p) => (p.id === photo.id ? photo : p));
    },
  });
}

/** 다른 가족 공간에 사진 공유(복사) — 대상 공간의 피드·앨범·미분류 캐시를 갱신 */
export function useCopyPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: photosApi.copyPhotos,
    onSuccess: (_r, { targetGroupId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.feed(targetGroupId) });
      qc.invalidateQueries({ queryKey: queryKeys.albums(targetGroupId) });
      qc.invalidateQueries({ queryKey: ['albumPhotos'] });
      qc.invalidateQueries({ queryKey: queryKeys.unfiledPhotos(targetGroupId) });
      qc.invalidateQueries({ queryKey: queryKeys.myGroups });
      qc.invalidateQueries({ queryKey: queryKeys.group(targetGroupId) });
    },
  });
}

/** 사진 일괄 앨범 이동 — 옮긴 사진의 albumId 를 캐시에 반영하고 앨범 목록·앨범별/미분류 목록을 갱신 */
export function useMovePhotos() {
  const qc = useQueryClient();
  const groupId = useActiveGroupId();
  return useMutation({
    mutationFn: photosApi.movePhotos,
    onSuccess: ({ movedIds }, { albumId }) => {
      const moved = new Set(movedIds);
      const patch = (p: Photo): Photo => (moved.has(p.id) ? { ...p, albumId: albumId ?? undefined } : p);
      patchPhotoLists(qc, patch);
      for (const id of moved) qc.setQueryData<Photo>(queryKeys.photo(id), (old) => (old ? patch(old) : old));
      qc.invalidateQueries({ queryKey: queryKeys.albums(groupId) });
      qc.invalidateQueries({ queryKey: ['albumPhotos'] });
      qc.invalidateQueries({ queryKey: ['unfiledPhotos'] });
    },
  });
}

/** 사진 일괄 삭제 — 삭제된 것만 캐시에서 제거하고 앨범/그룹 카운트를 갱신 */
export function useDeletePhotos() {
  const qc = useQueryClient();
  const groupId = useActiveGroupId();
  return useMutation({
    mutationFn: photosApi.deletePhotos,
    onSuccess: ({ deletedIds }) => {
      const deleted = new Set(deletedIds);
      for (const id of deleted) qc.removeQueries({ queryKey: queryKeys.photo(id) });
      filterPhotoLists(qc, (p) => !deleted.has(p.id));
      qc.invalidateQueries({ queryKey: queryKeys.albums(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.members(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.profileStats });
    },
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  const groupId = useActiveGroupId();
  return useMutation({
    mutationFn: photosApi.deletePhoto,
    onSuccess: (_v, photoId) => {
      qc.removeQueries({ queryKey: queryKeys.photo(photoId) });
      filterPhotoLists(qc, (p) => p.id !== photoId);
      qc.invalidateQueries({ queryKey: queryKeys.albums(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.members(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.profileStats });
    },
  });
}

function useInvalidatePhotoLists() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ predicate: (q) => PHOTO_LIST_KEYS.has(q.queryKey[0] as string) });
}

export function useAddComment(photoId: string) {
  const qc = useQueryClient();
  const invalidateLists = useInvalidatePhotoLists();
  return useMutation({
    mutationFn: (text: string) => photosApi.addComment({ photoId, text }),
    onSuccess: (comment) => {
      // 리페치를 기다리지 않고 바로 목록에 붙여 방금 쓴 댓글이 즉시 보이게
      qc.setQueryData<Comment[]>(queryKeys.comments(photoId), (old) => (old && !old.some((c) => c.id === comment.id) ? [...old, comment] : old));
      qc.invalidateQueries({ queryKey: queryKeys.comments(photoId) });
      qc.invalidateQueries({ queryKey: queryKeys.photo(photoId) });
      invalidateLists();
    },
  });
}

export function useDeleteComment(photoId: string) {
  const qc = useQueryClient();
  const invalidateLists = useInvalidatePhotoLists();
  return useMutation({
    mutationFn: (commentId: string) => photosApi.deleteComment({ photoId, commentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments(photoId) });
      qc.invalidateQueries({ queryKey: queryKeys.photo(photoId) });
      invalidateLists();
    },
  });
}

export const useReport = () => useMutation({ mutationFn: reportsApi.report });

/** 차단/해제/내보내기 후 — 그룹 콘텐츠 전체 갱신 */
function useInvalidateGroupContent() {
  const qc = useQueryClient();
  const groupId = useActiveGroupId();
  const invalidateLists = useInvalidatePhotoLists();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.members(groupId) });
    qc.invalidateQueries({ queryKey: queryKeys.group(groupId) });
    qc.invalidateQueries({ queryKey: ['comments'] });
    invalidateLists();
  };
}

export function useBlockMember() {
  const invalidate = useInvalidateGroupContent();
  return useMutation({ mutationFn: familyApi.blockMember, onSuccess: invalidate });
}

export function useUnblockMember() {
  const invalidate = useInvalidateGroupContent();
  return useMutation({ mutationFn: familyApi.unblockMember, onSuccess: invalidate });
}

/** 가족 공간 나가기 — 내 그룹 목록을 갱신하고, 남은 그룹이 있으면 첫 번째로 전환 (없으면 비움) */
export function useLeaveGroup() {
  const qc = useQueryClient();
  const setActiveGroup = useSession((s) => s.setActiveGroup);
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.leaveGroup(groupId),
    onSuccess: async (_v, groupId) => {
      qc.removeQueries({ queryKey: queryKeys.group(groupId) });
      qc.removeQueries({ queryKey: queryKeys.members(groupId) });
      qc.removeQueries({ queryKey: queryKeys.feed(groupId) });
      qc.removeQueries({ queryKey: queryKeys.albums(groupId) });
      const groups = await qc.fetchQuery({ queryKey: queryKeys.myGroups, queryFn: groupsApi.getMyGroups });
      setActiveGroup(groups[0]?.id ?? '');
      qc.invalidateQueries({ queryKey: queryKeys.profileStats });
    },
  });
}

export function useRemoveMember() {
  const invalidate = useInvalidateGroupContent();
  const groupId = useActiveGroupId();
  return useMutation({ mutationFn: (memberId: string) => familyApi.removeMember({ groupId, memberId }), onSuccess: invalidate });
}

export function useUploadPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadPayload) => photosApi.uploadPhotos(payload),
    // 일부 청크만 실패해도 올라간 사진은 있으니 항상 목록을 갱신한다
    onSuccess: (_result, payload) => {
      for (const t of payload.targets) {
        qc.invalidateQueries({ queryKey: queryKeys.feed(t.groupId) });
        qc.invalidateQueries({ queryKey: queryKeys.albums(t.groupId) });
        qc.invalidateQueries({ queryKey: queryKeys.unfiledPhotos(t.groupId) });
      }
      qc.invalidateQueries({ queryKey: queryKeys.myGroups });
      qc.invalidateQueries({ queryKey: queryKeys.profileStats });
    },
  });
}
