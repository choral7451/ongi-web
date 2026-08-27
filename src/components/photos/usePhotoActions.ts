'use client';

import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { useBlockMember, useDeletePhoto, useMembers, useReport } from '@/lib/queries';
import type { Photo } from '@/types';

export const REPORT_DONE_MESSAGE = '신고가 접수됐어요. 운영진이 24시간 안에 확인하고 필요한 조치를 할게요.';

/** 사진 ⋯ 메뉴 — 삭제(작성자·관리자) · 신고 · 작성자 차단 (App Store/UGC 요건과 동일) */
export function usePhotoActions(onDeleted?: () => void) {
  const dialog = useDialog();
  const alertError = useAlertError();
  const members = useMembers();
  const deletePhoto = useDeletePhoto();
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
    const canDelete = isMine || me?.role === 'admin';

    await dialog.actions('사진', [
      ...(canDelete
        ? [
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
