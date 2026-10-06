import { Archive, CalendarDays, Check, FolderHeart, Images, KeyRound, Lock, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { LandingCta } from '@/components/landing/LandingCta';
import { SITE_DESCRIPTION, SITE_OPEN_GRAPH, SITE_TITLE, SITE_URL } from '@/lib/site';
import { APP_STORE_URL, DOWNLOAD_SECTION_ID, GOOGLE_PLAY_URL } from '@/lib/store';

// 탭 제목은 레이아웃에서 '온기'로 고정 — 랜딩만 검색 결과에 보일 제목을 따로 준다
export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  alternates: { canonical: '/' },
  openGraph: { ...SITE_OPEN_GRAPH, url: '/' },
};

// 대상: 아기를 둔 엄마아빠가 조부모·친척에게 아기 사진을 나누는 것 (2026-10 재구성)
// 히어로 핵심 네 가지 — 키워드만 남긴 알약 칩 (아래 '이런 적 있으시죠?' 의 불편에 대한 답)
const HERO_POINTS = [
  { Icon: FolderHeart, label: '앨범별로 정리' },
  { Icon: Archive, label: '사라지지 않아요' },
  { Icon: Lock, label: '초대한 가족만' },
  { Icon: KeyRound, label: '초대 코드 하나로' },
];

const PAINS = [
  ['단톡방에 올리면 금방 묻혀요', '어제 올린 사진을 다시 보려면 한참을 올려야 해요. 100일 사진이 어디 있는지 아무도 몰라요.'],
  ['시간이 지나면 사라져요', '메신저 사진은 저장 기간이 지나면 열리지 않아요. 돌잔치 때 백일 사진을 찾으면 이미 없어요.'],
  ['SNS는 남들 눈이 신경 쓰여요', '아기 얼굴을 모르는 사람에게까지 보여주고 싶진 않아요. 가족만 보면 충분해요.'],
  ['할머니 할아버지는 앱이 어려워요', '가입하고 설정하는 것부터 막혀요. 그래서 결국 사진을 하나하나 보내드리게 돼요.'],
];

const STEPS = [
  ['1', '엄마아빠가 공간을 만들고 올려요', '"우리 아기"처럼 이름을 붙이고, 오늘 찍은 사진과 영상을 한 번에 올려요.'],
  ['2', '가족에게 초대 코드를 보내요', '메신저로 코드를 보내면, 가족은 앱을 받고 코드만 넣으면 끝이에요.'],
  ['3', '가족은 따뜻해요와 한마디를 남겨요', '멀리 있는 할머니도 사진 한 장에 마음을 남겨요. 좋아요 대신 "따뜻해요".'],
];

const SHOTS = [
  ['/landing/feed-smile.jpg', '온기 앱 홈 피드 — 아빠 품에서 웃는 아기', '오늘의 한 장이 차곡차곡', '올린 순서대로 날짜순으로 쌓여요.'],
  ['/landing/albums.jpg', '온기 앱 앨범 탭 — 100일·돌 앨범', '백일·돌도 한곳에', '특별한 날은 앨범으로 나눠 담아요.'],
  ['/landing/schedule.jpg', '온기 앱 가족 일정 — 예방접종 일정이 등록된 달력', '예방접종·기념일 달력', '등록하면 가족이 함께 알림을 받아요.'],
];

const FEATURES = [
  { Icon: Images, title: '성장 기록이 날짜순으로', body: '올린 순서대로 하루하루 쌓여요. 뒤집기, 첫 이유식, 첫걸음을 나중에 다시 찾기 쉬워요. 영상도 함께 올려요.' },
  { Icon: FolderHeart, title: '백일·돌 앨범', body: '백일, 돌잔치, 첫 여행처럼 특별한 날은 앨범으로 나눠 담아요. 가족 누구나 앨범에서 바로 찾아봐요.' },
  { Icon: CalendarDays, title: '예방접종·기념일 알림', body: '백일, 돌, 예방접종 날짜를 등록하면 가족이 함께 알림을 받아요. 음력 생일과 매년 반복도 돼요.' },
  { Icon: MessageCircle, title: '가족 대화', body: '사진 아래 한마디, 1:1과 단체 대화. 누가 읽었는지 바로 보여요.' },
  { Icon: Lock, title: '공간 밖으로는 안 보여요', body: '초대한 사람만 들어오고, 올린 사진과 대화는 공간 밖으로 공개되지 않아요. 탈퇴하면 올린 사진이 삭제돼요.' },
];

