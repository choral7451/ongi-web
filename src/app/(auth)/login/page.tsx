import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { LoginScreen } from './LoginScreen';

export const metadata: Metadata = { title: '로그인' };

export default function LoginPage() {
  return (
    <AuthGuard mode="guest">
      <Suspense>
        <LoginScreen />
      </Suspense>
    </AuthGuard>
  );
}
