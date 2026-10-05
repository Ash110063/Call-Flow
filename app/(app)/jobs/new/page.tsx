"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, AlertTriangle, Loader2, PhoneCall, Minus, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { AIRLINES, HOTLINES, LINES, PROVIDERS, type Engine } from "@/lib/data";
import { btn, Card, cx, Field, inputCls, PageTitle, Select, ToggleRow } from "@/components/ui";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GAPS = [
  { v: 0.5, l: "30s" },
  { v: 2, l: "2m" },
  { v: 5, l: "5m" },
  { v: 10, l: "10m" },
];

function Section({ n, title, sub, children }: { n: number; title: string; sub: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-6 p-7">
      <div className="flex items-start gap-3.5">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">{n}</span>
        <div>
          <h2 className="text-[19px] font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{sub}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function ChoiceCard({ on, onClick, title, body, tag }: { on: boolean; onClick: () => void; title: string; body: string; tag?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cx("flex cursor-pointer items-start gap-3 rounded-2xl p-4 text-left transition", on ? "bg-[#E9F2FF] ring-2 ring-primary" : "bg-white ring-1 ring-soft hover:ring-primary")}
    >
      <span className={cx("mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full bg-white", on ? "border-[5px] border-primary" : "border-2 border-[#B7C9E8]")} />
      <span className="flex-1">
        <span className="flex justify-between gap-2 text-[15px] font-bold">
          {title}
          {tag && <span className="text-xs font-bold text-primary-ink">{tag}</span>}
        </span>
        <span className="mt-0.5 block text-[13px] text-muted">{body}</span>
      </span>
    </button>
  );
}

function NewJobForm() {
  const { jobs, getJob, addJob, updateJob, toast } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const fromId = Number(params.get("from")) || 0;
  const source = fromId ? getJob(fromId) : undefined;

  const [name, setName] = useState("AA Customer Service — weekday mornings");
  const [air, setAir] = useState("American Airlines");
  const [line, setLine] = useState<string>("Customer service");
  const [number, setNumber] = useState("+1 800 433 7300");
  const [menuPath, setMenuPath] = useState("2 → “agent” → 0");
  const [calls, setCalls] = useState(20);
  const [gap, setGap] = useState(2);
  const [mode, setMode] = useState<"now" | "sched">("sched");
  const [date, setDate] = useState("2026-10-06");
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("12:00");
  const [days, setDays] = useState([true, true, true, true, true, false, false]);
  const [provider, setProvider] = useState<string>(PROVIDERS[0]);
  const [engine, setEngine] = useState<Engine>("Deepgram");
  const [chunk, setChunk] = useState("10 seconds");
  const [noise, setNoise] = useState("Light office");
  const [rec, setRec] = useState(true);
  const [hangUp, setHangUp] = useState(true);
  const [notify, setNotify] = useState(false);
  const [test, setTest] = useState<"idle" | "running" | "done">("idle");
  const [touched, setTouched] = useState(false);

  // prefill from a draft / duplicate
  useEffect(() => {
    if (!source) return;
    setName(source.name);
    setAir(source.airline);
    setLine(source.line);
    setNumber(source.number);
    setMenuPath(source.menuPath);
    setCalls(source.total);
    setGap(source.gapMin);
    setEngine(source.engine);
    setRec(source.recording);
    setHangUp(source.hangUpOnHuman);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromId]);

  const pickHotline = (a: string, l: string) => {
    const h = HOTLINES.find((x) => x.airline === a && x.line === l);
    if (h) {
      setNumber(h.number);
      setMenuPath(h.menuPath);
    }
  };

  const hotline = HOTLINES.find((h) => h.number === number);
  const totalMin = Math.round(calls * (gap + 7));
  const runtime = `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
  const windowMin = (() => {
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = to.split(":").map(Number);
    return th * 60 + tm - (fh * 60 + fm);
  })();
  const overlap = jobs.find((j) => j.id !== fromId && j.number === number && (j.status === "scheduled" || j.status === "running"));

  const errors = {
    name: !name.trim() ? "Give the job a name." : "",
    number: !/^\+?[\d\s()-]{8,}$/.test(number) ? "Enter a valid phone number." : "",
    window: mode === "sched" && windowMin <= 0 ? "End time must be after start time." : "",
    days: mode === "sched" && !days.some(Boolean) ? "Pick at least one day." : "",
  };
  const invalid = Object.values(errors).some(Boolean);

  const checks = useMemo(
    () => [
      hotline?.health === "busy"
        ? { ok: false, text: "This hotline returned busy signals today." }
        : hotline?.health === "changed"
          ? { ok: false, text: "The phone menu may have changed. Run a test call." }
          : { ok: true, text: hotline ? "Hotline reachable" : "New number, run a test call first" },
      test === "done" ? { ok: true, text: "Test call passed" } : { ok: !!hotline && hotline.health === "ok", text: "Menu path matched last successful run" },
      overlap ? { ok: false, text: `Overlaps job #${overlap.id} on the same number` } : { ok: true, text: "No overlapping jobs on this number" },
      mode === "sched" && totalMin > windowMin && windowMin > 0 ? { ok: false, text: `${calls} calls need ~${runtime}, longer than the window` } : { ok: true, text: "Fits the time window" },
    ],
    [hotline, test, overlap, mode, totalMin, windowMin, calls, runtime],
  );

  const runTest = () => {
    if (test === "running") return;
    setTest("running");
    setTimeout(() => {
      setTest("done");
      toast("Test call passed: reached the hold queue in 1m 41s");
    }, 2200);
  };

  const buildJob = (status: "running" | "scheduled" | "draft") => ({
    name: name.trim(),
    airline: air,
    line,
    number,
    menuPath,
    engine,
    provider,
    schedule:
      status === "draft"
        ? "Not scheduled"
        : mode === "now"
          ? "Started just now"
          : `${days.every(Boolean) ? "Daily" : days.filter(Boolean).length === 5 && days.slice(0, 5).every(Boolean) ? "Mon–Fri" : DAYS.filter((_, i) => days[i]).join(", ")} · ${from}–${to}`,
    startedAt: status === "running" ? "Just now" : "—",
    total: calls,
    done: 0,
    reached: 0,
    avgHoldSec: 0,
    longestHoldSec: 0,
    gapMin: gap,
    recording: rec,
    hangUpOnHuman: hangUp,
    status,
  });

  const submit = (draft = false) => {
    setTouched(true);
    if (!draft && invalid) return;
    const status = draft ? "draft" : mode === "now" ? "running" : "scheduled";
    let id: number;
    if (source && source.status === "draft") {
      updateJob(source.id, buildJob(status));
      id = source.id;
    } else {
      id = addJob(buildJob(status));
    }
    if (draft) {
      toast(`Saved as draft job #${id}`);
      router.push("/jobs");
      return;
    }
    toast(status === "running" ? `Job #${id} launched. Dialing the first call…` : `Job #${id} scheduled for ${from} ET`);
    router.push(`/jobs/${id}`);
  };

  const err = (k: keyof typeof errors) => (touched ? errors[k] : "");

  return (
    <>
      <PageTitle
        crumbs={
          <>
            <Link href="/jobs" className="hover:text-navy">
              Jobs
            </Link>{" "}
            / <span className="text-navy">{source?.status === "draft" ? `Draft #${source.id}` : "New job"}</span>
          </>
        }
        title="Set up a call job"
        sub="Choose who to call, when, and how each call is listened to."
        right={
          <>
            <Link href="/jobs" className={btn.white}>
              Cancel
            </Link>
            <button onClick={() => submit(true)} className={btn.outline}>
              Save as draft
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-4">
          <Section n={1} title="Who are we calling?" sub="The airline hotline this job will dial.">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-5 gap-y-4.5">
              <Field label="Job name" error={err("name")} className="col-span-full">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Airline">
                <Select
                  value={air}
                  options={AIRLINES.map((a) => a.name)}
                  onChange={(v) => {
                    setAir(v);
                    pickHotline(v, line);
                  }}
                />
              </Field>
              <Field label="Line">
                <Select
                  value={line}
                  options={LINES}
                  onChange={(v) => {
                    setLine(v);
                    pickHotline(air, v);
                  }}
                />
              </Field>
              <Field
                label="Hotline number"
                error={err("number")}
                hint={hotline ? `Saved hotline · checked ${hotline.checked.toLowerCase()}` : "Not a saved hotline yet"}
              >
                <input value={number} onChange={(e) => setNumber(e.target.value)} inputMode="tel" className={cx(inputCls, "font-mono")} />
              </Field>
              <Field label="Phone-menu path" hint="Keys or phrases to reach an agent">
                <input value={menuPath} onChange={(e) => setMenuPath(e.target.value)} className={cx(inputCls, "font-mono")} />
              </Field>
            </div>
          </Section>

          <Section n={2} title="Call plan" sub="How many calls, how far apart, and when they run.">
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Calls in this job</span>
                <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border border-soft">
                  <button aria-label="Fewer calls" onClick={() => setCalls((c) => Math.max(1, c - 1))} className="flex h-full w-[50px] cursor-pointer items-center justify-center bg-bg hover:bg-tint">
                    <Minus size={16} />
                  </button>
                  <input
                    aria-label="Calls in this job"
                    value={calls}
                    onChange={(e) => setCalls(Math.max(1, Math.min(200, Number(e.target.value.replace(/\D/g, "")) || 1)))}
                    className="w-16 text-center text-[17px] font-bold outline-none"
                  />
                  <button aria-label="More calls" onClick={() => setCalls((c) => Math.min(200, c + 1))} className="flex h-full w-[50px] cursor-pointer items-center justify-center bg-bg hover:bg-tint">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Gap between calls</span>
                <div role="radiogroup" aria-label="Gap between calls" className="flex gap-0.5 rounded-2xl bg-tint p-1">
                  {GAPS.map((g) => (
                    <button
                      key={g.v}
                      role="radio"
                      aria-checked={gap === g.v}
                      onClick={() => setGap(g.v)}
                      className={cx("h-[42px] cursor-pointer rounded-xl px-4 text-sm font-bold transition", gap === g.v ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy")}
                    >
                      {g.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold">When should it run?</span>
              <div role="radiogroup" className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                <ChoiceCard on={mode === "now"} onClick={() => setMode("now")} title="Run now" body="Start dialing as soon as you launch." />
                <ChoiceCard on={mode === "sched"} onClick={() => setMode("sched")} title="Schedule a window" body="Run between set times, on chosen days." />
              </div>
            </div>

            {mode === "sched" && (
              <div className="flex flex-col gap-4.5 rounded-[18px] bg-bg p-5">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
                  <Field label="Starts on">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="From">
                    <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Until" error={err("window")}>
                    <input type="time" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Time zone">
                    <Select value="ET (UTC−5)" onChange={() => {}} options={["ET (UTC−5)", "CT (UTC−6)", "PT (UTC−8)", "UTC"]} />
                  </Field>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Repeat on</span>
                  <div role="group" aria-label="Repeat on" className="flex flex-wrap gap-2">
                    {DAYS.map((d, i) => (
                      <button
                        key={d}
                        aria-pressed={days[i]}
                        onClick={() => setDays(days.map((x, k) => (k === i ? !x : x)))}
                        className={cx("h-11 w-[52px] cursor-pointer rounded-xl border text-sm font-bold transition", days[i] ? "border-primary bg-primary text-white" : "border-soft bg-white text-body hover:border-primary")}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {err("days") && <span className="text-[13px] font-semibold text-bad">{err("days")}</span>}
                </div>
              </div>
            )}
          </Section>

          <Section n={3} title="Voice & detection" sub="How calls are placed, transcribed and analysed.">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-5 gap-y-4.5">
              <Field label="Voice provider">
                <Select value={provider} onChange={setProvider} options={PROVIDERS} />
              </Field>
              <Field label="Audio chunk length" hint="Shorter chunks detect humans faster but cost more.">
                <Select value={chunk} onChange={setChunk} options={["5 seconds", "10 seconds", "20 seconds"]} />
              </Field>
              <Field label="Caller background noise">
                <Select value={noise} onChange={setNoise} options={["None", "Light office", "Airport terminal", "Street"]} />
              </Field>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold">Speech engine</span>
              <div role="radiogroup" aria-label="Speech engine" className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                <ChoiceCard on={engine === "Deepgram"} onClick={() => setEngine("Deepgram")} title="Deepgram" tag="Recommended" body="Streaming, ~1.5s to detect a human." />
                <ChoiceCard on={engine === "Whisper"} onClick={() => setEngine("Whisper")} title="Whisper" body="Higher transcript accuracy, slower detection." />
              </div>
            </div>
            <div className="border-b border-line">
              <ToggleRow title="Record calls" body="Keep audio for 30 days so you can replay detections." checked={rec} onChange={setRec} />
              <ToggleRow title="Hang up once a human answers" body="Ends the call politely after detection to save agent time." checked={hangUp} onChange={setHangUp} />
              <ToggleRow title="Email me when the job finishes" body="Includes the summary and any failed calls." checked={notify} onChange={setNotify} />
            </div>
          </Section>
        </div>

        <aside aria-label="Job summary" className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 lg:sticky lg:top-6">
          <div className="flex flex-col gap-5 rounded-3xl bg-navy p-6 text-white">
            <div>
              <div className="text-[13px] font-bold tracking-[0.06em] text-sky-light uppercase">Summary</div>
              <div className="mt-2 text-[19px] leading-snug font-bold">{name || "Untitled job"}</div>
              <div className="mt-1 text-[13px] text-muted-dark">
                {air} · {line}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Calls", String(calls)],
                ["Every", GAPS.find((g) => g.v === gap)?.l ?? ""],
                ["Est. run time", runtime],
                ["Est. minutes", `~${calls * 16} min`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-navy-2 p-3.5">
                  <div className="text-xs text-muted-dark">{k}</div>
                  <div className="mt-1 text-[22px] font-bold tabular-nums">{v}</div>
                </div>
              ))}
            </div>
            <dl className="flex flex-col gap-2.5 text-sm text-soft-2">
              <div className="flex justify-between gap-4">
                <dt>Schedule</dt>
                <dd className="text-right font-bold text-white">{mode === "now" ? "Starts on launch" : `${days.filter(Boolean).length} days · ${from}–${to} ET`}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Speech engine</dt>
                <dd className="font-bold text-white">{engine}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Recording</dt>
                <dd className="font-bold text-white">{rec ? "On · kept 30 days" : "Off"}</dd>
              </div>
            </dl>
            {touched && invalid && <div className="rounded-xl bg-bad-dot/15 px-3.5 py-3 text-[13px] text-[#FFB3B0]">Fix the highlighted fields to continue.</div>}
            <button onClick={() => submit(false)} className={cx(btn.primary, "h-[52px] text-[15px]")}>
              {mode === "now" ? "Launch job now" : "Schedule job"}
            </button>
            <button onClick={runTest} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#3A3A78] text-sm font-bold hover:bg-navy-2">
              {test === "running" ? <Loader2 size={16} className="animate-spin" /> : <PhoneCall size={16} />}
              {test === "running" ? `Calling ${number}…` : test === "done" ? "Run test call again" : "Place one test call first"}
            </button>
            {test === "done" && (
              <div role="status" className="rounded-xl bg-sky/15 px-3.5 py-3 text-[13px] leading-relaxed text-soft-2">
                <strong className="text-white">Test call passed.</strong> Menu path worked and the call reached the hold queue in 1m 41s.
              </div>
            )}
          </div>

          <Card className="flex flex-col gap-3.5 p-6">
            <h2 className="text-base font-bold">Pre-flight checks</h2>
            {checks.map((c) => (
              <div key={c.text} className="flex items-start gap-2.5 text-sm">
                <span className={cx("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full", c.ok ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn")}>
                  {c.ok ? <Check size={13} strokeWidth={3} /> : <AlertTriangle size={12} strokeWidth={2.6} />}
                </span>
                {c.text}
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-2 p-6">
            <h2 className="mb-1.5 text-base font-bold">Start from a template</h2>
            {[
              { t: "Morning peak · 20 calls", d: "2m gap · Deepgram · Mon–Fri 09:00", apply: () => (setCalls(20), setGap(2), setEngine("Deepgram"), setMode("sched"), setFrom("09:00"), setTo("12:00"), setDays([true, true, true, true, true, false, false])) },
              { t: "Overnight sweep · 30 calls", d: "10m gap · Whisper · Daily 23:00", apply: () => (setCalls(30), setGap(10), setEngine("Whisper"), setMode("sched"), setFrom("23:00"), setTo("23:59"), setDays([true, true, true, true, true, true, true])) },
              { t: "Quick check · 5 calls", d: "30s gap · Deepgram · Run now", apply: () => (setCalls(5), setGap(0.5), setEngine("Deepgram"), setMode("now")) },
            ].map((x) => (
              <button
                key={x.t}
                onClick={() => {
                  x.apply();
                  toast(`Applied “${x.t}”`, "info");
                }}
                className="cursor-pointer rounded-2xl border border-line bg-bg px-3.5 py-3 text-left text-sm hover:border-primary"
              >
                <strong>{x.t}</strong>
                <span className="mt-0.5 block text-[13px] text-muted">{x.d}</span>
              </button>
            ))}
          </Card>
        </aside>
      </div>
    </>
  );
}

export default function NewJobPage() {
  return (
    <Suspense fallback={null}>
      <NewJobForm />
    </Suspense>
  );
}
