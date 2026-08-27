'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ErrorState, Spinner } from '@/components/ui/State';
import { useLegalDoc } from '@/lib/queries';

export function LegalDocScreen({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const doc = useLegalDoc(slug);

  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/" aria-label="돌아가기" className="rounded-md p-1.5 hover:bg-neutral-100">
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <span className="font-serif text-base font-semibold text-ink">{doc.data?.title ?? fallbackTitle}</span>
      </div>

      {doc.isPending ? (
        <Spinner label="문서를 불러오는 중이에요…" />
      ) : doc.isError ? (
        <ErrorState message="문서를 불러오지 못했어요." onRetry={() => doc.refetch()} />
      ) : doc.data ? (
        <article>
          <p className="text-[10px] uppercase tracking-[0.15em] text-accent">온기 정책</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">{doc.data.title}</h1>
          <p className="mt-1 text-[11px] tabular-nums text-muted">시행일 {doc.data.updatedAt}</p>
          <div className="my-4 h-px bg-accent-300" />
          <pre className="font-sans text-[13.5px] leading-6 whitespace-pre-wrap text-ink">{doc.data.body}</pre>
        </article>
      ) : null}
    </div>
  );
}
