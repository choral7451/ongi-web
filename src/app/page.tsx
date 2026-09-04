import { Heart, Images, Lock, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { LandingCta } from '@/components/landing/LandingCta';
import { LandingRedirect } from '@/components/landing/LandingRedirect';

const FEATURES = [
  { Icon: Users, title: '가족만의 비공개 공간', body: '초대 코드로만 들어올 수 있어요. 우리 가족끼리만 보는 사진첩이에요.' },
  { Icon: Images, title: '날짜순 피드와 앨범', body: '오늘 올라온 사진부터 차곡차곡. 여행, 명절, 아이 성장 앨범으로 정리해요.' },
  { Icon: Heart, title: '따뜻해요와 한마디', body: '멀리 있어도 사진 한 장에 마음을 남겨요. 좋아요 대신 "따뜻해요".' },
  { Icon: Lock, title: '안심하고 나누기', body: '사진은 초대된 구성원에게만 공개되고, 탈퇴하면 올린 사진이 모두 삭제돼요.' },
];

/** 공개 랜딩 — 로그인 전 첫 화면. 로그인 상태면 피드로 리다이렉트 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingRedirect />
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
            <p className="mb-4 text-[11px] tracking-[0.2em] text-accent">우리 가족의 오늘을 담는 곳</p>
            <h1 className="font-serif text-4xl leading-tight font-semibold text-ink md:text-6xl">
              흩어져 있는 가족의
              <br />
              하루를 한곳에
            </h1>
            <div className="my-6 h-px w-14 bg-accent-300" />
            <p className="max-w-xl text-base leading-7 text-muted">
              온기는 가족만 들어올 수 있는 사진 공간이에요. 부모님 폰에도, 형제 폰에도 흩어진 사진을 한곳에 모으고, 서로의 오늘에
              따뜻한 한마디를 남겨보세요.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <LandingCta variant="hero" />
            </div>
            <p className="mt-4 text-xs text-neutral-500">카카오·구글 계정으로 3초 만에 시작 · 웹에서도 이어서 볼 수 있어요</p>
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
          <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid gap-10 sm:grid-cols-3">
            {[
              ['/landing/03-album-all.webp', '모든 사진을 한눈에', '가족이 올린 사진이 앨범으로 차곡차곡 모여요.'],
              ['/landing/04-family.webp', '초대 코드 하나면 끝', '6자리 코드를 보내면 부모님도 바로 함께해요.'],
              ['/landing/02-albums.webp', '여행·성장 앨범 정리', '여행, 명절, 아이 성장을 앨범으로 나눠 담아요.'],
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
              ['1', '가족 공간 만들기', '카카오나 구글 계정으로 시작하고 "김씨네 온기" 같은 이름으로 공간을 만들어요.'],
              ['2', '초대 코드 나누기', '6자리 초대 코드를 가족 채팅방에 보내면, 코드 입력만으로 바로 참여해요.'],
              ['3', '사진 올리고 마음 남기기', '오늘 찍은 사진을 올리고, 가족이 남긴 따뜻해요와 한마디를 확인해요.'],
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
