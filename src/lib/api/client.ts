/**
 * API 클라이언트 — artinfo-server 의 /ongi/* 엔드포인트.
 * 서버 응답은 { code, message, item } 봉투라 request() 가 item 만 풀어서 돌려준다.
 * 401 이면 refresh 를 한 번 시도하고, 그래도 실패하면 onUnauthorized 로 세션을 끝낸다.
 */
import { clearTokens, getTokens, saveTokens } from './token';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-artinfokorea.com';

interface Envelope<T> {
  code: string;
  message: string | null;
  item: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

let refreshPromise: Promise<boolean> | null = null;

function doFetch(path: string, init?: RequestInit): Promise<Response> {
  const tokens = getTokens();
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      ...init?.headers,
    },
  });
}

async function parse<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    let message = `요청에 실패했어요 (${res.status})`;
    let code: string | undefined;
    try {
      const body = (await res.json()) as { message?: unknown; code?: unknown };
      if (typeof body.message === 'string' && body.message) message = body.message;
      if (typeof body.code === 'string') code = body.code;
    } catch {
      // 본문이 JSON 이 아니면 상태 코드 메시지 유지
    }
    throw new ApiError(`${message}${process.env.NODE_ENV === 'development' ? ` — ${path}` : ''}`, res.status, code);
  }
  const envelope = (await res.json()) as Envelope<T>;
  return envelope.item;
}

async function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const tokens = getTokens();
      if (!tokens) return false;
      try {
        const res = await fetch(`${BASE_URL}/ongi/auths/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tokens),
        });
        if (!res.ok) return false;
        const envelope = (await res.json()) as Envelope<{ accessToken: string; refreshToken: string }>;
        saveTokens({ accessToken: envelope.item.accessToken, refreshToken: envelope.item.refreshToken });
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res = await doFetch(path, init);

  if (res.status === 401 && getTokens()) {
    const renewed = await refreshTokens();
    if (renewed) {
      res = await doFetch(path, init);
    } else {
      clearTokens();
      onUnauthorized?.();
    }
  }

  return parse<T>(res, path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) });
}

export async function del(path: string): Promise<void> {
  await request<null>(path, { method: 'DELETE' });
}

/** multipart 업로드 */
export function postForm<T>(path: string, form: FormData): Promise<T> {
  return request<T>(path, { method: 'POST', body: form });
}
