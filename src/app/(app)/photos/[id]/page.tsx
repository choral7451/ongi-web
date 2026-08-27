import { Suspense } from 'react';
import { Spinner } from '@/components/ui/State';
import { PhotoDetailScreen } from './PhotoDetailScreen';

export default async function PhotoDetailPage({ params }: PageProps<'/photos/[id]'>) {
  const { id } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <PhotoDetailScreen id={id} />
    </Suspense>
  );
}
