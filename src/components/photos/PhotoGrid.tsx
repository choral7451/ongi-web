'use client';

import { Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
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
  /** 선택 모드 — 클릭하면 상세 대신 선택 토글. canSelect 가 false 인 사진은 흐리게 표시되고 선택 불가 */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (photo: Photo) => void;
  canSelect?: (photo: Photo) => boolean;
}

export function PhotoGrid({ photos, isLoading, isError, onRetry, ctx, emptyMessage = '아직 사진이 없어요.', selectable = false, selectedIds, onToggleSelect, canSelect }: PhotoGridProps) {
  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState message="사진을 불러오지 못했어요." onRetry={onRetry} />;
  if (!photos || photos.length === 0) return <EmptyState>{emptyMessage}</EmptyState>;

  return (
    <ul className="grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-1.5 lg:grid-cols-5">
      {photos.map((photo) => {
        const allowed = !selectable || (canSelect?.(photo) ?? true);
        const selected = selectable && (selectedIds?.has(photo.id) ?? false);
        const img = <Image src={photo.url} alt={photo.caption ?? '사진'} fill sizes="(min-width: 1024px) 200px, 33vw" className={cn('object-cover transition-opacity', !selectable && 'hover:opacity-90', selectable && !allowed && 'opacity-35')} />;
        return (
          <li key={photo.id} className={cn('relative aspect-square overflow-hidden bg-neutral-200', selected && 'ring-2 ring-accent ring-inset')}>
            {selectable ? (
              <button type="button" disabled={!allowed} aria-pressed={selected} onClick={() => onToggleSelect?.(photo)} className="block h-full w-full disabled:cursor-not-allowed">
                {img}
                {allowed ? (
                  <span className={cn('absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-bg', selected ? 'border-accent bg-accent text-bg' : 'bg-ink/35')}>
                    {selected ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                  </span>
                ) : null}
              </button>
            ) : (
              <Link href={{ pathname: `/photos/${photo.id}`, query: { ctx } }} className="block h-full w-full">
                {img}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
