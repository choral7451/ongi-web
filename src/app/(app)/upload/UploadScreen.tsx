'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, ImagePlus, Loader2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Lightbox } from '@/components/ui/Lightbox';
import { useEffect, useRef, useState } from 'react';
import { NoGroupState } from '@/components/NoGroupState';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { albumsApi } from '@/lib/api';
import { useAlbumsOf, useHasNoGroup, useMyGroups, useUploadPhotos } from '@/lib/queries';
import { UPLOAD_MAX_SELECT } from '@/lib/api/photos';
import { cn } from '@/lib/utils/cn';
import { makeThumbnail } from '@/lib/utils/image';
import type { Group } from '@/types';

const MAX_FILES = UPLOAD_MAX_SELECT;

/** 그룹별 업로드 대상 — 키가 있으면 그 가족에 올린다 (albumId 없으면 미분류) */
type Targets = Record<string, { albumId?: string }>;

/** 지난 업로드 대상 — 다음 업로드 때 기본값으로 미리 채운다 */
const LAST_TARGETS_KEY = 'ongi.upload.lastTargets';

const loadLastTargets = (): Targets | null => {
  try {
    const raw = localStorage.getItem(LAST_TARGETS_KEY);
    return raw ? (JSON.parse(raw) as Targets) : null;
  } catch {
    return null;
  }
};
const saveLastTargets = (targets: Targets) => {
  try {
    localStorage.setItem(LAST_TARGETS_KEY, JSON.stringify(targets));
  } catch {
    /* 저장 실패는 무시 — 다음에 다시 고르면 된다 */
  }
};

/** 허브 시트의 가족 한 줄 — 선택되면 담을 앨범 이름을 보여준다 */
function HubRow({
  group,
  target,
  onPress,
  onClear,
}: {
  group: Group;
  target: { albumId?: string } | undefined;
  onPress: () => void;
  onClear: () => void;
}) {
  const albums = useAlbumsOf(group.id);
  const selected = target != null;
  const albumName = target?.albumId != null ? albums.data?.find((a) => a.id === target.albumId)?.title : undefined;

  return (
    <button type="button" onClick={onPress} className="flex w-full items-center gap-3 border-b border-divider py-3 text-left">
      <span className={cn('flex h-[34px] w-[34px] items-center justify-center rounded-full border border-divider font-serif text-[15px] font-semibold', selected ? 'bg-accent-100 text-accent-800' : 'bg-neutral-100 text-neutral-700')}>
        {group.name.slice(0, 1)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className={cn('truncate text-sm', selected ? 'text-accent' : 'text-ink')}>{group.name}</span>
        <span className={cn('truncate text-[11px]', selected ? 'text-accent' : 'text-muted')}>
          {selected ? `${albumName ?? '미분류'} 앨범에 담아요` : '누르면 앨범을 골라요'}
        </span>
      </span>
      {selected ? (
        <span
          role="button"
          aria-label={`${group.name} 선택 해제`}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent"
        >
          <Check className="h-[13px] w-[13px] text-white" strokeWidth={2.5} />
        </span>
      ) : (
        <ChevronRight className="h-[15px] w-[15px] text-neutral-500" strokeWidth={1.75} />
      )}
    </button>
  );
}

/** 앨범 한 줄 — 라디오 + 이름 */
function AlbumRowItem({ label, picked, onPick }: { label: string; picked: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} className="flex w-full items-center gap-3 border-b border-divider py-3.5 text-left">
      <span className={cn('h-5 w-5 rounded-full', picked ? 'border-[6px] border-accent' : 'border-[1.5px] border-ink/30')} />
      <span className={cn('flex-1 text-sm', picked ? 'text-accent' : 'text-ink')}>{label}</span>
    </button>
  );
}

