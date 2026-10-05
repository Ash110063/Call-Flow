// Dummy data for the Call Flow prototype. Everything here is invented sample data.

export type JobStatus = "running" | "paused" | "scheduled" | "completed" | "failed" | "stopped" | "draft";
export type Engine = "Deepgram" | "Whisper";
export type CallStage = "dialing" | "ivr" | "hold" | "human" | "ended" | "failed";

export interface Airline {
  name: string;
  code: string;
  tint: string;
  ink: string;
}

export const AIRLINES: Airline[] = [
  { name: "American Airlines", code: "AA", tint: "#D7E9FF", ink: "#1A62C2" },
  { name: "United Airlines", code: "UA", tint: "#E3F6EE", ink: "#0B6B49" },
  { name: "Turkish Airlines", code: "TK", tint: "#FFF1DC", ink: "#8A4B00" },
  { name: "Delta Air Lines", code: "DL", tint: "#DDF4FF", ink: "#0A6890" },
  { name: "Emirates", code: "EK", tint: "#FDE7E5", ink: "#A8261F" },
  { name: "JetBlue", code: "B6", tint: "#EEF4FF", ink: "#33376A" },
];

export const airline = (name: string): Airline =>
  AIRLINES.find((a) => a.name === name) ?? { name, code: name.slice(0, 2).toUpperCase(), tint: "#EEF4FF", ink: "#33376A" };

export const LINES = ["Customer service", "Reservations", "Baggage", "Loyalty desk"] as const;
export const PROVIDERS = ["Twilio · US East", "Telnyx · US Central", "Vonage · US East"] as const;

export interface Hotline {
  airline: string;
  line: string;
  number: string;
  menuPath: string;
  checked: string;
  health: "ok" | "changed" | "busy";
}

export const HOTLINES: Hotline[] = [
  { airline: "American Airlines", line: "Customer service", number: "+1 800 433 7300", menuPath: "2 → “agent” → 0", checked: "Today 09:12", health: "ok" },
  { airline: "United Airlines", line: "Baggage", number: "+1 800 335 2247", menuPath: "3 → 1 → “agent”", checked: "Today 10:05", health: "ok" },
  { airline: "United Airlines", line: "Customer service", number: "+1 800 864 8331", menuPath: "1 → “agent”", checked: "Today 07:50", health: "ok" },
  { airline: "Turkish Airlines", line: "Reservations", number: "+1 800 874 8875", menuPath: "1 → 0", checked: "Today 10:31", health: "changed" },
  { airline: "Delta Air Lines", line: "Loyalty desk", number: "+1 800 325 8847", menuPath: "4 → “representative”", checked: "Today 08:41", health: "busy" },
  { airline: "Delta Air Lines", line: "Reservations", number: "+1 800 221 1212", menuPath: "1 → 1 → 0", checked: "Yesterday 18:20", health: "ok" },
  { airline: "Emirates", line: "Loyalty desk", number: "+1 800 777 3999", menuPath: "2 → 2 → 0", checked: "Yesterday 22:58", health: "ok" },
  { airline: "JetBlue", line: "Customer service", number: "+1 800 538 2583", menuPath: "Not mapped yet", checked: "—", health: "changed" },
];

export interface Job {
  id: number;
  name: string;
  airline: string;
  line: string;
  number: string;
  menuPath: string;
  engine: Engine;
  provider: string;
  schedule: string;
  startedAt: string;
  total: number;
  done: number;
  reached: number;
  avgHoldSec: number;
  longestHoldSec: number;
  gapMin: number;
  recording: boolean;
  hangUpOnHuman: boolean;
  status: JobStatus;
  failReason?: string;
  createdBy: string;
}

const job = (j: Partial<Job> & Pick<Job, "id" | "name" | "airline" | "line" | "number" | "status">): Job => ({
  menuPath: HOTLINES.find((h) => h.number === j.number)?.menuPath ?? "0",
  engine: "Deepgram",
  provider: "Twilio · US East",
  schedule: "Today",
  startedAt: "—",
  total: 20,
  done: 0,
  reached: 0,
  avgHoldSec: 0,
  longestHoldSec: 0,
  gapMin: 2,
  recording: true,
  hangUpOnHuman: true,
  createdBy: "Sana Ahmed",
  ...j,
});

