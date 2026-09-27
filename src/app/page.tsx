import { CalendarDays, Heart, Images, Lock, MessageCircle, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { DOWNLOAD_SECTION_ID, LandingCta } from '@/components/landing/LandingCta';
import { SITE_DESCRIPTION, SITE_OPEN_GRAPH, SITE_TITLE, SITE_URL } from '@/lib/site';
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/lib/utils/invite';

// 탭 제목은 레이아웃에서 '온기'로 고정 — 랜딩만 검색 결과에 보일 제목을 따로 준다
export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  alternates: { canonical: '/' },
  openGraph: { ...SITE_OPEN_GRAPH, url: '/' },
};

const FEATURES = [
  { Icon: Users, title: '초대한 사람만 들어와요', body: '초대 코드로만 들어올 수 있어요. 가족, 커플, 친구 모임 — 공간을 여러 개 만들어 따로 나눠요.' },
  { Icon: Images, title: '우리끼리 사진첩', body: '사진과 영상을 한 번에 올리면 날짜순으로 쌓이고, 여행·기념일 앨범으로 정리돼요.' },
  { Icon: MessageCircle, title: '1:1도, 여럿이서도 대화', body: '공간 사람과 바로 대화해요. 다른 공간 사람도 한 방에 초대하고, 누가 읽었는지 바로 보여요.' },
  { Icon: CalendarDays, title: '함께 챙기는 일정', body: '생일, 기념일, 모임 날짜를 등록하면 함께 알림을 받아요. 음력·매년 반복도 돼요.' },
  { Icon: Heart, title: '따뜻해요와 한마디', body: '멀리 있어도 사진 한 장에 마음을 남겨요. 좋아요 대신 "따뜻해요".' },
  { Icon: Lock, title: '안심하고 나누기', body: '올린 사진과 대화는 공간 밖으로 공개되지 않고, 탈퇴하면 올린 사진이 삭제돼요.' },
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

/** 공개 랜딩 — 웹은 소개 전용, 이용은 앱에서 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, '\\u003c') }} />
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="inline-block origin-left scale-x-[1.15] text-2xl leading-none font-bold tracking-[0.12em] text-ink [font-family:var(--font-logo),sans-serif]">ONGI</span>
        <nav className="flex items-center gap-5 text-sm text-neutral-700" aria-label="상단 메뉴">
          <a href="#features" className="hidden hover:text-ink sm:inline">
            소개
          </a>
          <LandingCta variant="header" />
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-6 pt-14 pb-16 md:grid-cols-[1fr_auto] md:gap-16 md:pt-20 md:pb-24">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <p className="mb-4 text-[11px] tracking-[0.2em] text-accent">우리끼리만 나누는 곳</p>
            <h1 className="font-serif text-4xl leading-tight font-semibold text-ink md:text-6xl">
              소중한 사람들과
              <br />
              우리끼리, 한곳에
            </h1>
            <div className="my-6 h-px w-14 bg-accent-300" />
            <p className="max-w-xl text-base leading-7 text-muted">
              온기는 초대한 사람만 들어올 수 있는 공간이에요. 가족, 연인, 친한 친구와 사진을 모으고, 일정을 챙기고, 대화를 나눠요.
              밖으로는 보이지 않는 우리만의 이야기.
            </p>
            <div id={DOWNLOAD_SECTION_ID} className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <LandingCta variant="hero" />
            </div>
            <p className="mt-4 text-xs text-neutral-500">Apple·카카오·구글 계정으로 3초 만에 시작해요</p>
          </div>
          <div className="mx-auto w-[240px] shrink-0 rounded-[36px] border border-divider bg-white p-2 shadow-[0_24px_60px_-24px_rgba(16,17,20,0.25)] md:w-[280px]">
            <Image
              src="/landing/01-home.webp"
              alt="온기 앱 홈 피드 화면"
              width={640}
              height={1386}
              priority
              className="w-full rounded-[28px]"
            />
          </div>
        </section>

        <section id="features" className="border-t border-divider bg-neutral-100/60">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <article key={title} className="flex flex-col gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-divider bg-bg text-accent">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
                <p className="text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['/landing/03-album-all.webp', '모든 순간을 한눈에', '함께 올린 사진이 앨범으로 차곡차곡 모여요.'],
              // TODO: 채팅 화면 스크린샷이 생기면 이 칸을 '우리끼리 대화' (1:1도 그룹도, 안 읽은 사람 수까지 한눈에.) 로 바꾼다
              ['/landing/02-albums.webp', '여행·기념일 앨범 정리', '여행, 기념일, 모임을 앨범으로 나눠 담아요.'],
              ['/landing/05-schedule.webp', '일정까지 한곳에', '기념일과 모임을 등록하고 함께 챙겨요.'],
              ['/landing/04-family.webp', '초대 코드 하나면 끝', '코드를 보내면 바로 함께해요.'],
            ].map(([src, title, body]) => (
              <figure key={src} className="flex flex-col items-center gap-4">
                <div className="w-[200px] rounded-[30px] border border-divider bg-white p-1.5 shadow-[0_18px_44px_-20px_rgba(16,17,20,0.22)]">
                  <Image src={src} alt={title} width={640} height={1386} className="w-full rounded-[24px]" />
                </div>
                <figcaption className="text-center">
                  <p className="font-serif text-base font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="border-t border-divider">
          <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              ['1', '공간 만들기', '계정으로 시작하고 "우리 가족", "우리 둘", "대학 동기"처럼 이름을 붙여 공간을 만들어요.'],
              ['2', '초대 코드 나누기', '초대 코드를 메신저로 보내면 코드 입력만으로 바로 들어와요.'],
              ['3', '사진·일정·대화 나누기', '사진을 올리고, 일정을 챙기고, 대화를 나눠요.'],
            ].map(([step, title, body]) => (
              <div key={step} className="flex gap-4">
                <span className="font-serif text-3xl font-semibold text-accent-300">{step}</span>
                <div>
                  <h3 className="font-serif text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
                </div>
              </div>
            ))}
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
            <a href="mailto:artinfokorea2022@gmail.com" className="hover:underline">
              문의
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
