/** 클래스 이름 합치기 — falsy 값 제거 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
