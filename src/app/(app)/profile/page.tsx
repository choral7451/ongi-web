import type { Metadata } from 'next';
import { ProfileScreen } from './ProfileScreen';

export const metadata: Metadata = { title: '나' };

export default function ProfilePage() {
  return <ProfileScreen />;
}
