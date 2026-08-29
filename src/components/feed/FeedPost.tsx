'use client';

import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { usePhotoActions } from '@/components/photos/usePhotoActions';
import { useToggleLike } from '@/lib/queries';
import { formatTime } from '@/lib/utils/format';
import type { Album, Member, Photo } from '@/types';

interface FeedPostProps {
  photo: Photo;
  author?: Member;
  album?: Album;
}

/** 홈 피드의 게시물 하나 — 사진 · 작성자 · 반응 · 캡션 (앱 FeedPost 와 동일한 배치) */
export function FeedPost({ photo, author, album }: FeedPostProps) {
  const toggleLike = useToggleLike();
  const openActions = usePhotoActions();
  const href = { pathname: `/photos/${photo.id}`, query: { ctx: 'feed' } };

  return (
    <article className="flex flex-col gap-2.5">
      <Link href={href} className="relative block w-full overflow-hidden bg-accent-100" style={{ aspectRatio: photo.aspectRatio || 1 }}>
        <Image src={photo.url} alt={photo.caption ?? '가족 사진'} fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover" />
      </Link>

      <div className="flex items-center gap-2.5">
        <Avatar name={author?.name ?? '?'} src={author?.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-ink">{author?.name ?? '구성원'}</p>
          <p className="truncate text-[11px] tabular-nums text-muted">
            {formatTime(photo.createdAt)}
            {album ? ` · 앨범 「${album.title}」` : ''}
          </p>
        </div>
        <button type="button" onClick={() => toggleLike.mutate(photo.id)} className="flex items-center gap-1 text-accent-700" aria-pressed={photo.likedByMe} aria-label="따뜻해요">
          <Heart className="h-4 w-4" strokeWidth={1.75} fill={photo.likedByMe ? 'currentColor' : 'transparent'} />
          <span className="text-xs tabular-nums">{photo.likeCount}</span>
        </button>
        {photo.commentCount > 0 ? (
          <Link href={href} className="flex items-center gap-1 text-neutral-600" aria-label="댓글">
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-xs tabular-nums">{photo.commentCount}</span>
          </Link>
        ) : null}
        <button type="button" onClick={() => openActions(photo)} className="ml-1 p-1 text-neutral-600" aria-label="더보기">
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {photo.caption ? <p className="text-[13.5px] leading-[21.5px] text-ink">{photo.caption}</p> : null}
    </article>
  );
}
