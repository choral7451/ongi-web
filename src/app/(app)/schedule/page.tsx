import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ScheduleScreen } from './ScheduleScreen';

export const metadata: Metadata = { title: '가족 일정 · 온기' };

export default function SchedulePage() {
  // useSearchParams 를 쓰는 클라이언트 화면은 Suspense 경계가 필요하다
  return (
    <Suspense>
      <ScheduleScreen />
    </Suspense>
  );
}
