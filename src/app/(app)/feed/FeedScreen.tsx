'use client';

import { useMemo } from 'react';
import { FeedPost } from '@/components/feed/FeedPost';
import { NoGroupState } from '@/components/NoGroupState';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/State';
import { useAlbums, useFeed, useHasNoGroup, useMembers } from '@/lib/queries';
import { dayKey, feedSectionTitle, formatFeedDate } from '@/lib/utils/format';
import type { Photo } from '@/types';

/** 홈 / 피드 — 날짜순으로 가족의 오늘 */
export function FeedScreen() {
  const feed = useFeed();
  const members = useMembers();
  const albums = useAlbums();
  const hasNoGroup = useHasNoGroup();

  const sections = useMemo(() => {
    if (!feed.data) return [];
    const byDay = new Map<string, Photo[]>();
    for (const photo of feed.data) {
      const key = dayKey(new Date(photo.createdAt));
      byDay.set(key, [...(byDay.get(key) ?? []), photo]);
    }
    const today = dayKey(new Date());
    return [...byDay.entries()].map(([key, photos]) => ({
      key,
      title: feedSectionTitle(key, today),
      meta: formatFeedDate(new Date(`${key}T00:00:00`)),
      photos,
    }));
  }, [feed.data]);

  if (hasNoGroup) return <NoGroupState />;

  return (
    <div className="mx-auto max-w-2xl">
      {feed.isPending ? (
        <Spinner />
      ) : feed.isError ? (
        <ErrorState message="피드를 불러오지 못했어요." onRetry={() => feed.refetch()} />
      ) : sections.length === 0 ? (
        <EmptyState>아직 올라온 사진이 없어요. 첫 사진을 올려보세요.</EmptyState>
      ) : (
        sections.map((section) => (
          <section key={section.key} className="mb-[22px]">
            <div className="flex flex-col gap-[22px]">
              {section.photos.map((photo) => (
                <FeedPost
                  key={photo.id}
                  photo={photo}
                  author={members.data?.find((m) => m.id === photo.authorId)}
                  album={albums.data?.find((a) => a.id === photo.albumId)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
