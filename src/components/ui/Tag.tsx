import { cn } from '@/lib/utils/cn';

/** 디자인 시스템 .tag — accent(연파랑 배경) / neutral(회색) / outline(파란 외곽선). 앱 Tag 와 동일 */
const VARIANTS = {
  outline: 'border border-accent py-[2px] text-accent',
  accent: 'bg-accent-100 text-accent-800',
  neutral: 'bg-neutral-200 text-neutral-800',
};

export function Tag({ label, variant = 'outline' }: { label: string; variant?: keyof typeof VARIANTS }) {
  return <span className={cn('inline-flex rounded-[3px] px-2.5 py-[3px] text-[11px] tracking-[0.22px]', VARIANTS[variant])}>{label}</span>;
}
