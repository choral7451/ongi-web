import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'solid';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const VARIANTS: Record<Variant, string> = {
  primary: 'border-accent text-accent hover:bg-accent-100',
  secondary: 'border-divider text-ink hover:bg-neutral-100',
  ghost: 'border-transparent text-ink hover:bg-neutral-100',
  danger: 'border-danger text-danger hover:bg-red-50',
  solid: 'border-accent bg-accent text-white hover:bg-accent-700',
};

const SIZES = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-1.5 text-[13px]', lg: 'px-4 py-2.5 text-sm' };

/** 디자인 시스템 .btn — 외곽선 버튼 (세리프 라벨) */
export function Button({ variant = 'primary', size = 'md', icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border font-serif font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** 36×36 아이콘 버튼 */
export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string }) {
  return (
    <button
      {...props}
      className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-neutral-100', className)}
    />
  );
}
