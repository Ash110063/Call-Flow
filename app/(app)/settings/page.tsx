"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, Phone, Plus, RefreshCw, Save, Settings2, Users, Bell, Mic, KeyRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { HOTLINES, AIRLINES, LINES, type Hotline } from "@/lib/data";
import { btn, Card, cx, Field, inputCls, Modal, PageTitle, Select, ToggleRow } from "@/components/ui";

type Tab = "general" | "hotlines" | "voice" | "notifications" | "team" | "api";
const TABS: { v: Tab; label: string; icon: React.ElementType }[] = [
  { v: "general", label: "General", icon: Settings2 },
  { v: "hotlines", label: "Airline hotlines", icon: Phone },
  { v: "voice", label: "Voice & speech", icon: Mic },
  { v: "notifications", label: "Notifications", icon: Bell },
  { v: "team", label: "Team", icon: Users },
  { v: "api", label: "API & webhooks", icon: KeyRound },
];

const HEALTH = {
  ok: { label: "Reachable", cls: "bg-ok-bg text-ok" },
  changed: { label: "Menu changed", cls: "bg-warn-bg text-warn" },
  busy: { label: "Busy signal", cls: "bg-bad-bg text-bad" },
};

export default function SettingsPage() {
  const { toast, team, inviteMember } = useStore();
  const [tab, setTab] = useState<Tab>("general");

  // general
  const [ws, setWs] = useState("Call Flow · Ops");
  const [tz, setTz] = useState("ET (UTC−5)");
  const [maxHold, setMaxHold] = useState("45 minutes");
  const [retention, setRetention] = useState("30 days");
  const [dirty, setDirty] = useState(false);
  const mark = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setDirty(true);
  };

  // hotlines
  const [hotlines, setHotlines] = useState<Hotline[]>(HOTLINES);
  const [checking, setChecking] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [nh, setNh] = useState({ airline: "JetBlue", line: "Reservations", number: "+1 800 ", menuPath: "1 → 0" });

  // voice
  const [providers, setProviders] = useState({ Twilio: true, Telnyx: true, Vonage: false });
  const [defEngine, setDefEngine] = useState("Deepgram");
  const [conf, setConf] = useState(92);

  // notifications
  const [n, setN] = useState({ failed: true, done: false, spike: true, digest: true });
  const [slack, setSlack] = useState("#callflow-alerts");

  // team
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Analyst");

  // api
  const [showKey, setShowKey] = useState(false);
  const [key, setKey] = useState("cf_live_7Hq2xR9vLmP4tW8nK3sD");
  const [hook, setHook] = useState("https://ops.example.com/hooks/callflow");

  const recheck = (h: Hotline) => {
    setChecking(h.number + h.line);
    setTimeout(() => {
      setHotlines((list) => list.map((x) => (x === h ? { ...x, health: "ok", checked: "Just now" } : x)));
      setChecking(null);
      toast(`${h.airline} ${h.line.toLowerCase()} is reachable`);
    }, 1500);
  };

  return (
    <>
      <PageTitle title="Settings" sub="Workspace defaults, hotlines, providers and your team" />
      <div className="flex flex-wrap items-start gap-5">
        <nav aria-label="Settings sections" className="flex max-w-full flex-[1_1_240px] flex-col gap-0.5 rounded-3xl bg-white p-2.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.v;
            return (
              <button
                key={t.v}
                aria-current={on ? "page" : undefined}
                onClick={() => setTab(t.v)}
                className={cx("flex cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold transition", on ? "bg-soft-2 text-navy" : "text-body hover:bg-bg")}
              >
                <Icon size={17} className={on ? "text-primary-ink" : "text-muted"} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-4">
          {tab === "general" && (
            <Card className="flex flex-col gap-6 p-7">
              <div>
                <h2 className="text-xl font-bold">General</h2>
                <p className="mt-1 text-sm text-muted">Defaults applied to every new job.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-5 gap-y-4.5">
                <Field label="Workspace name">
                  <input value={ws} onChange={(e) => mark(setWs)(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Default time zone">
                  <Select value={tz} onChange={mark(setTz)} options={["ET (UTC−5)", "CT (UTC−6)", "PT (UTC−8)", "UTC"]} />
                </Field>
                <Field label="Maximum hold before hanging up" hint="Calls still on hold after this are ended and marked “Max hold reached”.">
                  <Select value={maxHold} onChange={mark(setMaxHold)} options={["30 minutes", "45 minutes", "60 minutes", "90 minutes"]} />
                </Field>
                <Field label="Recording retention">
                  <Select value={retention} onChange={mark(setRetention)} options={["7 days", "30 days", "90 days"]} />
                </Field>
              </div>
              <div className="flex items-center justify-end gap-3.5">
                {dirty && <span className="text-sm text-muted">Unsaved changes</span>}
                <button
                  className={btn.primary}
                  disabled={!dirty}
                  onClick={() => {
                    setDirty(false);
                    toast("Settings saved");
                  }}
                >
                  <Save size={16} /> Save changes
                </button>
              </div>
            </Card>
          )}

          {tab === "hotlines" && (
            <Card className="flex flex-col gap-4 pt-6 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3 px-6">
                <div>
                  <h2 className="text-xl font-bold">Airline hotlines</h2>
                  <p className="mt-1 text-sm text-muted">Numbers and phone-menu paths jobs can dial.</p>
                </div>
                <button className={btn.dark} onClick={() => setAddOpen(true)}>
                  <Plus size={16} /> Add hotline
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-bg text-left text-[11px] tracking-[0.06em] text-muted uppercase">
                      <th className="py-3 pr-4 pl-6 font-bold">Airline · line</th>
                      <th className="px-4 font-bold">Number</th>
                      <th className="px-4 font-bold">Menu path</th>
                      <th className="px-4 font-bold">Last checked</th>
                      <th className="px-4 font-bold">Status</th>
                      <th className="pr-6 pl-4 font-bold">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotlines.map((h) => {
                      const busy = checking === h.number + h.line;
                      return (
                        <tr key={h.number + h.line} className="border-t border-line">
                          <td className="py-3.5 pr-4 pl-6">
                            <strong>{h.airline}</strong>
                            <div className="text-xs text-muted">{h.line}</div>
                          </td>
                          <td className="px-4 font-mono text-[13px] whitespace-nowrap">{h.number}</td>
                          <td className="px-4 font-mono text-[13px]">{h.menuPath}</td>
                          <td className="px-4 whitespace-nowrap">{h.checked}</td>
                          <td className="px-4">
                            <span className={cx("rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap", HEALTH[h.health].cls)}>{HEALTH[h.health].label}</span>
                          </td>
                          <td className="pr-6 pl-4 text-right">
                            <button className={btn.ghost} onClick={() => recheck(h)} disabled={busy}>
                              <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> {busy ? "Checking…" : "Check now"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === "voice" && (
            <Card className="flex flex-col gap-6 p-7">
              <div>
                <h2 className="text-xl font-bold">Voice &amp; speech</h2>
                <p className="mt-1 text-sm text-muted">Telephony providers and how human pickup is detected.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
                {(Object.keys(providers) as (keyof typeof providers)[]).map((p) => {
                  const on = providers[p];
                  return (
                    <div key={p} className="flex flex-col gap-3 rounded-[18px] border border-soft bg-bg p-4.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-base">{p}</strong>
                        <span className={cx("rounded-full px-2.5 py-1 text-xs font-bold", on ? "bg-ok-bg text-ok" : "bg-tint text-body")}>{on ? "Connected" : "Not connected"}</span>
                      </div>
                      <span className="text-[13px] text-muted">{p === "Twilio" ? "US East · 4 numbers" : p === "Telnyx" ? "US Central · 2 numbers" : on ? "US East · 1 number" : "No numbers yet"}</span>
                      <button
                        className={cx(on ? btn.outline : btn.primary, "h-10")}
                        onClick={() => {
                          setProviders((x) => ({ ...x, [p]: !on }));
                          toast(on ? `${p} disconnected` : `${p} connected`, on ? "info" : "ok");
                        }}
                      >
                        {on ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <Field label="Default speech engine">
                <Select value={defEngine} onChange={setDefEngine} options={["Deepgram", "Whisper"]} />
              </Field>
              <div className="flex flex-col gap-2.5">
                <label htmlFor="conf" className="text-sm font-semibold">
                  Human-detection confidence threshold: <strong className="text-primary-ink">0.{conf}</strong>
                </label>
                <input id="conf" type="range" min={80} max={99} value={conf} onChange={(e) => setConf(Number(e.target.value))} className="w-full accent-primary" />
                <span className="text-[13px] text-muted">
                  {conf >= 95 ? "Very strict: almost no false positives, but detection can lag by 2–3s." : conf <= 85 ? "Loose: fastest detection, expect more false positives from hold voiceovers." : "Balanced. 0.92 is recommended."}
                </span>
              </div>
            </Card>
          )}

          {tab === "notifications" && (
            <Card className="flex flex-col gap-2 p-7">
              <div className="mb-2">
                <h2 className="text-xl font-bold">Notifications</h2>
                <p className="mt-1 text-sm text-muted">Where and when Call Flow lets you know something happened.</p>
              </div>
              <ToggleRow title="A job fails" body="Email and Slack, immediately." checked={n.failed} onChange={(v) => setN({ ...n, failed: v })} />
              <ToggleRow title="A job completes" body="Email with the job summary." checked={n.done} onChange={(v) => setN({ ...n, done: v })} />
              <ToggleRow title="Hold times spike" body="When an airline runs 25% above its 30-day average." checked={n.spike} onChange={(v) => setN({ ...n, spike: v })} />
              <ToggleRow title="Daily digest" body="Every weekday at 08:00 ET." checked={n.digest} onChange={(v) => setN({ ...n, digest: v })} />
              <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-5">
                <Field label="Slack channel" className="flex-[1_1_260px]">
                  <input value={slack} onChange={(e) => setSlack(e.target.value)} className={inputCls} />
                </Field>
                <button className={btn.outline} onClick={() => toast(`Test message sent to ${slack}`)}>
                  Send test
                </button>
              </div>
            </Card>
          )}

          {tab === "team" && (
            <Card className="flex flex-col gap-2.5 p-7">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Team</h2>
                  <p className="mt-1 text-sm text-muted">{team.length} members</p>
                </div>
                <button className={btn.dark} onClick={() => setInviteOpen(true)}>
                  <Plus size={16} /> Invite member
                </button>
              </div>
              {team.map((m, i) => (
                <div key={m.email + i} className="flex flex-wrap items-center gap-3.5 border-t border-line py-3.5">
                  <span className={cx("flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-sm font-extrabold", ["bg-soft-2", "bg-ivr-bg", "bg-ok-bg", "bg-warn-bg"][i % 4])}>{m.initials}</span>
                  <div className="min-w-0 flex-[1_1_200px]">
                    <div className="text-[15px] font-bold">
                      {m.name}
                      {m.you && <span className="ml-1.5 text-[13px] font-semibold text-muted">(you)</span>}
                    </div>
                    <div className="text-[13px] text-muted">{m.email}</div>
                  </div>
                  {m.pending && <span className="rounded-full bg-warn-bg px-2.5 py-1 text-xs font-bold text-warn">Invite sent</span>}
                  <span className="rounded-full bg-tint px-3 py-1.5 text-[13px] font-bold text-body">{m.role}</span>
                </div>
              ))}
            </Card>
          )}

          {tab === "api" && (
            <Card className="flex flex-col gap-5 p-7">
              <div>
                <h2 className="text-xl font-bold">API &amp; webhooks</h2>
                <p className="mt-1 text-sm text-muted">Pull results into your own systems.</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Secret key</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <code className="flex-[1_1_300px] rounded-2xl border border-soft bg-bg px-4 py-3.5 font-mono text-sm">{showKey ? key : `${key.slice(0, 8)}${"•".repeat(16)}${key.slice(-4)}`}</code>
                  <button className={btn.outline} onClick={() => setShowKey(!showKey)} aria-label={showKey ? "Hide key" : "Reveal key"}>
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />} {showKey ? "Hide" : "Reveal"}
                  </button>
                  <button
                    className={btn.dark}
                    onClick={() => {
                      navigator.clipboard?.writeText(key).catch(() => {});
                      toast("API key copied to clipboard");
                    }}
                  >
                    <Copy size={16} /> Copy
                  </button>
                  <button
                    className={btn.danger}
                    onClick={() => {
                      setKey(`cf_live_${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`);
                      setShowKey(true);
                      toast("New key generated. The old key stops working in 24 hours.", "warn");
                    }}
                  >
                    <RefreshCw size={15} /> Regenerate
                  </button>
                </div>
              </div>
              <Field label="Webhook URL" hint="Sends job.completed, job.failed and call.human_detected events.">
                <input value={hook} onChange={(e) => setHook(e.target.value)} className={cx(inputCls, "font-mono")} />
              </Field>
              <div className="flex justify-end">
                <button className={btn.outline} onClick={() => toast("Test event delivered · 200 OK in 182ms")}>
                  Send test event
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a hotline">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (nh.number.replace(/\D/g, "").length < 10) {
              toast("Enter a full phone number", "warn");
              return;
            }
            setHotlines((l) => [...l, { ...nh, checked: "Just now", health: "ok" }]);
            setAddOpen(false);
            toast(`${nh.airline} ${nh.line.toLowerCase()} added`);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Airline">
              <Select value={nh.airline} onChange={(v) => setNh({ ...nh, airline: v })} options={AIRLINES.map((a) => a.name)} />
            </Field>
            <Field label="Line">
              <Select value={nh.line} onChange={(v) => setNh({ ...nh, line: v })} options={LINES} />
            </Field>
          </div>
          <Field label="Number">
            <input value={nh.number} onChange={(e) => setNh({ ...nh, number: e.target.value })} className={cx(inputCls, "font-mono")} autoFocus />
          </Field>
          <Field label="Phone-menu path" hint="Keys or phrases to reach an agent, e.g. 2 → “agent” → 0">
            <input value={nh.menuPath} onChange={(e) => setNh({ ...nh, menuPath: e.target.value })} className={cx(inputCls, "font-mono")} />
          </Field>
          <div className="mt-2 flex justify-end gap-2.5">
            <button type="button" className={btn.outline} onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={btn.primary}>
              Add hotline
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a team member">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.includes("@")) {
              toast("Enter a valid email address", "warn");
              return;
            }
            inviteMember(email, role);
            setInviteOpen(false);
            setEmail("");
            toast(`Invite sent to ${email}`);
          }}
        >
          <Field label="Work email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={inputCls} autoFocus />
          </Field>
          <Field label="Role" hint={role === "Viewer" ? "Can see dashboards and calls." : role === "Analyst" ? "Can view everything and export data." : role === "Operator" ? "Can create, run and stop jobs." : "Full access, including billing and API keys."}>
            <Select value={role} onChange={setRole} options={["Analyst", "Operator", "Viewer", "Admin"]} />
          </Field>
          <div className="mt-2 flex justify-end gap-2.5">
            <button type="button" className={btn.outline} onClick={() => setInviteOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={btn.primary}>
              Send invite
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
