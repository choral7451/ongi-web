'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface RetentionPoint {
  days: number;
  cohort: number;
  retained: number;
  /** 대상자가 없으면 null */
  rate: number | null;
}

export interface RetentionSeries {
  key: string;
  label: string;
  /** 선 색 — 글자는 항상 잉크색, 색은 선과 범례 점에만 */
  color: string;
  points: RetentionPoint[];
}

const Y_TICKS = [0, 25, 50, 75, 100];
const END_LABEL_GAP = 9; // 끝 라벨끼리 최소 간격 (y %)

/** 값이 있는 점끼리만 이어서 polyline 좌표 묶음으로 — 대상자가 없는 날은 선이 끊긴다 */
function segmentsOf(points: RetentionPoint[], count: number): string[] {
  const segments: string[] = [];
  let current: string[] = [];
  for (const point of points) {
    if (point.rate === null) {
      if (current.length > 0) segments.push(current.join(' '));
      current = [];
      continue;
    }
    current.push(`${((point.days - 0.5) / count) * 100},${100 - point.rate}`);
  }
  if (current.length > 0) segments.push(current.join(' '));
  return segments;
}

/** 각 선의 마지막 값 라벨이 겹치지 않게 위아래로 밀어낸다 (y 는 % 단위, 위가 0) */
function endLabelsOf(series: RetentionSeries[]) {
  const labels = series
    .map((s) => {
      const last = [...s.points].reverse().find((p) => p.rate !== null);
      return last && last.rate !== null ? { key: s.key, color: s.color, rate: last.rate, y: 100 - last.rate } : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null)
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i += 1) {
    if (labels[i].y - labels[i - 1].y < END_LABEL_GAP) labels[i].y = labels[i - 1].y + END_LABEL_GAP;
  }
  return labels;
}

/**
 * 재방문 곡선 — 가입 n일째에 다시 온 비율, 여러 선.
 * - 세로축은 0~100%, 가로축은 가입 후 일수
 * - 대상자가 없는 날은 점을 찍지 않고 선을 끊는다
 * - 값은 마우스를 올리거나 키보드(←→)로 읽고, 같은 값이 아래 "표로 보기" 에 있다
 */
export function RetentionCurve({ title, series, count }: { title: string; series: RetentionSeries[]; count: number }) {
  const [active, setActive] = useState<number | null>(null);
  const last = count - 1;
  const endLabels = endLabelsOf(series);
  const move = (delta: number) => setActive((index) => Math.min(last, Math.max(0, (index ?? (delta > 0 ? -1 : count)) + delta)));

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
        <span>{title}</span>
        <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="선 설명">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
              <span className="text-ink">{s.label}</span>
            </li>
          ))}
        </ul>
      </figcaption>

      <div className="flex">
        <div className="relative h-48 w-9 shrink-0 text-[10px] tabular-nums text-muted" aria-hidden>
          {Y_TICKS.map((tick) => (
            <span key={tick} className="absolute right-2 translate-y-1/2 leading-none" style={{ bottom: `${tick}%` }}>
              {tick}%
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1">
          <div
            className="relative h-48 min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
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
            {Y_TICKS.map((tick) => (
              <span key={tick} className={cn('absolute inset-x-0 h-px', tick === 0 ? 'bg-divider' : 'bg-neutral-200')} style={{ bottom: `${tick}%` }} aria-hidden />
            ))}

            {active !== null ? (
              <span className="absolute inset-y-0 w-px bg-accent-300" style={{ left: `${((active + 0.5) / count) * 100}%` }} aria-hidden />
            ) : null}

            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {series.map((s) =>
                segmentsOf(s.points, count).map((segment, index) => (
                  <polyline
                    key={`${s.key}-${index}`}
                    points={segment}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )),
              )}
            </svg>

            {/* 점 — 선이 끊긴 외딴 값도 보이게, 가리키는 날은 크게 */}
            {series.map((s) =>
              s.points.map((p, index) =>
                p.rate === null ? null : (
                  <span
                    key={`${s.key}-${p.days}`}
                    className={cn('absolute -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-white', active === index ? 'h-2.5 w-2.5' : 'h-2 w-2')}
                    style={{ left: `${((p.days - 0.5) / count) * 100}%`, bottom: `${p.rate}%`, backgroundColor: s.color }}
                    aria-hidden
                  />
                ),
              ),
            )}

            <div className="absolute inset-0 flex">
              {Array.from({ length: count }, (_, index) => (
                <div key={index} className="h-full min-w-0 flex-1" onPointerEnter={() => setActive(index)} onPointerDown={() => setActive(index)} />
              ))}
            </div>

            {active !== null ? (
              <div
                className="pointer-events-none absolute bottom-full z-10 mb-1.5 rounded-md border border-divider bg-white px-2.5 py-1.5 whitespace-nowrap shadow-[0_6px_20px_-8px_rgba(16,17,20,0.3)]"
                style={active < count / 2 ? { left: `${((active + 0.5) / count) * 100}%` } : { right: `${((last - active + 0.5) / count) * 100}%` }}
                role="status"
              >
                <p className="text-[11px] text-muted">가입 {active + 1}일째</p>
                {series.map((s) => {
                  const p = s.points[active];
                  return (
                    <p key={s.key} className="flex items-center gap-1.5 text-[12px] tabular-nums text-ink">
                      <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                      <span className="text-muted">{s.label}</span>
                      {p?.rate === null || p === undefined ? (
                        <span className="text-muted">대상 없음</span>
                      ) : (
                        <>
                          <span className="font-semibold">{p.rate}%</span>
                          <span className="text-muted">
                            {p.retained}/{p.cohort}명
                          </span>
                        </>
                      )}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* 선 끝 값 라벨 — 글자는 잉크색, 색 점이 어느 선인지 알려준다 */}
          <div className="relative h-48 w-12 shrink-0" aria-hidden>
            {endLabels.map((l) => (
              <span
                key={l.key}
                className="absolute left-1.5 flex -translate-y-1/2 items-center gap-1 text-[10px] font-semibold tabular-nums text-ink"
                style={{ top: `${l.y}%` }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                {l.rate}%
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex pl-9 pr-12 text-[10px] tabular-nums text-muted" aria-hidden>
        {Array.from({ length: count }, (_, index) => (
          <span key={index} className="min-w-0 flex-1 text-center whitespace-nowrap">
            {index === 0 || (index + 1) % 5 === 0 ? `${index + 1}일` : ''}
          </span>
        ))}
      </div>
    </figure>
  );
}
