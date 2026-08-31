/** 도메인 모델 — artinfo-server /ongi/* 응답 스키마와 1:1. 모바일 앱(ongi/src/types)과 동일하게 유지한다 */

export type MemberRole = 'admin' | 'member' | 'pending';

/**
 * 그룹(가족 공간) — 사진·앨범·구성원이 전부 그룹 단위로 분리됩니다.
 * 한 계정이 여러 그룹에 속할 수 있습니다 (예: 우리집 / 외갓집).
 */
export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  inviteExpiresInDays: number;
  memberCount: number;
  photoCount: number;
  sinceLabel: string;
}

/** 그룹 구성원 — 호칭(name)은 그룹마다 다를 수 있어 그룹 소속 데이터입니다 */
export interface Member {
  id: string;
  groupId: string;
  /** 이 그룹 안에서 부르는 이름 (예: 엄마) */
  name: string;
  /** 실명 (예: 수진) */
  realName?: string;
  role: MemberRole;
  photoCount: number;
  avatarUrl?: string;
  /** 내가 이 구성원을 차단했는지 — 차단한 사람의 사진·댓글은 나에게 보이지 않는다 */
  blockedByMe?: boolean;
  /** 이 구성원 레코드가 나(로그인 사용자)인지 */
  isMe?: boolean;
}

/** 인물 태그 대상 (구성원이 아닌 아이 등 포함) */
export interface Person {
  id: string;
  groupId: string;
  name: string;
  photoCount: number;
  imageUrl?: string;
}

export interface Album {
  id: string;
  groupId: string;
  title: string;
  coverUrl: string;
  photoCount: number;
  /** 목록에 보여줄 부가 정보 (예: "8월", "매주 업데이트") */
  meta: string;
}

export interface Photo {
  id: string;
  groupId: string;
  url: string;
  /** 목록용 축소본 URL — 없으면(구버전 사진) url 사용 */
  thumbUrl?: string;
  /** 세로 비율 힌트 (width/height) — 피드 레이아웃용 */
  aspectRatio: number;
  authorId: string;
  albumId?: string;
  caption?: string;
  location?: string;
  createdAt: string; // ISO
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  /** 함께 찍힌 인물 id 목록 */
  personIds: string[];
}

export interface Comment {
  id: string;
  photoId: string;
  authorId: string;
  text: string;
  createdAt: string; // ISO
}

export interface ProfileStats {
  photoCount: number;
  albumCount: number;
  familyCount: number;
}

/** 신고 대상 종류 */
export type ReportTargetType = 'photo' | 'comment' | 'member';

/** 약관·정책 문서 */
export interface LegalDoc {
  slug: 'terms' | 'privacy';
  title: string;
  updatedAt: string; // "2026년 1월 1일" 형태의 표시용 문자열
  body: string;
}
