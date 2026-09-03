/**
 * 카카오 웹 로그인 — 인가 코드 리다이렉트 방식.
 * 버튼 → kauth 인가 페이지 → /login/kakao 콜백(code) → 토큰 교환 → 서버 로그인.
 * 필요: 카카오 콘솔 플랫폼(Web) 도메인 + Redirect URI(/login/kakao) 등록, Client Secret "사용 안 함".
 */

/** REST API 키 — 클라이언트 노출 가능한 공개 키 */
const KAKAO_REST_KEY = '0e5172be96be3b8c6c6566bf09bd209f';

const redirectUri = () => `${window.location.origin}/login/kakao`;

/** 카카오 인가 페이지로 이동 — next(초대 링크 등)는 state 로 왕복시킨다 */
export function startKakaoLogin(next?: string | null): void {
  const params = new URLSearchParams({
    client_id: KAKAO_REST_KEY,
    redirect_uri: redirectUri(),
    response_type: 'code',
  });
  if (next) params.set('state', next);
  window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

/** 인가 코드 → access token */
export async function exchangeKakaoCode(code: string): Promise<string> {
  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_KEY,
      redirect_uri: redirectUri(),
      code,
    }).toString(),
  });
  const payload = (await response.json()) as { access_token?: string; error_description?: string };
  if (!payload.access_token) throw new Error(payload.error_description ?? '카카오 로그인에 실패했어요.');
  return payload.access_token;
}
