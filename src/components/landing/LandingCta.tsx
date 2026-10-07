'use client';

import { useSyncExternalStore } from 'react';
import { trackDownloadClick } from '@/lib/analytics';
import { APP_STORE_URL, DOWNLOAD_PATH, DOWNLOAD_SECTION_ID, GOOGLE_PLAY_URL, detectClientStorePlatform } from '@/lib/store';

const BUTTON_BASE =
  'inline-flex w-full min-w-[13.5rem] items-center justify-center gap-2 rounded-md px-6 py-3 font-serif text-sm font-semibold hover:opacity-85 sm:w-auto';
const HERO_BUTTON_CLASS = `${BUTTON_BASE} bg-ink text-bg`;
/** 검정 바탕 구역용 — 흰 버튼에 검정 글자 */
const INVERSE_BUTTON_CLASS = `${BUTTON_BASE} bg-bg text-ink`;

const subscribeNever = () => () => {};

/** 접속 기기의 스토어 — 서버 렌더·첫 하이드레이션은 null(두 버튼), 브라우저에서 판별되면 그 스토어만 */
function useStorePlatform() {
  return useSyncExternalStore(subscribeNever, detectClientStorePlatform, () => null);
}

/**
 * 랜딩 CTA — 웹은 랜딩 전용이라 로그인 대신 앱 다운로드만 안내.
 * header: 기기를 알아보면 그 스토어로 바로, 못 알아보면(PC 등) 히어로의 다운로드 버튼으로 부드럽게 스크롤.
 * hero · inverse: 모바일은 자기 기기 스토어 버튼 하나, PC 는 두 스토어 버튼 모두. inverse 는 검정 바탕용.
 */
export function LandingCta({ variant }: { variant: 'header' | 'hero' | 'inverse' }) {
  const platform = useStorePlatform();

  if (variant === 'header') {
    const storeUrl = platform === 'ios' ? APP_STORE_URL : platform === 'android' ? GOOGLE_PLAY_URL : null;
    return (
      // 하이드레이션 전·스크립트 꺼짐에서는 /download(서버가 기기를 다시 판별)로 간다
      <a
        href={storeUrl ?? DOWNLOAD_PATH}
        onClick={(e) => {
          if (storeUrl) {
            if (platform) trackDownloadClick(platform);
            return;
          }
          const target = document.getElementById(DOWNLOAD_SECTION_ID);
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        className="rounded-md border border-ink px-3.5 py-1.5 font-serif text-[13px] font-semibold text-ink hover:bg-neutral-100"
      >
        앱 다운로드
      </a>
    );
  }
  const buttonClass = variant === 'inverse' ? INVERSE_BUTTON_CLASS : HERO_BUTTON_CLASS;
  return (
    <>
      {platform !== 'android' && (
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass} onClick={() => trackDownloadClick('ios')}>
          {/* Apple 로고 —  글리프는 안드로이드에서 깨져서 SVG 사용 */}
          <svg aria-hidden viewBox="0 0 384 512" className="h-4 w-4 fill-current">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          App Store에서 받기
        </a>
      )}
      {platform !== 'ios' && (
        <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className={buttonClass} onClick={() => trackDownloadClick('android')}>
          {/* Google Play 삼각 로고 — 단색(현재 글자색) */}
          <svg aria-hidden viewBox="0 0 512 512" className="h-4 w-4 fill-current">
            <path d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
          </svg>
          Google Play에서 받기
        </a>
      )}
    </>
  );
}
