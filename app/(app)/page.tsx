"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, Phone, Plus, Timer, ShieldCheck, Pause, Play } from "lucide-react";
import { useStore } from "@/lib/store";
import { AIRLINE_STATS, airline, fmtDur, pct } from "@/lib/data";
import { AirlineBadge, btn, Card, CardHead, cx, downloadCsv, PageTitle, Segmented, StatusChip, popCls, menuItemCls, usePopover } from "@/components/ui";
import { Donut, Sparkbars } from "@/components/charts";

type Range = "today" | "7d" | "30d";
const RANGE_MULT: Record<Range, number> = { today: 1, "7d": 6.4, "30d": 27.8 };

export default function OverviewPage() {
  const { jobs, toast, liveMode, setLiveMode } = useStore();
  const router = useRouter();
  const [range, setRange] = useState<Range>("today");
  const exportMenu = usePopover();

  const running = jobs.filter((j) => j.status === "running" || j.status === "paused");
  const liveDone = running.reduce((a, j) => a + j.done, 0);
  const liveReached = running.reduce((a, j) => a + j.reached, 0);
  const m = RANGE_MULT[range];
  const callsPlaced = Math.round((1261 + liveDone) * m);
  const reached = Math.round((892 + liveReached) * m);
  const reachedPct = (reached / callsPlaced) * 100;
  const avgHold = running.length ? Math.round(running.reduce((a, j) => a + j.avgHoldSec, 0) / running.length) - 280 : 872;

  const pipeline = useMemo(() => {
    const active = jobs.filter((j) => j.status === "running");
    return {
      dialing: active.filter((j) => j.done < j.total).length,
      ivr: active.length,
      hold: active.length * 2,
      human: active.filter((j) => j.reached % 2 === 1).length,
    };
  }, [jobs]);
  const liveTotal = pipeline.dialing + pipeline.ivr + pipeline.hold + pipeline.human;
  const pMax = Math.max(1, pipeline.dialing, pipeline.ivr, pipeline.hold, pipeline.human);

  const recent = [...jobs]
    .sort((a, b) => {
      const order = { running: 0, paused: 1, failed: 2, scheduled: 3, completed: 4, stopped: 5, draft: 6 };
      return order[a.status] - order[b.status] || b.id - a.id;
    })
    .slice(0, 6);

  const exportCsv = () => {
    downloadCsv(`callflow-overview-${range}.csv`, [
      ["Job", "Name", "Airline", "Status", "Calls", "Reached human", "Avg hold"],
      ...jobs.map((j) => [`#${j.id}`, j.name, j.airline, j.status, `${j.done}/${j.total}`, pct(j.reached, j.done), fmtDur(j.avgHoldSec)]),
    ]);
    exportMenu.setOpen(false);
    toast("Overview exported as CSV");
  };

  return (
    <>
      <PageTitle
        title="Good morning, Sana"
        sub={
          <span>
            {running.length} jobs running · {liveTotal} calls live right now · all times in ET (UTC−5)
          </span>
        }
        right={
          <>
            <Segmented
              label="Time range"
              value={range}
              onChange={setRange}
              options={[
                { value: "today", label: "Today" },
                { value: "7d", label: "7 days" },
                { value: "30d", label: "30 days" },
              ]}
            />
            <div ref={exportMenu.ref} className="relative">
              <button className={btn.white} aria-expanded={exportMenu.open} onClick={() => exportMenu.setOpen(!exportMenu.open)}>
                <Download size={17} /> Export report
              </button>
              {exportMenu.open && (
                <div role="menu" className={cx(popCls, "right-0 w-[220px]")}>
                  <button role="menuitem" className={menuItemCls} onClick={exportCsv}>
                    Download CSV data
                  </button>
                  <button
                    role="menuitem"
                    className={menuItemCls}
                    onClick={() => {
                      exportMenu.setOpen(false);
                      toast("PDF report is being prepared. We’ll email it to you.", "info");
                    }}
                  >
                    Email PDF report
                  </button>
                </div>
              )}
            </div>
            <Link href="/jobs/new" className={btn.primary}>
              <Plus size={18} strokeWidth={2.4} /> New job
            </Link>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
        <Card className="flex flex-col gap-3.5 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-body">Calls placed</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft-2 text-primary-ink">
              <Phone size={17} />
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[38px] leading-none font-bold tracking-tight tabular-nums">{callsPlaced.toLocaleString()}</div>
              <span className="mt-2.5 inline-flex rounded-full bg-ok-bg px-2 py-1 text-xs font-bold text-ok">↑ 12% vs previous</span>
            </div>
            <Sparkbars values={[18, 24, 14, 28, 22, 32, 36, 42]} />
          </div>
        </Card>

        <div className="flex flex-col gap-3.5 rounded-3xl bg-primary px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Reached a human</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">Primary KPI</span>
          </div>
          <div className="text-[38px] leading-none font-bold tracking-tight tabular-nums">{reachedPct.toFixed(1)}%</div>
          <div className="h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${reachedPct}%` }} />
          </div>
          <div className="text-[13px]">
            {reached.toLocaleString()} of {callsPlaced.toLocaleString()} calls · ↑ 3.2 pts
          </div>
        </div>

        <Card className="flex flex-col gap-3.5 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-body">Average hold time</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warn-bg text-warn">
              <Timer size={17} />
            </span>
          </div>
          <div className="text-[38px] leading-none font-bold tracking-tight tabular-nums">{fmtDur(avgHold)}</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ok-bg px-2 py-1 text-xs font-bold text-ok">↓ 1m 05s faster</span>
            <span className="text-[13px] text-muted">Longest {fmtDur(Math.max(...running.map((j) => j.longestHoldSec), 2468))}</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-3.5 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-body">Human-detection accuracy</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ok-bg text-ok">
              <ShieldCheck size={17} />
            </span>
          </div>
          <div className="text-[38px] leading-none font-bold tracking-tight">96.8%</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-warn-bg px-2 py-1 text-xs font-bold text-warn">{Math.round(11 * m)} false positives</span>
            <span className="text-[13px] text-muted">Avg detect 1.6s</span>
          </div>
        </Card>
      </section>

      <section className="flex flex-wrap gap-4">
        <Card className="flex min-w-0 flex-[999_1_620px] flex-col gap-4 p-6">
          <CardHead
            title="Live jobs"
            sub="Jobs dialing right now. Open one to watch calls and transcripts live."
            right={
              <Link href="/jobs" className={btn.outline}>
                All jobs
              </Link>
            }
          />
          {running.length === 0 && (
            <div className="rounded-2xl bg-bg p-8 text-center text-sm text-muted">
              No jobs are running.{" "}
              <Link href="/jobs/new" className="font-bold text-primary-ink">
                Start one
              </Link>
            </div>
          )}
          {running.map((j) => {
            const a = airline(j.airline);
            return (
              <div key={j.id} className="flex flex-wrap items-center gap-5 rounded-[18px] bg-bg p-4">
                <div className="flex min-w-0 flex-[1_1_260px] items-center gap-3.5">
                  <AirlineBadge {...a} size={46} />
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold">{j.name}</div>
                    <div className="mt-0.5 text-[13px] text-muted">
                      {j.number} · {j.engine} · Job #{j.id}
                    </div>
                  </div>
                </div>
                <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-bold tabular-nums">
                      {j.done} / {j.total} calls
                    </span>
                    <StatusChip status={j.status} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-soft">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(j.done / j.total) * 100}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    <span className="rounded-full bg-ivr-bg px-2 py-0.5 text-ivr">{j.status === "running" ? 1 : 0} in menu</span>
                    <span className="rounded-full bg-warn-bg px-2 py-0.5 text-warn">{Math.min(2, j.done)} on hold</span>
                    <span className="rounded-full bg-ok-bg px-2 py-0.5 text-ok">{j.reached} reached human</span>
                  </div>
                </div>
                <Link href={`/jobs/${j.id}`} className={btn.dark}>
                  Watch live <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </Card>

        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 rounded-3xl bg-navy p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-[19px] font-bold">Calls in progress</h2>
            <button
              onClick={() => setLiveMode(!liveMode)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-navy-2 px-3 py-1.5 text-xs font-bold text-sky-light hover:bg-navy-3"
              aria-label={liveMode ? "Pause live updates" : "Resume live updates"}
            >
              {liveMode ? <span className="live-dot h-[7px] w-[7px] rounded-full bg-sky" /> : <Play size={12} />}
              {liveMode ? "LIVE" : "PAUSED"}
              {liveMode && <Pause size={12} className="opacity-70" />}
            </button>
          </div>
          <div>
            <div className="text-[52px] leading-none font-bold tabular-nums">{liveTotal}</div>
            <div className="mt-1.5 text-[13px] text-muted-dark">across {jobs.filter((j) => j.status === "running").length} jobs, by current stage</div>
          </div>
          {[
            { label: "Dialing", v: pipeline.dialing, c: "#3595FF" },
            { label: "In phone menu", v: pipeline.ivr, c: "#D3E7FF" },
            { label: "On hold", v: pipeline.hold, c: "#FFC266" },
            { label: "Talking to a human", v: pipeline.human, c: "#22BDFF" },
          ].map((r) => (
            <div key={r.label}>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="text-soft-2">{r.label}</span>
                <span className="font-bold tabular-nums">{r.v}</span>
              </div>
              <div className="h-2.5 rounded-full bg-navy-3">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.v / pMax) * 100}%`, background: r.c }} />
              </div>
            </div>
          ))}
          <div className="mt-auto rounded-2xl bg-navy-2 p-4 text-[13px] leading-relaxed text-soft-2">
            Longest current hold: <strong className="text-white">27m 14s</strong> on United Baggage.{" "}
            <Link href="/jobs/58" className="font-bold text-sky-light hover:underline">
              Open call
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
        <Card className="flex flex-col gap-4 p-6">
          <CardHead title="Hold time by airline" sub="Average wait before a human answers" />
          {AIRLINE_STATS.map((a, i) => (
            <div key={a.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{a.name}</span>
                <span className="font-bold tabular-nums">{fmtDur(a.avgHoldSec)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-tint">
                <div className="h-full rounded-full" style={{ width: `${(a.avgHoldSec / AIRLINE_STATS[0].avgHoldSec) * 100}%`, background: ["#1A62C2", "#3595FF", "#22BDFF", "#59CCFB", "#A9E3FD"][i] }} />
              </div>
            </div>
          ))}
          <Link href="/analytics" className="mt-auto text-sm font-bold text-primary-ink hover:underline">
            Compare in Analytics →
          </Link>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <CardHead title="Detection quality" sub="How often “human picked up” was right" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              center="96.8%"
              sub="correct"
              parts={[
                { label: "Correct", value: 1243, color: "#3595FF" },
                { label: "Missed human", value: 30, color: "#FFB547" },
                { label: "False positive", value: 11, color: "#E5484D" },
              ]}
            />
            <div className="flex flex-[1_1_140px] flex-col gap-3 text-sm">
              {[
                ["Correct", "1,243", "#3595FF"],
                ["Missed human", "30", "#FFB547"],
                ["False positive", "11", "#E5484D"],
              ].map(([l, v, c]) => (
                <div key={l} className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded" style={{ background: c }} />
                  <span className="flex-1">{l}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-bg p-3.5 text-[13px] leading-relaxed text-body">
            8 of 11 false positives were hold-music voiceovers on Turkish Airlines.{" "}
            <Link href="/jobs/59" className="font-bold text-primary-ink hover:underline">
              Review calls
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[19px] font-bold">Insights</h2>
            <span className="rounded-full bg-soft-2 px-2.5 py-1 text-xs font-bold text-primary-ink">Auto-generated</span>
          </div>
          {[
            { icon: "↑", cls: "bg-warn-bg text-warn", title: "United hold times are 31% above their 30-day average", body: "Started around 08:30 ET. Likely weather disruption at ORD.", href: "/analytics" },
            { icon: "◷", cls: "bg-soft-2 text-primary-ink", title: "Best window to call American: 14:00–16:00 ET", body: "Average hold 7m 40s, about half the morning peak.", href: "/analytics" },
            { icon: "!", cls: "bg-bad-bg text-bad", title: "Job #57 failed: hotline returned busy 5 times", body: "Check the number or switch provider and retry.", href: "/jobs/57" },
          ].map((i) => (
            <Link key={i.title} href={i.href} className="-mx-2 flex gap-3.5 rounded-2xl border-t border-line px-2 py-3.5 hover:bg-bg">
              <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold", i.cls)}>{i.icon}</span>
              <span>
                <span className="block text-sm leading-snug font-bold">{i.title}</span>
                <span className="mt-1 block text-[13px] leading-snug text-muted">{i.body}</span>
              </span>
            </Link>
          ))}
        </Card>
      </section>

      <Card className="flex flex-col gap-4 pt-6 pb-2">
        <div className="px-6">
          <CardHead
            title="Recent jobs"
            sub="Running and latest jobs"
            right={
              <Link href="/jobs" className={btn.ghost}>
                View all <ArrowRight size={15} />
              </Link>
            }
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-bg text-left text-[11px] tracking-[0.06em] text-muted uppercase">
                <th className="py-3 pr-4 pl-6 font-bold">Job</th>
                <th className="px-4 font-bold">Airline</th>
                <th className="px-4 font-bold">Engine</th>
                <th className="px-4 font-bold">Started (ET)</th>
                <th className="px-4 font-bold">Calls</th>
                <th className="px-4 font-bold">Reached human</th>
                <th className="px-4 font-bold">Avg hold</th>
                <th className="py-3 pr-6 pl-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((j) => (
                <tr key={j.id} onClick={() => router.push(`/jobs/${j.id}`)} className="cursor-pointer border-t border-line hover:bg-bg">
                  <td className="py-3.5 pr-4 pl-6">
                    <Link href={`/jobs/${j.id}`} className="font-bold hover:text-primary-ink" onClick={(e) => e.stopPropagation()}>
                      {j.name}
                    </Link>
                    <div className="mt-0.5 font-mono text-xs text-muted">Job #{j.id}</div>
                  </td>
                  <td className="px-4 whitespace-nowrap">{j.airline}</td>
                  <td className="px-4">{j.engine}</td>
                  <td className="px-4 whitespace-nowrap">{j.startedAt}</td>
                  <td className="px-4 tabular-nums">
                    {j.done} / {j.total}
                  </td>
                  <td className="px-4 font-bold tabular-nums">{pct(j.reached, j.done)}</td>
                  <td className="px-4 tabular-nums">{fmtDur(j.avgHoldSec)}</td>
                  <td className="py-3.5 pr-6 pl-4">
                    <StatusChip status={j.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