export const SEED_JOBS: Job[] = [
  job({ id: 56, name: "AA Customer Service — weekday mornings", airline: "American Airlines", line: "Customer service", number: "+1 800 433 7300", status: "running", schedule: "Mon–Fri · 09:00–12:00", startedAt: "09:00", total: 20, done: 14, reached: 9, avgHoldSec: 964, longestHoldSec: 1720 }),
  job({ id: 58, name: "United Baggage — peak hours", airline: "United Airlines", line: "Baggage", number: "+1 800 335 2247", status: "running", engine: "Whisper", schedule: "Today · 10:00–13:00", startedAt: "10:12", total: 15, done: 6, reached: 4, avgHoldSec: 1177, longestHoldSec: 1634, createdBy: "Omar Farooq" }),
  job({ id: 59, name: "Turkish Reservations — EU overlap", airline: "Turkish Airlines", line: "Reservations", number: "+1 800 874 8875", status: "running", schedule: "Today · 10:30–12:30", startedAt: "10:38", total: 10, done: 3, reached: 1, avgHoldSec: 1330, longestHoldSec: 1530, gapMin: 5 }),
  job({ id: 60, name: "AA Customer Service — afternoon", airline: "American Airlines", line: "Customer service", number: "+1 800 433 7300", status: "scheduled", schedule: "Today · 14:00–17:00" }),
  job({ id: 61, name: "Delta Medallion — retry", airline: "Delta Air Lines", line: "Loyalty desk", number: "+1 800 325 8847", status: "scheduled", engine: "Whisper", schedule: "Tomorrow · 08:00", total: 5, createdBy: "Omar Farooq" }),
  job({ id: 57, name: "Delta Medallion — test batch", airline: "Delta Air Lines", line: "Loyalty desk", number: "+1 800 325 8847", status: "failed", engine: "Whisper", schedule: "Today · 08:15", startedAt: "08:15", total: 5, failReason: "The hotline returned a busy signal 5 times in a row." }),
  job({ id: 55, name: "Emirates Skywards — overnight", airline: "Emirates", line: "Loyalty desk", number: "+1 800 777 3999", status: "completed", schedule: "Yesterday · 23:00", startedAt: "Yesterday 23:00", total: 30, done: 30, reached: 25, avgHoldSec: 372, longestHoldSec: 905, gapMin: 10 }),
  job({ id: 54, name: "United Customer Service — benchmark", airline: "United Airlines", line: "Customer service", number: "+1 800 864 8331", status: "completed", schedule: "Oct 3 · 09:00", startedAt: "Oct 3 09:00", total: 20, done: 20, reached: 14, avgHoldSec: 1131, longestHoldSec: 2410, createdBy: "Hina Malik" }),
  job({ id: 53, name: "Turkish Baggage — weekend check", airline: "Turkish Airlines", line: "Baggage", number: "+1 800 874 8875", status: "completed", schedule: "Oct 3 · 15:00", startedAt: "Oct 3 15:00", total: 12, done: 12, reached: 7, avgHoldSec: 1290, longestHoldSec: 2210 }),
  job({ id: 52, name: "Delta Reservations — morning peak", airline: "Delta Air Lines", line: "Reservations", number: "+1 800 221 1212", status: "completed", engine: "Whisper", schedule: "Oct 2 · 09:00", startedAt: "Oct 2 09:00", total: 20, done: 20, reached: 16, avgHoldSec: 588, longestHoldSec: 1320 }),
  job({ id: 51, name: "Emirates Reservations — daytime", airline: "Emirates", line: "Reservations", number: "+1 800 777 3999", status: "completed", schedule: "Oct 2 · 11:00", startedAt: "Oct 2 11:00", total: 15, done: 15, reached: 13, avgHoldSec: 355, longestHoldSec: 840 }),
  job({ id: 62, name: "JetBlue Customer Service — pilot", airline: "JetBlue", line: "Customer service", number: "+1 800 538 2583", status: "draft", schedule: "Not scheduled", total: 25 }),
];

/* ---------- calls & transcripts ---------- */

export interface Call {
  n: number;
  id: string;
  startedAt: string; // HH:MM:SS ET
  stage: CallStage;
  ivrSec: number;
  holdSec: number;
  humanSec: number;
  humanAt: string;
  confidence: number;
}

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const clock = (totalSec: number) => {
  const h = Math.floor(totalSec / 3600) % 24;
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};
const hex = (r: () => number, len: number) =>
  Array.from({ length: len }, () => "0123456789abcdef"[Math.floor(r() * 16)]).join("");

