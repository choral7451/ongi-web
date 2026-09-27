import type { Metadata } from 'next';

/** 랜딩·검색 노출용 사이트 정보 — layout · 랜딩 · robots · sitemap 이 같이 쓴다 */
export const SITE_URL = 'https://www.ongifamily.com';
export const SITE_TITLE = '온기 - 우리끼리 사진·일정·대화';
export const SITE_DESCRIPTION = '가족·연인·친구와 초대한 사람끼리만 사진, 일정, 대화를 나누는 비공개 공간, 온기.';

// 공유 미리보기 이미지는 app/opengraph-image.png · twitter-image.png 파일로 자동 연결된다
export const SITE_OPEN_GRAPH: NonNullable<Metadata['openGraph']> = {
  type: 'website',
  siteName: '온기',
  locale: 'ko_KR',
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};
