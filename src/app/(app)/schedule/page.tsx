import type { Metadata } from 'next';
import { ScheduleScreen } from './ScheduleScreen';

export const metadata: Metadata = { title: '가족 일정 · 온기' };

export default function SchedulePage() {
  return <ScheduleScreen />;
}
