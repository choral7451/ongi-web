/** 스토어 링크와 기기 판별 — 랜딩 버튼 · /download 스마트 링크가 같이 쓴다 (원본 URL 은 서버 ongi-app-config.ts) */
export const APP_STORE_URL = 'https://apps.apple.com/app/id6805759281';
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ongifamily.app';

/** 기기에 맞는 스토어로 보내는 스마트 링크 — QR·초대 문구·광고에는 이 주소 하나만 쓴다 */
export const DOWNLOAD_PATH = '/download';

/** 히어로 다운로드 영역 id — PC 처럼 스토어를 정할 수 없는 기기는 /download 가 여기로 안내 */
export const DOWNLOAD_SECTION_ID = 'download';

export type StorePlatform = 'ios' | 'android';

/**
 * User-Agent 로 스토어를 고른다. 판별할 수 없으면(PC 등) null.
 * iPadOS 13+ 사파리는 Mac 과 같은 UA 를 보내 여기서는 구분되지 않는다 — 브라우저에서는 터치 지원 여부로 한 번 더 본다(detectClientStorePlatform).
 */
export function detectStorePlatform(userAgent: string | null | undefined): StorePlatform | null {
  if (!userAgent) return null;
  // 안드로이드 UA 에도 'like iPhone' 류 문구가 섞인 경우가 있어 안드로이드를 먼저 본다
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return null;
}

/** 브라우저 전용 — UA 에 더해 Mac 으로 위장한 아이패드(터치 지원)를 iOS 로 본다 */
export function detectClientStorePlatform(): StorePlatform | null {
  if (typeof navigator === 'undefined') return null;
  const platform = detectStorePlatform(navigator.userAgent);
  if (platform) return platform;
  if (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return 'ios';
  return null;
}
