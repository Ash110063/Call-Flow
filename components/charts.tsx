"use client";

import { useState } from "react";
import { HEAT_DAYS, HEAT_HOURS, heatValue } from "@/lib/data";

export function Sparkbars({ values, highlightLast = true }: { values: number[]; highlightLast?: boolean }) {
  const max = Math.max(...values);
  return (
    <svg width={values.length * 12} height="44" viewBox={`0 0 ${values.length * 12} 44`} aria-hidden="true">
      {values.map((v, i) => {
        const h = Math.max(4, (v / max) * 42);
        return <rect key={i} x={i * 12} y={44 - h} width="8" height={h} rx="3" fill={highlightLast && i === values.length - 1 ? "#3595FF" : "#D3E7FF"} />;
      })}
    </svg>
  );
}

export function Ring({ value, size = 64, stroke = 8, track = "rgba(255,255,255,0.25)", color = "#FFFFFF" }: { value: number; size?: number; stroke?: number; track?: string; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * Math.min(1, value)} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray .5s ease" }}
      />
    </svg>
  );
}

export function Donut({ parts, center, sub }: { parts: { value: number; color: string; label: string }[]; center: string; sub: string }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const total = parts.reduce((a, p) => a + p.value, 0);
  let offset = 0;
  return (
    <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
      <circle cx="75" cy="75" r={r} fill="none" stroke="#EEF4FF" strokeWidth="18" />
      {parts.map((p) => {
        const len = (p.value / total) * c;
        const el = <circle key={p.label} cx="75" cy="75" r={r} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${len} ${c}`} strokeDashoffset={-offset} transform="rotate(-90 75 75)" />;
        offset += len;
        return el;
      })}
      <text x="75" y="73" textAnchor="middle" fontSize="26" fontWeight="700" fill="#101038">
        {center}
      </text>
      <text x="75" y="94" textAnchor="middle" fontSize="12" fill="#565B85">
        {sub}
      </text>
    </svg>
  );
}

/** Smooth line chart with optional comparison series and hover readout. */
export function LineChart({ series, compare, labels, unit = "m" }: { series: number[]; compare?: number[]; labels: string[]; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 820;
  const H = 260;
  const L = 44;
  const T = 16;
  const B = 36;
  const all = [...series, ...(compare ?? [])];
  const max = Math.ceil(Math.max(...all) / 10) * 10;
  const x = (i: number) => L + (i / (series.length - 1)) * (W - L - 8);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const path = (vals: number[]) =>
    vals
      .map((v, i) => {
        if (i === 0) return `M${x(i)} ${y(v)}`;
        const px = x(i - 1);
        const cx = (px + x(i)) / 2;
        return `C${cx} ${y(vals[i - 1])} ${cx} ${y(v)} ${x(i)} ${y(v)}`;
      })
      .join(" ");
  const ticks = [0, max / 3, (2 * max) / 3, max].map((v) => Math.round(v));
  const step = Math.ceil(labels.length / 6);
  const peakIdx = series.indexOf(Math.max(...series));
  const hi = hover ?? peakIdx;
  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`Average hold ranges from ${Math.min(...series)}${unit} to ${Math.max(...series)}${unit}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - L) / (W - L - 8)) * (series.length - 1));
          setHover(Math.max(0, Math.min(series.length - 1, i)));
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#D3E7FF" : "#E6EFFF"} />
            <text x="0" y={y(t) + 4} fontSize="11" fill="#565B85">
              {t}
              {unit}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % step === 0 || i === labels.length - 1 ? (
            <text key={i} x={x(i)} y={H - 10} fontSize="11" fill="#565B85" textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}>
              {l}
            </text>
          ) : null,
        )}
        {compare && <path d={path(compare)} fill="none" stroke="#9EA3C8" strokeWidth="2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />}
        <path d={`${path(series)} L${x(series.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`} fill="#3595FF" fillOpacity="0.09" />
        <path d={path(series)} fill="none" stroke="#3595FF" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={x(hi)} x2={x(hi)} y1={y(series[hi])} y2={y(0)} stroke="#3595FF" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        <circle cx={x(hi)} cy={y(series[hi])} r="6" fill="#fff" stroke="#3595FF" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div
        className="pointer-events-none absolute top-1 rounded-xl bg-navy px-3 py-2 text-xs text-white shadow-lg"
        style={{ left: `clamp(0px, calc(${(x(hi) / W) * 100}% - 70px), calc(100% - 160px))` }}
      >
        <div className="text-muted-dark">{labels[hi]}{hover === null ? " · peak" : ""}</div>
        <div className="text-sm font-bold">
          {series[hi]}
          {unit} avg hold{compare ? <span className="font-medium text-muted-dark"> · prev {compare[hi]}{unit}</span> : null}
        </div>
      </div>
    </div>
  );
}

const SHADES = ["#F3F7FF", "#D3E7FF", "#59CCFB", "#22BDFF", "#3595FF", "#101038"];
export const HEAT_SHADES = SHADES;

export function Heatmap({ factor }: { factor: number }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="flex min-w-[640px] flex-col gap-1">
          <div className="grid grid-cols-[44px_repeat(15,minmax(0,1fr))] gap-1 text-center text-[11px] text-muted">
            <span />
            {HEAT_HOURS.map((h) => (
              <span key={h}>{String(h).padStart(2, "0")}</span>
            ))}
          </div>
          {HEAT_DAYS.map((d, di) => (
            <div key={d} className="grid grid-cols-[44px_repeat(15,minmax(0,1fr))] items-center gap-1">
              <span className="text-xs font-semibold text-body">{d}</span>
              {HEAT_HOURS.map((h) => {
                const v = heatValue(di, h, factor);
                const lvl = Math.max(0, Math.min(5, Math.floor((v - 5) / 4)));
                const on = hover && hover.d === di && hover.h === h;
                return (
                  <button
                    key={h}
                    aria-label={`${d} ${String(h).padStart(2, "0")}:00 ET, ${Math.round(v)} minutes average hold`}
                    onMouseEnter={() => setHover({ d: di, h })}
                    onFocus={() => setHover({ d: di, h })}
                    onMouseLeave={() => setHover(null)}
                    className="h-[30px] cursor-default rounded-[7px] transition"
                    style={{ background: SHADES[lvl], outline: on ? "2px solid #101038" : "none", outlineOffset: 1 }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-2">
          Shorter hold
          {SHADES.map((s) => (
            <span key={s} className="h-3 w-[22px] rounded" style={{ background: s }} />
          ))}
          Longer hold
        </div>
        <div className="min-h-[18px] text-[13px] font-semibold text-navy">
          {hover ? `${HEAT_DAYS[hover.d]} ${String(hover.h).padStart(2, "0")}:00 ET · ${Math.round(heatValue(hover.d, hover.h, factor))}m avg hold` : "Hover a cell to see its average"}
        </div>
      </div>
    </div>
  );
}
