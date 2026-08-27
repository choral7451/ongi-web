import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/State';
import { GroupsScreen } from './GroupsScreen';

export const metadata: Metadata = { title: '가족 공간' };

export default function GroupsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <GroupsScreen />
    </Suspense>
  );
}
