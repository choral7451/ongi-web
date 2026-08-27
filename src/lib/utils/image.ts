/**
 * 브라우저 이미지 전처리 — 긴 변 축소 + JPEG 변환. 기본은 원본 비율 유지, `ratio` 를 주면 중앙 크롭(아바타 등).
 * HEIC 등 브라우저가 못 여는 포맷은 createImageBitmap 이 실패하므로 원본을 그대로 올린다 (비율 1 로 기록).
 */
export async function prepareImage(file: File, options: { maxSize: number; ratio?: number }): Promise<{ blob: Blob; aspectRatio: number }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return { blob: file, aspectRatio: 1 };
  }

  const { width, height } = bitmap;
  let cropW = width;
  let cropH = height;
  if (options.ratio) {
    if (width / height > options.ratio) cropW = Math.round(height * options.ratio);
    else cropH = Math.round(width / options.ratio);
  }
  const sx = Math.round((width - cropW) / 2);
  const sy = Math.round((height - cropH) / 2);
  const aspectRatio = cropW > 0 && cropH > 0 ? cropW / cropH : 1;
  const scale = Math.min(1, options.maxSize / Math.max(cropW, cropH));
  const outW = Math.max(1, Math.round(cropW * scale));
  const outH = Math.max(1, Math.round(cropH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { blob: file, aspectRatio };
  ctx.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, outW, outH);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85);
  });
  return { blob, aspectRatio };
}

/** 파일 선택 input 의 미리보기 URL — 사용 후 revokeObjectURL 필요 */
export const previewUrl = (file: File) => URL.createObjectURL(file);

/**
 * 그리드용 작은 썸네일(긴 변 size px) — 원본 12MP 를 그리드마다 다시 디코딩하지 않도록 파일당 한 번만 축소.
 * 실패(HEIC 등)하면 원본 object URL 로 폴백.
 */
export async function makeThumbnail(file: File, size = 320): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    if (!blob) throw new Error('toBlob failed');
    return URL.createObjectURL(blob);
  } catch {
    return URL.createObjectURL(file);
  }
}
