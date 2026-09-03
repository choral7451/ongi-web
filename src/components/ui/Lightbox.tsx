'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ZOOM = 2.5;

/** 전체 화면 사진 라이트박스 — 사진 탭(클릭)으로 그 지점 확대/축소, 확대 상태에서 드래그 이동, ESC·X·배경으로 닫기 */
export function Lightbox({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number; moved: boolean } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const toggleZoom = (e: React.MouseEvent<HTMLImageElement>) => {
    if (drag.current?.moved) return;
    if (zoomed) {
      setZoomed(false);
      setOffset({ x: 0, y: 0 });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin(`${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}% ${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
    setZoomed(true);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!zoomed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.current.moved = true;
    setOffset({ x: drag.current.baseX + dx, y: drag.current.baseY + dy });
  };
  const onPointerUp = () => {
    // moved 플래그는 click(토글)이 먼저 읽도록 다음 틱에 해제
    setTimeout(() => {
      drag.current = null;
    }, 0);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95" onClick={onClose} role="dialog" aria-modal>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? '사진'}
        className={`max-h-full max-w-full select-none ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'} ${drag.current ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoomed ? ZOOM : 1})`, transformOrigin: origin, touchAction: 'none' }}
        onClick={(e) => {
          e.stopPropagation();
          toggleZoom(e);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        draggable={false}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </button>
    </div>
  );
}
