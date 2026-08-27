# ongi-web

온기(ONGI) 가족 사진 공유 서비스의 **웹 클라이언트**. Next.js(App Router) + Tailwind CSS v4.
백엔드는 `artinfo-server` 의 `/ongi/*` API 를 iOS 앱(`../ongi`)과 그대로 공유한다.

## 실행

```bash
cp .env.example .env.local   # NEXT_PUBLIC_GOOGLE_CLIENT_ID 채우기
npm install
npm run dev                  # http://localhost:3000
```

| 환경 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | artinfo-server 주소 (기본 운영 서버) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud "웹 애플리케이션" OAuth 클라이언트 ID. 승인된 JavaScript 원본에 `http://localhost:3000` 과 배포 도메인을 등록해야 팝업이 뜬다 |
| `NEXT_PUBLIC_DEV_LOGIN` | `true` 면 토큰 없는 개발용 로그인 버튼 노출 (서버 `.env` 에 `ONGI_DEV_LOGIN=true` 필요) |

## 구조

```
src/
├── app/                      # 라우트 (App Router)
│   ├── page.tsx              # /            공개 랜딩
│   ├── (auth)/login/         # /login       구글 로그인 (로그인 상태면 /feed 로)
│   ├── (app)/                # 로그인 필요 — AuthGuard + AppShell(사이드바/하단 탭)
│   │   ├── feed/             # /feed        날짜순 피드
│   │   ├── albums/           # /albums, /albums/[id] (all·unfiled 는 가상 앨범)
│   │   ├── photos/[id]/      # 사진 상세 · 댓글 · 신고/차단
│   │   ├── family/           # 구성원 · 초대 코드
│   │   ├── groups/           # 가족 공간 전환 · 만들기 · 참여
│   │   ├── upload/           # 사진 올리기 (브라우저 크롭 → S3 → 게시)
│   │   └── profile/          # 프로필 · 약관 · 로그아웃 · 탈퇴
│   └── legal/[slug]/         # 약관·개인정보 처리방침 (공개)
├── components/
│   ├── ui/                   # Button, Avatar, Tag, Input, Dialog(confirm/prompt/actions), State
│   ├── layout/               # AuthGuard, AppShell
│   ├── feed/ photos/         # FeedPost, PhotoGrid, usePhotoActions
│   └── landing/ providers/
├── lib/
│   ├── api/                  # 서버 호출 — client(봉투 언랩·401 refresh), token, auth, google, 도메인별 모듈
│   ├── queries/              # TanStack Query 훅 (앱의 hooks/queries 와 동일 키 구조)
│   ├── store/session.ts      # zustand 세션 (복원 8초 타임아웃, 활성 그룹 localStorage)
│   └── utils/                # image(크롭·JPEG), format, cn
└── types/                    # 도메인 타입 — 앱 ongi/src/types 와 동일하게 유지
```

## 앱과의 차이

- 로그인은 구글만 제공 (웹에는 Apple 로그인을 두지 않기로 결정).
- 사진 전처리(중앙 크롭·리사이즈·JPEG)는 브라우저 `createImageBitmap` + canvas 로 처리. HEIC 처럼 브라우저가 못 여는 파일은 원본을 그대로 올린다.
- 페이지는 모두 클라이언트 렌더(토큰이 localStorage 에 있어 SSR 로 데이터를 가져오지 않음). 랜딩·약관만 서버 컴포넌트.
