import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** 검색 노출은 랜딩과 약관만 — 관리자·로그인·웹 앱 경로와 스토어 리다이렉트(/download)는 수집하지 않게 한다 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/legal/'],
      disallow: ['/admin', '/login', '/download', '/feed', '/albums', '/photos', '/family', '/groups', '/schedule', '/upload', '/profile'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
