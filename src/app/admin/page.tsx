import { Suspense } from 'react';
import { AdminScreen } from './AdminScreen';

export default function AdminPage() {
  return (
    <Suspense>
      <AdminScreen />
    </Suspense>
  );
}
