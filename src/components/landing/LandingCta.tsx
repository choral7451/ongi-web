const APP_STORE_URL = 'https://apps.apple.com/app/id6805759281';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ongifamily.app';

/** 히어로 다운로드 영역 id — 헤더 "앱 다운로드" 가 어느 한 스토어로 보내지 않고 여기로 안내 */
export const DOWNLOAD_SECTION_ID = 'download';

const HERO_BUTTON_CLASS =
  'inline-flex w-full min-w-[13.5rem] items-center justify-center gap-2 rounded-md bg-ink px-6 py-3 font-serif text-sm font-semibold text-bg hover:opacity-85 sm:w-auto';

/** 랜딩 CTA — 웹은 랜딩 전용이라 로그인 대신 App Store · Google Play 다운로드만 안내 */
export function LandingCta({ variant }: { variant: 'header' | 'hero' }) {
  if (variant === 'header') {
    return (
      <a
        href={`#${DOWNLOAD_SECTION_ID}`}
        className="rounded-md border border-accent px-3.5 py-1.5 font-serif text-[13px] font-semibold text-accent hover:bg-accent-100"
      >
        앱 다운로드
      </a>
    );
  }
  return (
    <>
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={HERO_BUTTON_CLASS}>
        {/* Apple 로고 —  글리프는 안드로이드에서 깨져서 SVG 사용 */}
        <svg aria-hidden viewBox="0 0 384 512" className="h-4 w-4 fill-current">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
        App Store에서 받기
      </a>
      <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className={HERO_BUTTON_CLASS}>
        {/* Google Play 삼각 로고 — 단색(현재 글자색) */}
        <svg aria-hidden viewBox="0 0 512 512" className="h-4 w-4 fill-current">
          <path d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
        </svg>
        Google Play에서 받기
      </a>
    </>
  );
}
