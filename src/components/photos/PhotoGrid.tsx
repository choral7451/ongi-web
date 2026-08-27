'use client';

import Image from 'next/image';
import Link from 'next/link';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/State';
import type { Photo } from '@/types';

interface PhotoGridProps {
  photos?: Photo[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** 상세 화면에 넘길 목록 컨텍스트 — 좌우 이동용 */
  ctx: string;
  emptyMessage?: string;
}

export function PhotoGrid({ photos, isLoading, isError, onRetry, ctx, emptyMessage = '아직 사진이 없어요.' }: PhotoGridProps) {
  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState message="사진을 불러오지 못했어요." onRetry={onRetry} />;
  if (!photos || photos.length === 0) return <EmptyState>{emptyMessage}</EmptyState>;

  return (
    <ul className="grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-1.5 lg:grid-cols-5">
      {photos.map((photo) => (
        <li key={photo.id} className="relative aspect-square overflow-hidden bg-neutral-200">
          <Link href={{ pathname: `/photos/${photo.id}`, query: { ctx } }} className="block h-full w-full">
            <Image src={photo.url} alt={photo.caption ?? '사진'} fill sizes="(min-width: 1024px) 200px, 33vw" className="object-cover transition-opacity hover:opacity-90" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
