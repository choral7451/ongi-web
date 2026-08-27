import type { Metadata } from 'next';
import { FeedScreen } from './FeedScreen';

export const metadata: Metadata = { title: '피드' };

export default function HomePage() {
  return <FeedScreen />;
}
