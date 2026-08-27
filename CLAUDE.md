# ongi-web

온기 웹 클라이언트 (Next.js 16 App Router, Tailwind v4, TanStack Query, zustand). 구조·환경 변수는 README.md 참고.

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
