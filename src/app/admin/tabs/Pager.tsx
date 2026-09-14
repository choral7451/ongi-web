import { Button } from '@/components/ui/Button';

/** 50개씩 끊어 받는 목록의 이전/다음 — 마지막 페이지는 받은 개수가 50 미만인지로 판단 */
export function Pager({ page, hasNext, onChange }: { page: number; hasNext: boolean; onChange: (page: number) => void }) {
  if (page === 1 && !hasNext) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}>
        이전
      </Button>
      <span className="text-[13px] tabular-nums text-muted">{page}</span>
      <Button variant="secondary" size="sm" disabled={!hasNext} onClick={() => onChange(page + 1)}>
        다음
      </Button>
    </div>
  );
}
