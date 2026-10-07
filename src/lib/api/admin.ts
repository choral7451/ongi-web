import { del, post, put, request } from './client';

/** 관리자 API (/ongi/admin) — 서버가 매 요청 등급을 확인한다. 권한 없으면 403 */

export type AdminType = 'ADMIN' | 'SUPER_ADMIN';
export type AdminPermission = 'dashboard' | 'reports' | 'inquiries' | 'directory' | 'configs' | 'grant' | 'sensitive' | 'photos' | 'deleteGroup';

export interface AdminMe {
  userId: string;
  name: string;
  type: AdminType;
  permissions: AdminPermission[];
}

export interface AdminDashboard {
  totals: { users: number; newUsers7d: number; groups: number; photos: number; videos: number; comments: number; openReports: number; openInquiries: number };
  signups: { day: string; count: number }[];
}

export interface AdminStatsDaily {
  day: string;
  activeUsers: number;
  /** 앱이 사용 시간을 보낸 사용자 수 (1.0.10 이상) */
  measuredUsers: number;
  /** 시간을 잰 사용자 1명당 평균 사용 시간(초) */
  avgSeconds: number;
  sessions: number;
  signups: number;
  photos: number;
  comments: number;
  chatMessages: number;
}

export interface AdminShare {
  cohort: number;
  count: number;
  rate: number;
}

export interface AdminMixShare {
  count: number;
  rate: number;
}

/** 지표 — 날짜는 한국 시간, 테스트 계정은 빠져 있다 */
export interface AdminStats {
  today: string;
  /** 접속 기록을 시작한 날 — 그 전의 접속 지표는 없다 */
  trackingSince: string | null;
  active: { dau: number; wau: number; mau: number; stickiness: number };
  daily: AdminStatsDaily[];
  engagement: { measuredUserDays: number; avgSecondsPerUser: number; avgSessionsPerUser: number; avgSecondsPerSession: number };
  /** rate 가 null 이면 아직 대상자가 없다 */
  retention: { days: number; cohort: number; retained: number; rate: number | null }[];
  /** 재방문율을 역할로 나눠서 — admin(공간을 만든 사람) · member(초대받은 사람) · none(공간 없음). 구서버 응답에는 없다 */
  retentionByRole?: { role: 'admin' | 'member' | 'none'; retention: AdminStats['retention'] }[];
  /** 7일 안 활성화 — 만든 지 7일 지난 공간 중 두 번째 가족 합류, 가입 7일 지난 사용자 중 첫 사진 (최근 30일) */
  activation?: { windowDays: number; secondMember: AdminShare; firstPhoto: AdminShare };
  /** 최근 7일 접속자가 며칠 왔는지 — 1일부터 7일까지 */
  visitDays?: { days: number; users: number }[];
  /** 최근 7일 접속자 = 신규 + 기존 + 부활 */
  activeMix?: { total: number; newUsers: AdminMixShare; existing: AdminMixShare; resurrected: AdminMixShare };
  spaces: { total: number; solo: number; soloRate: number; active7d: number; activeRate: number; avgMembers: number };
  funnel: { users: number } & Record<'withGroup' | 'withPhoto' | 'withChat' | 'withPush', { count: number; rate: number }>;
  platforms: { platform: string; users: number }[];
  versions: { version: string; users: number }[];
  excludedTestUsers?: number;
}

export interface AdminReport {
  id: string;
  status: 'open' | 'resolved';
  reason: string;
  createdAt: string;
  reporter: { userId: string; name: string | null };
  targetType: 'photo' | 'comment' | 'member' | 'chat_message';
  targetId: string;
  targetDeleted: boolean;
  targetName: string | null;
  targetUserId: string | null;
  group: { id: string; name: string } | null;
  photo: { id: string; url: string | null; thumbUrl: string | null; mediaType: string; caption: string | null } | null;
  commentText: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  /** 민감 정보 권한이 없으면 가려진 값 */
  email: string | null;
  /** 민감 정보 권한이 없으면 null */
  snsType: string | null;
  type: 'USER' | AdminType;
  /** 테스트 계정 — 운영 현황 · 지표 수치에서 빠진다 */
  isTest?: boolean;
  createdAt: string;
  deletedAt: string | null;
  /** 마지막 접속 — 접속 기록을 시작한(2026-09-29) 뒤로 접속하지 않았으면 null */
  lastSeenAt?: string | null;
  groupCount: number;
  photoCount: number;
  /** 소속 공간 (들어온 순) */
  groups?: { groupId: string; groupName: string; memberName: string; role: string }[];
}

export type AdminUserSort = 'joined' | 'seen';

export interface AdminUserDetail {
  user: AdminUser;
  groups: { groupId: string; groupName: string; memberName: string; role: string; joinedAt: string }[];
}

