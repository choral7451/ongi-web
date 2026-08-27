'use client';

import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import { usePhotoActions } from '@/components/photos/usePhotoActions';
import { useToggleLike } from '@/lib/queries';
import { formatTime } from '@/lib/utils/format';
import type { Album, Member, Photo } from '@/types';

interface FeedPostProps {
  photo: Photo;
  author?: Member;
  album?: Album;
}

/** 피드 카드 — 사진 · 작성자 · 캡션 · 따뜻해요/댓글 */
export function FeedPost({ photo, author, album }: FeedPostProps) {
  const toggleLike = useToggleLike();
  const openActions = usePhotoActions();
  const href = { pathname: `/photos/${photo.id}`, query: { ctx: 'feed' } };

  return (
    <article className="border-b border-divider pb-6">
      <Link href={href} className="relative block w-full overflow-hidden rounded-md bg-neutral-200" style={{ aspectRatio: photo.aspectRatio || 1 }}>
        <Image src={photo.url} alt={photo.caption ?? '가족 사진'} fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover" />
      </Link>

      <div className="mt-3 flex items-center gap-2.5">
        <Avatar name={author?.name ?? '?'} src={author?.avatarUrl} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-ink">{author?.name ?? '구성원'}</p>
          <p className="text-[11px] tabular-nums text-muted">
            {formatTime(photo.createdAt)}
            {album ? ` · ${album.title}` : ''}
          </p>
        </div>
        <IconButton aria-label="더보기" onClick={() => openActions(photo)}>
          <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </IconButton>
      </div>

      {photo.caption ? <p className="mt-2 font-serif text-[17px] leading-8 text-ink">&ldquo;{photo.caption}&rdquo;</p> : null}

      <div className="mt-2 flex items-center gap-4 text-[13px] text-accent-700">
        <button type="button" onClick={() => toggleLike.mutate(photo.id)} className="flex items-center gap-1.5" aria-pressed={photo.likedByMe} aria-label="따뜻해요">
          <Heart className="h-[18px] w-[18px]" strokeWidth={1.75} fill={photo.likedByMe ? 'currentColor' : 'transparent'} />
          <span className="tabular-nums">{photo.likeCount}</span>
        </button>
        <Link href={href} className="flex items-center gap-1.5" aria-label="댓글">
          <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="tabular-nums">{photo.commentCount}</span>
        </Link>
      </div>
    </article>
  );
}
