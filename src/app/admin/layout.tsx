import type { Metadata } from 'next';

/** 관리자 페이지 — 검색 노출 차단. 접근 권한은 서버가 매 요청 확인한다 */
export const metadata: Metadata = { title: '관리자', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return children;
}
