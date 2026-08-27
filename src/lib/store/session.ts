import { create } from 'zustand';
import { fetchMe, signOut as signOutApi, type AuthUser } from '@/lib/api/auth';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { loadTokens } from '@/lib/api/token';

const RESTORE_TIMEOUT_MS = 8_000;
const ACTIVE_GROUP_KEY = 'ongi.activeGroupId';

interface SessionState {
  /** 저장된 토큰으로 세션 복원 중 — 완료 전엔 보호 화면을 그리지 않는다 */
  isHydrating: boolean;
  isAuthenticated: boolean;
  currentUserId: string;
  currentUserName: string;
  /** 지금 보고 있는 가족 공간 — 모든 콘텐츠가 이 그룹 기준 */
  activeGroupId: string;
  restore: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  setCurrentUserName: (name: string) => void;
  setActiveGroup: (groupId: string) => void;
  signOut: () => void;
}

function readActiveGroup(): string {
  try {
    return window.localStorage.getItem(ACTIVE_GROUP_KEY) ?? '';
  } catch {
    return '';
  }
}

export const useSession = create<SessionState>((set) => ({
  isHydrating: true,
  isAuthenticated: false,
  currentUserId: '',
  currentUserName: '',
  activeGroupId: '',
  restore: async () => {
    try {
      const tokens = loadTokens();
      if (!tokens) return;
      const me = await Promise.race([
        fetchMe(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), RESTORE_TIMEOUT_MS)),
      ]);
      set({ isAuthenticated: true, currentUserId: me.id, currentUserName: me.name, activeGroupId: readActiveGroup() });
    } catch (e) {
      if (!(e instanceof Error && e.message === 'timeout')) signOutApi();
    } finally {
      set({ isHydrating: false });
    }
  },
  setUser: (user) =>
    set({ isAuthenticated: true, currentUserId: user.id, currentUserName: user.name, activeGroupId: readActiveGroup() }),
  setCurrentUserName: (name) => set({ currentUserName: name }),
  setActiveGroup: (groupId) => {
    try {
      window.localStorage.setItem(ACTIVE_GROUP_KEY, groupId);
    } catch {
      // 무시
    }
    set({ activeGroupId: groupId });
  },
  signOut: () => {
    signOutApi();
    set({ isAuthenticated: false, currentUserId: '', currentUserName: '', activeGroupId: '' });
  },
}));

// refresh 까지 실패한 세션은 즉시 로그아웃 — 에러만 뿌리는 좀비 상태 방지
setUnauthorizedHandler(() => {
  if (useSession.getState().isAuthenticated) useSession.getState().signOut();
});

export const useActiveGroupId = () => useSession((s) => s.activeGroupId);
