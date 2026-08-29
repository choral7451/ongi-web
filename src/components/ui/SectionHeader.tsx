/** 세리프 제목 + 연파랑 헤어라인 — 앱 SectionHeader 와 동일한 섹션 구분 패턴 */
export function SectionHeader({ title, meta, size = 'md' }: { title: string; meta?: string; size?: 'sm' | 'md' }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <h2 className={size === 'sm' ? 'font-serif text-sm font-semibold text-ink' : 'font-serif text-base font-semibold text-ink'}>{title}</h2>
      <span className="h-px flex-1 bg-accent-300" aria-hidden />
      {meta ? <span className="text-[11px] tabular-nums text-muted">{meta}</span> : null}
    </div>
  );
}
