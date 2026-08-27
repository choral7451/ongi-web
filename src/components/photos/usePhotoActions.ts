'use client';

import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { useAlbums, useBlockMember, useDeletePhoto, useMembers, useReport, useUpdatePhoto } from '@/lib/queries';
import type { Photo } from '@/types';

export const REPORT_DONE_MESSAGE = '신고가 접수됐어요. 운영진이 24시간 안에 확인하고 필요한 조치를 할게요.';

/** 사진 ⋯ 메뉴 — 수정·삭제(작성자·관리자) · 신고 · 작성자 차단 (App Store/UGC 요건과 동일) */
export function usePhotoActions(onDeleted?: () => void) {
  const dialog = useDialog();
  const alertError = useAlertError();
  const members = useMembers();
  const deletePhoto = useDeletePhoto();
  const updatePhoto = useUpdatePhoto();
  const albums = useAlbums();
  const report = useReport();
  const block = useBlockMember();

  return async (photo: Photo) => {
    if (!members.data) {
      await dialog.alert('잠시만요', '구성원 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    const me = members.data.find((m) => m.isMe);
    const author = members.data.find((m) => m.id === photo.authorId);
    const isMine = me?.id === photo.authorId;
    // 수정·삭제는 같은 규칙 — 작성자 본인 또는 관리자
    const canEdit = isMine || me?.role === 'admin';

    const editCaption = async () => {
      const value = await dialog.prompt({ title: '문구 수정', confirmText: '저장', defaultValue: photo.caption ?? '', placeholder: '사진에 남길 한마디' });
      if (value === null) return;
      const caption = value.trim() || null;
      if (caption === (photo.caption ?? null)) return;
      updatePhoto.mutate({ photoId: photo.id, caption, albumId: photo.albumId ?? null }, { onError: alertError('수정 실패') });
    };

    const moveAlbum = async () => {
      const list = albums.data ?? [];
      const choose = (albumId: string | null) => {
        if (albumId === (photo.albumId ?? null)) return;
        updatePhoto.mutate({ photoId: photo.id, caption: photo.caption ?? null, albumId }, { onError: alertError('앨범 변경 실패') });
      };
      await dialog.actions('앨범 선택', [
        { label: `앨범 없음 (미분류)${photo.albumId ? '' : '  ✓'}`, onPress: () => choose(null) },
        ...list.map((album) => ({ label: `${album.title}${album.id === photo.albumId ? '  ✓' : ''}`, onPress: () => choose(album.id) })),
      ]);
    };

    await dialog.actions('사진', [
      ...(canEdit
        ? [
            { label: '문구 수정', onPress: editCaption },
            { label: '앨범 변경', onPress: moveAlbum },
            {
              label: '사진 삭제',
              destructive: true,
              onPress: async () => {
                if (await dialog.confirm({ title: '사진 삭제', message: '이 사진과 댓글이 모두 삭제되며 되돌릴 수 없어요.', confirmText: '삭제', destructive: true }))
                  deletePhoto.mutate(photo.id, { onSuccess: onDeleted, onError: alertError('삭제 실패') });
              },
            },
          ]
        : []),
      ...(!isMine
        ? [
            {
              label: '사진 신고',
              onPress: async () => {
                const reason = await dialog.prompt({ title: '사진 신고', message: '신고 내용은 운영진이 24시간 안에 확인해요.', confirmText: '신고', destructive: true, placeholder: '신고 사유' });
                if (reason === null) return;
                report.mutate(
                  { targetType: 'photo', targetId: photo.id, reason: reason.trim() || '사유 미입력' },
                  { onSuccess: () => dialog.alert('신고 완료', REPORT_DONE_MESSAGE), onError: alertError('신고 실패') },
                );
              },
            },
            {
              label: `${author?.name ?? '작성자'} 차단`,
              destructive: true,
              onPress: async () => {
                if (
                  await dialog.confirm({
                    title: '구성원 차단',
                    message: `${author?.name ?? '이 구성원'}의 사진과 댓글이 더 이상 보이지 않아요. 가족 페이지에서 언제든 해제할 수 있어요.`,
                    confirmText: '차단',
                    destructive: true,
                  })
                )
                  block.mutate(photo.authorId, { onSuccess: onDeleted, onError: alertError('차단 실패') });
              },
            },
          ]
        : []),
    ]);
  };
}
