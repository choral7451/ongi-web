'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button } from './Button';

/**
 * 앱의 Alert.alert / Alert.prompt / ActionSheet 에 대응하는 웹 다이얼로그.
 * useDialog() 로 confirm / prompt / actions / alert 를 프라미스로 호출한다.
 */
export interface ActionItem {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface PromptOptions extends ConfirmOptions {
  placeholder?: string;
  defaultValue?: string;
}

type DialogState =
  | { kind: 'alert'; title: string; message?: string; resolve: () => void }
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void }
  | { kind: 'actions'; title: string; actions: ActionItem[]; resolve: () => void };

interface DialogApi {
  alert: (title: string, message?: string) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  actions: (title: string, actions: ActionItem[]) => Promise<void>;
}

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog 는 DialogProvider 안에서만 사용할 수 있어요.');
  return ctx;
}

/** 에러를 알림으로 — mutation onError 에 그대로 넘긴다 */
export function useAlertError() {
  const dialog = useDialog();
  return (title: string) => (e: unknown) => dialog.alert(title, e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);

  const api: DialogApi = {
    alert: useCallback((title, message) => new Promise((resolve) => setState({ kind: 'alert', title, message, resolve })), []),
    confirm: useCallback((options) => new Promise((resolve) => setState({ kind: 'confirm', options, resolve })), []),
    prompt: useCallback((options) => new Promise((resolve) => setState({ kind: 'prompt', options, resolve })), []),
    actions: useCallback((title, actions) => new Promise((resolve) => setState({ kind: 'actions', title, actions, resolve })), []),
  };

  return (
    <DialogContext.Provider value={api}>
      {children}
      {state ? <DialogView state={state} close={() => setState(null)} /> : null}
    </DialogContext.Provider>
  );
}

function DialogView({ state, close }: { state: DialogState; close: () => void }) {
  const [value, setValue] = useState(state.kind === 'prompt' ? (state.options.defaultValue ?? '') : '');
  const inputRef = useRef<HTMLInputElement>(null);

  const dismiss = () => {
    if (state.kind === 'confirm') state.resolve(false);
    else if (state.kind === 'prompt') state.resolve(null);
    else state.resolve();
    close();
  };

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = state.kind === 'confirm' || state.kind === 'prompt' ? state.options.title : state.title;
  const message = state.kind === 'confirm' || state.kind === 'prompt' ? state.options.message : state.kind === 'alert' ? state.message : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={dismiss} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-sm rounded-lg bg-bg p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title" className="font-serif text-lg font-semibold text-ink">
          {title}
        </h2>
        {message ? <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p> : null}

        {state.kind === 'prompt' ? (
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              state.resolve(value);
              close();
            }}
          >
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={state.options.placeholder}
              className="w-full rounded-md border border-divider px-3 py-2 text-base text-ink outline-none focus:border-accent md:text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={dismiss}>
                취소
              </Button>
              <Button type="submit" variant={state.options.destructive ? 'danger' : 'primary'}>
                {state.options.confirmText ?? '확인'}
              </Button>
            </div>
          </form>
        ) : state.kind === 'actions' ? (
          <div className="mt-4 flex flex-col gap-1">
            {state.actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  state.resolve();
                  close();
                  a.onPress();
                }}
                className={`rounded-md px-3 py-2.5 text-left text-sm hover:bg-neutral-100 ${a.destructive ? 'text-danger' : 'text-ink'}`}
              >
                {a.label}
              </button>
            ))}
            <button type="button" onClick={dismiss} className="mt-1 rounded-md px-3 py-2.5 text-left text-sm text-muted hover:bg-neutral-100">
              취소
            </button>
          </div>
        ) : (
          <div className="mt-5 flex justify-end gap-2">
            {state.kind === 'confirm' ? (
              <Button variant="ghost" onClick={dismiss}>
                {state.options.cancelText ?? '취소'}
              </Button>
            ) : null}
            <Button
              variant={state.kind === 'confirm' && state.options.destructive ? 'danger' : 'primary'}
              onClick={() => {
                if (state.kind === 'confirm') state.resolve(true);
                else state.resolve();
                close();
              }}
            >
              {state.kind === 'confirm' ? (state.options.confirmText ?? '확인') : '확인'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
