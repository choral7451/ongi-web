'use client';

import { ChevronLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { useAlbumPhotos, useAlbums, useDeletePhotos, useFeed, useMembers, useUnfiledPhotos } from '@/lib/queries';
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
  const title = isAll ? '전체 사진' : isUnfiled ? '미분류' : (albums.data?.find((a) => a.id === id)?.title ?? '앨범');
  const ctx = isAll ? 'all' : isUnfiled ? 'unfiled' : `album:${id}`;

  // 선택 모드 — 작성자 본인 또는 관리자인 사진만 골라서 한 번에 삭제
  const dialog = useDialog();
  const alertError = useAlertError();
  const members = useMembers();
  const me = members.data?.find((m) => m.isMe);
  const canDelete = (photo: Photo) => !!me && (me.role === 'admin' || photo.authorId === me.id);
  const deletePhotos = useDeletePhotos();
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
      <div className="mb-5 flex items-center gap-2">
        <Link href="/albums" aria-label="앨범 목록으로" className="rounded-md p-1.5 hover:bg-neutral-100">
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-ink">{title}</h1>
        {query.data ? <span className="text-xs tabular-nums text-muted">{query.data.length}장</span> : null}
        <span className="flex-1" />
        {selecting ? (
          <Button variant="ghost" onClick={exitSelect}>
            취소
          </Button>
        ) : deletable.length > 0 ? (
          <Button onClick={() => setSelecting(true)}>선택</Button>
        ) : null}
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
        <div className="sticky bottom-[calc(3.875rem+env(safe-area-inset-bottom))] mt-4 flex items-center justify-between gap-2.5 border-t border-divider bg-bg py-3 md:bottom-0">
          <span className="text-sm tabular-nums text-ink">{selectedIds.size}장 선택</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSelectedIds(selectedIds.size === deletable.length ? new Set() : new Set(deletable.map((p) => p.id)))}>
              {selectedIds.size === deletable.length ? '선택 해제' : '모두 선택'}
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={selectedIds.size === 0 || deletePhotos.isPending} icon={<Trash2 className="h-4 w-4" strokeWidth={1.75} />}>
              {deletePhotos.isPending ? '삭제 중…' : `${selectedIds.size}장 삭제`}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
