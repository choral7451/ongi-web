'use client';

import { Bell, Calendar, ChevronLeft, ChevronRight, Plus, RotateCw, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { Input, Textarea } from '@/components/ui/Input';
import { useCreateEvent, useDeleteEvent, useEventsRange, useFamily, useMembers, useUpdateEvent } from '@/lib/queries';
import { cn } from '@/lib/utils/cn';
import {
  REPEAT_LABELS,
  addMonths,
  daysUntil,
  ddayLabel,
  formatKoreanDate,
  formatKoreanTime,
  lastDayOf,
  monthMatrix,
  monthOf,
  todayStr,
} from '@/lib/utils/calendar';
import type { FamilyEvent } from '@/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface FormState {
  eventId?: string;
  title: string;
  date: string;
  allDay: boolean;
  time: string;
  calendarType: 'solar' | 'lunar';
  repeatType: 'none' | 'weekly' | 'monthly' | 'yearly';
  memo: string;
  /** null = 아직 손대지 않음 → 전체 선택으로 간주 */
  notifyUserIds: string[] | null;
}

const emptyForm = (date: string): FormState => ({
  title: '',
  date,
  allDay: true,
  time: '12:00',
  calendarType: 'solar',
  repeatType: 'none',
  memo: '',
  notifyUserIds: null,
});

