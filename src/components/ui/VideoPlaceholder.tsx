import { Play } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * 포스터가 없는 영상 자리표시자 — 어두운 판 위에 ▶.
 * mp4 URL 을 <img> 로 그리면 빈 칸이 되므로, 영상임을 알 수 있게 대신 그린다.
 */
export function VideoPlaceholder({ className, iconClassName = 'h-5 w-5' }: { className?: string; iconClassName?: string }) {
  return (
    <span className={cn('absolute inset-0 flex items-center justify-center bg-ink text-white', className)}>
      <Play className={iconClassName} strokeWidth={1.75} fill="currentColor" />
    </span>
  );
}
