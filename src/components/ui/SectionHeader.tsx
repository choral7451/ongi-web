export function SectionHeader({ title, meta, size = 'md' }: { title: string; meta?: string; size?: 'sm' | 'md' }) {
  return (
    <div className="mb-3 flex items-baseline justify-between border-b border-divider pb-2">
      <h2 className={size === 'sm' ? 'font-serif text-sm font-semibold text-ink' : 'font-serif text-lg font-semibold text-ink'}>{title}</h2>
      {meta ? <span className="text-xs tabular-nums text-muted">{meta}</span> : null}
    </div>
  );
}