/** 앨범 선택 창 — 가족 하나의 앨범 목록. 고르면 즉시 허브로 돌아간다 */
function AlbumSheet({
  group,
  current,
  onPick,
  onBack,
  onUnselect,
}: {
  group: Group;
  current: { albumId?: string } | undefined;
  onPick: (albumId: string | undefined) => void;
  onBack: () => void;
  onUnselect: () => void;
}) {
  const albums = useAlbumsOf(group.id);
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const alertError = useAlertError();

  const createAlbum = async () => {
    const title = await dialog.prompt({ title: '새 앨범 만들기', message: '앨범 이름을 입력해 주세요.' });
    const name = title?.trim();
    if (!name) return;
    try {
      const album = await albumsApi.createAlbum(group.id, name);
      await queryClient.invalidateQueries({ queryKey: ['albums', group.id] });
      onPick(album.id);
    } catch (e) {
      alertError('앨범 만들기 실패')(e);
    }
  };

  return (
    <>
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-left">
        <ChevronLeft className="h-4 w-4 text-ink" strokeWidth={1.75} />
        <span className="truncate font-serif text-base font-semibold text-ink">{group.name} · 어느 앨범에 담을까요?</span>
      </button>
      <p className="mt-1 mb-1 pl-6 text-xs text-muted">앨범을 고르면 이전 화면으로 돌아가요</p>
      <div className="max-h-80 overflow-y-auto">
        <AlbumRowItem label="미분류" picked={current != null && current.albumId == null} onPick={() => onPick(undefined)} />
        {albums.data?.map((album) => (
          <AlbumRowItem key={album.id} label={album.title} picked={current?.albumId === album.id} onPick={() => onPick(album.id)} />
        ))}
        <button type="button" onClick={createAlbum} className="flex w-full items-center gap-3 border-b border-divider py-3.5 text-left">
          <Plus className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <span className="text-sm text-accent">새 앨범 만들기</span>
        </button>
        {current != null ? (
          <button type="button" onClick={onUnselect} className="flex w-full items-center py-3.5 text-left">
            <span className="text-[13px] text-danger">이 가족에는 올리지 않기</span>
          </button>
        ) : null}
      </div>
    </>
  );
}

