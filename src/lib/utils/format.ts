const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "8월 25일 월요일" */
export function formatFeedDate(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`;
}

/** "2026년 8월 25일 오후 4:38" */
export function formatFullDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${formatTime(iso)}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const period = h < 12 ? '오전' : '오후';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${hour12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 피드 섹션 제목 — 오늘이면 "오늘" */
export function feedSectionTitle(key: string, todayKey: string): string {
  if (key === todayKey) return '오늘';
  const d = new Date(`${key}T00:00:00`);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
