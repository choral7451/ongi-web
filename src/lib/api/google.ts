/**
 * 구글 웹 로그인 — Google Identity Services 의 토큰 클라이언트.
 * access token 을 받아 서버(/ongi/auths/login)에 넘기면 서버가 userinfo 로 검증한다.
 * 필요: Google Cloud 콘솔 "웹 애플리케이션" OAuth 클라이언트 + 승인된 JavaScript 원본에 사이트 주소 등록.
 */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleAccounts {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string }) => void;
      }) => TokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

export class GoogleSignInCancelled extends Error {
  constructor() {
    super('구글 로그인이 취소됐어요.');
  }
}

let loading: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('구글 로그인 스크립트를 불러오지 못했어요.'));
      document.head.appendChild(script);
    });
  }
  return loading;
}

export async function getGoogleAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) throw new Error('구글 로그인이 아직 설정되지 않았어요. (NEXT_PUBLIC_GOOGLE_CLIENT_ID)');
  await loadGis();

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.access_token) resolve(response.access_token);
        else if (response.error === 'access_denied') reject(new GoogleSignInCancelled());
        else reject(new Error('구글 로그인에 실패했어요.'));
      },
      error_callback: (error) => {
        if (error.type === 'popup_closed') reject(new GoogleSignInCancelled());
        else reject(new Error('구글 로그인 창을 열 수 없어요. 팝업 차단을 확인해 주세요.'));
      },
    });
    client.requestAccessToken();
  });
}
