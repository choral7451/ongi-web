import type { FamilyEvent } from '@/types';
import { del, post, put, request } from './client';

export interface SaveEventPayload {
  title: string;
  /** calendarType 기준 날짜 YYYY-MM-DD */
  date: string;
  /** HH:MM — null 이면 하루 종일 */
  time: string | null;
  calendarType: 'solar' | 'lunar';
  repeatType: 'none' | 'weekly' | 'monthly' | 'yearly';
  memo: string | null;
  /** 등록·리마인드 푸시를 받을 사용자 id 목록 */
  notifyUserIds: string[];
}

/** [from, to] 범위의 발생일 목록 (양력) — 반복 일정은 발생일마다 한 건 */
export async function getEvents(groupId: string, from: string, to: string): Promise<FamilyEvent[]> {
  const result = await request<{ events: FamilyEvent[] }>(`/ongi/groups/${groupId}/events?from=${from}&to=${to}`);
  return result.events;
}

export const createEvent = (groupId: string, payload: SaveEventPayload) => post<FamilyEvent>(`/ongi/groups/${groupId}/events`, payload);

export const updateEvent = (eventId: string, payload: SaveEventPayload) => put<FamilyEvent>(`/ongi/events/${eventId}`, payload);

export const deleteEvent = (eventId: string) => del(`/ongi/events/${eventId}`);
