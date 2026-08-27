import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="font-serif text-5xl font-semibold text-ink">404</p>
      <p className="text-sm text-muted">찾으시는 페이지가 없어요.</p>
      <Link href="/" className="text-sm text-accent-700 underline">
        처음으로
      </Link>
    </div>
  );
}
