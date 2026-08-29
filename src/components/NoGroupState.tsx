import { Plus, Ticket } from 'lucide-react';
import Link from 'next/link';

/** 가족 공간이 없을 때(가입 직후) 콘텐츠 대신 보여주는 첫 화면 */
export function NoGroupState() {
  return (
    <section className="mx-auto mt-6 flex max-w-md flex-col items-center gap-2 rounded-md border border-divider p-[22px] text-center">
      <span className="text-[10px] uppercase tracking-[1.2px] text-accent">시작하기</span>
      <h2 className="font-serif text-xl leading-7 font-semibold text-ink">아직 가족 공간이 없어요</h2>
      <p className="mb-1.5 text-[13px] leading-[21px] text-muted">
        가족 공간을 만들고 초대 코드를 나누거나,
        <br />
        받은 초대 코드로 가족 공간에 참여해 보세요.
      </p>
      <Link href="/groups?tab=create" className="flex w-full items-center justify-center gap-1.5 rounded-md border border-accent py-[11px] font-serif text-[13px] font-semibold text-accent hover:bg-accent-100">
        <Plus className="h-[15px] w-[15px]" strokeWidth={1.75} /> 가족 공간 만들기
      </Link>
      <Link href="/groups?tab=join" className="flex w-full items-center justify-center gap-1.5 rounded-md border border-divider py-[11px] font-serif text-[13px] font-semibold text-ink hover:bg-neutral-100">
        <Ticket className="h-[15px] w-[15px]" strokeWidth={1.75} /> 초대 코드로 참여
      </Link>
    </section>
  );
}
