import { post, request } from './client';
import { getGoogleAccessToken } from './google';
import { exchangeKakaoCode } from './kakao';
import { clearTokens, saveTokens } from './token';

export type SocialProvider = 'google' | 'apple' | 'kakao' | 'naver';

/** 서버가 이름을 못 받았을 때 붙이는 기본 이름 */
export const DEFAULT_USER_NAME = '온기 사용자';

/** 토큰 없는 개발용 로그인 버튼 노출 여부 — 서버도 ONGI_DEV_LOGIN=true 여야 동작 */
export const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === 'true';

export interface AuthUser {
  id: string;
  name: string;
  provider: string;
}

interface LoginResponse {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string };
}

/** 구글 로그인 — 미가입이면 서버가 자동 가입 (웹은 구글 로그인만 제공) */
export async function signInWithGoogle(): Promise<AuthUser> {
  const token = await getGoogleAccessToken();
  const result = await post<LoginResponse>('/ongi/auths/login', { provider: 'google', token });
  saveTokens(result.tokens);
  return result.user;
}

/** 카카오 로그인 — 콜백에서 받은 인가 코드로 토큰 교환 후 서버 로그인 (미가입 시 자동 가입) */
export async function signInWithKakaoCode(code: string): Promise<AuthUser> {
  const token = await exchangeKakaoCode(code);
  const result = await post<LoginResponse>('/ongi/auths/login', { provider: 'kakao', token });
  saveTokens(result.tokens);
  return result.user;
}

/** 개발용 로그인 — 토큰 없이 dev-{provider} 계정 (로컬 서버 전용) */
export async function signInAsDev(provider: SocialProvider = 'google'): Promise<AuthUser> {
  const result = await post<LoginResponse>('/ongi/auths/login', { provider });
  saveTokens(result.tokens);
  return result.user;
}

export function fetchMe(): Promise<AuthUser> {
  return request<AuthUser>('/ongi/users/me');
}

export function signOut(): void {
  clearTokens();
}
