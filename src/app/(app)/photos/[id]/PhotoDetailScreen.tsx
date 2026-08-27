'use client';

import { ChevronLeft, ChevronRight, Heart, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { usePhotoActions, REPORT_DONE_MESSAGE } from '@/components/photos/usePhotoActions';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { ErrorState, Spinner } from '@/components/ui/State';
import { useAddComment, useAlbumPhotos, useAlbums, useComments, useDeleteComment, useFeed, useMembers, usePhoto, useReport, useToggleLike, useUnfiledPhotos } from '@/lib/queries';
import { useActiveGroupId } from '@/lib/store/session';
import { formatFullDateTime, formatTime } from '@/lib/utils/format';
import type { Comment } from '@/types';

/** 사진 상세 — 반응 · 댓글. ctx(feed | all | unfiled | album:<id>)가 있으면 이전/다음 사진으로 이동 */
export function PhotoDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const ctx = useSearchParams().get('ctx') ?? '';
  const dialog = useDialog();
  const alertError = useAlertError();
  const groupId = useActiveGroupId();

  const ctxAlbumId = ctx.startsWith('album:') ? ctx.slice('album:'.length) : '';
  const feed = useFeed();
  const albumPhotos = useAlbumPhotos(ctxAlbumId);
  const unfiled = useUnfiledPhotos(ctx === 'unfiled' ? groupId : '');
  const list = ctx === 'feed' || ctx === 'all' ? feed.data : ctxAlbumId ? albumPhotos.data : ctx === 'unfiled' ? unfiled.data : undefined;
  const index = list?.findIndex((p) => p.id === id) ?? -1;
  const prev = list && index > 0 ? list[index - 1] : undefined;
  const next = list && index >= 0 && index < list.length - 1 ? list[index + 1] : undefined;

  const photo = usePhoto(id);
  const comments = useComments(id);
  const members = useMembers();
  const albums = useAlbums();
  const toggleLike = useToggleLike();
  const addComment = useAddComment(id);
  const deleteComment = useDeleteComment(id);
  const report = useReport();
  const [draft, setDraft] = useState('');

  const me = members.data?.find((m) => m.isMe);
  const author = members.data?.find((m) => m.id === photo.data?.authorId);
  const album = albums.data?.find((a) => a.id === photo.data?.albumId);

  const backHref = ctxAlbumId ? `/albums/${ctxAlbumId}` : ctx === 'all' ? '/albums/all' : ctx === 'unfiled' ? '/albums/unfiled' : '/feed';
  const openPhotoActions = usePhotoActions(() => router.replace(backHref));

  const likeSummary = photo.data
    ? photo.data.likeCount === 0
      ? '가장 먼저 따뜻함을 전해보세요'
      : photo.data.likedByMe
        ? photo.data.likeCount === 1
          ? '내가 따뜻해했어요'
          : `나와 가족 ${photo.data.likeCount - 1}명이 따뜻해했어요`
        : `가족 ${photo.data.likeCount}명이 따뜻해했어요`
    : '';

  const openCommentActions = (comment: Comment) => {
    if (!members.data) return dialog.alert('잠시만요', '구성원 정보를 불러오는 중이에요.');
    const isMine = me?.id === comment.authorId;
    const canDelete = isMine || me?.id === photo.data?.authorId || me?.role === 'admin';
    return dialog.actions('댓글', [
      ...(canDelete ? [{ label: '댓글 삭제', destructive: true, onPress: () => deleteComment.mutate(comment.id, { onError: alertError('삭제 실패') }) }] : []),
      ...(!isMine
        ? [
            {
              label: '댓글 신고',
              onPress: async () => {
                const reason = await dialog.prompt({ title: '댓글 신고', message: '신고 내용은 운영진이 24시간 안에 확인해요.', confirmText: '신고', destructive: true, placeholder: '신고 사유' });
                if (reason === null) return;
                report.mutate(
                  { targetType: 'comment', targetId: comment.id, reason: reason.trim() || '사유 미입력' },
                  { onSuccess: () => dialog.alert('신고 완료', REPORT_DONE_MESSAGE), onError: alertError('신고 실패') },
                );
              },
            },
          ]
        : []),
    ]);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    addComment.mutate(text, { onSuccess: () => setDraft(''), onError: alertError('댓글 등록 실패') });
  };

  const navTo = (photoId: string) => router.replace(`/photos/${photoId}?ctx=${encodeURIComponent(ctx)}`);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href={backHref} aria-label="뒤로" className="rounded-md p-1.5 hover:bg-neutral-100">
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div className="text-center">
          <p className="font-serif text-base font-semibold text-ink">{album?.title ?? '사진'}</p>
          {list && list.length > 1 && index >= 0 ? (
            <p className="text-[10px] tabular-nums text-muted">
              {index + 1} / {list.length}
            </p>
          ) : null}
        </div>
        <IconButton aria-label="더보기" onClick={() => photo.data && openPhotoActions(photo.data)}>
          <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </IconButton>
      </div>

      {photo.isPending ? (
        <Spinner />
      ) : photo.isError || !photo.data ? (
        <ErrorState message="사진을 불러오지 못했어요." onRetry={() => photo.refetch()} />
      ) : (
        <>
          <div className="relative overflow-hidden rounded-md bg-neutral-200" style={{ aspectRatio: photo.data.aspectRatio || 1 }}>
            <Image src={photo.data.url} alt={photo.data.caption ?? '사진'} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-contain" />
            {prev ? (
              <button type="button" onClick={() => navTo(prev.id)} aria-label="이전 사진" className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow hover:bg-white">
                <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
              </button>
            ) : null}
            {next ? (
              <button type="button" onClick={() => navTo(next.id)} aria-label="다음 사진" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow hover:bg-white">
                <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5 border-b border-divider py-3.5">
            <Avatar name={author?.name ?? '?'} src={author?.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-ink">{author?.name ?? '구성원'}</p>
              <p className="text-[11px] tabular-nums text-muted">
                {formatFullDateTime(photo.data.createdAt)}
                {photo.data.location ? ` · ${photo.data.location}` : ''}
              </p>
            </div>
          </div>

          {photo.data.caption ? <p className="my-3.5 font-serif text-[19px] leading-8 text-ink">&ldquo;{photo.data.caption}&rdquo;</p> : null}

          <div className="flex items-center gap-3.5 border-b border-divider pb-3.5">
            <button type="button" onClick={() => toggleLike.mutate(photo.data!.id)} aria-pressed={photo.data.likedByMe} aria-label="따뜻해요" className="flex items-center gap-1.5 text-[13px] text-accent-700">
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.75} fill={photo.data.likedByMe ? 'currentColor' : 'transparent'} />
              <span className="tabular-nums">{photo.data.likeCount}</span>
            </button>
            <span className="text-xs text-muted">{likeSummary}</span>
          </div>

          <ul className="flex flex-col gap-3.5 py-3.5">
            {comments.data?.map((comment) => {
              const commentAuthor = members.data?.find((m) => m.id === comment.authorId);
              return (
                <li key={comment.id} className="flex gap-2.5">
                  <Avatar name={commentAuthor?.name ?? '?'} src={commentAuthor?.avatarUrl} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-semibold text-ink">{commentAuthor?.name ?? '구성원'}</span>
                      <span className="ml-2 text-[10.5px] text-muted">{formatTime(comment.createdAt)}</span>
                    </p>
                    <p className="text-[13px] leading-5 text-ink">{comment.text}</p>
                  </div>
                  <IconButton aria-label="댓글 옵션" onClick={() => openCommentActions(comment)} className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4 text-neutral-500" strokeWidth={1.75} />
                  </IconButton>
                </li>
              );
            })}
          </ul>

          <form onSubmit={send} className="sticky bottom-20 flex items-center gap-2.5 border-t border-divider bg-bg py-3 md:bottom-0">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="따뜻한 한마디를 남겨보세요" aria-label="댓글" />
            <Button type="submit" disabled={draft.trim().length === 0 || addComment.isPending}>
              보내기
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