/** Generate a stable list of calls for a job (newest first). */
export function generateCalls(j: Job): Call[] {
  const r = rng(j.id * 7919);
  const calls: Call[] = [];
  const startBase = 9 * 3600 + (j.id % 3) * 600;
  const live = j.status === "running" || j.status === "paused";
  const liveCount = live ? Math.min(3, j.done) : 0;
  let humans = 0;
  for (let i = 1; i <= j.done; i++) {
    const isLive = i > j.done - liveCount;
    const ivrSec = 60 + Math.floor(r() * 70);
    const holdBase = j.avgHoldSec || 900;
    let holdSec = Math.max(60, Math.floor(holdBase * (0.45 + r() * 1.1)));
    let stage: CallStage;
    if (isLive) {
      stage = i === j.done ? "ivr" : "hold";
      holdSec = stage === "hold" ? Math.floor(120 + r() * 900) : 0;
    } else if (humans < j.reached && r() < 0.85) {
      stage = "human";
      humans++;
    } else {
      stage = r() < 0.6 ? "ended" : "failed";
    }
    const start = startBase + (i - 1) * (j.gapMin * 60 + 420);
    const humanAtSec = start + ivrSec + holdSec;
    calls.push({
      n: i,
      id: `${hex(r, 8)}-${hex(r, 4)}-${hex(r, 4)}`,
      startedAt: clock(start),
      stage,
      ivrSec: stage === "ivr" ? Math.floor(10 + r() * 40) : ivrSec,
      holdSec: stage === "ivr" ? 0 : stage === "failed" ? 0 : holdSec,
      humanSec: stage === "human" ? Math.floor(15 + r() * 25) : 0,
      humanAt: stage === "human" ? clock(humanAtSec).slice(0, 5) : "—",
      confidence: 0.9 + Math.round(r() * 9) / 100,
    });
  }
  // ensure the reached count matches by promoting ended calls if the random walk fell short
  for (const c of calls) {
    if (humans >= j.reached) break;
    if (c.stage === "ended") {
      c.stage = "human";
      c.humanSec = 22;
      humans++;
    }
  }
  return calls.reverse();
}

export interface TranscriptLine {
  kind: "ivr" | "bot" | "agent" | "event";
  t: string;
  text: string;
  tone?: "hold" | "human" | "end" | "fail";
}

const mmss = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;

export function transcriptFor(call: Call, j: Job): TranscriptLine[] {
  const lines: TranscriptLine[] = [
    { kind: "ivr", t: "00:02", text: `Welcome. For new reservations, press 1. For an existing trip, press 2.` },
    { kind: "bot", t: "00:09", text: "Pressed 2" },
    { kind: "ivr", t: "00:31", text: "Please say or enter your six-character confirmation code." },
    { kind: "bot", t: "00:40", text: "“Agent”" },
  ];
  if (call.stage === "ivr") return lines.slice(0, 2);
  const holdStart = call.ivrSec;
  lines.push({ kind: "event", t: mmss(holdStart), text: "Placed on hold · hold music detected", tone: "hold" });
  if (call.stage === "hold") return lines;
  if (call.stage === "failed") {
    lines.push({ kind: "event", t: mmss(holdStart + 4), text: "Line dropped by carrier", tone: "fail" });
    return lines;
  }
  const humanAt = holdStart + call.holdSec;
  if (call.stage === "ended") {
    lines.push({ kind: "event", t: mmss(humanAt), text: "Max hold reached · call ended", tone: "end" });
    return lines;
  }
  const agents = ["Marcus", "Priya", "Jordan", "Elena", "Sam", "Aylin"];
  const name = agents[call.n % agents.length];
  lines.push(
    { kind: "event", t: mmss(humanAt), text: `Human detected · confidence ${call.confidence.toFixed(2)} · 1.6s after pickup`, tone: "human" },
    { kind: "agent", t: mmss(humanAt + 1), text: `Thanks for holding, this is ${name} with ${j.airline}. How can I help you today?` },
  );
  if (j.hangUpOnHuman) {
    lines.push(
      { kind: "bot", t: mmss(humanAt + 8), text: `Hi ${name}, this is an automated wait-time check. Thank you, I’ll end the call now.` },
      { kind: "agent", t: mmss(humanAt + 16), text: "Okay, no problem. Have a good day." },
      { kind: "event", t: mmss(humanAt + call.humanSec), text: "Call ended by Call Flow", tone: "end" },
    );
  }
  return lines;
}

