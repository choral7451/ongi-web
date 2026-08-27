import { AlbumDetailScreen } from './AlbumDetailScreen';

export default async function AlbumDetailPage({ params }: PageProps<'/albums/[id]'>) {
  const { id } = await params;
  return <AlbumDetailScreen id={id} />;
}