const EASY = [
  ['초대 코드 입력만 하면 들어와요', '받은 코드를 넣으면 바로 우리 아기 공간이 열려요. 복잡한 설정이 없어요.'],
  ['사진이 크게, 최신 순으로', '앱을 열면 오늘 올라온 아기 사진이 바로 보여요. 찾아다닐 필요가 없어요.'],
  ['탭 다섯 개로 단순하게', '홈, 앨범, 올리기, 가족, 나. 메뉴를 헤매지 않아요.'],
];

// 검색 엔진용 구조화 데이터 — 앱 소개(무료, iOS·Android)
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: '온기',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  operatingSystem: 'iOS, Android',
  applicationCategory: 'LifestyleApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
  sameAs: [APP_STORE_URL, GOOGLE_PLAY_URL],
};

/** 폰 테두리 안에 앱 스크린샷 한 장 (원본 1206×2622 → 720×1565) */
function PhoneShot({ src, alt, size, preload = false }: { src: string; alt: string; size: 'lg' | 'md' | 'sm'; preload?: boolean }) {
  const frame = {
    lg: 'w-[240px] rounded-[36px] p-2 shadow-[0_24px_60px_-24px_rgba(16,17,20,0.25)] md:w-[280px]',
    md: 'w-[240px] rounded-[32px] p-[7px] shadow-[0_18px_44px_-20px_rgba(16,17,20,0.22)]',
    sm: 'w-[200px] rounded-[30px] p-1.5 shadow-[0_18px_44px_-20px_rgba(16,17,20,0.22)]',
  }[size];
  const inner = { lg: 'rounded-[28px]', md: 'rounded-[25px]', sm: 'rounded-[24px]' }[size];
  return (
    <div className={`mx-auto shrink-0 border border-divider bg-white ${frame}`}>
      <Image src={src} alt={alt} width={720} height={1565} preload={preload} sizes="280px" className={`w-full ${inner}`} />
    </div>
  );
}

