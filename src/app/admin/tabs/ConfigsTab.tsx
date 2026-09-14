'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, Spinner } from '@/components/ui/State';
import { adminApi } from '@/lib/api';
import type { AdminConfig } from '@/lib/api/admin';

const PLATFORMS = [
  { title: 'iOS', minKey: 'min_ios_version', latestKey: 'latest_ios_version' },
  { title: 'Android', minKey: 'min_android_version', latestKey: 'latest_android_version' },
];

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export function ConfigsTab() {
  const configs = useQuery({ queryKey: ['admin', 'configs'], queryFn: adminApi.getConfigs });

  if (configs.isPending) return <Spinner />;
  if (configs.isError) return <ErrorState message={configs.error.message} onRetry={() => configs.refetch()} />;

  const valueOf = (key: string) => configs.data.find((config) => config.key === key)?.value ?? '1.0.0';

  return (
    <div className="flex flex-col gap-8">
      <p className="rounded-md bg-surface px-4 py-3 text-[13px] leading-5 text-muted">
        최소 버전보다 낮은 앱은 실행하면 스토어 업데이트 차단 화면이 떠요. <b className="text-ink">새 버전이 스토어에 출시된 뒤에</b> 올려 주세요. 서버
        캐시로 최대 1분 뒤 반영돼요.
      </p>
      {PLATFORMS.map((platform) => (
        <section key={platform.title}>
          <SectionHeader title={platform.title} />
          <div className="flex flex-col gap-3">
            <ConfigRow config={{ key: platform.minKey, value: valueOf(platform.minKey) }} label="최소 지원 버전" warn />
            <ConfigRow config={{ key: platform.latestKey, value: valueOf(platform.latestKey) }} label="최신 버전" />
          </div>
        </section>
      ))}
    </div>
  );
}

function ConfigRow({ config, label, warn }: { config: AdminConfig; label: string; warn?: boolean }) {
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const alertError = useAlertError();
  const [draft, setDraft] = useState(config.value);
  const save = useMutation({
    mutationFn: (value: string) => adminApi.setConfig(config.key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'configs'] }),
    onError: alertError('저장 실패'),
  });

  const value = draft.trim();
  const valid = VERSION_PATTERN.test(value);
  const changed = value !== config.value;

  const submit = async () => {
    if (!valid || !changed) return;
    if (warn) {
      const ok = await dialog.confirm({
        title: `최소 버전을 ${value} 로 바꿀까요?`,
        message: `${value} 미만 앱은 업데이트 전까지 사용할 수 없어요. 스토어에 ${value} 이상이 출시됐는지 확인해 주세요.`,
        confirmText: '변경',
        destructive: true,
      });
      if (!ok) return;
    }
    save.mutate(value);
  };

  return (
    <form
      className="flex flex-wrap items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label htmlFor={config.key} className="w-28 text-[13px] text-muted">
        {label}
      </label>
      <Input id={config.key} value={draft} onChange={(e) => setDraft(e.target.value)} inputMode="decimal" className="w-32 tabular-nums" aria-invalid={!valid} />
      <Button type="submit" variant="primary" disabled={!valid || !changed || save.isPending}>
        저장
      </Button>
      {!valid ? <span className="text-[12px] text-danger">1.2.3 형식으로 입력해 주세요.</span> : null}
      <span className="text-[11px] text-muted">{config.key}</span>
    </form>
  );
}
