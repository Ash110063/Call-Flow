"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Download, FileText, Search, Bookmark, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { AIRLINE_STATS, AIRLINES, LINES, OUTCOME_SPLIT, PROVIDERS, fmtDur, generateCalls, holdSeries, HEAT_DAYS, heatValue, HEAT_HOURS } from "@/lib/data";
import { btn, Card, CardHead, cx, downloadCsv, Dropdown, PageTitle, Segmented, StageChip } from "@/components/ui";
import { Heatmap, LineChart } from "@/components/charts";

type Range = "7" | "30" | "90";
const RANGE_MULT: Record<Range, number> = { "7": 0.24, "30": 1, "90": 2.9 };
const ALL = "All";
const PAGE = 8;

interface Filters {
  airline: string;
  line: string;
  provider: string;
  engine: string;
  outcome: string;
}
const EMPTY: Filters = { airline: ALL, line: ALL, provider: ALL, engine: ALL, outcome: ALL };

const dateLabels = (days: number) => {
  const end = new Date(2026, 9, 4);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (days - 1 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
};

export default function AnalyticsPage() {
  const { jobs, toast } = useStore();
  const [range, setRange] = useState<Range>("30");
  const [f, setF] = useState<Filters>(EMPTY);
  const [saved, setSaved] = useState<{ name: string; f: Filters; range: Range }[]>([{ name: "US carriers · mornings", f: { ...EMPTY, airline: "United Airlines" }, range: "30" }]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const set = (k: keyof Filters) => (v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setPage(0);
  };
  const filtered = Object.values(f).some((v) => v !== ALL);

  const stats = f.airline === ALL ? AIRLINE_STATS : AIRLINE_STATS.filter((a) => a.name === f.airline);
  const callMult = RANGE_MULT[range] * (f.engine === "Whisper" ? 0.38 : f.engine === "Deepgram" ? 0.62 : 1) * (f.provider === ALL ? 1 : f.provider.startsWith("Twilio") ? 0.6 : f.provider.startsWith("Telnyx") ? 0.3 : 0.1) * (f.line === ALL ? 1 : 0.28);
  const baseCalls = stats.reduce((a, s) => a + s.calls, 0);
  const calls = Math.max(1, Math.round(baseCalls * callMult));
  const reachedPct = stats.reduce((a, s) => a + s.reachedPct * s.calls, 0) / baseCalls;
  const avgHold = stats.reduce((a, s) => a + s.avgHoldSec * s.calls, 0) / baseCalls;
  const longest = Math.max(...stats.map((s) => s.longestHoldSec));
  const detect = stats.reduce((a, s) => a + s.detectSec * s.calls, 0) / baseCalls + (f.engine === "Whisper" ? 0.9 : 0);
  const factor = avgHold / 900;

  const days = Number(range);
  const series = useMemo(() => holdSeries(days, factor, 11), [days, factor]);
  const prev = useMemo(() => holdSeries(days, factor * 1.06, 97), [days, factor]);
  const labels = useMemo(() => dateLabels(days), [days]);

  const best = useMemo(() => {
    let b = { d: 0, h: 6, v: Infinity };
    HEAT_DAYS.forEach((_, di) => HEAT_HOURS.slice(2, 12).forEach((h) => {
      const v = heatValue(di, h, factor);
      if (v < b.v) b = { d: di, h, v };
    }));
    return b;
  }, [factor]);

  // call log built from real job data
  const log = useMemo(() => {
    const rows = jobs
      .filter((j) => j.done > 0)
      .flatMap((j) => generateCalls(j).map((c) => ({ ...c, job: j })))
      .filter((r) => r.stage !== "ivr" && r.stage !== "hold");
    return rows;
  }, [jobs]);
  const outcomeOf = (s: string) => (s === "human" ? "Reached a human" : s === "ended" ? "Max hold reached" : "Failed to connect");
  const logRows = log.filter(
    (r) =>
      (f.airline === ALL || r.job.airline === f.airline) &&
      (f.engine === ALL || r.job.engine === f.engine) &&
      (f.line === ALL || r.job.line === f.line) &&
      (f.outcome === ALL || outcomeOf(r.stage) === f.outcome) &&
      (!q || `${r.id} ${r.job.name} #${r.job.id}`.toLowerCase().includes(q.toLowerCase())),
  );
  const pages = Math.max(1, Math.ceil(logRows.length / PAGE));
  const pageRows = logRows.slice(page * PAGE, page * PAGE + PAGE);

  const exportCsv = () => {
    downloadCsv(`callflow-analytics-${range}d.csv`, [
      ["Call ID", "Job", "Airline", "Started (ET)", "Hold", "Outcome"],
      ...logRows.map((r) => [r.id, `#${r.job.id}`, r.job.airline, r.startedAt, fmtDur(r.holdSec), outcomeOf(r.stage)]),
    ]);
    toast(`Exported ${logRows.length} calls as CSV`);
  };

  const kpis = [
    { label: "Calls placed", value: calls.toLocaleString(), note: "↑ 8% vs previous period" },
    { label: "Reached a human", value: `${reachedPct.toFixed(1)}%`, note: `${Math.round((calls * reachedPct) / 100).toLocaleString()} calls · ↑ 2.4 pts`, primary: true },
    { label: "Average hold", value: fmtDur(Math.round(avgHold)), note: "↓ 48s, faster than before" },
    { label: "Longest hold", value: fmtDur(longest), note: stats.length === 1 ? stats[0].name : "United · Sep 18, 10:41 ET" },
    { label: "Time to detect a human", value: `${detect.toFixed(1)}s`, note: "After pickup · 96.6% accurate" },
  ];

  return (
    <>
      <PageTitle
        title="Hold-time analytics"
        sub="Patterns across every completed call · all times in ET (UTC−5)"
        right={
          <>
            <button className={btn.white} onClick={exportCsv}>
              <Download size={16} /> CSV
            </button>
            <button className={btn.dark} onClick={() => toast("PDF report is being generated. We’ll email it to you.", "info")}>
              <FileText size={16} /> PDF report
            </button>
          </>
        }
      />

      <Card className="flex flex-wrap items-center gap-2.5 p-3">
        <div className="flex items-center gap-2 pl-1.5 text-sm font-bold text-primary-ink">
          <CalendarDays size={16} /> Last
        </div>
        <Segmented
          label="Date range"
          variant="light"
          value={range}
          onChange={(v) => {
            setRange(v);
            setPage(0);
          }}
          options={[
            { value: "7", label: "7 days" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
          ]}
        />
        <Dropdown label="Airline" value={f.airline} options={[ALL, ...AIRLINES.slice(0, 5).map((a) => a.name)]} onChange={set("airline")} />
        <Dropdown label="Line" value={f.line} options={[ALL, ...LINES]} onChange={set("line")} />
        <Dropdown label="Provider" value={f.provider} options={[ALL, ...PROVIDERS]} onChange={set("provider")} />
        <Dropdown label="Engine" value={f.engine} options={[ALL, "Deepgram", "Whisper"]} onChange={set("engine")} />
        <Dropdown label="Outcome" value={f.outcome} options={[ALL, "Reached a human", "Max hold reached", "Failed to connect"]} onChange={set("outcome")} />
        <span className="flex-1" />
        {filtered && (
          <button className={btn.ghost} onClick={() => (setF(EMPTY), setPage(0))}>
            <X size={15} /> Reset
          </button>
        )}
        <button
          className={btn.outline}
          onClick={() => {
            const name = f.airline !== ALL ? `${f.airline.split(" ")[0]} · ${range}d` : `All airlines · ${range}d`;
            setSaved((s) => [...s, { name, f, range }]);
            toast(`Saved view “${name}”`);
          }}
        >
          <Bookmark size={15} /> Save view
        </button>
      </Card>

      {saved.length > 0 && (
        <div className="-mt-2 flex flex-wrap items-center gap-2 px-1 text-[13px]">
          <span className="font-semibold text-muted">Saved views:</span>
          {saved.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setF(s.f);
                setRange(s.range);
                setPage(0);
              }}
              className="cursor-pointer rounded-full bg-white px-3 py-1.5 font-bold text-body hover:text-primary-ink"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <section aria-label="Summary metrics" className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
        {kpis.map((k) => (
          <div key={k.label} className={cx("flex flex-col gap-2.5 rounded-[22px] px-5.5 py-5", k.primary ? "bg-primary text-white" : "bg-white")}>
            <span className={cx("text-[13px] font-semibold", k.primary ? "" : "text-muted")}>{k.label}</span>
            <span className="text-[32px] leading-none font-bold tracking-tight tabular-nums">{k.value}</span>
            <span className={cx("text-[13px]", k.primary ? "" : "text-muted")}>{k.note}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap gap-4">
        <Card className="flex min-w-0 flex-[999_1_640px] flex-col gap-3.5 p-6">
          <CardHead
            title="Average hold time, daily"
            sub={`Last ${range} days compared with the ${range} days before · hover to inspect`}
            right={
              <div className="flex gap-4 text-[13px] text-body">
                <span className="flex items-center gap-1.5">
                  <span className="h-[3px] w-4 rounded bg-primary" />
                  This period
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t-2 border-dashed border-[#9EA3C8]" />
                  Previous
                </span>
              </div>
            }
          />
          <LineChart series={series} compare={prev} labels={labels} />
        </Card>

        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 rounded-3xl bg-navy p-6 text-white">
          <div>
            <h2 className="text-[19px] font-bold">What happened to calls</h2>
            <p className="mt-1 text-[13px] text-muted-dark">Final outcome of {calls.toLocaleString()} calls</p>
          </div>
          <div className="flex h-[22px] gap-[3px] overflow-hidden rounded-full">
            {OUTCOME_SPLIT.map((o) => (
              <span key={o.key} style={{ width: `${o.pct}%`, background: o.color, opacity: f.outcome === ALL || f.outcome === o.label ? 1 : 0.3 }} />
            ))}
          </div>
          {OUTCOME_SPLIT.map((o) => (
            <button
              key={o.key}
              onClick={() => set("outcome")(f.outcome === o.label ? ALL : o.label)}
              className={cx("flex cursor-pointer items-center gap-3 rounded-xl border-b border-navy-3 px-2 py-2 text-left text-sm hover:bg-navy-2", f.outcome === o.label && "bg-navy-2")}
            >
              <span className="h-3 w-3 rounded" style={{ background: o.color }} />
              <span className="flex-1 text-soft-2">{o.label}</span>
              <span className="text-muted-dark tabular-nums">{Math.round((calls * o.pct) / 100).toLocaleString()}</span>
              <strong className="w-14 text-right tabular-nums">{o.pct}%</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-4">
        <Card className="flex min-w-0 flex-[999_1_640px] flex-col gap-4 p-6">
          <CardHead
            title="Best time to call"
            sub="Average hold by weekday and hour (ET)"
            right={
              <span className="rounded-xl bg-ok-bg px-3 py-2 text-[13px] font-bold text-ok">
                Shortest: {HEAT_DAYS[best.d]} {String(best.h).padStart(2, "0")}:00 · {Math.round(best.v)}m avg
              </span>
            }
          />
          <Heatmap factor={factor} />
        </Card>

        <Card className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 p-6">
          <CardHead title="Airlines compared" sub="Click one to filter the whole page" />
          {AIRLINE_STATS.map((a) => {
            const on = f.airline === a.name;
            return (
              <button
                key={a.name}
                onClick={() => set("airline")(on ? ALL : a.name)}
                aria-pressed={on}
                className={cx("-mx-2 flex cursor-pointer flex-col gap-1.5 rounded-xl px-2 py-2 text-left hover:bg-bg", on && "bg-soft-2 hover:bg-soft-2", f.airline !== ALL && !on && "opacity-50")}
              >
                <div className="flex w-full justify-between text-sm">
                  <span className="font-bold">{a.name}</span>
                  <span>
                    <strong className="tabular-nums">{fmtDur(a.avgHoldSec)}</strong> <span className="text-muted">· {a.reachedPct}% reached</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-tint">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(a.avgHoldSec / AIRLINE_STATS[0].avgHoldSec) * 100}%` }} />
                </div>
              </button>
            );
          })}
        </Card>
      </section>

      <section className="flex flex-wrap items-start gap-4">
        <Card className="flex min-w-0 flex-[999_1_640px] flex-col gap-3.5 pt-6 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6">
            <h2 className="text-[19px] font-bold">Call log</h2>
            <label className="flex h-11 items-center gap-2 rounded-full border border-soft px-3.5 text-muted focus-within:border-primary">
              <Search size={16} />
              <span className="sr-only">Search calls</span>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
                placeholder="Search call ID or job"
                className="w-[200px] bg-transparent text-sm text-navy outline-none"
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-bg text-left text-[11px] tracking-[0.06em] text-muted uppercase">
                  <th className="py-3 pr-4 pl-6 font-bold">Call</th>
                  <th className="px-4 font-bold">Started (ET)</th>
                  <th className="px-4 font-bold">Airline</th>
                  <th className="px-4 font-bold">Job</th>
                  <th className="px-4 font-bold">Hold</th>
                  <th className="pr-6 pl-4 font-bold">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={`${r.job.id}-${r.n}`} className="border-t border-line hover:bg-bg">
                    <td className="py-3.5 pr-4 pl-6 font-mono text-[13px]">{r.id.slice(0, 13)}</td>
                    <td className="px-4 tabular-nums">{r.startedAt}</td>
                    <td className="px-4 whitespace-nowrap">{r.job.airline}</td>
                    <td className="px-4">
                      <Link href={`/jobs/${r.job.id}`} className="font-bold text-primary-ink hover:underline">
                        #{r.job.id}
                      </Link>
                    </td>
                    <td className="px-4 font-bold tabular-nums">{fmtDur(r.holdSec)}</td>
                    <td className="pr-6 pl-4">
                      <StageChip stage={r.stage} />
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted">
                      No calls match these filters.{" "}
                      <button className="cursor-pointer font-bold text-primary-ink hover:underline" onClick={() => (setF(EMPTY), setQ(""))}>
                        Reset filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 pt-1 pb-3 text-[13px] text-muted">
            <span>
              {logRows.length ? `${page * PAGE + 1}–${Math.min(logRows.length, page * PAGE + PAGE)} of ${logRows.length} calls` : "0 calls"}
            </span>
            <span className="flex gap-1.5">
              <button aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-soft bg-white disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button aria-label="Next page" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-soft bg-white disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </span>
          </div>
        </Card>

        <Card className="flex min-w-0 flex-[1_1_360px] flex-col p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[19px] font-bold">Insights</h2>
            <span className="rounded-full bg-soft-2 px-2.5 py-1 text-xs font-bold text-primary-ink">Updated 06:00 ET</span>
          </div>
          {[
            { title: `${HEAT_DAYS[best.d]} ${String(best.h).padStart(2, "0")}:00 ET is the best slot${f.airline !== ALL ? ` for ${f.airline}` : ""}`, body: `Average hold ${Math.round(best.v)}m, against ${fmtDur(Math.round(avgHold))} overall.` },
            { title: "Monday 10:00 ET is the worst slot", body: `Average hold ${Math.round(heatValue(0, 10, factor))}m, about 2× the weekday afternoon.` },
            { title: "Whisper is 0.9s slower to detect humans", body: "Accuracy is only 0.4 pts higher. Deepgram is the better default." },
            { title: "Sep 18 spike lines up with storm delays", body: "Every US carrier rose above 20m between 08:00 and 13:00." },
          ].map((i) => (
            <div key={i.title} className="border-t border-line py-3.5">
              <div className="text-sm leading-snug font-bold">{i.title}</div>
              <div className="mt-1 text-[13px] leading-snug text-muted">{i.body}</div>
            </div>
          ))}
        </Card>
      </section>
    </>
  );
}