/** 공개 랜딩 — 웹은 소개 전용, 이용은 앱에서 */
export default function LandingPage() {
  return (
    // break-keep: 한글이 낱말 중간에서 끊기지 않게 (예: "사라져/요")
    // shrink-0: body 가 높이 100% flex 라서, 없으면 이 상자가 화면 한 장 높이로 줄어 sticky 헤더가 그 구간만 따라오다 사라진다
    <div className="flex min-h-screen shrink-0 flex-col break-keep">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, '\\u003c') }} />
      {/* 스크롤해도 따라오는 헤더 — 로고와 다운로드 버튼만 */}
      <header className="sticky top-0 z-40 border-b border-divider bg-bg/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3.5">
          <span className="inline-block origin-left scale-x-[1.15] text-2xl leading-none font-bold tracking-[0.12em] text-ink [font-family:var(--font-logo),sans-serif]">ONGI</span>
          <LandingCta variant="header" />
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-6 pt-12 pb-16 md:grid-cols-[1fr_auto] md:gap-16 md:pt-16 md:pb-24">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <p className="mb-4 text-xs tracking-[0.18em] text-neutral-700">아기를 둔 엄마아빠를 위한 가족 공간</p>
            <h1 className="font-serif text-4xl leading-tight font-semibold text-ink md:text-[3.25rem]">
              우리 아기 사진,
              <br />
              가족에게만
            </h1>
            <div className="my-7 h-px w-14 bg-ink" />
            <ul className="flex max-w-md flex-wrap justify-center gap-2.5 md:justify-start">
              {HERO_POINTS.map(({ Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-400 px-4 py-2 text-[14.5px] text-ink">
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            <div id={DOWNLOAD_SECTION_ID} className="mt-8 flex w-full scroll-mt-24 flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <LandingCta variant="hero" />
            </div>
            <p className="mt-4 text-xs text-neutral-600">무료 · 애플·카카오·구글 계정으로 3초 만에 시작해요</p>
          </div>
          <PhoneShot src="/landing/home.jpg" alt="온기 앱 홈 피드 — 아기 사진과 예방접종 일정 배너" size="lg" preload />
        </section>

        <section className="border-t border-divider bg-warm">
          <div className="mx-auto flex max-w-5xl flex-col gap-9 px-6 py-16 md:py-[72px]">
            <h2 className="font-serif text-2xl font-semibold text-ink md:text-3xl">이런 적 있으시죠?</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PAINS.map(([title, body]) => (
                <article key={title} className="flex flex-col gap-2.5 rounded-lg border border-divider bg-bg p-6">
                  <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
                  <p className="text-sm leading-[1.7] text-muted">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-5xl flex-col gap-9 px-6 py-16 md:py-[72px]">
          <h2 className="font-serif text-2xl font-semibold text-ink md:text-3xl">온기는 이렇게 써요</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map(([step, title, body]) => (
              <div key={step} className="flex gap-4">
                <span className="font-serif text-4xl leading-none font-semibold text-neutral-400">{step}</span>
                <div>
                  <h3 className="font-serif text-[17px] font-semibold text-ink">{title}</h3>
                  <p className="mt-1.5 text-sm leading-[1.7] text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-divider bg-warm">
          <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 md:py-[72px]">
            <div className="flex flex-col gap-2.5">
              <h2 className="font-serif text-2xl font-semibold text-ink md:text-3xl">아기의 하루를 담는 데 필요한 것만</h2>
              <p className="text-[15px] leading-[1.7] text-muted">사진, 앨범, 일정, 대화. 복잡한 기능 없이 가족이 쓰는 네 가지예요.</p>
            </div>
            <div className="grid gap-10 sm:grid-cols-3">
              {SHOTS.map(([src, alt, title, body]) => (
                <figure key={src} className="flex flex-col items-center gap-4">
                  <PhoneShot src={src} alt={alt} size="sm" />
                  <figcaption className="text-center">
                    <p className="font-serif text-base font-semibold text-ink">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
            {/* 5장 — 넓은 화면은 윗줄 3장·아랫줄 2장, 중간 폭은 2열에 마지막 장이 한 줄을 채워 빈 칸이 없게 */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
              {FEATURES.map(({ Icon, title, body }, i) => (
                <article
                  key={title}
                  className={`flex flex-col gap-3 rounded-lg border border-divider bg-bg p-6 ${i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'} ${i === FEATURES.length - 1 ? 'sm:col-span-2' : ''}`}
                >
                  <Icon className="h-[22px] w-[22px] text-ink" strokeWidth={1.5} aria-hidden />
                  <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
                  <p className="text-sm leading-[1.7] text-muted">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:gap-10 md:py-[72px]">
          <PhoneShot src="/landing/family.jpg" alt="온기 앱 가족 탭 — 구성원과 초대 코드" size="md" />
          <div className="flex flex-col gap-6 md:max-w-md">
            <h2 className="font-serif text-2xl leading-snug font-semibold text-ink md:text-3xl md:leading-snug">
              할머니 할아버지도
              <br />
              어렵지 않아요
            </h2>
            <ul className="flex flex-col gap-4">
              {EASY.map(([title, body]) => (
                <li key={title} className="flex items-start gap-3">
                  <Check className="mt-1 h-[18px] w-[18px] shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
                  <div>
                    <p className="font-serif text-base font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 text-sm leading-[1.6] text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-ink text-bg">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-7 px-6 py-20 text-center">
            <h2 className="font-serif text-3xl leading-snug font-semibold md:text-[34px]">
              오늘 찍은 사진,
              <br />
              오늘 가족에게
            </h2>
            <p className="max-w-xl text-[15px] leading-[1.7] text-white/70">공간을 만들고 초대 코드를 보내면 바로 시작이에요. 무료예요.</p>
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <LandingCta variant="inverse" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-divider">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-[11px] leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>아트인포 · 대표 임성준 · 서울특별시 서초구 동광로 12가길 13 4층 401호 · 사업자등록번호 329-35-01197</p>
          <p className="flex gap-3">
            <Link href="/legal/terms" className="hover:underline">
              이용약관
            </Link>
            <Link href="/legal/privacy" className="hover:underline">
              개인정보 처리방침
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
