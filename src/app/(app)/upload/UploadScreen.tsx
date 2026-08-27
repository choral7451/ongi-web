'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NoGroupState } from '@/components/NoGroupState';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAlbumsOf, useHasNoGroup, useMyGroups, useUploadPhotos } from '@/lib/queries';
import { UPLOAD_MAX_SELECT } from '@/lib/api/photos';
import { useActiveGroupId } from '@/lib/store/session';
import { cn } from '@/lib/utils/cn';
import { makeThumbnail } from '@/lib/utils/image';

const MAX_FILES = UPLOAD_MAX_SELECT;
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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [ratio, setRatio] = useState<number>(1);
  const [caption, setCaption] = useState('');
  // 사용자가 손대기 전(null)에는 활성 그룹이 기본 게시 대상
  const [pickedGroupIds, setTargetGroupIds] = useState<string[] | null>(null);
  const targetGroupIds = pickedGroupIds ?? (activeGroupId ? [activeGroupId] : []);
  const [albumByGroup, setAlbumByGroup] = useState<Record<string, string>>({});

  // 파일별 썸네일 URL 캐시 — 한 장을 빼도 나머지는 다시 디코딩하지 않는다 (이전엔 전체 재생성으로 수 초 멈춤)
  const thumbCache = useRef(new Map<File, string>());
  const [thumbs, setThumbs] = useState<Map<File, string>>(new Map());
  useEffect(() => {
    let cancelled = false;
    const cache = thumbCache.current;
    // 제거된 파일의 URL 만 해제
    for (const [file, url] of cache) {
      if (!files.includes(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }
    // 새로 추가된 파일만 썸네일 생성 (순차 — 동시에 수십 장 디코딩하면 탭이 멈춘다)
    (async () => {
      for (const file of files) {
        if (cancelled) return;
        if (cache.has(file)) continue;
        cache.set(file, await makeThumbnail(file));
        if (!cancelled) setThumbs(new Map(cache));
      }
      if (!cancelled) setThumbs(new Map(cache));
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);
  useEffect(() => {
    const cache = thumbCache.current;
    return () => cache.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  const previews = files.map((file) => ({ file, url: thumbs.get(file) }));

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    // 같은 파일을 두 번 고르면 한 번만 (키 충돌·중복 업로드 방지)
    const keyOf = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
    const seen = new Set(files.map(keyOf));
    const picked = Array.from(list).filter((f) => f.type.startsWith('image/') && !seen.has(keyOf(f)) && (seen.add(keyOf(f)), true));
    const next = [...files, ...picked].slice(0, MAX_FILES);
    if (files.length + picked.length > MAX_FILES) await dialog.alert('선택 한도', `한 번에 ${MAX_FILES}장까지 올릴 수 있어요. 나눠서 올려주세요.`);
    setFiles(next);
  };

  const toggleGroup = (id: string) =>
    setTargetGroupIds(targetGroupIds.includes(id) ? targetGroupIds.filter((g) => g !== id) : [...targetGroupIds, id]);

  const submit = () => {
    if (files.length === 0 || targetGroupIds.length === 0) return;
    runUpload(files, true);
  };

  /** 넘긴 파일만 올린다 — 실패분 재시도에도 그대로 쓴다 (문구는 첫 업로드에만) */
  const runUpload = (targetFiles: File[], withCaption: boolean) => {
    upload.mutate(
      {
        files: targetFiles,
        ratio,
        caption: withCaption ? caption.trim() || undefined : undefined,
        targets: targetGroupIds.map((groupId) => ({ groupId, albumId: albumByGroup[groupId] || undefined })),
        onProgress: (done, total) => setProgress({ done, total }),
      },
      {
        onSettled: () => setProgress(null),
        onSuccess: async (result) => {
          const ok = targetFiles.length - result.failedFiles.length;
          if (result.failedFiles.length === 0) {
            await dialog.alert('올리기 완료', `사진 ${ok}장을 올렸어요.`);
            router.push('/feed');
            return;
          }
          const retry = await dialog.confirm({
            title: '일부 사진을 올리지 못했어요',
            message: `${ok}장 성공, ${result.failedFiles.length}장 실패${result.errorMessage ? `\n${result.errorMessage}` : ''}`,
            confirmText: '실패한 사진 다시 올리기',
            cancelText: '그만하기',
          });
          if (retry) runUpload(result.failedFiles, false);
          else router.push('/feed');
        },
        onError: alertError('올리기 실패'),
      },
    );
  };

  if (hasNoGroup) return <NoGroupState />;

  const percent = progress ? Math.round((progress.done / Math.max(progress.total, 1)) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl" aria-busy={upload.isPending}>
      {upload.isPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85" role="status" aria-live="polite" aria-label="사진 올리는 중">
          <div className="flex min-w-56 flex-col items-center gap-2.5 rounded-xl border border-divider bg-bg px-7 py-6 shadow-sm">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
            <p className="font-serif text-base font-semibold text-ink">사진을 올리고 있어요</p>
            {progress ? (
              <>
                <p className="text-[22px] tabular-nums text-accent-700">
                  {progress.done} / {progress.total}
                </p>
                <div className="h-1 w-44 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
                </div>
              </>
            ) : null}
            <p className="text-[11px] text-muted">완료될 때까지 이 페이지를 닫지 말아 주세요</p>
          </div>
        </div>
      ) : null}
      <h1 className="mb-6 font-serif text-3xl font-semibold text-ink">사진 올리기</h1>

      <SectionHeader title="사진" meta={`${files.length} / ${MAX_FILES}`} />
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {previews.map((p, i) => (
          <div key={`${p.file.name}-${p.file.size}-${p.file.lastModified}`} className="relative overflow-hidden bg-neutral-200" style={{ aspectRatio: ratio }}>
            {/* 로컬 미리보기(blob:)는 next/image 최적화 대상이 아니다 */}
            {p.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt={`선택한 사진 ${i + 1}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : null}
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
          {upload.isPending ? (progress ? `올리는 중 ${progress.done}/${progress.total}` : '올리는 중…') : `${files.length}장 올리기`}
        </Button>
      </div>
    </div>
  );
}

function AlbumPicker({ groupId, value, onChange }: { groupId: string; value: string; onChange: (albumId: string) => void }) {
  const albums = useAlbumsOf(groupId);
  if (!albums.data || albums.data.length === 0) return null;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-md border border-divider bg-bg px-2 py-1.5 text-base text-ink md:text-xs" aria-label="앨범 선택">
      <option value="">앨범 없음 (미분류)</option>
      {albums.data.map((a) => (
        <option key={a.id} value={a.id}>
          {a.title}
        </option>
      ))}
    </select>
  );
}
