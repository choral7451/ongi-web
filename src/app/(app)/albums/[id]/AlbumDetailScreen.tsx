'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { useAlbumPhotos, useAlbums, useFeed, useUnfiledPhotos } from '@/lib/queries';
import { useActiveGroupId } from '@/lib/store/session';

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

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center gap-2">
        <Link href="/albums" aria-label="앨범 목록으로" className="rounded-md p-1.5 hover:bg-neutral-100">
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-ink">{title}</h1>
        {query.data ? <span className="text-xs tabular-nums text-muted">{query.data.length}장</span> : null}
      </div>
      <PhotoGrid photos={query.data} isLoading={query.isPending} isError={query.isError} onRetry={() => query.refetch()} ctx={ctx} emptyMessage="이 앨범에는 아직 사진이 없어요." />
    </div>
  );
}
