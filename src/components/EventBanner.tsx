'use client';

import { CalendarDays, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEventsRange } from '@/lib/queries';
import { addDaysStr, ddayLabel, todayStr } from '@/lib/utils/calendar';

/** 홈 상단 한 줄 일정 배너 — 다가오는 일정(30일)이 있을 때만 나타난다 */
export function EventBanner() {
  const from = todayStr();
  const events = useEventsRange(from, addDaysStr(from, 30));

  const upcoming = events.data ?? [];
  if (upcoming.length === 0) return null;
  const first = upcoming[0];
  const rest = upcoming.length - 1;

  return (
    <Link href="/schedule" className="mb-3.5 flex items-center gap-2 rounded-md bg-accent-100 px-3 py-2.5" aria-label="가족 일정 보기">
      <CalendarDays className="h-[15px] w-[15px] shrink-0 text-accent-700" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-accent-900">
        <span className="font-semibold">{first.title}</span> {ddayLabel(first.date)}
        {rest > 0 ? ` · 외 ${rest}건` : ''}
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-accent-700" strokeWidth={1.75} />
    </Link>
  );
}
