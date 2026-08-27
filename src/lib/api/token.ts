/**
 * 토큰 저장소 — localStorage + 메모리 캐시.
 * 요청 헤더에서는 동기적으로 읽어야 하므로 캐시를 두고, SSR(window 없음)에서는 항상 null.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const STORAGE_KEY = 'ongi.tokens';
let cached: AuthTokens | null = null;

export function getTokens(): AuthTokens | null {
  return cached;
}

export function loadTokens(): AuthTokens | null {
  if (cached) return cached;
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    cached = value ? (JSON.parse(value) as AuthTokens) : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function saveTokens(tokens: AuthTokens): void {
  cached = tokens;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // 시크릿 모드 등 — 메모리로만 유지
  }
}

export function clearTokens(): void {
  cached = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}
