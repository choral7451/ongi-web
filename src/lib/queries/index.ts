'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { albumsApi, familyApi, groupsApi, photosApi, profileApi, reportsApi } from '@/lib/api';
import type { UploadPayload } from '@/lib/api/photos';
import { useActiveGroupId, useSession } from '@/lib/store/session';
import type { Photo } from '@/types';

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
const PHOTO_LIST_KEYS = new Set(['feed', 'albumPhotos', 'unfiledPhotos']);

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

export function useFeed() {
  const groupId = useActiveGroupId();
  return useQuery({ queryKey: queryKeys.feed(groupId), queryFn: () => photosApi.getFeed(groupId), enabled: !!groupId });
}

export const usePhoto = (id: string) =>
  useQuery({ queryKey: queryKeys.photo(id), queryFn: () => photosApi.getPhoto(id), enabled: !!id });

export const useAlbumPhotos = (albumId: string) =>
  useQuery({ queryKey: queryKeys.albumPhotos(albumId), queryFn: () => photosApi.getPhotosByAlbum(albumId), enabled: !!albumId });

export const useUnfiledPhotos = (groupId: string) =>
  useQuery({ queryKey: queryKeys.unfiledPhotos(groupId), queryFn: () => photosApi.getUnfiledPhotos(groupId), enabled: !!groupId });

export const useComments = (photoId: string) =>
  useQuery({ queryKey: queryKeys.comments(photoId), queryFn: () => photosApi.getComments(photoId), enabled: !!photoId });

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
      qc.setQueriesData<Photo[]>(
        { predicate: (q) => PHOTO_LIST_KEYS.has(q.queryKey[0] as string) },
        (old) => old?.map((p) => (p.id === photo.id ? photo : p)),
      );
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
      qc.setQueriesData<Photo[]>(
        { predicate: (q) => PHOTO_LIST_KEYS.has(q.queryKey[0] as string) },
        (old) => old?.filter((p) => !deleted.has(p.id)),
      );
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
      qc.setQueriesData<Photo[]>(
        { predicate: (q) => PHOTO_LIST_KEYS.has(q.queryKey[0] as string) },
        (old) => old?.filter((p) => p.id !== photoId),
      );
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
    onSuccess: () => {
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
