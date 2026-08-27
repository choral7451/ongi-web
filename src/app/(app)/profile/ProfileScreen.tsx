'use client';

import { Camera, ChevronRight, FileText, Mail, Pencil, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useAlertError, useDialog } from '@/components/ui/Dialog';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useDeleteAccount, useFamily, useMe, useProfileStats, useUpdateMyName, useUploadAvatar } from '@/lib/queries';
import { useSession } from '@/lib/store/session';

const SUPPORT_EMAIL = 'artinfokorea2022@gmail.com';

function SettingRow({ icon, label, meta, href, onClick }: { icon: React.ReactNode; label: string; meta?: string; href?: string; onClick?: () => void }) {
  const inner = (
    <>
      {icon}
      <span className="flex-1 text-sm text-ink">{label}</span>
      {meta ? <span className="text-[11px] text-muted">{meta}</span> : null}
      <ChevronRight className="h-4 w-4 text-neutral-500" strokeWidth={1.75} />
    </>
  );
  const cls = 'flex w-full items-center gap-3 border-b border-divider py-3.5 text-left last:border-b-0 hover:bg-neutral-100';
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** 프로필 / 설정 */
export function ProfileScreen() {
  const dialog = useDialog();
  const alertError = useAlertError();
  const session = useSession();
  const me = useMe();
  const stats = useProfileStats();
  const family = useFamily();
  const updateMyName = useUpdateMyName();
  const uploadAvatar = useUploadAvatar();
  const deleteAccount = useDeleteAccount();
  const fileRef = useRef<HTMLInputElement>(null);

  const name = me.data?.name ?? session.currentUserName;

  const rename = async () => {
    const next = await dialog.prompt({ title: '이름 변경', message: '가족에게 보여질 이름이에요', confirmText: '변경', defaultValue: name });
    if (next?.trim() && next.trim() !== name) updateMyName.mutate(next.trim(), { onError: alertError('이름 변경 실패') });
  };

  const onSignOut = async () => {
    if (await dialog.confirm({ title: '로그아웃', message: '로그아웃 하시겠어요?', confirmText: '로그아웃', destructive: false })) session.signOut();
  };

  const onDeleteAccount = async () => {
    if (await dialog.confirm({ title: '회원탈퇴', message: '탈퇴하면 올린 사진과 댓글이 모두 삭제되며 되돌릴 수 없어요. 정말 탈퇴하시겠어요?', confirmText: '탈퇴하기', destructive: true }))
      deleteAccount.mutate(undefined, { onSuccess: () => session.signOut(), onError: alertError('회원탈퇴 실패') });
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex flex-col items-center gap-2.5 py-6">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative" aria-label="프로필 이미지 변경">
          <Avatar name={name || '?'} src={me.data?.avatarUrl} size={92} />
          <span className="absolute right-0 bottom-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg bg-accent text-white">
            <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAvatar.mutate(file, { onError: alertError('프로필 이미지 변경 실패') });
            e.target.value = '';
          }}
        />
        <button type="button" onClick={rename} className="flex items-center gap-1.5 font-serif text-2xl font-semibold text-ink" aria-label="이름 변경">
          {updateMyName.isPending ? '변경 중…' : uploadAvatar.isPending ? '이미지 올리는 중…' : name}
          <Pencil className="h-3.5 w-3.5 text-neutral-500" strokeWidth={1.75} />
        </button>
        <p className="-mt-1.5 text-xs text-muted">{family.data?.name ?? ''}</p>
        <dl className="mt-1 flex divide-x divide-divider">
          {[
            ['올린 사진', stats.data?.photoCount],
            ['앨범', stats.data?.albumCount],
            ['가족', stats.data?.familyCount],
          ].map(([label, value]) => (
            <div key={label as string} className="px-5 text-center">
              <dd className="font-serif text-xl font-semibold tabular-nums text-ink">{value ?? '–'}</dd>
              <dt className="text-[10.5px] tracking-wide text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <SectionHeader title="가족 공간" size="sm" />
      <SettingRow icon={<Users className="h-[18px] w-[18px] text-neutral-600" strokeWidth={1.75} />} label="가족 공간 만들기 · 참여 · 전환" href="/groups" />

      <div className="mt-6">
        <SectionHeader title="약관 및 정책" size="sm" />
      </div>
      <SettingRow icon={<FileText className="h-[18px] w-[18px] text-neutral-600" strokeWidth={1.75} />} label="이용약관" href="/legal/terms" />
      <SettingRow icon={<ShieldCheck className="h-[18px] w-[18px] text-neutral-600" strokeWidth={1.75} />} label="개인정보 처리방침" href="/legal/privacy" />
      <SettingRow icon={<Mail className="h-[18px] w-[18px] text-neutral-600" strokeWidth={1.75} />} label="문의하기" meta={SUPPORT_EMAIL} href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[온기] 문의')}`} />

      <div className="mt-6">
        <SectionHeader title="계정" size="sm" />
      </div>
      <button type="button" onClick={onSignOut} className="block w-full py-3.5 text-left text-sm text-accent-700 hover:bg-neutral-100">
        로그아웃
      </button>
      <button type="button" onClick={onDeleteAccount} disabled={deleteAccount.isPending} className="block w-full py-3.5 text-left text-sm text-danger hover:bg-neutral-100">
        {deleteAccount.isPending ? '탈퇴 처리 중…' : '회원탈퇴'}
      </button>
      <p className="text-[11px] text-muted">탈퇴하면 올린 사진과 댓글이 모두 삭제되며 복구할 수 없어요.</p>
    </div>
  );
}
