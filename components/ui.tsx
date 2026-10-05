"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, X } from "lucide-react";
import type { CallStage, JobStatus } from "@/lib/data";

export const cx = clsx;

/* ---------- buttons ---------- */
export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-primary text-white text-sm font-bold shadow-[0_8px_20px_rgba(53,149,255,0.28)] hover:bg-[#2585ef] active:translate-y-px transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
  dark: "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-navy text-white text-sm font-bold hover:bg-navy-2 transition disabled:opacity-50 cursor-pointer",
  white: "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full bg-white text-navy text-sm font-semibold hover:bg-tint transition cursor-pointer",
  outline:
    "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full border border-soft bg-white text-navy text-sm font-bold hover:border-primary hover:text-primary-ink transition cursor-pointer",
  danger:
    "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full border border-[#F0B4B0] bg-white text-bad text-sm font-bold hover:bg-bad-bg transition cursor-pointer",
  ghost: "inline-flex items-center gap-1 h-10 px-3 rounded-full text-sm font-bold text-primary-ink hover:bg-tint transition cursor-pointer",
};

/* ---------- cards ---------- */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-3xl bg-white", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[19px] font-bold">{title}</h2>
        {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- chips ---------- */
const JOB_STATUS: Record<JobStatus, { label: string; cls: string; dot: string; live?: boolean }> = {
  running: { label: "Running", cls: "bg-soft-2 text-primary-ink", dot: "bg-primary", live: true },
  paused: { label: "Paused", cls: "bg-warn-bg text-warn", dot: "bg-warn-dot" },
  scheduled: { label: "Scheduled", cls: "bg-tint text-body", dot: "bg-[#9EA3C8]" },
  completed: { label: "Completed", cls: "bg-ok-bg text-ok", dot: "bg-ok-dot" },
  failed: { label: "Failed", cls: "bg-bad-bg text-bad", dot: "bg-bad-dot" },
  stopped: { label: "Stopped", cls: "bg-tint text-body", dot: "bg-[#9EA3C8]" },
  draft: { label: "Draft", cls: "bg-ivr-bg text-ivr", dot: "bg-sky" },
};

export function StatusChip({ status, size = "sm" }: { status: JobStatus; size?: "sm" | "md" }) {
  const s = JOB_STATUS[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap", s.cls, size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2.5 py-1 text-xs")}>
      <span className={cx("h-1.5 w-1.5 rounded-full", s.dot, s.live && "live-dot")} />
      {s.label}
    </span>
  );
}

const STAGE: Record<CallStage, { label: string; cls: string; dot: string }> = {
  dialing: { label: "Dialing", cls: "bg-soft-2 text-primary-ink", dot: "bg-primary" },
  ivr: { label: "In phone menu", cls: "bg-ivr-bg text-ivr", dot: "bg-sky" },
  hold: { label: "On hold", cls: "bg-warn-bg text-warn", dot: "bg-warn-dot" },
  human: { label: "Human detected", cls: "bg-ok-bg text-ok", dot: "bg-ok-dot" },
  ended: { label: "No answer", cls: "bg-tint text-body", dot: "bg-[#9EA3C8]" },
  failed: { label: "Dropped", cls: "bg-bad-bg text-bad", dot: "bg-bad-dot" },
};

export function StageChip({ stage }: { stage: CallStage }) {
  const s = STAGE[stage];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap", s.cls)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", s.dot, (stage === "hold" || stage === "ivr") && "live-dot")} />
      {s.label}
    </span>
  );
}

export function AirlineBadge({ code, tint, ink, size = 44 }: { code: string; tint: string; ink: string; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold" style={{ width: size, height: size, background: tint, color: ink }}>
      {code}
    </span>
  );
}

/* ---------- segmented / tabs ---------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  variant = "dark",
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  variant?: "dark" | "light";
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("inline-flex flex-wrap gap-0.5 rounded-full p-1", variant === "dark" ? "bg-white" : "bg-tint")}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "cursor-pointer rounded-full px-4 py-2.5 text-[13px] font-bold transition",
              on ? (variant === "dark" ? "bg-navy text-white" : "bg-white text-navy shadow-sm") : "text-muted hover:text-navy",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- toggle ---------- */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx("flex h-[30px] w-[52px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors", checked ? "justify-end bg-primary" : "justify-start bg-[#B7C9E8]")}
    >
      <span className="h-6 w-6 rounded-full bg-white shadow" />
    </button>
  );
}

export function ToggleRow({ title, body, checked, onChange }: { title: string; body: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-4">
      <div>
        <div className="text-[15px] font-bold">{title}</div>
        <div className="mt-0.5 text-[13px] text-muted">{body}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

/* ---------- form fields ---------- */
export const inputCls =
  "h-[50px] w-full rounded-2xl border border-soft bg-white px-4 text-[15px] text-navy placeholder:text-[#8C90B2] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("flex flex-col gap-2 text-sm font-semibold", className)}>
      {label}
      {children}
      {error ? <span className="text-[13px] font-semibold text-bad">{error}</span> : hint ? <span className="text-[13px] font-medium text-muted">{hint}</span> : null}
    </label>
  );
}

export function Select({ value, onChange, options, ariaLabel }: { value: string; onChange: (v: string) => void; options: readonly string[]; ariaLabel?: string }) {
  return (
    <span className="relative block">
      <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputCls, "cursor-pointer appearance-none pr-11")}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute top-[17px] right-4 text-muted" />
    </span>
  );
}

/* ---------- popover ---------- */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

export const popCls = "pop-in absolute z-40 mt-2 rounded-2xl bg-white p-1.5 shadow-[0_18px_48px_rgba(16,16,56,0.18)]";
export const menuItemCls = "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-navy hover:bg-tint";

export function Dropdown({
  label,
  value,
  options,
  onChange,
  align = "left",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  align?: "left" | "right";
}) {
  const { open, setOpen, ref } = usePopover();
  const active = value !== options[0];
  return (
    <div ref={ref} className="relative">
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cx("flex h-11 cursor-pointer items-center gap-2 rounded-2xl border px-3.5 text-sm transition", active ? "border-primary bg-soft-2" : "border-soft bg-white hover:border-primary")}
      >
        <span className="text-muted">{label}:</span>
        <strong>{value}</strong>
        <ChevronDown size={14} className={cx("text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <div role="listbox" aria-label={label} className={cx(popCls, "min-w-[220px]", align === "right" ? "right-0" : "left-0")}>
          {options.map((o) => (
            <button
              key={o}
              role="option"
              aria-selected={o === value}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={cx(menuItemCls, o === value && "bg-tint font-bold")}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- modal ---------- */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy/45 p-6" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()} className="pop-in w-full max-w-[460px] rounded-3xl bg-white p-7">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-[21px] font-bold">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="-m-1 cursor-pointer rounded-full p-1.5 text-muted hover:bg-tint">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- misc ---------- */
export function PageTitle({ title, sub, crumbs, right }: { title: React.ReactNode; sub?: React.ReactNode; crumbs?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4 px-1 pt-3">
      <div className="min-w-0">
        {crumbs && <nav aria-label="Breadcrumb" className="mb-2 text-[13px] font-semibold text-muted">{crumbs}</nav>}
        <h1 className="font-display text-[38px] leading-[1.08] font-medium md:text-[44px]">{title}</h1>
        {sub && <div className="mt-2 text-[15px] text-muted">{sub}</div>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2.5">{right}</div>}
    </section>
  );
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
