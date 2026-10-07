/** 광고 전환 보내기 — 랜딩의 다운로드 버튼 클릭. 태그가 없으면 아무것도 하지 않는다 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '';
/** 전환 액션 "앱 다운로드 클릭" 의 라벨 — 광고 계정 > 목표 > 전환 > 태그 설정에서 복사 */
const DOWNLOAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_DOWNLOAD_LABEL ?? '';

/**
 * 다운로드 버튼 클릭을 Google Ads 전환으로. 스토어는 새 탭으로 열려 페이지가 안 떠나므로 그냥 보내면 된다.
 * 같은 사람이 두 스토어를 다 누르면 두 번 세지만, PC 에서만 가능한 일이라 무시한다.
 */
export function trackDownloadClick(platform: 'ios' | 'android') {
  if (!ADS_ID || !DOWNLOAD_LABEL || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'conversion', { send_to: `${ADS_ID}/${DOWNLOAD_LABEL}`, platform });
}
