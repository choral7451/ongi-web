import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

const base = 'w-full min-w-0 rounded-md border border-divider bg-bg px-3 py-2 text-base text-ink md:text-sm placeholder:text-neutral-500 outline-none focus:border-accent';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(base, className)} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(base, 'min-h-20 resize-y', className)} />;
}
