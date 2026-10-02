import type { NextRequest } from 'next/server';
import { APP_STORE_URL, DOWNLOAD_SECTION_ID, GOOGLE_PLAY_URL, detectStorePlatform } from '@/lib/store';

/**
 * 스마트 다운로드 링크 — 아이폰은 App Store, 안드로이드는 Google Play 로 바로 보낸다.
 * PC 처럼 스토어를 정할 수 없으면 랜딩의 다운로드 영역(두 버튼)으로 보낸다.
 * 기기마다 목적지가 달라 응답은 캐시하지 않는다.
 */
export function GET(request: NextRequest) {
  const platform = detectStorePlatform(request.headers.get('user-agent'));
  const location = platform === 'ios' ? APP_STORE_URL : platform === 'android' ? GOOGLE_PLAY_URL : `/#${DOWNLOAD_SECTION_ID}`;

  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': 'no-store', Vary: 'User-Agent' },
  });
}