/** 사진 올리기 — 화면은 사진 고르기에 집중, 올리기를 누르면 "어디에 올릴까요?" 허브에서 가족·앨범을 고른다 */
export function UploadScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const alertError = useAlertError();
  const hasNoGroup = useHasNoGroup();
  const groups = useMyGroups();
  const upload = useUploadPhotos();

  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [caption, setCaption] = useState('');
  const [targets, setTargets] = useState<Targets>({});
  const [sheet, setSheet] = useState<null | { step: 'hub' } | { step: 'album'; groupId: string }>(null);

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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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

  /** 올리기 버튼 → 허브 시트 열기 (지난 업로드의 선택을 기본값으로) */
  const openTargetSheet = () => {
    if (Object.keys(targets).length === 0) {
      const last = loadLastTargets();
      if (last) {
        const valid = Object.fromEntries(Object.entries(last).filter(([groupId]) => groups.data?.some((g) => g.id === groupId)));
        if (Object.keys(valid).length > 0) setTargets(valid);
      }
    }
    setSheet({ step: 'hub' });
  };

  const targetCount = Object.keys(targets).length;

  const submit = () => {
    if (files.length === 0 || targetCount === 0) return;
    saveLastTargets(targets);
    setSheet(null);
    runUpload(files, true);
  };

  /** 넘긴 파일만 올린다 — 실패분 재시도에도 그대로 쓴다 (문구는 첫 업로드에만) */
  const runUpload = (targetFiles: File[], withCaption: boolean) => {
    upload.mutate(
      {
        files: targetFiles,
        caption: withCaption ? caption.trim() || undefined : undefined,
        targets: Object.entries(targets).map(([groupId, target]) => ({ groupId, albumId: target.albumId })),
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
  const sheetGroup = sheet?.step === 'album' ? groups.data?.find((g) => g.id === sheet.groupId) : undefined;

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

      {/* 앱의 모달 헤더 — 닫기 · 제목(중앙 고정) · 올리기(→ 어디에 올릴까요 허브) */}
      <div className="sticky top-0 z-20 -mx-5 bg-bg px-5 pt-[calc(0.625rem+env(safe-area-inset-top))] pb-2.5 md:static md:z-auto md:mx-0 md:bg-transparent md:p-0 relative mb-4 flex items-center justify-between">
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-xl font-semibold text-ink">사진 올리기</span>
        <button type="button" onClick={() => router.back()} aria-label="닫기" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-neutral-100">
          <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <Button onClick={openTargetSheet} disabled={files.length === 0 || upload.isPending} className="relative">
          {upload.isPending ? (progress ? `올리는 중 ${progress.done}/${progress.total}` : '올리는 중…') : files.length > 0 ? `${files.length}장 올리기` : '올리기'}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <SectionHeader title="올릴 사진을 골라주세요" size="sm" meta={files.length > 0 ? `${files.length} / ${MAX_FILES}장 선택됨` : undefined} />
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div key={`${p.file.name}-${p.file.size}-${p.file.lastModified}`} className="relative overflow-hidden bg-neutral-200" style={{ aspectRatio: 1 }}>
                {/* 로컬 미리보기(blob:)는 next/image 최적화 대상이 아니다 */}
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt={`선택한 사진 ${i + 1}`} loading="lazy" decoding="async" onClick={() => p.url && setLightboxSrc(p.url)} className="h-full w-full cursor-zoom-in object-cover" />
                ) : null}
                <span className="absolute top-1.5 left-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent text-xs tabular-nums text-white">{i + 1}</span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="사진 제외" className="absolute top-1 right-1 rounded-full bg-ink/70 p-1 text-white">
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            ))}
            {files.length < MAX_FILES ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-divider text-xs text-muted hover:bg-neutral-100" style={{ aspectRatio: 1 }}>
                <ImagePlus className="h-6 w-6 text-accent" strokeWidth={1.5} />
                사진 선택
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
            ) : null}
          </div>
        </div>

      </div>

      {/* 어디에 올릴까요 — 허브 시트(가족 목록) ↔ 가족별 앨범 창 */}
      {sheet != null ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40" onClick={() => setSheet(null)}>
          <div
            className="w-full max-w-md rounded-t-xl bg-bg px-5 pt-2.5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3.5 h-1 w-9 rounded-full bg-ink/20" />
            {sheet.step === 'hub' ? (
              <>
                <p className="font-serif text-base font-semibold text-ink">어디에 올릴까요?</p>
                <p className="mt-1 mb-1 text-xs text-muted">가족을 누르면 담을 앨범을 골라요 · 여러 곳 선택 가능</p>
                <div className="max-h-80 overflow-y-auto">
                  {groups.data?.map((group) => (
                    <HubRow
                      key={group.id}
                      group={group}
                      target={targets[group.id]}
                      onPress={() => setSheet({ step: 'album', groupId: group.id })}
                      onClear={() =>
                        setTargets((prev) => {
                          const next = { ...prev };
                          delete next[group.id];
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
                <div className="mt-3 mb-1 flex flex-col gap-[5px]">
                  <label htmlFor="upload-caption" className="text-xs text-ink/70">
                    설명 <span className="text-muted">(선택)</span>
                  </label>
                  <Textarea id="upload-caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="사진에 담긴 이야기를 적어보세요" maxLength={200} className="min-h-9" rows={1} />
                </div>
                <button
                  type="button"
                  disabled={targetCount === 0}
                  onClick={submit}
                  className={cn(
                    'mt-4 flex h-[50px] w-full items-center justify-center rounded-md font-serif text-[15px] font-semibold',
                    targetCount === 0 ? 'bg-ink/[0.08] text-ink/35' : 'bg-accent text-white',
                  )}
                >
                  {targetCount === 0 ? '올릴 곳을 골라주세요' : `${targetCount}개 공간에 ${files.length}장 올리기`}
                </button>
              </>
            ) : sheetGroup ? (
              <AlbumSheet
                group={sheetGroup}
                current={targets[sheetGroup.id]}
                onPick={(albumId) => {
                  setTargets((prev) => ({ ...prev, [sheetGroup.id]: { albumId } }));
                  setSheet({ step: 'hub' });
                }}
                onBack={() => setSheet({ step: 'hub' })}
                onUnselect={() => {
                  setTargets((prev) => {
                    const next = { ...prev };
                    delete next[sheetGroup.id];
                    return next;
                  });
                  setSheet({ step: 'hub' });
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {lightboxSrc ? <Lightbox src={lightboxSrc} alt="선택한 사진" onClose={() => setLightboxSrc(null)} /> : null}
    </div>
  );
}
