'use client';

import { ImagePlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { NoGroupState } from '@/components/NoGroupState';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAlbumsOf, useHasNoGroup, useMyGroups, useUploadPhotos } from '@/lib/queries';
import { useActiveGroupId } from '@/lib/store/session';
import { cn } from '@/lib/utils/cn';

const MAX_FILES = 10;
const RATIOS = [
  { value: 1, label: '정방형 1:1' },
  { value: 0.8, label: '세로 4:5' },
] as const;

/** 사진 올리기 — 파일 선택 → 비율·문구·게시할 공간/앨범 → 업로드 */
export function UploadScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const alertError = useAlertError();
  const hasNoGroup = useHasNoGroup();
  const activeGroupId = useActiveGroupId();
  const groups = useMyGroups();
  const upload = useUploadPhotos();

  const [files, setFiles] = useState<File[]>([]);
  const [ratio, setRatio] = useState<number>(1);
  const [caption, setCaption] = useState('');
  // 사용자가 손대기 전(null)에는 활성 그룹이 기본 게시 대상
  const [pickedGroupIds, setTargetGroupIds] = useState<string[] | null>(null);
  const targetGroupIds = pickedGroupIds ?? (activeGroupId ? [activeGroupId] : []);
  const [albumByGroup, setAlbumByGroup] = useState<Record<string, string>>({});

  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list).filter((f) => f.type.startsWith('image/'))].slice(0, MAX_FILES);
    setFiles(next);
  };

  const toggleGroup = (id: string) =>
    setTargetGroupIds(targetGroupIds.includes(id) ? targetGroupIds.filter((g) => g !== id) : [...targetGroupIds, id]);

  const submit = () => {
    if (files.length === 0 || targetGroupIds.length === 0) return;
    upload.mutate(
      { files, ratio, caption: caption.trim() || undefined, targets: targetGroupIds.map((groupId) => ({ groupId, albumId: albumByGroup[groupId] || undefined })) },
      {
        onSuccess: async () => {
          await dialog.alert('올리기 완료', `사진 ${files.length}장을 올렸어요.`);
          router.push('/feed');
        },
        onError: alertError('올리기 실패'),
      },
    );
  };

  if (hasNoGroup) return <NoGroupState />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-ink">사진 올리기</h1>

      <SectionHeader title="사진" meta={`${files.length} / ${MAX_FILES}`} />
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {previews.map((p, i) => (
          <div key={p.url} className="relative overflow-hidden bg-neutral-200" style={{ aspectRatio: ratio }}>
            {/* 로컬 미리보기(blob:)는 next/image 최적화 대상이 아니다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`선택한 사진 ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="사진 제외" className="absolute top-1 right-1 rounded-full bg-ink/70 p-1 text-white">
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}
        {files.length < MAX_FILES ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-divider text-xs text-muted hover:bg-neutral-100" style={{ aspectRatio: ratio }}>
            <ImagePlus className="h-6 w-6 text-accent" strokeWidth={1.5} />
            사진 선택
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </label>
        ) : null}
      </div>

      <div className="mt-6">
        <SectionHeader title="비율" size="sm" />
        <div className="flex gap-2">
          {RATIOS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRatio(r.value)}
              className={cn('rounded-md border px-3 py-1.5 text-xs', ratio === r.value ? 'border-accent bg-accent-100 text-accent-700' : 'border-divider text-ink hover:bg-neutral-100')}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">선택한 비율로 가운데를 잘라 JPEG 로 변환해 올려요.</p>
      </div>

      <div className="mt-6">
        <SectionHeader title="한마디" size="sm" />
        <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="사진에 담긴 순간을 한 줄로 남겨보세요" maxLength={200} />
      </div>

      <div className="mt-6">
        <SectionHeader title="게시할 가족 공간" size="sm" />
        <ul className="flex flex-col gap-2">
          {groups.data?.map((group) => {
            const checked = targetGroupIds.includes(group.id);
            return (
              <li key={group.id} className={cn('rounded-lg border p-3', checked ? 'border-accent' : 'border-divider')}>
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={checked} onChange={() => toggleGroup(group.id)} className="h-4 w-4 accent-accent" />
                  <span className="flex-1 text-sm text-ink">{group.name}</span>
                </label>
                {checked ? <AlbumPicker groupId={group.id} value={albumByGroup[group.id] ?? ''} onChange={(albumId) => setAlbumByGroup({ ...albumByGroup, [group.id]: albumId })} /> : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] text-muted">여러 공간을 고르면 공간마다 독립된 게시물이 생겨요. 좋아요·댓글은 공간별로 따로 쌓여요.</p>
      </div>

      <div className="mt-8 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={() => router.back()}>
          취소
        </Button>
        <Button variant="solid" size="lg" onClick={submit} disabled={files.length === 0 || targetGroupIds.length === 0 || upload.isPending}>
          {upload.isPending ? '올리는 중…' : `${files.length}장 올리기`}
        </Button>
      </div>
    </div>
  );
}

function AlbumPicker({ groupId, value, onChange }: { groupId: string; value: string; onChange: (albumId: string) => void }) {
  const albums = useAlbumsOf(groupId);
  if (!albums.data || albums.data.length === 0) return null;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-md border border-divider bg-bg px-2 py-1.5 text-xs text-ink" aria-label="앨범 선택">
      <option value="">앨범 없음 (미분류)</option>
      {albums.data.map((a) => (
        <option key={a.id} value={a.id}>
          {a.title}
        </option>
      ))}
    </select>
  );
}
