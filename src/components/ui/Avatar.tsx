import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  pending?: boolean;
  className?: string;
}

/** 이니셜 아바타 — 세리프 첫 글자, 은은한 파란 배경 + 헤어라인 테두리 (앱 Avatar 와 동일). 프로필 이미지가 있으면 그 이미지 */
export function Avatar({ name, src, size = 34, pending, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.44) };
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        style={style}
        className={cn('shrink-0 rounded-full border border-divider object-cover', pending && 'opacity-50', className)}
      />
    );
  }
  return (
    <span
      style={style}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-divider bg-accent-100 font-serif font-semibold text-accent-800',
        pending && 'border-dashed border-neutral-400 bg-transparent font-sans font-normal text-neutral-500',
        className,
      )}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}
