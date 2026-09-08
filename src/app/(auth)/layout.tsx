import { redirect } from 'next/navigation';

/** 웹은 랜딩 전용으로 전환 — 로그인(소셜 콜백 포함)도 막고 랜딩으로 보낸다 */
export default function AuthLayout() {
  redirect('/');
}
