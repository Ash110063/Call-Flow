"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, Copy, Download, Pause, Play, RotateCcw, Square, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { airline, fmtDur, generateCalls, pct, transcriptFor, type Call } from "@/lib/data";
import { btn, Card, cx, downloadCsv, menuItemCls, Modal, PageTitle, popCls, StageChip, StatusChip, usePopover } from "@/components/ui";
import { Ring } from "@/components/charts";

type Filter = "all" | "live" | "human" | "none";

function Metric({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Card className="px-5 py-4.5">
      <div className="text-[13px] font-semibold text-muted">{label}</div>
      <div className="mt-1.5 text-[26px] font-bold tabular-nums">
        {value}
        {sub && <span className="ml-1 text-sm font-bold">{sub}</span>}
      </div>
    </Card>
  );
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { getJob, updateJob, addJob, toast, liveMode } = useStore();
  const job = getJob(id);

  const [filter, setFilter] = useState<Filter>("all");
  const [selN, setSelN] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [stopOpen, setStopOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playPos, setPlayPos] = useState(0);
  const exportMenu = usePopover();

  const isLive = job?.status === "running";
  useEffect(() => {
    if (!isLive || !liveMode) return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [isLive, liveMode]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const calls = useMemo(() => (job ? generateCalls(job) : []), [job?.id, job?.done, job?.reached, job?.status]);
  useEffect(() => setTick(0), [job?.done]);

  const selected: Call | undefined = calls.find((c) => c.n === selN) ?? calls.find((c) => c.stage === "human") ?? calls[0];
  const totalSec = selected ? selected.ivrSec + selected.holdSec + selected.humanSec : 0;

  useEffect(() => {
    setPlaying(false);
    setPlayPos(0);
  }, [selected?.n]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPlayPos((p) => (p >= 1 ? (setPlaying(false), 1) : Math.min(1, p + 0.01))), 120);
    return () => clearInterval(t);
  }, [playing]);

  if (!job) {
    return (
      <Card className="p-12 text-center">
        <h1 className="text-2xl font-bold">Job #{params.id} not found</h1>
        <p className="mt-2 text-muted">It may have been deleted.</p>
        <Link href="/jobs" className={cx(btn.primary, "mt-6")}>
          Back to jobs
        </Link>
      </Card>
    );
  }

  const a = airline(job.airline);
  const liveCalls = calls.filter((c) => c.stage === "hold" || c.stage === "ivr");
  const shown = calls.filter((c) => (filter === "all" ? true : filter === "live" ? c.stage === "hold" || c.stage === "ivr" : filter === "human" ? c.stage === "human" : c.stage === "ended" || c.stage === "failed"));
  const liveTime = (c: Call) => (isLive && liveMode ? tick : 0);
  const holdOf = (c: Call) => (c.stage === "hold" ? c.holdSec + liveTime(c) : c.holdSec);
  const firstHuman = [...calls].reverse().find((c) => c.stage === "human");

  const exportCalls = () => {
    downloadCsv(`job-${job.id}-calls.csv`, [
      ["Call", "Call ID", "Started (ET)", "Stage", "Phone menu", "Hold", "Human at", "Confidence"],
      ...calls.map((c) => [c.n, c.id, c.startedAt, c.stage, fmtDur(c.ivrSec), fmtDur(holdOf(c)), c.humanAt, c.stage === "human" ? c.confidence.toFixed(2) : ""]),
    ]);
    exportMenu.setOpen(false);
    toast(`Exported ${calls.length} calls as CSV`);
  };
  const exportTranscript = () => {
    if (!selected) return;
    const text = transcriptFor(selected, job)
      .map((l) => `[${l.t}] ${l.kind === "event" ? "—" : l.kind === "ivr" ? "Phone menu" : l.kind === "bot" ? "Call Flow" : "Agent"}: ${l.text}`)
      .join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const el = document.createElement("a");
    el.href = url;
    el.download = `job-${job.id}-call-${selected.n}.txt`;
    el.click();
    URL.revokeObjectURL(url);
    exportMenu.setOpen(false);
    toast(`Transcript for call #${selected.n} downloaded`);
  };

  const duplicate = () => {
    const { id: _i, createdBy: _c, ...rest } = job;
    const nid = addJob({ ...rest, name: `${job.name} (copy)`, status: "draft", done: 0, reached: 0, avgHoldSec: 0, longestHoldSec: 0, startedAt: "—", schedule: "Not scheduled", failReason: undefined });
    router.push(`/jobs/new?from=${nid}`);
  };

  const nextText =
    job.status === "running" ? `next call in ${mmss(Math.max(1, 72 - (tick % 72)))}` : job.status === "paused" ? `paused · ${job.total - job.done} calls waiting` : job.status === "stopped" ? "stopped by Sana Ahmed" : null;

  return (
    <>
      <PageTitle
        crumbs={
          <>
            <Link href="/jobs" className="hover:text-navy">
              Jobs
            </Link>{" "}
            / <span className="text-navy">Job #{job.id}</span>
          </>
        }
        title={
          <span className="flex flex-wrap items-center gap-3.5">
            <span className="text-[34px] md:text-[40px]">{job.name}</span>
            <StatusChip status={job.status} size="md" />
          </span>
        }
        sub={
          <span className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            <span className="font-mono text-navy">{job.number}</span>
            <span>
              {job.airline} · {job.line}
            </span>
            <span>
              {job.provider.split(" ·")[0]} · {job.engine}
            </span>
            <span>
              {job.status === "scheduled" || job.status === "draft" ? job.schedule : `Started ${job.startedAt} ET`}
              {nextText && ` · ${nextText}`}
            </span>
          </span>
        }
        right={
          <>
            <div ref={exportMenu.ref} className="relative">
              <button className={btn.white} aria-expanded={exportMenu.open} onClick={() => exportMenu.setOpen(!exportMenu.open)} disabled={!calls.length}>
                <Download size={16} /> Export
              </button>
              {exportMenu.open && (
                <div role="menu" className={cx(popCls, "right-0 w-[240px]")}>
                  <button role="menuitem" className={menuItemCls} onClick={exportCalls}>
                    <Download size={15} /> Calls as CSV
                  </button>
                  <button role="menuitem" className={menuItemCls} onClick={exportTranscript}>
                    <FileText size={15} /> Selected transcript (.txt)
                  </button>
                  <button role="menuitem" className={menuItemCls} onClick={() => (exportMenu.setOpen(false), toast("Job summary PDF will be emailed to you", "info"))}>
                    <FileText size={15} /> Job summary PDF
                  </button>
                </div>
              )}
            </div>
            {(job.status === "running" || job.status === "paused") && (
              <>
                <button
                  className={btn.dark}
                  onClick={() => {
                    const next = job.status === "running" ? "paused" : "running";
                    updateJob(job.id, { status: next });
                    toast(next === "paused" ? `Job #${job.id} paused. Live calls finish, no new calls start.` : `Job #${job.id} resumed`, next === "paused" ? "info" : "ok");
                  }}
                >
                  {job.status === "running" ? <Pause size={16} /> : <Play size={16} />}
                  {job.status === "running" ? "Pause job" : "Resume job"}
                </button>
                <button className={btn.danger} onClick={() => setStopOpen(true)}>
                  <Square size={14} /> Stop job
                </button>
              </>
            )}
            {(job.status === "completed" || job.status === "stopped" || job.status === "failed") && (
              <button className={btn.primary} onClick={duplicate}>
                <Copy size={16} /> Run again
              </button>
            )}
          </>
        }
      />

      {job.status === "failed" && (
        <div role="alert" className="flex flex-wrap items-center gap-4 rounded-3xl bg-bad-bg p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-bad">
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0 flex-[1_1_300px]">
            <div className="font-bold text-bad">This job couldn’t place any calls</div>
            <div className="mt-0.5 text-sm text-body">{job.failReason} Last attempt 08:41 ET.</div>
          </div>
          <button
            className={btn.dark}
            onClick={() => {
              updateJob(job.id, { status: "running", failReason: undefined, provider: "Telnyx · US Central", startedAt: "Just now" });
              toast(`Retrying job #${job.id} on Telnyx`);
            }}
          >
            <RotateCcw size={16} /> Retry with Telnyx
          </button>
          <Link href="/settings" className={btn.outline}>
            Check hotline
          </Link>
        </div>
      )}

      {(job.status === "scheduled" || job.status === "draft") && (
        <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-soft-2 text-primary-ink">
            <CalendarClock size={20} />
          </span>
          <div className="min-w-0 flex-[1_1_300px]">
            <div className="font-bold">{job.status === "draft" ? "This job is a draft" : `Scheduled · ${job.schedule} ET`}</div>
            <div className="mt-0.5 text-sm text-muted">
              {job.status === "draft" ? "Finish setting it up to schedule or launch it." : `${job.total} calls, every ${job.gapMin < 1 ? "30s" : `${job.gapMin}m`}. Calls and transcripts appear here once it starts.`}
            </div>
          </div>
          {job.status === "scheduled" && (
            <button
              className={btn.primary}
              onClick={() => {
                updateJob(job.id, { status: "running", startedAt: "Just now" });
                toast(`Job #${job.id} started early`);
              }}
            >
              <Play size={16} /> Start now
            </button>
          )}
          <Link href={`/jobs/new?from=${job.id}`} className={btn.outline}>
            {job.status === "draft" ? "Continue setup" : "Edit"}
          </Link>
        </div>
      )}

      <section aria-label="Job metrics" className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <div className="flex items-center gap-4 rounded-3xl bg-primary px-5 py-4 text-white">
          <Ring value={job.done / job.total} />
          <div>
            <div className="text-[13px] font-semibold">Progress</div>
            <div className="mt-0.5 text-[26px] font-bold tabular-nums">
              {job.done}
              <span className="text-base font-semibold opacity-80"> / {job.total}</span>
            </div>
          </div>
        </div>
        <Metric label="Reached a human" value={job.reached} sub={<span className="text-ok">{pct(job.reached, job.done)}</span>} />
        <Metric label="Live right now" value={isLive || job.status === "paused" ? liveCalls.length : 0} />
        <Metric label="Avg hold" value={fmtDur(job.avgHoldSec)} />
        <Metric label="Longest hold" value={fmtDur(job.longestHoldSec)} />
        <Metric label="First human at" value={firstHuman ? firstHuman.humanAt : "—"} sub={firstHuman ? <span className="text-muted">ET</span> : undefined} />
      </section>

      {calls.length > 0 && (
        <div className="flex flex-wrap items-start gap-4">
          <Card className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5 pt-5 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5">
              <h2 className="text-[19px] font-bold">Calls</h2>
              <div role="tablist" aria-label="Filter calls" className="flex flex-wrap gap-0.5 rounded-full bg-tint p-1">
                {(
                  [
                    ["all", "All", calls.length],
                    ["live", "In progress", liveCalls.length],
                    ["human", "Reached human", calls.filter((c) => c.stage === "human").length],
                    ["none", "No answer", calls.filter((c) => c.stage === "ended" || c.stage === "failed").length],
                  ] as [Filter, string, number][]
                ).map(([k, l, n]) => (
                  <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={cx("cursor-pointer rounded-full px-3.5 py-2 text-[13px] font-bold", filter === k ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy")}>
                    {l} <span className="opacity-60">{n}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-bg text-left text-[11px] tracking-[0.06em] text-muted uppercase">
                    <th className="py-3 pr-3 pl-5 font-bold">Call</th>
                    <th className="px-3 font-bold">Started (ET)</th>
                    <th className="px-3 font-bold">Stage</th>
                    <th className="px-3 font-bold">Hold time</th>
                    <th className="px-3 font-bold">Human at</th>
                    <th className="pr-5 pl-3 font-bold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((c) => {
                    const on = c.n === selected?.n;
                    return (
                      <tr
                        key={c.n}
                        onClick={() => setSelN(c.n)}
                        aria-selected={on}
                        className={cx("cursor-pointer border-t border-line", on ? "bg-[#E9F2FF] shadow-[inset_3px_0_0_#3595FF]" : "hover:bg-bg")}
                      >
                        <td className="py-3.5 pr-3 pl-5">
                          <button className="cursor-pointer font-bold" onClick={() => setSelN(c.n)}>
                            #{c.n}
                          </button>
                        </td>
                        <td className="px-3 tabular-nums">{c.startedAt}</td>
                        <td className="px-3">
                          <StageChip stage={c.stage} />
                        </td>
                        <td className="px-3 font-semibold tabular-nums">{c.stage === "ivr" ? "—" : fmtDur(holdOf(c))}</td>
                        <td className="px-3 tabular-nums">{c.humanAt}</td>
                        <td className="pr-5 pl-3 tabular-nums">{c.stage === "human" ? c.confidence.toFixed(2) : "—"}</td>
                      </tr>
                    );
                  })}
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted">
                        No calls in this view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 pt-1 pb-3 text-[13px] text-muted">
              {job.done} of {job.total} calls placed{job.total - job.done > 0 && (job.status === "running" || job.status === "paused") ? ` · ${job.total - job.done} still to dial` : ""}
            </div>
          </Card>

          {selected && (
            <Card className="flex min-w-0 flex-[1_1_440px] flex-col gap-4.5 p-5 xl:sticky xl:top-6">
              <div className="flex flex-wrap items-start justify-between gap-2.5">
                <div>
                  <h2 className="text-[19px] font-bold">Call #{selected.n}</h2>
                  <div className="mt-1 font-mono text-xs text-muted">{selected.id}</div>
                </div>
                <StageChip stage={selected.stage} />
              </div>

              {(() => {
                const ivr = selected.ivrSec + (selected.stage === "ivr" ? liveTime(selected) : 0);
                const hold = holdOf(selected);
                const human = selected.humanSec;
                const sum = ivr + hold + human || 1;
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex h-3.5 gap-[3px] overflow-hidden rounded-full">
                      <span className="rounded-full bg-sky" style={{ width: `${(ivr / sum) * 100}%`, minWidth: 10 }} />
                      {hold > 0 && <span className="rounded-full bg-warn-dot" style={{ width: `${(hold / sum) * 100}%` }} />}
                      {human > 0 && <span className="rounded-full bg-ok-dot" style={{ width: `${(human / sum) * 100}%`, minWidth: 12 }} />}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-body">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-sky" />
                        Phone menu {fmtDur(ivr)}
                      </span>
                      {hold > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-sm bg-warn-dot" />
                          On hold {fmtDur(hold)}
                        </span>
                      )}
                      {human > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-sm bg-ok-dot" />
                          Human {fmtDur(human)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {job.recording && selected.stage !== "hold" && selected.stage !== "ivr" && (
                <div className="flex items-center gap-3 rounded-2xl bg-bg px-3.5 py-3">
                  <button
                    aria-label={playing ? "Pause recording" : "Play recording"}
                    onClick={() => (playPos >= 1 ? (setPlayPos(0), setPlaying(true)) : setPlaying(!playing))}
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-white hover:bg-[#2585ef]"
                  >
                    {playing ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" className="ml-0.5" />}
                  </button>
                  <div className="flex h-8 min-w-0 flex-1 items-center gap-[3px]" aria-hidden="true">
                    {Array.from({ length: 48 }, (_, i) => {
                      const human = i >= 42;
                      const h = human ? 10 + ((i * 37) % 20) : i < 6 ? 6 + ((i * 13) % 14) : 4 + ((i * 7) % 4);
                      const played = i / 48 < playPos;
                      return <span key={i} className="flex-1 rounded-full" style={{ height: h, background: played ? (human ? "#12A26F" : "#3595FF") : human ? "#A6E3C9" : "#A9E3FD" }} />;
                    })}
                  </div>
                  <span className="shrink-0 font-mono text-[13px] text-body">
                    {mmss(playPos * totalSec)} / {mmss(totalSec)}
                  </span>
                </div>
              )}

              <div className="flex max-h-[480px] flex-col gap-3 overflow-y-auto pr-1">
                {transcriptFor(selected, job).map((l, i) =>
                  l.kind === "event" ? (
                    <div
                      key={i}
                      className={cx(
                        "flex items-center gap-2 self-center rounded-full px-3 py-1.5 text-xs font-bold",
                        l.tone === "human" ? "bg-ok-bg text-ok" : l.tone === "hold" ? "bg-warn-bg text-warn" : l.tone === "fail" ? "bg-bad-bg text-bad" : "bg-tint text-body",
                      )}
                    >
                      <span className="font-mono font-medium">{l.t}</span>
                      {l.text}
                    </div>
                  ) : (
                    <div key={i} className={cx("flex max-w-[86%] flex-col gap-1", l.kind === "bot" ? "items-end self-end" : "self-start")}>
                      <div className="flex gap-2 text-xs text-muted">
                        <strong className="text-navy">{l.kind === "ivr" ? "Airline phone menu" : l.kind === "bot" ? "Call Flow" : "Agent"}</strong>
                        <span className="font-mono">{l.t}</span>
                      </div>
                      <div className={cx("rounded-2xl px-3.5 py-3 text-sm leading-relaxed", l.kind === "bot" ? "bg-primary text-white" : l.kind === "agent" ? "bg-ok-bg" : "bg-tint")}>{l.text}</div>
                    </div>
                  ),
                )}
                {(selected.stage === "hold" || selected.stage === "ivr") && (
                  <div className="flex items-center gap-2 self-center rounded-full bg-bg px-3 py-1.5 text-xs font-semibold text-muted">
                    <span className="live-dot h-2 w-2 rounded-full bg-primary" />
                    {job.status === "paused" ? "Live call continues while the job is paused" : "Listening… transcript streams in as audio is processed"}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {calls.length === 0 && job.status !== "scheduled" && job.status !== "draft" && (
        <Card className="p-10 text-center text-muted">{job.status === "failed" ? "No calls connected. Retry once the hotline is reachable." : "Dialing the first call… calls appear here within a few seconds."}</Card>
      )}

      <Modal open={stopOpen} onClose={() => setStopOpen(false)} title="Stop this job?">
        <p className="text-sm leading-relaxed text-muted">
          {liveCalls.length} live calls will be hung up and the {job.total - job.done} remaining calls won’t be placed. Results for the {job.done} calls so far are kept.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <button className={btn.outline} onClick={() => setStopOpen(false)}>
            Keep running
          </button>
          <button
            className="inline-flex h-11 cursor-pointer items-center rounded-full bg-[#C2362F] px-5 text-sm font-bold text-white hover:bg-bad"
            onClick={() => {
              updateJob(job.id, { status: "stopped" });
              setStopOpen(false);
              toast(`Job #${job.id} stopped. ${job.done} calls kept.`, "info");
            }}
          >
            Stop job
          </button>
        </div>
      </Modal>
    </>
  );
}
