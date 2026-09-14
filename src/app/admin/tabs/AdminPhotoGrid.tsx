'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Lightbox } from '@/components/ui/Lightbox';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/State';
import { VideoPlaceholder } from '@/components/ui/VideoPlaceholder';
import { adminApi } from '@/lib/api';
import type { AdminPhoto } from '@/lib/api/admin';
import { formatFullDateTime } from '@/lib/utils/format';
import { Pager } from './Pager';

/**
 * 가족 공간·사용자 사진 열람 — 최고 관리자 전용. 서버가 조회마다 열람 기록을 남기므로
 * 상세를 열자마자 불러오지 않고 "사진 보기"를 눌렀을 때만 요청한다.
 */
export function AdminPhotoGrid({ target, id }: { target: 'group' | 'user'; id: string }) {
  const [opened, setOpened] = useState(false);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<AdminPhoto | null>(null);
  const photos = useQuery({
    queryKey: ['admin', 'photos', target, id, page],
    queryFn: () => (target === 'group' ? adminApi.getGroupPhotos(id, page) : adminApi.getUserPhotos(id, page)),
    enabled: opened,
    // 열람 기록이 불필요하게 쌓이지 않도록 자동 재조회는 끈다
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return (
    <section>
      <SectionHeader title="사진" size="sm" />
      {!opened ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[12px] leading-5 text-muted">가족의 비공개 사진이에요. 신고 처리 등 운영에 필요한 경우에만 열람하고, 열람 기록이 남아요.</p>
          <Button variant="secondary" size="sm" onClick={() => setOpened(true)}>
            사진 보기
          </Button>
        </div>
      ) : null}

      {opened && photos.isPending ? <Spinner /> : null}
      {photos.isError ? <ErrorState message={photos.error.message} onRetry={() => photos.refetch()} /> : null}
      {photos.data?.length === 0 ? <EmptyState>올린 사진이 없어요.</EmptyState> : null}

      {photos.data?.length ? (
        <ul className="grid grid-cols-3 gap-1">
          {photos.data.map((photo) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => (photo.mediaType === 'video' ? window.open(photo.url, '_blank', 'noopener') : setViewing(photo))}
                className="relative block aspect-square w-full overflow-hidden rounded-sm bg-surface"
                title={`${photo.authorName ?? '알 수 없음'} · ${formatFullDateTime(photo.createdAt)}${target === 'user' ? ` · ${photo.groupName}` : ''}`}
              >
                {photo.thumbUrl || photo.mediaType !== 'video' ? (
                  // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL 은 next/image 최적화 대상이 아니다
                  <img src={photo.thumbUrl ?? photo.url} alt={photo.caption ?? ''} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <VideoPlaceholder />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {opened ? (
        <div className="mt-2">
          <Pager page={page} hasNext={(photos.data?.length ?? 0) === 50} onChange={setPage} />
        </div>
      ) : null}

      {viewing ? <Lightbox src={viewing.url} alt={viewing.caption ?? ''} onClose={() => setViewing(null)} /> : null}
    </section>
  );
}
