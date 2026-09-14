import { post, put, request } from './client';

/** 관리자 API (/ongi/admin) — 서버가 매 요청 등급을 확인한다. 권한 없으면 403 */

export type AdminType = 'ADMIN' | 'SUPER_ADMIN';
export type AdminPermission = 'dashboard' | 'reports' | 'directory' | 'configs' | 'grant' | 'sensitive';

export interface AdminMe {
  userId: string;
  name: string;
  type: AdminType;
  permissions: AdminPermission[];
}

export interface AdminDashboard {
  totals: { users: number; newUsers7d: number; groups: number; photos: number; videos: number; comments: number; openReports: number };
  signups: { day: string; count: number }[];
}

export interface AdminReport {
  id: string;
  status: 'open' | 'resolved';
  reason: string;
  createdAt: string;
  reporter: { userId: string; name: string | null };
  targetType: 'photo' | 'comment' | 'member';
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
  createdAt: string;
  deletedAt: string | null;
  groupCount: number;
  photoCount: number;
}

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

export const getReports = (status: 'open' | 'resolved' | 'all', page: number) =>
  request<{ reports: AdminReport[] }>(`/ongi/admin/reports${qs({ status: status === 'all' ? undefined : status, page })}`).then((r) => r.reports);
export const setReportStatus = (id: string, status: 'open' | 'resolved') => put<{ ok: boolean }>(`/ongi/admin/reports/${id}/status`, { status });
export const removeReportTarget = (id: string) => post<{ ok: boolean }>(`/ongi/admin/reports/${id}/remove-target`);

export const getUsers = (q: string, page: number) => request<{ users: AdminUser[] }>(`/ongi/admin/users${qs({ q, page })}`).then((r) => r.users);
export const getUser = (id: string) => request<AdminUserDetail>(`/ongi/admin/users/${id}`);
export const setUserType = (id: string, type: 'USER' | 'ADMIN') => put<{ ok: boolean }>(`/ongi/admin/users/${id}/type`, { type });

export const getGroups = (q: string, page: number) => request<{ groups: AdminGroup[] }>(`/ongi/admin/groups${qs({ q, page })}`).then((r) => r.groups);
export const getGroup = (id: string) => request<AdminGroupDetail>(`/ongi/admin/groups/${id}`);

export const getConfigs = () => request<{ configs: AdminConfig[] }>('/ongi/admin/configs').then((r) => r.configs);
export const setConfig = (key: string, value: string) => put<{ ok: boolean }>('/ongi/admin/configs', { key, value });
