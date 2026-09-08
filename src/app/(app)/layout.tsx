import { redirect } from 'next/navigation';

/** 웹은 랜딩 전용으로 전환 — 로그인 필요 화면은 모두 랜딩으로 보낸다 (앱에서만 이용) */
export default function AppLayout() {
  redirect('/');
}
