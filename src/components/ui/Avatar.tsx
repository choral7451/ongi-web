import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  pending?: boolean;
  className?: string;
}

/** 이름 첫 글자 또는 프로필 이미지 */
export function Avatar({ name, src, size = 36, pending, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        style={style}
        className={cn('shrink-0 rounded-full object-cover', pending && 'opacity-50', className)}
      />
    );
  }
  return (
    <span
      style={style}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent-100 font-serif font-semibold text-accent-700',
        pending && 'opacity-50',
        className,
      )}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}
