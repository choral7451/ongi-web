/**
 * 브라우저 이미지 전처리 — 중앙 크롭(비율 고정) + 축소 + JPEG 변환.
 * HEIC 등 브라우저가 못 여는 포맷은 createImageBitmap 이 실패하므로 원본을 그대로 올린다.
 */
export async function prepareImage(file: File, options: { ratio: number; maxSize: number }): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  const { width, height } = bitmap;
  let cropW = width;
  let cropH = height;
  if (width / height > options.ratio) cropW = Math.round(height * options.ratio);
  else cropH = Math.round(width / options.ratio);
  const sx = Math.round((width - cropW) / 2);
  const sy = Math.round((height - cropH) / 2);

  const scale = Math.min(1, options.maxSize / Math.max(cropW, cropH));
  const outW = Math.round(cropW * scale);
  const outH = Math.round(cropH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, outW, outH);
  bitmap.close();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.85);
  });
}

/** 파일 선택 input 의 미리보기 URL — 사용 후 revokeObjectURL 필요 */
export const previewUrl = (file: File) => URL.createObjectURL(file);
