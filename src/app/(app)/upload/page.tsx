import type { Metadata } from 'next';
import { UploadScreen } from './UploadScreen';

export const metadata: Metadata = { title: '사진 올리기' };

export default function UploadPage() {
  return <UploadScreen />;
}
