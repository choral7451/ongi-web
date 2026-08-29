'use client';

import { ChevronLeft, FolderInput, Send, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import * as albumsApi from '@/lib/api/albums';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { queryKeys, useAlbumPhotos, useAlbums, useCopyPhotos, useDeletePhotos, useFeed, useMembers, useMovePhotos, useMyGroups, useUnfiledPhotos } from '@/lib/queries';
import { useActiveGroupId } from '@/lib/store/session';
import type { Photo } from '@/types';

/** 앨범 상세 — id 가 all/unfiled 면 가상 앨범 */
export function AlbumDetailScreen({ id }: { id: string }) {
  const groupId = useActiveGroupId();
  const isAll = id === 'all';
  const isUnfiled = id === 'unfiled';
  const feed = useFeed();
  const unfiled = useUnfiledPhotos(isUnfiled ? groupId : '');
  const albumPhotos = useAlbumPhotos(isAll || isUnfiled ? '' : id);
  const albums = useAlbums();

  const query = isAll ? feed : isUnfiled ? unfiled : albumPhotos;
  const album = isAll || isUnfiled ? undefined : albums.data?.find((a) => a.id === id);
  const title = isAll ? '전체 사진' : isUnfiled ? '미분류' : (album?.title ?? '앨범');
  const ctx = isAll ? 'all' : isUnfiled ? 'unfiled' : `album:${id}`;
  const coverUrl = isAll || isUnfiled ? query.data?.[0]?.url : album?.coverUrl;

  // 선택 모드 — 작성자 본인 또는 관리자인 사진만 골라서 한 번에 삭제
  const dialog = useDialog();
  const alertError = useAlertError();
  const members = useMembers();
  const me = members.data?.find((m) => m.isMe);
  const canDelete = (photo: Photo) => !!me && (me.role === 'admin' || photo.authorId === me.id);
  const deletePhotos = useDeletePhotos();
  const movePhotos = useMovePhotos();
  const copyPhotos = useCopyPhotos();
  const myGroups = useMyGroups();
  const qc = useQueryClient();
  const otherGroups = (myGroups.data ?? []).filter((g) => g.id !== groupId);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const deletable = (query.data ?? []).filter(canDelete);

  const exitSelect = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };
  const toggleSelect = (photo: Photo) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photo.id)) next.delete(photo.id);
      else next.add(photo.id);
      return next;
    });
  const pickAlbumAndMove = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    const move = (albumId: string | null) =>
      movePhotos.mutate(
        { photoIds: [...selectedIds], albumId },
        {
          onSuccess: ({ skippedIds }) => {
            exitSelect();
            if (skippedIds.length > 0) dialog.alert('일부 사진은 옮기지 못했어요', `${skippedIds.length}장은 권한이 없어요.`);
          },
          onError: alertError('앨범 이동 실패'),
        },
      );
    const targets = (albums.data ?? []).filter((a) => a.id !== id);
    await dialog.actions(`${count}장을 옮길 앨범`, [
      ...(isUnfiled ? [] : [{ label: '앨범 없음 (미분류)', onPress: () => move(null) }]),
      ...targets.map((a) => ({ label: a.title, onPress: () => move(a.id) })),
    ]);
  };

  /** 다른 가족 공간에 공유 — 대상 공간 → 그 공간의 앨범 순으로 고른 뒤 복사 */
  const pickGroupAndCopy = async () => {
    const count = selectedIds.size;
    if (count === 0 || otherGroups.length === 0) return;
    const copy = (targetGroupId: string, albumId: string | null) =>
      copyPhotos.mutate(
        { photoIds: [...selectedIds], targetGroupId, albumId },
        {
          onSuccess: ({ copiedIds, skippedIds }) => {
            exitSelect();
            dialog.alert('공유 완료', `${copiedIds.length}장을 공유했어요.${skippedIds.length > 0 ? ` ${skippedIds.length}장은 권한이 없어 건너뛰었어요.` : ''}`);
          },
          onError: alertError('공유 실패'),
        },
      );
    const pickAlbum = async (targetGroupId: string, groupName: string) => {
      const albums = await qc.fetchQuery({ queryKey: queryKeys.albums(targetGroupId), queryFn: () => albumsApi.getAlbums(targetGroupId) }).catch(() => []);
      await dialog.actions(`「${groupName}」의 앨범`, [
        { label: '앨범 없음 (미분류)', onPress: () => copy(targetGroupId, null) },
        ...albums.map((a) => ({ label: a.title, onPress: () => copy(targetGroupId, a.id) })),
      ]);
    };
    await dialog.actions(`${count}장을 공유할 가족 공간`, otherGroups.map((g) => ({ label: g.name, onPress: () => void pickAlbum(g.id, g.name) })));
  };

  const confirmDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    const ok = await dialog.confirm({ title: '사진 삭제', message: `선택한 ${count}장과 달린 댓글이 모두 삭제되며 되돌릴 수 없어요.`, confirmText: `${count}장 삭제`, destructive: true });
    if (!ok) return;
    deletePhotos.mutate([...selectedIds], {
      onSuccess: ({ skippedIds }) => {
        exitSelect();
        if (skippedIds.length > 0) dialog.alert('일부 사진은 삭제하지 못했어요', `${skippedIds.length}장은 권한이 없거나 이미 삭제됐어요.`);
      },
      onError: alertError('삭제 실패'),
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <Link href="/albums" aria-label="앨범 목록으로" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-neutral-100">
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </Link>
        <p className="font-serif text-base font-semibold text-ink">{selecting ? `${selectedIds.size}장 선택` : '앨범'}</p>
        {selecting ? (
          <Button onClick={exitSelect}>취소</Button>
        ) : !isAll && (query.data?.length ?? 0) > 0 ? (
          <Button onClick={() => setSelecting(true)}>선택</Button>
        ) : (
          <span className="w-9" />
        )}
      </div>
      <div className="mb-3.5">
        {coverUrl ? (
          <div className="relative h-[180px] overflow-hidden bg-accent-100 md:hidden">
            <Image src={coverUrl} alt="" fill sizes="100vw" className="object-cover" />
          </div>
        ) : null}
        <div className="mt-3.5 flex items-baseline justify-between gap-3">
          <h1 className="font-serif text-2xl leading-8 font-semibold text-ink">{title}</h1>
          <span className="text-[11px] tabular-nums text-muted">
            {query.data ? `${query.data.length}장` : ''}
            {album ? ` · ${album.meta}` : ''}
          </span>
        </div>
        <div className="mt-2.5 h-px bg-accent-300" />
      </div>
      <PhotoGrid
        photos={query.data}
        isLoading={query.isPending}
        isError={query.isError}
        onRetry={() => query.refetch()}
        ctx={ctx}
        emptyMessage="이 앨범에는 아직 사진이 없어요."
        selectable={selecting}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        canSelect={canDelete}
      />
      {selecting ? (
        <div className="sticky bottom-[calc(74px+env(safe-area-inset-bottom))] mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-divider bg-bg py-3 md:bottom-0">
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => setSelectedIds(selectedIds.size === deletable.length ? new Set() : new Set(deletable.map((p) => p.id)))}>
              {selectedIds.size === deletable.length ? '선택 해제' : '모두 선택'}
            </Button>
            {otherGroups.length > 0 ? (
              <Button onClick={pickGroupAndCopy} disabled={selectedIds.size === 0 || copyPhotos.isPending} icon={<Send className="h-[15px] w-[15px]" strokeWidth={1.75} />}>
                {copyPhotos.isPending ? '공유 중…' : '다른 공간에 공유'}
              </Button>
            ) : null}
            <Button onClick={pickAlbumAndMove} disabled={selectedIds.size === 0 || movePhotos.isPending} icon={<FolderInput className="h-[15px] w-[15px]" strokeWidth={1.75} />}>
              {movePhotos.isPending ? '이동 중…' : '앨범 이동'}
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={selectedIds.size === 0 || deletePhotos.isPending} icon={<Trash2 className="h-[15px] w-[15px]" strokeWidth={1.75} />}>
              {deletePhotos.isPending ? '삭제 중…' : `${selectedIds.size}장 삭제`}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
