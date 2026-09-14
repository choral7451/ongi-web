import { redirect } from 'next/navigation';

/** 웹은 랜딩 전용 — 일반 로그인 화면은 막는다 (관리자 로그인은 /admin 에서) */
export default function LoginPage() {
  redirect('/');
}