export interface AdminGroup {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  photoCount: number;
  lastPhotoAt: string | null;
}

export interface AdminGroupDetail {
  group: AdminGroup;
  members: { memberId: string; userId: string; name: string; role: string; joinedAt: string; photoCount: number }[];
}

export interface AdminPhoto {
  id: string;
  groupId: string;
  groupName: string;
  authorName: string | null;
  authorUserId: string | null;
  url: string;
  thumbUrl: string | null;
  mediaType: string;
  caption: string | null;
  createdAt: string;
}

export interface AdminAccessLog {
  id: string;
  adminUserId: string;
  adminName: string | null;
  action: string;
  targetType: 'group' | 'user';
  targetId: string;
  targetName: string | null;
  createdAt: string;
}

export interface AdminInquiry {
  id: string;
  status: 'open' | 'answered';
  /** 민감 정보 권한이 없으면 이메일은 가려진 값 */
  user: { id: string; name: string | null; email: string | null };
  content: string;
  /** null 답변 전 · '' 답변 없이 완료 */
  answer: string | null;
  answeredByName: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface AdminConfig {
  key: string;
  value: string;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : '';
};

export const getMe = () => request<AdminMe>('/ongi/admin/me');
export const getDashboard = () => request<AdminDashboard>('/ongi/admin/dashboard');
export const getStats = () => request<AdminStats>('/ongi/admin/stats');

export const getReports = (status: 'open' | 'resolved' | 'all', page: number) =>
  request<{ reports: AdminReport[] }>(`/ongi/admin/reports${qs({ status: status === 'all' ? undefined : status, page })}`).then((r) => r.reports);
export const setReportStatus = (id: string, status: 'open' | 'resolved') => put<{ ok: boolean }>(`/ongi/admin/reports/${id}/status`, { status });
export const removeReportTarget = (id: string) => post<{ ok: boolean }>(`/ongi/admin/reports/${id}/remove-target`);

export const getUsers = (q: string, page: number, sort: AdminUserSort = 'joined') =>
  request<{ users: AdminUser[] }>(`/ongi/admin/users${qs({ q, page, sort: sort === 'joined' ? undefined : sort })}`).then((r) => r.users);
export const getUser = (id: string) => request<AdminUserDetail>(`/ongi/admin/users/${id}`);
export const setUserType = (id: string, type: 'USER' | 'ADMIN') => put<{ ok: boolean }>(`/ongi/admin/users/${id}/type`, { type });
export const setUserTest = (id: string, isTest: boolean) => put<{ ok: boolean }>(`/ongi/admin/users/${id}/test`, { isTest });

export const getGroups = (q: string, page: number) => request<{ groups: AdminGroup[] }>(`/ongi/admin/groups${qs({ q, page })}`).then((r) => r.groups);
export const getGroup = (id: string) => request<AdminGroupDetail>(`/ongi/admin/groups/${id}`);
/** 가족 공간 삭제 — 구성원·앨범·사진·댓글·일정까지 소프트 삭제, 서버가 삭제 기록을 남긴다 */
export const deleteGroup = (id: string) => del(`/ongi/admin/groups/${id}`);

export const getConfigs = () => request<{ configs: AdminConfig[] }>('/ongi/admin/configs').then((r) => r.configs);
export const setConfig = (key: string, value: string) => put<{ ok: boolean }>('/ongi/admin/configs', { key, value });

/** 가족 사진 열람 — 서버가 조회마다 열람 기록을 남긴다 */
export const getGroupPhotos = (id: string, page: number) =>
  request<{ photos: AdminPhoto[] }>(`/ongi/admin/groups/${id}/photos${qs({ page })}`).then((r) => r.photos);
export const getUserPhotos = (id: string, page: number) =>
  request<{ photos: AdminPhoto[] }>(`/ongi/admin/users/${id}/photos${qs({ page })}`).then((r) => r.photos);
export const getAccessLogs = (page: number) => request<{ logs: AdminAccessLog[] }>(`/ongi/admin/access-logs${qs({ page })}`).then((r) => r.logs);

export const getInquiries = (status: 'open' | 'answered' | 'all', page: number) =>
  request<{ inquiries: AdminInquiry[] }>(`/ongi/admin/inquiries${qs({ status: status === 'all' ? undefined : status, page })}`).then((r) => r.inquiries);
/** 답변 작성·수정 — 빈 문자열이면 답변 없이 완료 처리. 내용 있는 첫 답변이면 서버가 문의자에게 푸시를 보낸다 */
export const answerInquiry = (id: string, answer: string) => put<{ ok: boolean }>(`/ongi/admin/inquiries/${id}/answer`, { answer });
