# ongi-web

온기 웹 (Next.js 16 App Router, Tailwind v4, TanStack Query, zustand). 구조·환경 변수는 README.md 참고.

> **지금 운영하는 건 랜딩 페이지(`src/app/page.tsx`)뿐이다.** `(app)` 그룹의 웹 앱 클라이언트(피드·앨범·사진·업로드)는 더 이상 운영하지 않는다 — 앱(`../ongi`) 기능을 고칠 때 여기까지 따라 고치지 말 것. `(app)` 을 손대야 할 일이 생기면 먼저 확인받는다.

- 백엔드 API 는 `../artinfo-server/src/ongi` — 응답은 `{code,message,item}` 봉투, `lib/api/client.ts` 가 item 만 반환.
- 도메인 타입(`src/types`)과 쿼리 키 구조는 iOS 앱(`../ongi/src`)과 맞춰 유지한다. API 를 바꾸면 양쪽을 같이 수정.
- 디자인 토큰은 `globals.css` `@theme` 에 정의(앱 `theme/index.ts` 와 1:1). 세리프 헤딩(`font-serif`), 헤어라인 구분선, 외곽선 버튼이 기본 문법.
- 앱 화면은 `(app)` 그룹 안에 두면 AuthGuard 와 AppShell 이 자동 적용된다. 페이지 파일은 서버 컴포넌트로 두고 화면 본체는 `*Screen.tsx`(client) 로 분리.
- 확인/입력/액션 시트는 `useDialog()` (components/ui/Dialog) 를 쓴다 — window.confirm 금지.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## AI 개발 프로세스 (온기) — 모든 작업은 이 순서를 따른다

**흐름**: ① 요청(기대값 포함) → ② 테스트 먼저(서버 로직) → ③ 구현 → ④ PR(스펙 요약) → ⑤ AI 리뷰 → ⑥ 사람 리뷰(플래그·테스트 변경만) → ⑦ CI 통과 시 머지 → ⑧ 배포 후 확인. 모든 변경은 브랜치 → PR 로만 머지한다 (main 직푸시는 브랜치 보호가 차단).

- 랜딩 작업만 이 레포에서 한다. 온기 기능(피드·앨범·푸시 등)은 앱(`../ongi`) + 서버(`../artinfo-server`) 에서 처리한다.
- 커밋 전 게이트: `npx tsc --noEmit` · `npx eslint src` 모두 통과 — CI 가 같은 검사를 강제한다.
- 테스트가 실패하면 테스트를 고치지 말고 구현을 의심할 것. 기대값 수정은 사유와 함께 별도 커밋으로만.
