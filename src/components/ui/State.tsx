import { Loader2 } from 'lucide-react';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-accent" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-14 text-center text-sm text-muted">{children}</p>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-sm text-muted">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="text-accent-700 underline">
          다시 시도
        </button>
      ) : null}
    </div>
  );
}
