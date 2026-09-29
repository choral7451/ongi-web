'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface DailyPoint {
  /** 'YYYY-MM-DD' */
  day: string;
  value: number;
}

/** 눈금이 깔끔한 수(1·2·5 × 10ⁿ)로 떨어지는 축 — 0 부터 max 이상까지 2~4칸 */
export function niceScale(max: number, allowFraction = false): { max: number; ticks: number[] } {
  const floor = allowFraction ? 1 : 3;
  const target = Math.max(max, floor);
  const rough = target / 3;
  const power = 10 ** Math.floor(Math.log10(rough));
  const unit = [1, 2, 5, 10].find((n) => n * power >= rough) ?? 10;
  const step = allowFraction ? unit * power : Math.max(1, unit * power);
  const count = Math.ceil(target / step);
  return { max: count * step, ticks: Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 100) / 100) };
}

const shortDay = (day: string) => `${Number(day.slice(5, 7))}/${Number(day.slice(8, 10))}`;
const longDay = (day: string) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일`;

/**
 * 일별 세로 막대 — 한 가지 값, 한 가지 색.
 * - 오늘은 아직 끝나지 않은 날이라 옅게 그린다
 * - since 이전은 기록이 없던 날 — 0 과 구분되게 회색 바탕으로 둔다
 * - 값은 마우스를 올리거나 키보드(←→)로 읽고, 같은 값이 아래 "표로 보기" 에 있다
 */
export function DailyChart({
  title,
  data,
  today,
  since,
  format = (value) => value.toLocaleString(),
  allowFraction = false,
  compact = false,
}: {
  title: string;
  data: DailyPoint[];
  today: string;
  since?: string | null;
  format?: (value: number) => string;
  allowFraction?: boolean;
  compact?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const scale = niceScale(Math.max(0, ...data.map((d) => d.value)), allowFraction);
  const isUntracked = (day: string) => since !== undefined && (since === null || day < since);
  const point = active === null ? null : data[active];
  const last = data.length - 1;

  const move = (delta: number) => setActive((index) => Math.min(last, Math.max(0, (index ?? last + (delta > 0 ? 0 : 1)) + delta)));

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 text-[12px] text-muted">{title}</figcaption>
      <div className="flex">
        <div className={cn('relative w-9 shrink-0 text-[10px] tabular-nums text-muted', compact ? 'h-24' : 'h-40')} aria-hidden>
          {scale.ticks.map((tick) => (
            <span key={tick} className="absolute right-2 translate-y-1/2 leading-none" style={{ bottom: `${(tick / scale.max) * 100}%` }}>
              {format(tick)}
            </span>
          ))}
        </div>

        <div
          className={cn('relative min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-300', compact ? 'h-24' : 'h-40')}
          role="group"
          aria-label={`${title} — 좌우 화살표로 날짜를 옮겨요`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') move(-1);
            else if (e.key === 'ArrowRight') move(1);
            else if (e.key === 'Escape') setActive(null);
            else return;
            e.preventDefault();
          }}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
        >
          {scale.ticks.map((tick) => (
            <span
              key={tick}
              className={cn('absolute inset-x-0 h-px', tick === 0 ? 'bg-divider' : 'bg-neutral-200')}
              style={{ bottom: `${(tick / scale.max) * 100}%` }}
              aria-hidden
            />
          ))}

          <div className="absolute inset-0 flex items-end">
            {data.map((d, index) => (
              <div
                key={d.day}
                className={cn('flex h-full min-w-0 flex-1 items-end justify-center px-px', isUntracked(d.day) && 'bg-neutral-100', active === index && 'bg-accent-100')}
                onPointerEnter={() => setActive(index)}
                onPointerDown={() => setActive(index)}
              >
                <div
                  className={cn('w-full max-w-6 rounded-t-[4px]', d.day === today ? 'bg-accent-300' : 'bg-accent-600')}
                  style={{ height: `${(d.value / scale.max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
                />
              </div>
            ))}
          </div>

          {point && active !== null ? (
            <div
              className="pointer-events-none absolute bottom-full z-10 mb-1.5 rounded-md border border-divider bg-white px-2.5 py-1.5 whitespace-nowrap shadow-[0_6px_20px_-8px_rgba(16,17,20,0.3)]"
              style={
                active < data.length / 2
                  ? { left: `${(active / data.length) * 100}%` }
                  : { right: `${((last - active) / data.length) * 100}%` }
              }
              role="status"
            >
              <p className="text-sm font-semibold text-ink">{isUntracked(point.day) ? '기록 전' : format(point.value)}</p>
              <p className="text-[11px] text-muted">
                {longDay(point.day)}
                {point.day === today ? ' · 오늘(진행 중)' : ''}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-1.5 flex pl-9 text-[10px] tabular-nums text-muted" aria-hidden>
        {data.map((d, index) => (
          <span key={d.day} className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">
            {(last - index) % (compact ? 10 : 5) === 0 ? shortDay(d.day) : ''}
          </span>
        ))}
      </div>
    </figure>
  );
}
