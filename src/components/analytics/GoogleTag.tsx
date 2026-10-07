import Script from 'next/script';

/** Google Ads 태그 ID (AW-XXXXXXXXX) — 비어 있으면 아무 스크립트도 싣지 않는다 */
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '';

/**
 * Google 태그 — 광고 전환 측정용. 랜딩에서 다운로드 버튼을 누른 것을 전환으로 보낸다.
 * 광고 계정에서 만든 전환 액션의 ID·라벨은 Vercel 환경 변수로 넣는다 (.env.example 참고).
 */
export function GoogleTag() {
  if (!GOOGLE_ADS_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
      <Script id="google-tag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
    </>
  );
}
