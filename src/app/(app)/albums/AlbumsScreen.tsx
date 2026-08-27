'use client';

import { MoreHorizontal, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { NoGroupState } from '@/components/NoGroupState';
import { Button, IconButton } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Spinner } from '@/components/ui/State';
import { useAlbums, useCreateAlbum, useDeleteAlbum, useFeed, useHasNoGroup, useMembers, useRenameAlbum, useUnfiledPhotos } from '@/lib/queries';
import { useActiveGroupId } from '@/lib/store/session';
import type { Album } from '@/types';

interface AlbumCardProps {
  href: string;
  coverUrl?: string;
  title: string;
  meta: string;
  onMenu?: () => void;
}

function AlbumCard({ href, coverUrl, title, meta, onMenu }: AlbumCardProps) {
  return (
    <li className="relative">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-neutral-200">
          {coverUrl ? <Image src={coverUrl} alt={title} fill sizes="(min-width: 1024px) 240px, 50vw" className="object-cover" /> : null}
        </div>
        <p className="mt-2 font-serif text-base font-semibold text-ink">{title}</p>
        <p className="text-[11px] tabular-nums text-muted">{meta}</p>
      </Link>
      {onMenu ? (
        <IconButton aria-label={`${title} 앨범 옵션`} onClick={onMenu} className="absolute right-0 bottom-0 h-8 w-8">
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
        </IconButton>
      ) : null}
    </li>
  );
}

/** 앨범 — 전체 사진 + 미분류 + 직접 만든 앨범 */
export function AlbumsScreen() {
  const dialog = useDialog();
  const alertError = useAlertError();
  const hasNoGroup = useHasNoGroup();
  const groupId = useActiveGroupId();
  const albums = useAlbums();
  const unfiled = useUnfiledPhotos(groupId);
  const allPhotos = useFeed();
  const members = useMembers();
  // 앨범 추가·이름 변경·삭제는 그룹 관리자만
  const isAdmin = members.data?.find((m) => m.isMe)?.role === 'admin';
  const createAlbum = useCreateAlbum();
  const renameAlbum = useRenameAlbum();
  const deleteAlbum = useDeleteAlbum();

  const promptNew = async () => {
    const title = await dialog.prompt({ title: '새 앨범', message: '앨범 이름을 입력해 주세요', confirmText: '만들기', placeholder: '예: 여름 휴가' });
    if (title?.trim()) createAlbum.mutate(title.trim(), { onError: alertError('앨범 만들기 실패') });
  };

  const openMenu = (album: Album) =>
    dialog.actions(`앨범 「${album.title}」`, [
      {
        label: '이름 변경',
        onPress: async () => {
          const title = await dialog.prompt({ title: '앨범 이름 변경', confirmText: '변경', defaultValue: album.title });
          if (title?.trim() && title.trim() !== album.title) renameAlbum.mutate({ albumId: album.id, title: title.trim() }, { onError: alertError('이름 변경 실패') });
        },
      },
      {
        label: '삭제',
        destructive: true,
        onPress: async () => {
          if (await dialog.confirm({ title: '앨범 삭제', message: `"${album.title}" 앨범을 삭제할까요?\n사진은 삭제되지 않고 미분류로 이동해요.`, confirmText: '삭제', destructive: true }))
            deleteAlbum.mutate(album.id, { onError: alertError('앨범 삭제 실패') });
        },
      },
    ]);

  if (hasNoGroup) return <NoGroupState />;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="font-serif text-3xl font-semibold text-ink">앨범</h1>
        {isAdmin ? (
          <Button onClick={promptNew} disabled={createAlbum.isPending} icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}>
            {createAlbum.isPending ? '만드는 중…' : '새 앨범'}
          </Button>
        ) : null}
      </div>

      <SectionHeader title="가족 앨범" meta={albums.data ? `${albums.data.length}개` : undefined} />
      {albums.isPending ? (
        <Spinner />
      ) : (
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {allPhotos.data && allPhotos.data.length > 0 ? (
            <AlbumCard href="/albums/all" coverUrl={allPhotos.data[0].url} title="전체 사진" meta={`${allPhotos.data.length}장 · 이 공간의 모든 사진`} />
          ) : null}
          {unfiled.data && unfiled.data.length > 0 ? (
            <AlbumCard href="/albums/unfiled" coverUrl={unfiled.data[0].url} title="미분류" meta={`${unfiled.data.length}장 · 앨범에 담기 전 사진`} />
          ) : null}
          {albums.data?.map((album) => (
            <AlbumCard key={album.id} href={`/albums/${album.id}`} coverUrl={album.coverUrl} title={album.title} meta={`${album.photoCount}장 · ${album.meta}`} onMenu={isAdmin ? () => openMenu(album) : undefined} />
          ))}
        </ul>
      )}
    </div>
  );
}
