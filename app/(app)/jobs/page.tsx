"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, MoreHorizontal, Pause, Play, Plus, Search, Trash2, ArrowUpDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtDur, pct, type Job, type JobStatus } from "@/lib/data";
import { btn, Card, cx, menuItemCls, PageTitle, popCls, StatusChip, usePopover } from "@/components/ui";

type Tab = "all" | JobStatus;
type Sort = "recent" | "hold" | "rate";

function RowMenu({ j }: { j: Job }) {
  const { open, setOpen, ref } = usePopover();
  const { updateJob, addJob, toast } = useStore();
  const router = useRouter();
  const close = () => setOpen(false);
  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button aria-label={`More actions for job #${j.id}`} aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-soft hover:border-primary">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" className={cx(popCls, "right-0 w-[200px]")}>
          {j.status === "running" && (
            <button role="menuitem" className={menuItemCls} onClick={() => (updateJob(j.id, { status: "paused" }), toast(`Job #${j.id} paused`, "info"), close())}>
              <Pause size={15} /> Pause
            </button>
          )}
          {(j.status === "paused" || j.status === "scheduled") && (
            <button role="menuitem" className={menuItemCls} onClick={() => (updateJob(j.id, { status: "running", startedAt: j.startedAt === "—" ? "Now" : j.startedAt }), toast(`Job #${j.id} is running`), close())}>
              <Play size={15} /> {j.status === "paused" ? "Resume" : "Start now"}
            </button>
          )}
          <button
            role="menuitem"
            className={menuItemCls}
            onClick={() => {
              const { id: _id, createdBy: _c, ...rest } = j;
              const id = addJob({ ...rest, name: `${j.name} (copy)`, status: "draft", done: 0, reached: 0, avgHoldSec: 0, longestHoldSec: 0, startedAt: "—", schedule: "Not scheduled" });
              toast(`Duplicated as draft job #${id}`);
              close();
              router.push(`/jobs/new?from=${id}`);
            }}
          >
            <Copy size={15} /> Duplicate
          </button>
          {(j.status === "draft" || j.status === "scheduled") && (
            <button role="menuitem" className={cx(menuItemCls, "text-bad")} onClick={() => (updateJob(j.id, { status: "stopped", schedule: "Cancelled" }), toast(`Job #${j.id} cancelled`, "info"), close())}>
              <Trash2 size={15} /> Cancel job
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const ACTION: Record<JobStatus, string> = { running: "Watch", paused: "Open", scheduled: "View", completed: "Results", failed: "Details", stopped: "Results", draft: "Continue" };

export default function JobsPage() {
  const { jobs } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  const count = (s: JobStatus) => jobs.filter((j) => j.status === s).length;
  const matches = (j: Job) => !q || `${j.name} ${j.airline} #${j.id} ${j.number}`.toLowerCase().includes(q.toLowerCase());
  const rows = jobs
    .filter((j) => (tab === "all" || j.status === tab) && matches(j))
    .sort((a, b) => (sort === "hold" ? b.avgHoldSec - a.avgHoldSec : sort === "rate" ? b.reached / (b.done || 1) - a.reached / (a.done || 1) : b.id - a.id));

  const tabs: { value: Tab; label: string; n: number }[] = [
    { value: "all", label: "All", n: jobs.length },
    { value: "running", label: "Running", n: count("running") },
    { value: "scheduled", label: "Scheduled", n: count("scheduled") },
    { value: "completed", label: "Completed", n: count("completed") },
    { value: "failed", label: "Failed", n: count("failed") },
    { value: "draft", label: "Drafts", n: count("draft") },
  ];
  const stats: { value: JobStatus; label: string; dot: string }[] = [
    { value: "running", label: "Running now", dot: "bg-primary live-dot" },
    { value: "scheduled", label: "Scheduled", dot: "bg-[#9EA3C8]" },
    { value: "completed", label: "Completed", dot: "bg-ok-dot" },
    { value: "failed", label: "Need attention", dot: "bg-bad-dot" },
  ];

  return (
    <>
      <PageTitle
        title="Jobs"
        sub="Every call job your team has run, scheduled or drafted · times in ET"
        right={
          <Link href="/jobs/new" className={btn.primary}>
            <Plus size={18} strokeWidth={2.4} /> New job
          </Link>
        }
      />

      <section aria-label="Job counts" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {stats.map((s) => {
          const on = tab === s.value;
          return (
            <button
              key={s.value}
              aria-pressed={on}
              onClick={() => setTab(on ? "all" : s.value)}
              className={cx("flex cursor-pointer items-center justify-between gap-3 rounded-[22px] border px-5 py-5 text-left transition", on ? "border-primary bg-soft-2" : "border-transparent bg-white hover:border-soft")}
            >
              <span>
                <span className="block text-[13px] font-semibold text-muted">{s.label}</span>
                <span className="mt-1.5 block text-[32px] leading-none font-bold">{count(s.value)}</span>
              </span>
              <span className={cx("h-3 w-3 rounded-full", s.dot)} />
            </button>
          );
        })}
      </section>

      <Card className="flex flex-col gap-4 pt-5 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5">
          <div role="tablist" aria-label="Filter jobs" className="flex flex-wrap gap-0.5 rounded-full bg-tint p-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={cx("cursor-pointer rounded-full px-4 py-2.5 text-[13px] font-bold transition", tab === t.value ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy")}
              >
                {t.label} <span className="opacity-60">{t.n}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-11 items-center gap-2 rounded-full border border-soft px-3.5 text-muted focus-within:border-primary">
              <Search size={16} />
              <span className="sr-only">Search jobs</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, airline or #" className="w-[210px] bg-transparent text-sm text-navy outline-none" />
            </label>
            <label className="flex h-11 items-center gap-2 rounded-full border border-soft px-3.5 text-sm text-muted">
              <ArrowUpDown size={15} />
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="cursor-pointer bg-transparent font-semibold text-navy outline-none">
                <option value="recent">Newest first</option>
                <option value="hold">Longest hold</option>
                <option value="rate">Best reach rate</option>
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead>
              <tr className="bg-bg text-left text-[11px] tracking-[0.06em] text-muted uppercase">
                <th className="py-3 pr-4 pl-5 font-bold">Job</th>
                <th className="px-4 font-bold">Airline · line</th>
                <th className="px-4 font-bold">Hotline</th>
                <th className="px-4 font-bold">Schedule</th>
                <th className="px-4 font-bold">Progress</th>
                <th className="px-4 font-bold">Reached</th>
                <th className="px-4 font-bold">Avg hold</th>
                <th className="px-4 font-bold">Status</th>
                <th className="pr-5 pl-4 font-bold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id} onClick={() => router.push(`/jobs/${j.id}`)} className="cursor-pointer border-t border-line hover:bg-bg">
                  <td className="py-3.5 pr-4 pl-5">
                    <Link href={`/jobs/${j.id}`} onClick={(e) => e.stopPropagation()} className="font-bold hover:text-primary-ink">
                      {j.name}
                    </Link>
                    <div className="mt-0.5 font-mono text-xs text-muted">
                      Job #{j.id} · {j.engine} · by {j.createdBy}
                    </div>
                  </td>
                  <td className="px-4">
                    <div className="whitespace-nowrap">{j.airline}</div>
                    <div className="text-xs text-muted">{j.line}</div>
                  </td>
                  <td className="px-4 font-mono text-[13px] whitespace-nowrap">{j.number}</td>
                  <td className="px-4 whitespace-nowrap">{j.schedule}</td>
                  <td className="px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 w-[90px] rounded-full bg-tint">
                        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(j.done / j.total) * 100}%` }} />
                      </div>
                      <span className="text-[13px] tabular-nums">
                        {j.done}/{j.total}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 font-bold tabular-nums">{pct(j.reached, j.done)}</td>
                  <td className="px-4 tabular-nums">{fmtDur(j.avgHoldSec)}</td>
                  <td className="px-4">
                    <StatusChip status={j.status} />
                  </td>
                  <td className="py-3.5 pr-5 pl-4">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={j.status === "draft" ? `/jobs/new?from=${j.id}` : `/jobs/${j.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-9 items-center rounded-full bg-navy px-3.5 text-[13px] font-bold text-white hover:bg-navy-2"
                      >
                        {ACTION[j.status]}
                      </Link>
                      <RowMenu j={j} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted">
                    No jobs match{q ? ` “${q}”` : " this filter"}.{" "}
                    <button
                      className="cursor-pointer font-bold text-primary-ink hover:underline"
                      onClick={() => {
                        setQ("");
                        setTab("all");
                      }}
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pt-1 pb-3 text-[13px] text-muted">
          Showing {rows.length} of {jobs.length} jobs
        </div>
      </Card>
    </>
  );
}
