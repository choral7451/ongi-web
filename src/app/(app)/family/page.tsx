import type { Metadata } from 'next';
import { FamilyScreen } from './FamilyScreen';

export const metadata: Metadata = { title: '가족' };

export default function FamilyPage() {
  return <FamilyScreen />;
}