/** 가족 일정 — 월 달력 + 선택한 날짜의 일정 목록 (앱 schedule 화면과 동일) */
export function ScheduleScreen() {
  const dialog = useDialog();
  const alertError = useAlertError();
  const family = useFamily();
  const members = useMembers();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // 배너에서 ?date= 로 들어오면 그 날짜부터 — 없으면 오늘
  const searchParams = useSearchParams();
  const paramDate = searchParams.get('date') ?? '';
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(paramDate) ? paramDate : todayStr();
  const [month, setMonth] = useState(monthOf(initialDate));
  const [selected, setSelected] = useState(initialDate);
  const [form, setForm] = useState<FormState | null>(null);
  const [detail, setDetail] = useState<FamilyEvent | null>(null);

  const events = useEventsRange(`${month}-01`, lastDayOf(month));
  const marked = useMemo(() => new Set((events.data ?? []).map((e) => e.date)), [events.data]);
  const dayEvents = useMemo(() => (events.data ?? []).filter((e) => e.date === selected), [events.data, selected]);

  const me = members.data?.find((m) => m.isMe);
  const allUserIds = useMemo(() => (members.data ?? []).map((m) => m.userId), [members.data]);
  const canEdit = (event: FamilyEvent) => me != null && (event.creatorUserId === me.userId || me.role === 'admin');

  const today = todayStr();
  const weeks = monthMatrix(month);
  const [year, monthNo] = month.split('-').map(Number);

  const openCreate = () => setForm(emptyForm(selected));
  const openEdit = (event: FamilyEvent) => {
    setDetail(null);
    setForm({
      eventId: event.id,
      title: event.title,
      date: event.sourceDate,
      allDay: event.time == null,
      time: event.time ?? '12:00',
      calendarType: event.calendarType,
      repeatType: event.repeatType,
      memo: event.memo ?? '',
      notifyUserIds: event.notifyUserIds ?? [],
    });
  };

  const saving = createEvent.isPending || updateEvent.isPending;

  const submit = async () => {
    if (!form) return;
    const title = form.title.trim();
    if (!title) {
      await dialog.alert('제목을 입력해 주세요', '무슨 일정인지 적어주세요.');
      return;
    }
    const payload = {
      title,
      date: form.date,
      time: form.allDay ? null : form.time,
      calendarType: form.calendarType,
      repeatType: form.repeatType,
      memo: form.memo.trim() || null,
      notifyUserIds: form.notifyUserIds ?? allUserIds,
    };
    const options = { onSuccess: () => setForm(null), onError: alertError('저장 실패') };
    if (form.eventId) updateEvent.mutate({ eventId: form.eventId, payload }, options);
    else createEvent.mutate(payload, options);
  };

  const confirmDelete = async (event: FamilyEvent) => {
    const ok = await dialog.confirm({
      title: '일정 삭제',
      message: `'${event.title}' 일정을 삭제할까요?\n남은 알림도 함께 취소돼요.`,
      confirmText: '삭제',
      cancelText: '취소',
    });
    if (!ok) return;
    deleteEvent.mutate(event.id, { onSuccess: () => setDetail(null), onError: alertError('삭제 실패') });
  };

  const toggleNotify = (userId: string) => {
    if (!form) return;
    const base = form.notifyUserIds ?? allUserIds;
    setForm({ ...form, notifyUserIds: base.includes(userId) ? base.filter((id) => id !== userId) : [...base, userId] });
  };

  const formNotify = form ? (form.notifyUserIds ?? allUserIds) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold text-ink">가족 일정</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" strokeWidth={1.75} /> 일정 만들기
        </Button>
      </div>

      {/* 월 달력 */}
      <div className="flex items-center justify-between py-1.5">
        <button type="button" aria-label="이전 달" onClick={() => { const next = addMonths(month, -1); setMonth(next); setSelected(`${next}-01`); }} className="rounded p-1 hover:bg-neutral-100">
          <ChevronLeft className="h-[18px] w-[18px] text-ink" strokeWidth={1.75} />
        </button>
        <p className="font-serif text-base font-semibold text-ink">
          {year}년 {monthNo}월
        </p>
        <button type="button" aria-label="다음 달" onClick={() => { const next = addMonths(month, 1); setMonth(next); setSelected(`${next}-01`); }} className="rounded p-1 hover:bg-neutral-100">
          <ChevronRight className="h-[18px] w-[18px] text-ink" strokeWidth={1.75} />
        </button>
      </div>
      <div className="grid grid-cols-7 pt-2 pb-0.5">
        {WEEKDAYS.map((day, i) => (
          <span key={day} className={cn('text-center text-[11px]', i === 0 ? 'text-danger' : 'text-muted')}>
            {day}
          </span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((date, di) =>
            date == null ? (
              <span key={`empty-${di}`} />
            ) : (
              <button key={date} type="button" onClick={() => setSelected(date)} className="flex flex-col items-center py-[3px]">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm tabular-nums',
                    date === selected ? 'bg-accent text-white' : date === today ? 'bg-accent-100 text-ink' : di === 0 ? 'text-danger' : 'text-ink',
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                <span className={cn('h-1 w-1 rounded-full', marked.has(date) && date !== selected ? 'bg-accent' : 'bg-transparent')} />
              </button>
            ),
          )}
        </div>
      ))}

      <div className="mt-3 mb-3.5 h-px bg-accent-300" />
      <p className="mb-1 text-[11px] tracking-widest text-accent">{formatKoreanDate(selected)}</p>

      {dayEvents.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">이 날엔 일정이 없어요</p>
      ) : (
        dayEvents.map((event) => (
          <button
            key={`${event.id}-${event.date}`}
            type="button"
            onClick={() => setDetail(event)}
            className="flex w-full items-center gap-3 border-b border-divider py-3 text-left"
          >
            <span className="min-w-16 rounded-sm bg-accent-100 px-2 py-1 text-center text-[11px] text-accent-800">
              {event.time ? formatKoreanTime(event.time) : '하루 종일'}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[14.5px] text-ink">{event.title}</span>
              <span className="truncate text-[11px] text-muted">
                {[event.lunarLabel, event.repeatType !== 'none' ? `${REPEAT_LABELS[event.repeatType]} 반복` : null, event.creatorName ? `${event.creatorName} 등록` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            {event.repeatType !== 'none' ? <RotateCw className="h-[13px] w-[13px] shrink-0 text-neutral-500" strokeWidth={1.75} /> : null}
          </button>
        ))
      )}

      {/* 일정 상세 */}
      {detail ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 md:items-center" onClick={() => setDetail(null)}>
          <div className="w-full max-w-md rounded-t-xl bg-bg px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:rounded-xl md:pb-6" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] tracking-widest text-accent">{daysUntil(detail.date) >= 0 ? `다가오는 일정 · ${ddayLabel(detail.date)}` : '지난 일정'}</p>
              <button type="button" aria-label="닫기" onClick={() => setDetail(null)} className="rounded p-1 hover:bg-neutral-100">
                <X className="h-4 w-4 text-ink" strokeWidth={1.75} />
              </button>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-ink">{detail.title}</h2>
            <div className="mt-3.5 mb-1 h-px bg-accent-300" />

            <div className="flex items-center gap-3 border-b border-divider py-3">
              <Calendar className="h-4 w-4 shrink-0 text-neutral-600" strokeWidth={1.75} />
              <div className="flex flex-col gap-px">
                <span className="text-sm text-ink">{formatKoreanDate(detail.date)}</span>
                <span className="text-[11px] text-muted">{[detail.lunarLabel, detail.time ? formatKoreanTime(detail.time) : '하루 종일'].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
            {detail.repeatType !== 'none' ? (
              <div className="flex items-center gap-3 border-b border-divider py-3">
                <RotateCw className="h-4 w-4 shrink-0 text-neutral-600" strokeWidth={1.75} />
                <span className="flex-1 text-sm text-ink">{REPEAT_LABELS[detail.repeatType]} 반복</span>
                {detail.calendarType === 'lunar' ? <span className="text-xs text-muted">음력 기준</span> : null}
              </div>
            ) : null}
            <div className="flex items-center gap-3 border-b border-divider py-3">
              <Bell className="h-4 w-4 shrink-0 text-neutral-600" strokeWidth={1.75} />
              <div className="flex min-w-0 flex-col gap-px">
                <span className="text-sm text-ink">{detail.time ? '하루 전 · 1시간 전 알림' : '하루 전 알림'}</span>
                <span className="truncate text-[11px] text-muted">
                  {(detail.notifyUserIds ?? [])
                    .map((userId) => members.data?.find((m) => m.userId === userId)?.name)
                    .filter(Boolean)
                    .join(' · ') || '알림 받는 사람이 없어요'}
                </span>
              </div>
            </div>
            {detail.memo ? (
              <div className="pt-4">
                <p className="text-[11px] tracking-widest text-accent">메모</p>
                <div className="mt-1.5 rounded-md bg-neutral-100 p-3 text-sm leading-relaxed text-ink">{detail.memo}</div>
              </div>
            ) : null}
            {detail.creatorName ? <p className="pt-4 text-xs text-muted">{detail.creatorName}님이 만든 일정</p> : null}

            {canEdit(detail) ? (
              <div className="mt-5 flex items-center justify-between">
                <button type="button" onClick={() => confirmDelete(detail)} className="text-[13px] text-danger underline underline-offset-2" disabled={deleteEvent.isPending}>
                  {deleteEvent.isPending ? '삭제 중…' : '일정 삭제하기'}
                </button>
                <Button onClick={() => openEdit(detail)}>수정</Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 일정 만들기·수정 폼 */}
      {form ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 md:items-center" onClick={() => setForm(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-bg px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:rounded-xl md:pb-6" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base font-semibold text-ink">{form.eventId ? '일정 수정' : '일정 만들기'}</h2>
                {family.data?.name ? <p className="text-[11px] text-accent">{family.data.name}</p> : null}
              </div>
              <button type="button" aria-label="닫기" onClick={() => setForm(null)} className="rounded p-1 hover:bg-neutral-100">
                <X className="h-4 w-4 text-ink" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-widest text-accent">무슨 일정인가요?</span>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 아버님 생신" maxLength={80} />
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-[11px] tracking-widest text-accent">언제인가요?</span>
                <div className="flex items-center gap-2">
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="flex-1" />
                  <div className="flex overflow-hidden rounded-md border border-divider">
                    {(['solar', 'lunar'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, calendarType: type })}
                        className={cn('px-2.5 py-1.5 text-xs', form.calendarType === type ? 'bg-accent text-white' : 'text-neutral-600')}
                      >
                        {type === 'solar' ? '양력' : '음력'}
                      </button>
                    ))}
                  </div>
                </div>
                {form.calendarType === 'lunar' ? <p className="text-[11px] text-muted">고른 월·일을 음력으로 저장해요 · 양력 날짜는 자동 변환</p> : null}
                <label className="flex items-center justify-between rounded-md border border-divider px-3.5 py-2.5 text-sm text-ink">
                  하루 종일
                  <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} className="h-4 w-4 accent-accent" />
                </label>
                {!form.allDay ? <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /> : null}
                <label className="flex items-center justify-between rounded-md border border-divider px-3.5 py-2.5 text-sm text-ink">
                  반복
                  <select
                    value={form.repeatType}
                    onChange={(e) => setForm({ ...form, repeatType: e.target.value as FormState['repeatType'] })}
                    className="bg-transparent text-[13px] text-accent outline-none"
                  >
                    <option value="none">없음</option>
                    <option value="weekly">매주</option>
                    <option value="monthly">매월</option>
                    <option value="yearly">매년</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tracking-widest text-accent">알림 받을 사람</span>
                  <button type="button" onClick={() => setForm({ ...form, notifyUserIds: allUserIds })} className="text-[13px] text-accent">
                    모두 선택
                  </button>
                </div>
                <p className="text-[11px] text-muted">등록 알림과 리마인드를 받아요</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(members.data ?? []).map((member) => {
                    const picked = formNotify.includes(member.userId);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleNotify(member.userId)}
                        aria-pressed={picked}
                        className={cn('rounded-full border px-3 py-1.5 text-xs', picked ? 'border-accent bg-accent-100 text-accent' : 'border-divider text-neutral-600')}
                      >
                        {member.name}
                        {member.isMe ? ' (나)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-widest text-accent">
                  메모 <span className="tracking-normal text-muted">(선택)</span>
                </span>
                <Textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="예: 저녁 7시까지 본가로 모여요" rows={2} maxLength={500} />
              </label>

              <p className="flex items-center gap-2 rounded-md bg-neutral-100 p-3 text-xs leading-snug text-neutral-700">
                <Bell className="h-[15px] w-[15px] shrink-0 text-neutral-600" strokeWidth={1.75} />
                저장하면 바로 알림이 가고, 하루 전 오전 9시 · 시간이 있는 일정은 1시간 전에도 알려드려요
              </p>

              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="flex h-[50px] w-full items-center justify-center rounded-md bg-accent font-serif text-[15px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