/* ---------- analytics ---------- */

export interface AirlineStats {
  name: string;
  calls: number;
  reachedPct: number;
  avgHoldSec: number;
  longestHoldSec: number;
  detectSec: number;
  dayFactor: number;
}

export const AIRLINE_STATS: AirlineStats[] = [
  { name: "Turkish Airlines", calls: 3120, reachedPct: 61, avgHoldSec: 1304, longestHoldSec: 3290, detectSec: 2.1, dayFactor: 1.35 },
  { name: "United Airlines", calls: 4410, reachedPct: 68, avgHoldSec: 1142, longestHoldSec: 3492, detectSec: 1.7, dayFactor: 1.2 },
  { name: "American Airlines", calls: 5260, reachedPct: 74, avgHoldSec: 866, longestHoldSec: 2860, detectSec: 1.6, dayFactor: 0.95 },
  { name: "Delta Air Lines", calls: 3050, reachedPct: 79, avgHoldSec: 615, longestHoldSec: 2140, detectSec: 1.8, dayFactor: 0.7 },
  { name: "Emirates", calls: 2580, reachedPct: 86, avgHoldSec: 400, longestHoldSec: 1520, detectSec: 1.5, dayFactor: 0.45 },
];

export const OUTCOME_SPLIT = [
  { key: "human", label: "Reached a human", pct: 72.1, color: "#22BDFF" },
  { key: "hung", label: "Airline hung up", pct: 11.4, color: "#3595FF" },
  { key: "max", label: "Max hold reached", pct: 9.8, color: "#FFB547" },
  { key: "fail", label: "Failed to connect", pct: 6.7, color: "#E5484D" },
] as const;

/** Daily average hold (minutes) for a period, deterministic per seed. */
export function holdSeries(days: number, factor: number, seed: number): number[] {
  const r = rng(seed + days);
  return Array.from({ length: days }, (_, i) => {
    const weekly = Math.sin((i / 7) * Math.PI * 2) * 2.2;
    const spike = days >= 30 && Math.abs(i - Math.floor(days * 0.45)) < 2 ? 7 - Math.abs(i - Math.floor(days * 0.45)) * 3 : 0;
    return Math.max(3, Math.round((15 + weekly + spike + (r() - 0.5) * 3 - (i / days) * 2) * factor * 10) / 10);
  });
}

export const HEAT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const HEAT_HOURS = Array.from({ length: 15 }, (_, i) => i + 6);
const DAY_F = [1.3, 1.08, 1.0, 1.0, 1.12, 0.55, 0.68];
const HOUR_F: Record<number, number> = { 6: 0.5, 7: 0.72, 8: 1.0, 9: 1.3, 10: 1.42, 11: 1.25, 12: 1.02, 13: 0.95, 14: 0.82, 15: 0.62, 16: 0.66, 17: 0.85, 18: 0.74, 19: 0.56, 20: 0.46 };
export const heatValue = (dayIdx: number, hour: number, factor: number) => 15 * DAY_F[dayIdx] * HOUR_F[hour] * factor;

/* ---------- team, notifications ---------- */

export const TEAM = [
  { initials: "SA", name: "Sana Ahmed", email: "sana@callflow.io", role: "Admin", you: true },
  { initials: "OF", name: "Omar Farooq", email: "omar@callflow.io", role: "Operator" },
  { initials: "HM", name: "Hina Malik", email: "hina@callflow.io", role: "Analyst" },
  { initials: "DR", name: "Daniel Reyes", email: "daniel@callflow.io", role: "Viewer" },
];

export interface Notification {
  id: number;
  tone: "bad" | "warn" | "ok" | "info";
  title: string;
  body: string;
  href: string;
  read: boolean;
}

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: 1, tone: "bad", title: "Job #57 failed", body: "Hotline returned busy 5 times · 08:41 ET", href: "/jobs/57", read: false },
  { id: 2, tone: "warn", title: "United hold times 31% above average", body: "Since 08:30 ET · see Analytics", href: "/analytics", read: false },
  { id: 3, tone: "ok", title: "Job #55 completed", body: "30 calls · 83% reached a human", href: "/jobs/55", read: true },
];

/* ---------- helpers ---------- */

export const fmtDur = (sec: number) => {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}m ${pad(s)}s` : `${s}s`;
};

export const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
