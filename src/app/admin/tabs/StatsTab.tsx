'use client';

import { useQuery } from '@tanstack/react-query';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, Spinner } from '@/components/ui/State';
import { adminApi } from '@/lib/api';
import type { AdminStats } from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';
import { DailyChart } from './DailyChart';

const dayLabel = (day: string) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일`;

/** 45 → '45초', 450 → '7분 30초', 3900 → '1시간 5분' */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  if (total < 60) return `${total}초`;
  if (total < 3600) return total % 60 === 0 ? `${total / 60}분` : `${Math.floor(total / 60)}분 ${total % 60}초`;
  const minutes = Math.floor((total % 3600) / 60);
  return minutes === 0 ? `${Math.floor(total / 3600)}시간` : `${Math.floor(total / 3600)}시간 ${minutes}분`;
}

const RETENTION_LABEL: Record<number, string> = { 1: '가입 다음 날', 7: '가입 7일 뒤', 30: '가입 30일 뒤' };
const PLATFORM_LABEL: Record<string, string> = { ios: 'iPhone', android: 'Android', unknown: '알 수 없음' };
const FUNNEL_STEPS: { key: 'withGroup' | 'withPhoto' | 'withChat' | 'withPush'; label: string }[] = [
  { key: 'withGroup', label: '공간에 참여' },
  { key: 'withPhoto', label: '사진을 올림' },
  { key: 'withChat', label: '대화를 보냄' },
  { key: 'withPush', label: '푸시 알림 허용' },
];

function Tile({ label, value, sub, meter }: { label: string; value: string; sub?: string; meter?: number | null }) {
  return (
    <div className="rounded-lg border border-divider px-4 py-3.5">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-ink">{value}</p>
      {meter !== undefined && meter !== null ? <Meter percent={meter} className="mt-2" /> : null}
      {sub ? <p className="mt-1 text-[11px] text-muted">{sub}</p> : null}
    </div>
  );
}

/** 비율 막대 — 채운 부분과 바탕이 같은 파랑 계열 */
function Meter({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-accent-100', className)} aria-hidden>
      <div className="h-full rounded-full bg-accent-600" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

/** 이름 · 막대 · 값 한 줄 */
function ShareRow({ label, count, percent }: { label: string; count: number; percent: number }) {
  return (
    <li className="grid grid-cols-[92px_minmax(0,1fr)_96px] items-center gap-3 text-[13px]">
      <span className="truncate text-ink">{label}</span>
      <Meter percent={percent} />
      <span className="text-right tabular-nums text-muted">
        <span className="font-semibold text-ink">{percent}%</span> · {count.toLocaleString()}명
      </span>
    </li>
  );
}

const shareOf = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 1000) / 10 : 0);

export function StatsTab() {
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getStats });

  if (stats.isPending) return <Spinner />;
  if (stats.isError) return <ErrorState message={stats.error.message} onRetry={() => stats.refetch()} />;

  return <StatsView stats={stats.data} />;
}

export function StatsView({ stats }: { stats: AdminStats }) {
  const { today, trackingSince, active, daily, engagement, retention, spaces, funnel, platforms, versions } = stats;
  const excluded = stats.excludedTestUsers ?? 0;
  const platformTotal = platforms.reduce((sum, p) => sum + p.users, 0);
  const versionTotal = versions.reduce((sum, v) => sum + v.users, 0);
  const series = (pick: (d: AdminStats['daily'][number]) => number) => daily.map((d) => ({ day: d.day, value: pick(d) }));

  return (
    <div className="flex flex-col gap-10">
      <p className="text-[12px] leading-5 text-muted">
        날짜는 한국 시간 기준이에요.
        {trackingSince ? ` 접속 기록은 ${dayLabel(trackingSince)}부터 쌓였어요.` : ' 접속 기록은 아직 없어요 — 서버 배포 뒤 첫 접속부터 쌓여요.'}
        {excluded > 0 ? ` 테스트 계정 ${excluded}개는 모든 수치에서 뺐어요.` : ' 테스트 계정은 사용자 탭에서 표시하면 수치에서 빠져요.'}
      </p>

      <section>
        <SectionHeader title="접속자" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile label="오늘 (DAU)" value={`${active.dau.toLocaleString()}명`} sub="오늘 앱을 연 사람" />
          <Tile label="최근 7일 (WAU)" value={`${active.wau.toLocaleString()}명`} />
          <Tile label="최근 30일 (MAU)" value={`${active.mau.toLocaleString()}명`} />
          <Tile label="고착도" value={`${active.stickiness}%`} meter={active.stickiness} sub="하루 평균 접속자 ÷ 30일 접속자" />
        </div>
        <div className="mt-6">
          <DailyChart title="일별 접속자 · 최근 30일" data={series((d) => d.activeUsers)} today={today} since={trackingSince} format={(v) => `${v.toLocaleString()}명`} />
        </div>
      </section>

      <section>
        <SectionHeader title="체류시간" meta="최근 7일" />
        {engagement.measuredUserDays === 0 ? (
          <p className="rounded-lg border border-divider px-4 py-5 text-[13px] leading-6 text-muted">
            아직 잰 기록이 없어요. 사용 시간은 앱 1.0.10 이상에서 보내기 때문에, 업데이트한 사용자가 생기면 여기에 나타나요.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Tile label="1명이 하루에 쓰는 시간" value={formatDuration(engagement.avgSecondsPerUser)} />
              <Tile label="1명이 하루에 여는 횟수" value={`${engagement.avgSessionsPerUser}회`} />
              <Tile label="한 번 열 때 쓰는 시간" value={formatDuration(engagement.avgSecondsPerSession)} />
            </div>
            <p className="mt-2 text-[11px] text-muted">앱 1.0.10 이상 사용자만 잰 값이에요 (최근 7일 {engagement.measuredUserDays.toLocaleString()}명·일).</p>
            <div className="mt-6">
              <DailyChart
                title="1명당 하루 사용 시간 · 최근 30일"
                data={series((d) => Math.round((d.avgSeconds / 60) * 10) / 10)}
                today={today}
                since={trackingSince}
                format={(v) => `${v}분`}
                allowFraction
              />
            </div>
          </>
        )}
      </section>

      <section>
        <SectionHeader title="재방문율" meta="최근 30일 안에 그날을 맞은 가입자" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {retention.map((r) => (
            <Tile
              key={r.days}
              label={RETENTION_LABEL[r.days] ?? `가입 ${r.days}일 뒤`}
              value={r.rate === null ? '—' : `${r.rate}%`}
              meter={r.rate}
              sub={r.rate === null ? '아직 대상자가 없어요' : `${r.cohort.toLocaleString()}명 중 ${r.retained.toLocaleString()}명이 다시 옴`}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="공간" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile label="전체 공간" value={`${spaces.total.toLocaleString()}곳`} />
          <Tile label="혼자인 공간" value={`${spaces.solo.toLocaleString()}곳`} meter={spaces.soloRate} sub={`전체의 ${spaces.soloRate}% — 초대가 안 된 공간`} />
          <Tile label="최근 7일 활동한 공간" value={`${spaces.active7d.toLocaleString()}곳`} meter={spaces.activeRate} sub={`전체의 ${spaces.activeRate}% — 사진·댓글이 올라옴`} />
          <Tile label="공간당 구성원" value={`${spaces.avgMembers}명`} />
        </div>
      </section>

      <section>
        <SectionHeader title="가입 후 전환" meta={`가입자 ${funnel.users.toLocaleString()}명 기준`} />
        <ul className="flex flex-col gap-3">
          {FUNNEL_STEPS.map((step) => (
            <ShareRow key={step.key} label={step.label} count={funnel[step.key].count} percent={funnel[step.key].rate} />
          ))}
        </ul>
      </section>

      <section>
        <SectionHeader title="일별 활동" meta="최근 30일" />
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <DailyChart compact title="가입" data={series((d) => d.signups)} today={today} format={(v) => `${v.toLocaleString()}명`} />
          <DailyChart compact title="사진 · 영상" data={series((d) => d.photos)} today={today} format={(v) => `${v.toLocaleString()}개`} />
          <DailyChart compact title="댓글" data={series((d) => d.comments)} today={today} format={(v) => `${v.toLocaleString()}개`} />
          <DailyChart compact title="채팅 메시지" data={series((d) => d.chatMessages)} today={today} format={(v) => `${v.toLocaleString()}개`} />
        </div>
        <p className="mt-3 text-[11px] text-muted">차트마다 세로 눈금이 달라요. 여러 공간에 함께 올린 사진은 공간마다 1개로 세요.</p>
      </section>

      <section>
        <SectionHeader title="기기 · 앱 버전" meta="최근 30일 접속자" />
        {platformTotal === 0 ? (
          <p className="text-[13px] text-muted">아직 접속 기록이 없어요.</p>
        ) : (
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            <ul className="flex flex-col gap-3">
              {platforms.map((p) => (
                <ShareRow key={p.platform} label={PLATFORM_LABEL[p.platform] ?? p.platform} count={p.users} percent={shareOf(p.users, platformTotal)} />
              ))}
            </ul>
            <ul className="flex flex-col gap-3">
              {versions.map((v) => (
                <ShareRow key={v.version} label={v.version === 'unknown' ? '1.0.9 이하' : v.version} count={v.users} percent={shareOf(v.users, versionTotal)} />
              ))}
            </ul>
          </div>
        )}
      </section>

      <details className="text-[13px]">
        <summary className="cursor-pointer font-serif font-semibold text-accent-700">표로 보기 — 최근 30일</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-right tabular-nums">
            <thead>
              <tr className="border-y border-divider text-[11px] text-muted">
                <th className="py-2 text-left font-normal">날짜</th>
                <th className="font-normal">접속자</th>
                <th className="font-normal">1명당 사용 시간</th>
                <th className="font-normal">방문</th>
                <th className="font-normal">가입</th>
                <th className="font-normal">사진 · 영상</th>
                <th className="font-normal">댓글</th>
                <th className="font-normal">채팅</th>
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().map((d) => {
                const untracked = trackingSince === null || d.day < trackingSince;
                return (
                  <tr key={d.day} className="border-b border-divider text-ink">
                    <td className="py-1.5 text-left">
                      {dayLabel(d.day)}
                      {d.day === today ? <span className="text-muted"> (오늘)</span> : null}
                    </td>
                    <td>{untracked ? '—' : d.activeUsers.toLocaleString()}</td>
                    <td>{d.measuredUsers > 0 ? formatDuration(d.avgSeconds) : '—'}</td>
                    <td>{d.measuredUsers > 0 ? d.sessions.toLocaleString() : '—'}</td>
                    <td>{d.signups.toLocaleString()}</td>
                    <td>{d.photos.toLocaleString()}</td>
                    <td>{d.comments.toLocaleString()}</td>
                    <td>{d.chatMessages.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
