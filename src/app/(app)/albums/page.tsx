import type { Metadata } from 'next';
import { AlbumsScreen } from './AlbumsScreen';

export const metadata: Metadata = { title: '앨범' };

export default function AlbumsPage() {
  return <AlbumsScreen />;
}
