import { cn } from '@/lib/utils/cn';

const VARIANTS = {
  outline: 'border-divider text-ink',
  accent: 'border-accent-200 bg-accent-100 text-accent-700',
  neutral: 'border-transparent bg-neutral-200 text-neutral-700',
};

export function Tag({ label, variant = 'outline' }: { label: string; variant?: keyof typeof VARIANTS }) {
  return <span className={cn('inline-flex rounded-sm border px-1.5 py-0.5 text-[10px] tracking-wide', VARIANTS[variant])}>{label}</span>;
}
