import type { ReportTargetType } from '@/types';
import { post } from './client';

/** 부적절한 사진·댓글·구성원 신고 — 운영진이 24시간 내 검토 */
export const report = (p: { targetType: ReportTargetType; targetId: string; reason: string }) =>
  post<null>('/ongi/reports', p);
