/** 웹은 랜딩 전용 — 로그인 화면은 login/page 에서 랜딩으로 보내고, 카카오 콜백만 관리자 로그인용으로 남긴다 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
