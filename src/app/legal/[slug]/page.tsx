import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalDocScreen } from './LegalDocScreen';

const TITLES: Record<string, string> = { terms: '이용약관', privacy: '개인정보 처리방침' };

export async function generateMetadata({ params }: PageProps<'/legal/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  return { title: TITLES[slug] ?? '정책' };
}

/** 약관·개인정보 처리방침 — 로그인 없이 열람 가능 */
export default async function LegalPage({ params }: PageProps<'/legal/[slug]'>) {
  const { slug } = await params;
  if (!(slug in TITLES)) notFound();
  return <LegalDocScreen slug={slug} fallbackTitle={TITLES[slug]} />;
}
